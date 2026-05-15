/* ══════════════════════════════════════════
   AUTH
══════════════════════════════════════════ */
const VALID_USERS = [
  { email:'admin@nazca.com', pass:'nazca2024', name:'Admin', role:'Administrador' },
  { email:'qualidade@nazca.com', pass:'cq2024', name:'Analista CQ', role:'Analista' },
];
let currentUser = null;
let mfaCode = '';
let pendingUser = null;

function doLogin() {
  const email = document.getElementById('login-email').value.trim().toLowerCase();
  const pass  = document.getElementById('login-pass').value;
  const err   = document.getElementById('login-error');
  const user  = VALID_USERS.find(u => u.email === email && u.pass === pass);
  if (!user) {
    err.textContent = '❌ E-mail ou senha incorretos. Tente novamente.';
    err.style.display = 'block';
    return;
  }
  err.style.display = 'none';
  pendingUser = user;
  mfaCode = '123456'; // Demo fixed code
  document.getElementById('mfa-email-display').textContent = email.replace(/(.{2}).*(@)/, '$1***$2');
  document.getElementById('login-panel').style.display = 'none';
  document.getElementById('mfa-panel').style.display = 'block';
  document.getElementById('mfa0').focus();
}

function mfaInput(idx) {
  const val = document.getElementById('mfa'+idx).value.replace(/\D/g,'');
  document.getElementById('mfa'+idx).value = val;
  if (val && idx < 5) document.getElementById('mfa'+(idx+1)).focus();
  if (idx === 5 && val) doMFA();
}
function mfaKey(e, idx) {
  if (e.key === 'Backspace' && !document.getElementById('mfa'+idx).value && idx > 0)
    document.getElementById('mfa'+(idx-1)).focus();
}
function doMFA() {
  const code = [0,1,2,3,4,5].map(i=>document.getElementById('mfa'+i).value).join('');
  const err  = document.getElementById('mfa-error');
  if (code !== mfaCode) {
    err.textContent = '❌ Código inválido. O código demo é 123456.';
    err.style.display = 'block';
    [0,1,2,3,4,5].forEach(i=>{ document.getElementById('mfa'+i).value=''; });
    document.getElementById('mfa0').focus();
    return;
  }
  currentUser = pendingUser;
  const finishLogin = () => {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('navbar').style.display = 'flex';
    const initials = currentUser.name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
    document.getElementById('user-avatar').textContent = initials;
    document.getElementById('user-name-display').textContent = currentUser.name.split(' ')[0];
    navigate('dashboard');
    startLiveClock();
    setTimeout(()=>toast('Bem-vindo, '+currentUser.name.split(' ')[0]+'!', firebaseReady ? 'Dados sincronizados com Firebase.' : 'Dados carregados localmente.', firebaseReady ? 'success' : 'warn'), 400);
  };
  const loaded = loadData();
  if (loaded && typeof loaded.then === 'function') loaded.then(finishLogin).catch(finishLogin);
  else finishLogin();
}
function resendMFA() {
  const resend = document.querySelector('.mfa-resend');
  resend.textContent = '✓ Código reenviado!';
  resend.style.color = '#5ecebf';
  setTimeout(() => { resend.textContent = 'Reenviar código'; resend.style.color = ''; }, 3000);
}
function doLogout() {
  currentUser = null;
  pendingUser = null;
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('navbar').style.display = 'none';
  document.getElementById('login-panel').style.display = 'block';
  document.getElementById('mfa-panel').style.display = 'none';
  document.getElementById('login-pass').value = '';
  document.getElementById('login-error').style.display = 'none';
  [0,1,2,3,4,5].forEach(i=>{ document.getElementById('mfa'+i).value=''; });
  document.getElementById('mfa-error').style.display = 'none';
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.getElementById('page-dashboard').classList.add('active');
}

/* ══════════════════════════════════════════
   MOBILE NAV
══════════════════════════════════════════ */
function openMobileNav() {
  document.getElementById('mobile-nav-overlay').classList.add('open');
  document.getElementById('mobile-nav-panel').style.transform = 'translateX(0)';
}
function closeMobileNav() {
  document.getElementById('mobile-nav-overlay').classList.remove('open');
  document.getElementById('mobile-nav-panel').style.transform = 'translateX(100%)';
}

/* ══════════════════════════════════════════
   DATA
══════════════════════════════════════════ */
let POPS = [];

const SECTORS_DATA = {}; // calculado dinamicamente a partir dos POPs cadastrados

let EMPLOYEES = [];

const ALL_SECTORS = {};

const ROLES_BY_SECTOR = {};

const ONBOARDING_MAP = {};

const TRAINING_MATRIX = [];

const CORE_POPS = [];
const MATRIX_POPS = [];

let ANEXOS = [];
let nextAnexoId = 1;
let nextEmpId = 1;
let currentSectorFilter = null;
let tvMode = false;
let chartsInit = {};
let confirmCallback = null;

/* ══════════════════════════════════════════
   CONFIRM DELETE
══════════════════════════════════════════ */
function showConfirm(title, msg, cb, confirmText = 'Sim, excluir') {
  confirmCallback = cb;
  document.getElementById('confirm-title').textContent = title;
  document.getElementById('confirm-msg').textContent = msg;
  const yesBtn = document.getElementById('confirm-yes-btn');
  const icon = document.querySelector('.confirm-icon');
  if(icon) icon.textContent = title.toLowerCase().includes('inativar') ? '⏸️' : '🗑️';
  yesBtn.textContent = confirmText;
  yesBtn.onclick = () => { const fn = confirmCallback; closeConfirm(); if(fn) fn(); };
  document.getElementById('confirm-overlay').classList.add('open');
}
function closeConfirm() {
  document.getElementById('confirm-overlay').classList.remove('open');
  const yesBtn = document.getElementById('confirm-yes-btn');
  const icon = document.querySelector('.confirm-icon');
  if(icon) icon.textContent = '🗑️';
  if(yesBtn) yesBtn.textContent = 'Sim, excluir';
  confirmCallback = null;
}

/* ══════════════════════════════════════════
   NAVIGATION
══════════════════════════════════════════ */
function navigate(page, sectorFilter) {
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nb-link').forEach(l=>l.classList.remove('active'));
  document.getElementById('page-'+page).classList.add('active');
  document.querySelectorAll('.nb-link').forEach(l=>{
    const t=l.textContent.toLowerCase();
    if(page==='dashboard'&&t.includes('dashboard'))l.classList.add('active');
    if(page==='analytics'&&t.includes('analytics'))l.classList.add('active');
    if(page==='pops'&&t.includes('procedimentos'))l.classList.add('active');
    if(page==='funcionarios'&&t.includes('funcionários'))l.classList.add('active');
    if(page==='matriz'&&t.includes('matriz'))l.classList.add('active');
    if(page==='alertas'&&t.includes('alertas'))l.classList.add('active');
    if(page==='anexos'&&t.includes('anexos'))l.classList.add('active');
    if(page==='auditoria'&&t.includes('auditoria'))l.classList.add('active');
  });
  if(page==='dashboard'){renderDashboard();startLiveClock();}
  if(page==='analytics'){currentSectorFilter=sectorFilter||null;renderAnalytics();}
  if(page==='pops')renderPOPs();
  if(page==='funcionarios')renderFuncionarios();
  if(page==='matriz')renderMatrix();
  if(page==='anexos')renderAnexos();
  if(page==='alertas')renderAlertasPage();
  if(page==='auditoria')renderAuditoria();
}

/* ══════════════════════════════════════════
   DARK MODE
══════════════════════════════════════════ */
function toggleDarkMode() {
  tvMode=!tvMode;
  document.body.classList.toggle('dark-mode',tvMode);
  document.getElementById('tv-btn').classList.toggle('on',tvMode);
  Object.values(chartsInit).forEach(c=>{if(c&&c.destroy)c.destroy();});
  chartsInit={};
  const activePage=document.querySelector('.page.active');
  if(activePage){
    const id=activePage.id.replace('page-','');
    if(id==='dashboard')renderDashboard();
    if(id==='analytics')renderAnalytics();
  }
}

/* ══════════════════════════════════════════
   MODAL
══════════════════════════════════════════ */
function openModal(title,bodyHTML,wide){
  document.getElementById('modal-title').innerHTML=title;
  document.getElementById('modal-body').innerHTML=bodyHTML;
  document.querySelector('.modal-box').classList.toggle('modal-wide',!!wide);
  document.getElementById('modal').classList.add('open');
}
function openModalWide(t,b){openModal(t,b,true);}
function closeModal(){document.getElementById('modal').classList.remove('open');}

/* ══════════════════════════════════════════
   STATUS HELPERS
══════════════════════════════════════════ */
function vigenciaBadge(v){
  const m={'NO PRAZO':'<span class="badge badge-green">No Prazo</span>','VENCE EM 3 MESES':'<span class="badge badge-orange">Vence em 3m</span>','VENCIDO':'<span class="badge badge-red">Vencido ⚠</span>','OBSOLETO':'<span class="badge badge-gray">Obsoleto</span>','ELABORAR':'<span class="badge badge-sand">Elaborar</span>'};
  return m[v]||`<span class="badge badge-gray">${v}</span>`;
}
function docBadge(s){
  const m={'APROVADO':'<span class="badge badge-green">✓ Aprovado</span>','EM REVISÃO':'<span class="badge badge-orange">Em Revisão</span>','ELABORAR':'<span class="badge badge-sand">Elaborar</span>','OBSOLETO':'<span class="badge badge-gray">Obsoleto</span>'};
  return m[s]||`<span class="badge badge-gray">${s}</span>`;
}
function trainBadge(t){
  if(t==='OK')return'<span class="badge badge-green">✓ OK</span>';
  if(t==='SOLICITADO')return'<span class="badge badge-orange">⏳ Solicitado</span>';
  if(t==='N.A')return'<span class="badge badge-gray">N/A</span>';
  return`<span class="badge badge-gray">${t}</span>`;
}
function empStatusBadge(s){
  const m={'Válido':'<span class="badge badge-green">✓ Válido</span>','Crítico':'<span class="badge badge-orange">⚠ Crítico</span>','Vencido':'<span class="badge badge-red">Vencido</span>','Pendente':'<span class="badge badge-gray">Pendente</span>','Revisão Pendente':'<span class="badge badge-sand">Revisão</span>'};
  return m[s]||`<span class="badge badge-gray">${s}</span>`;
}
function popTypeBadge(t){
  if(t==='core')return'<span class="badge badge-blue">Core</span>';
  if(t==='area')return'<span class="badge badge-green">Área</span>';
  if(t==='cargo')return'<span class="badge badge-orange">Cargo</span>';
  return'<span class="badge badge-gray">POP</span>';
}
function empCompliance(emp){
  if(!emp.pops.length)return 0;
  return Math.round(emp.pops.filter(p=>p.status==='Válido').length/emp.pops.length*100);
}

/* ══════════════════════════════════════════
   DASHBOARD
══════════════════════════════════════════ */
function renderDashboard(){
  // Recompute SECTORS_DATA from live POPS array for real-time charts
  const sectorNames={AL:'Almoxarifado',CQ:'Qualidade / CQ',DE:'Des. Embalagem',DP:'P&D'};
  const sectors=[...new Set(POPS.map(p=>p.sector))];
  sectors.forEach(s=>{
    const sp=POPS.filter(p=>p.sector===s);
    SECTORS_DATA[s]={
      name:sectorNames[s]||s,
      total:sp.length,
      approved:sp.filter(p=>p.docStatus==='APROVADO').length,
      inReview:sp.filter(p=>p.docStatus==='EM REVISÃO').length,
      expired:sp.filter(p=>p.vigencia==='VENCIDO').length,
      trainPending:sp.filter(p=>p.training==='SOLICITADO').length,
    };
  });
  const totalPOPs=POPS.length;
  const approved=POPS.filter(p=>p.docStatus==='APROVADO').length;
  const compliance=totalPOPs ? Math.round(approved/totalPOPs*100) : 0;
  const critical=POPS.filter(p=>p.vigencia==='VENCIDO'||p.docStatus==='ELABORAR').length;
  const expiring=POPS.filter(p=>p.vigencia==='VENCE EM 3 MESES').length;
  const pendTrain=POPS.filter(p=>p.training==='SOLICITADO').length;

  document.getElementById('kpi-grid').innerHTML=`
    <div class="kpi-card green glass-card" onclick="navigate('analytics')"><div class="kpi-val">${compliance}%</div><div class="kpi-label">Compliance Global</div><div class="kpi-trend">▲ ${approved} de ${totalPOPs} POPs aprovados</div></div>
    <div class="kpi-card glass-card" onclick="showAlertasModal()"><div class="kpi-val">${critical}</div><div class="kpi-label">Alertas Críticos</div><div class="kpi-trend danger">${critical>0?'Ação imediata requerida':'Sem críticos'}</div></div>
    <div class="kpi-card orange glass-card" onclick="showPendenciasModal()"><div class="kpi-val">${expiring+pendTrain}</div><div class="kpi-label">Pendências Totais</div><div class="kpi-trend warn">${expiring} vencendo · ${pendTrain} trein. solicitados</div></div>
    <div class="kpi-card blue glass-card" onclick="navigate('funcionarios')"><div class="kpi-val">${EMPLOYEES.filter(e=>!e.inactive).length}</div><div class="kpi-label">Funcionários Ativos</div><div class="kpi-trend">Cobrindo ${Object.keys(computeSectorsData()).length} setores ativos</div></div>
  `;
  document.getElementById('alert-badge').textContent=`${critical+expiring} Alertas`;

  document.getElementById('sector-table').innerHTML=Object.entries(computeSectorsData()).map(([key,s])=>{
    const pct=s.total?Math.round(s.approved/s.total*100):0;
    const color=pct===100?'var(--green)':pct>=70?'var(--orange)':'var(--red)';
    return`<div class=\"sector-row\">
      <span class=\"clickable\" onclick=\"navigate('analytics','${key}')\">${s.name}</span>
      <span style=\"text-align:center\">${s.total}</span>
      <span style=\"text-align:center;color:var(--green);font-weight:700\">${s.approved}</span>
      <span style=\"text-align:center;color:${(s.expired>0||s.inReview>2)?'var(--red)':'var(--gray-soft)'};font-weight:700\" class=\"sector-col-3\">${s.inReview+s.expired}</span>
      <div style=\"flex:1\"><div style=\"display:flex;justify-content:flex-end;font-size:var(--fs-xs);margin-bottom:2px\"><span style=\"font-weight:700;color:${color}\">${pct}%</span></div><div class=\"prog-bar\"><div class=\"prog-fill\" style=\"width:${pct}%;background:${color}\"></div></div></div>
      <span>${pct===100?'<span class=\"badge badge-green\">OK</span>':pct>=70?'<span class=\"badge badge-orange\">Atenção</span>':'<span class=\"badge badge-red\">Crítico</span>'}</span>
    </div>`;
  }).join('') || '<div style=\"padding:20px;text-align:center;color:var(--gray-soft)\">Nenhum setor com POP cadastrado ainda.</div>';

  const alerts=[];
  POPS.filter(p=>p.vigencia==='VENCIDO').forEach(p=>alerts.push({icon:'🔴',text:`${p.code} — ${p.desc}: Vigência <strong>VENCIDA</strong>`,type:'danger'}));
  POPS.filter(p=>p.vigencia==='VENCE EM 3 MESES').forEach(p=>alerts.push({icon:'🟡',text:`${p.code} — ${p.desc}: vence em <strong>3 meses</strong>`,type:'warn'}));
  POPS.filter(p=>p.docStatus==='ELABORAR').forEach(p=>alerts.push({icon:'🟠',text:`${p.code} — ${p.desc}: aguardando elaboração`,type:'warn'}));
  if(pendTrain>0) alerts.push({icon:'🔵',text:`${pendTrain} treinamento(s) solicitado(s)`,type:'info'});
  document.getElementById('alerts-list').innerHTML=alerts.length ? alerts.slice(0,8).map(a=>`
    <div class="alert-item ${a.type}" onclick="showAlertasModal()">
      <span class="alert-item-icon">${a.icon}</span>
      <span class="alert-item-text">${a.text}</span>
    </div>
  `).join('') : '<div style="padding:20px;text-align:center;color:var(--gray-soft)">Nenhum alerta cadastrado no momento.</div>';

  if(chartsInit.train){chartsInit.train.destroy();chartsInit.status.destroy();}
  const tc=tvMode?'#d0d0ce':'#6b6b68';
  const gc=tvMode?'rgba(255,255,255,0.08)':'rgba(0,0,0,0.06)';

  chartsInit.train=new Chart(document.getElementById('trainChart'),{
    type:'bar',
    data:{labels:Object.values(SECTORS_DATA).map(s=>s.name),datasets:[
      {label:'Aprovados',data:Object.values(SECTORS_DATA).map(s=>s.approved),backgroundColor:'rgba(18,84,77,0.85)',borderRadius:6},
      {label:'Em Revisão/Crítico',data:Object.values(SECTORS_DATA).map(s=>s.inReview+s.expired),backgroundColor:'rgba(219,102,69,0.85)',borderRadius:6},
    ]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'top',labels:{color:tc,font:{size:11},usePointStyle:true}}},scales:{x:{stacked:true,ticks:{color:tc},grid:{color:gc}},y:{stacked:true,beginAtZero:true,ticks:{color:tc},grid:{color:gc}}}}
  });

  const approvedCount=POPS.filter(p=>p.docStatus==='APROVADO').length;
  const inReviewCount=POPS.filter(p=>p.docStatus==='EM REVISÃO').length;
  const expiredCount=POPS.filter(p=>p.vigencia==='VENCIDO').length;
  const elaborarCount=POPS.filter(p=>p.docStatus==='ELABORAR').length;
  const obsoleteCount=POPS.filter(p=>p.docStatus==='OBSOLETO').length;

  chartsInit.status=new Chart(document.getElementById('statusChart'),{
    type:'doughnut',
    data:{labels:['Aprovado','Em Revisão','Vencido','Elaborar','Obsoleto'],datasets:[{data:[approvedCount,inReviewCount,expiredCount,elaborarCount,obsoleteCount],backgroundColor:['#12544d','#db6645','#a1213d','#c4956a','#6b6b68'],borderWidth:tvMode?2:0,borderColor:tvMode?'#1e1e1c':'transparent',hoverOffset:8}]},
    options:{responsive:true,maintainAspectRatio:false,cutout:'70%',plugins:{legend:{position:'right',labels:{color:tc,font:{size:11},usePointStyle:true}}}}
  });
  document.getElementById('donut-pct-dash').textContent=compliance+'%';
}

function showAlertasModal(){navigate('alertas');}
function showPendenciasModal(){
  const pendPOPs=POPS.filter(p=>p.training==='SOLICITADO');
  const expiringP=POPS.filter(p=>p.vigencia==='VENCE EM 3 MESES');
  openModal('Detalhamento de <span>Pendências</span>',`
    <table style="width:100%;border-collapse:collapse;font-size:var(--fs-sm)">
      <thead><tr style="border-bottom:1.5px solid var(--border)">
        <th style="padding:8px;text-align:left;font-size:var(--fs-xs);color:var(--gray-soft);text-transform:uppercase">Funcionário</th>
        <th style="padding:8px;text-align:left;font-size:var(--fs-xs);color:var(--gray-soft);text-transform:uppercase">Área</th>
        <th style="padding:8px;text-align:left;font-size:var(--fs-xs);color:var(--gray-soft);text-transform:uppercase">POPs Pendentes</th>
      </tr></thead>
      <tbody>
        ${EMPLOYEES.filter(e=>e.pops.some(p=>p.status==='Pendente'||p.status==='Crítico'||p.status==='Vencido')).map(e=>{
          const pend=e.pops.filter(p=>p.status!=='Válido');
          return`<tr style="border-bottom:1px solid var(--border)">
            <td style="padding:10px 8px"><strong>${e.name}</strong><div style="font-size:var(--fs-xs);color:var(--gray-soft)">${e.role}</div></td>
            <td style="padding:10px 8px"><span class="badge badge-blue">${e.sector}</span></td>
            <td style="padding:10px 8px">${pend.map(p=>`${empStatusBadge(p.status)} <span style="font-size:var(--fs-xs)">${p.pop}</span>`).join('<br>')}</td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>
  `);
}

/* ══════════════════════════════════════════
   ANALYTICS
══════════════════════════════════════════ */
function renderAnalytics(){
  const sectorData=computeSectorsData ? computeSectorsData() : {};
  const filterBar=document.getElementById('filter-bar');
  if(filterBar){
    const sectorBtns=Object.entries(sectorData).map(([key,val])=>
      `<button class="filter-pill ${currentSectorFilter===key?'active':''}" onclick="setFilter('${key}')">${val.name}</button>`
    ).join('');
    filterBar.innerHTML=`<button class="filter-pill ${!currentSectorFilter?'active':''}" onclick="clearFilter()">Todos os setores</button>${sectorBtns}`;
  }

  const fp=currentSectorFilter
    ? POPS.filter(p=>getPOPSectorInfo(p).key===String(currentSectorFilter))
    : POPS;
  const sName=currentSectorFilter?(sectorData[currentSectorFilter]?.name||currentSectorFilter):'Todos os Setores';
  const subtitle=document.getElementById('analytics-subtitle');
  if(subtitle) subtitle.textContent=`Indicadores avançados · ${sName}`;
  const filterLabel=document.getElementById('filter-label');
  if(filterLabel) filterLabel.textContent=currentSectorFilter?`· ${sName}`:'';
  const clearBtn=document.getElementById('clear-filter-btn');
  if(clearBtn) clearBtn.style.display=currentSectorFilter?'':'none';

  const total=fp.length;
  const approved=fp.filter(p=>p.docStatus==='APROVADO').length;
  const inReview=fp.filter(p=>p.docStatus==='EM REVISÃO').length;
  const expired=fp.filter(p=>p.vigencia==='VENCIDO').length;
  const pendTrain=fp.filter(p=>p.training==='SOLICITADO').length;
  const linkedAnexos=fp.reduce((acc,p)=>acc+getPOPAnexos(p).length,0);

  const kpis=document.getElementById('analytics-kpis');
  if(kpis){
    kpis.innerHTML=`
      <div class="kpi-card green glass-card"><div class="kpi-val">${total}</div><div class="kpi-label">POPs no Filtro</div></div>
      <div class="kpi-card glass-card"><div class="kpi-val">${total?Math.round(approved/total*100):0}%</div><div class="kpi-label">Taxa de Aprovação</div></div>
      <div class="kpi-card orange glass-card"><div class="kpi-val">${inReview}</div><div class="kpi-label">Em Revisão</div></div>
      <div class="kpi-card blue glass-card"><div class="kpi-val">${linkedAnexos}</div><div class="kpi-label">Anexos Vinculados</div></div>
    `;
  }

  const body=document.getElementById('pops-analytics-body');
  if(body){
    body.innerHTML=fp.length?fp.map(p=>{
      const anexos=getPOPAnexos(p);
      return `
      <tr>
        <td><strong style="color:var(--red)">${p.code}</strong></td>
        <td style="max-width:260px">${p.desc}</td>
        <td><span class="badge badge-gray">v${p.versao || '1.0'}</span></td>
        <td>${popTypeBadge(p.popType)} <span class="badge badge-blue">${p.sectorName||p.sector||'—'}</span></td>
        <td>${docBadge(p.docStatus)}</td>
        <td>${vigenciaBadge(p.vigencia)}</td>
        <td>${trainBadge(p.training)}</td>
        <td>${anexos.length?`<span class="badge badge-blue">${anexos.length}</span>`:'<span class="badge badge-gray">0</span>'}</td>
        <td><button class="btn btn-outline btn-sm" onclick="openRevisao('${p.code}')" style="font-size:.7rem;white-space:nowrap;color:var(--red);border-color:var(--red)">Rev.${String(p.revisao||0).padStart(2,'0')} → v${(p.revisao||0)+1}.0</button></td>
      </tr>`;
    }).join(''):'<tr><td colspan="9" style="text-align:center;padding:24px;color:var(--gray-soft)">Nenhum POP cadastrado para este filtro.</td></tr>';
  }

  if(typeof Chart!=='undefined'){
    if(chartsInit.trend){chartsInit.trend.destroy();chartsInit.trend=null;}
    if(chartsInit.doughnut){chartsInit.doughnut.destroy();chartsInit.doughnut=null;}
    const trendCanvas=document.getElementById('trendChart');
    const donutCanvas=document.getElementById('donutChart');
    const tc=tvMode?'#d0d0ce':'#6b6b68';
    const gc=tvMode?'rgba(255,255,255,0.08)':'rgba(0,0,0,0.06)';
    if(trendCanvas){
      const trendData = getHistoricalTrend();
      chartsInit.trend=new Chart(trendCanvas,{
        type:'line',
        data:{labels:trendData.map(t=>t.label),datasets:[{label:'Compliance (%)',data:trendData.map(t=>t.value),borderColor:'#12544d',backgroundColor:'rgba(18,84,77,.12)',fill:true,tension:.4,pointBackgroundColor:'#12544d',pointRadius:5,pointHoverRadius:7}]},
        options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:ctx=>`${ctx.parsed.y}% compliance`}}},scales:{y:{beginAtZero:false,min:0,max:100,ticks:{color:tc,callback:v=>v+'%'},grid:{color:gc}},x:{ticks:{color:tc},grid:{color:gc}}}}
      });
    }
    if(donutCanvas){
      const statusData=['APROVADO','EM REVISÃO','ELABORAR','OBSOLETO'].map(st=>fp.filter(p=>p.docStatus===st).length);
      const approvedPct=total?Math.round(approved/total*100):0;
      chartsInit.doughnut=new Chart(donutCanvas,{
        type:'doughnut',
        data:{labels:['Aprovado','Em Revisão','Elaborar','Obsoleto'],datasets:[{data:statusData,backgroundColor:['#12544d','#db6645','#c4956a','#6b6b68'],borderWidth:tvMode?2:0,borderColor:tvMode?'#1e1e1c':'transparent',hoverOffset:8}]},
        options:{responsive:true,maintainAspectRatio:false,cutout:'68%',plugins:{legend:{position:'bottom',labels:{color:tc,font:{size:11},usePointStyle:true}}}}
      });
      const pct=document.getElementById('donut-pct-anl');
      if(pct)pct.textContent=approvedPct+'%';
    }
  }
}
function setFilter(s){currentSectorFilter=s;renderAnalytics();}
function clearFilter(){setFilter(null);}

/* ══════════════════════════════════════════
   DATE HELPERS
══════════════════════════════════════════ */

// Converte de DD/MM/AAAA para AAAA-MM-DD (usado no openEditPOP)
function brToIso(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return '';
  const parts = dateStr.split('/');
  if (parts.length !== 3) return dateStr; // Retorna como está se não estiver no formato esperado
  return `${parts[2]}-${parts[1]}-${parts[0]}`;
}

// Converte de AAAA-MM-DD para DD/MM/AAAA (usado no salvarEditPOP)
function isoToBr(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

/* ══════════════════════════════════════════
   POPs LIST
══════════════════════════════════════════ */
function renderPOPs(){
  const search=(document.getElementById('pop-search')?.value||'').toLowerCase();
  const secFilter=document.getElementById('pops-sector-filter')?.value||'';
  const statFilter=document.getElementById('pops-status-filter')?.value||'';
  const vigFilter=document.getElementById('pops-vigencia-filter')?.value||'';
  let items=POPS;
  if(secFilter)items=items.filter(p=>p.sector===secFilter);
  if(statFilter)items=items.filter(p=>p.docStatus===statFilter);
  if(vigFilter)items=items.filter(p=>p.vigencia===vigFilter);
  if(search)items=items.filter(p=>p.desc.toLowerCase().includes(search)||p.code.toLowerCase().includes(search)||p.sectorName.toLowerCase().includes(search));

  document.getElementById('pops-body').innerHTML=items.length?items.map(p=>`
    <tr>
      <td><strong style="color:var(--red);cursor:pointer" onclick="openPOPDetail('${p.code}')">${p.code}</strong></td>
      <td>${popTypeBadge(p.popType)}</td>
      <td><span class="badge badge-gray">${p.sectorName}</span></td>
      <td style="max-width:220px;font-size:var(--fs-sm)">${p.desc}</td>
      <td>${docBadge(p.docStatus)}</td>
      <td style="font-size:var(--fs-xs);color:var(--gray-soft)">${p.dataCriacao||'—'}</td>
      <td style="font-size:var(--fs-xs);color:var(--gray-soft)">${p.dataRevisao||'—'}</td>
      <td style="font-size:var(--fs-xs);font-weight:700;color:${p.dataVencimento?'var(--green)':'var(--gray-soft)'}">${p.dataVencimento||'—'}</td>
      <td>${vigenciaBadge(p.vigencia)}</td>
      <td>${daysBadge(p)}</td>
      <td>${trainBadge(p.training)}</td>
      <td style="white-space:nowrap">
        <button class="btn btn-outline btn-sm" onclick="openEditPOP('${p.code}')">Editar</button>
      </td>
    </tr>
  `).join(''):'<tr><td colspan="12" style="text-align:center;padding:24px;color:var(--gray-soft)">Nenhum POP cadastrado ainda.</td></tr>';
}

// Mantido sem botão na interface: fallback técnico/admin via console, se necessário.
function deletePOP(code){
  const pop=POPS.find(p=>p.code===code);
  if(!pop)return;
  showConfirm('Excluir POP',`Tem certeza que deseja excluir o POP "${code} — ${pop.desc}"? Esta ação não pode ser desfeita.`,()=>{
    POPS=POPS.filter(p=>p.code!==code);
    addLog(`POP Excluído: ${code}`, 'delete', `${pop.desc} · Setor: ${pop.sectorName}`);
    saveData();
    toast('POP Excluído', `${code} removido com sucesso.`, 'warn');
    renderPOPs();
    const activePage=document.querySelector('.page.active');
    if(activePage&&activePage.id==='page-analytics')renderAnalytics();
  });
}

function openEditPOP(code){
  console.log("1. Botão clicado! Código recebido:", code);
  
  // Usando == em vez de === para evitar problemas de Tipo (String vs Number)
  const pop = POPS.find(p => p.code == code); 
  console.log("2. Resultado da busca no array POPS:", pop);

  if(!pop) {
    alert("ERRO: O POP não foi encontrado no array principal.");
    return;
  }

  try {
    openModal(`Editar <span>${code}</span>`,`
      <div class="form-grid">
        <div class="form-group"><label class="form-label">Tipo</label>
          <select class="form-select" id="ep-type">
            <option value="core" ${pop.popType==='core'?'selected':''}>Core — Obrigatório</option>
            <option value="area" ${pop.popType==='area'?'selected':''}>Área — Setor Específico</option>
            <option value="cargo" ${pop.popType==='cargo'?'selected':''}>Cargo — Função Específica</option>
          </select>
        </div>
        <div class="form-group"><label class="form-label">Status Doc</label>
          <select class="form-select" id="ep-status">
            <option value="ELABORAR" ${pop.docStatus==='ELABORAR'?'selected':''}>Elaborar</option>
            <option value="EM REVISÃO" ${pop.docStatus==='EM REVISÃO'?'selected':''}>Em Revisão</option>
            <option value="APROVADO" ${pop.docStatus==='APROVADO'?'selected':''}>Aprovado</option>
            <option value="OBSOLETO" ${pop.docStatus==='OBSOLETO'?'selected':''}>Obsoleto</option>
          </select>
        </div>
        <div class="form-group"><label class="form-label">Vigência</label>
          <select class="form-select" id="ep-vigencia">
            <option value="NO PRAZO" ${pop.vigencia==='NO PRAZO'?'selected':''}>No Prazo</option>
            <option value="VENCE EM 3 MESES" ${pop.vigencia==='VENCE EM 3 MESES'?'selected':''}>Vence em 3 Meses</option>
            <option value="VENCIDO" ${pop.vigencia==='VENCIDO'?'selected':''}>Vencido</option>
            <option value="OBSOLETO" ${pop.vigencia==='OBSOLETO'?'selected':''}>Obsoleto</option>
            <option value="ELABORAR" ${pop.vigencia==='ELABORAR'?'selected':''}>Elaborar</option>
          </select>
        </div>
        <div class="form-group"><label class="form-label">Treinamento</label>
          <select class="form-select" id="ep-training">
            <option value="OK" ${pop.training==='OK'?'selected':''}>OK</option>
            <option value="SOLICITADO" ${pop.training==='SOLICITADO'?'selected':''}>Solicitado</option>
            <option value="N.A" ${pop.training==='N.A'?'selected':''}>N/A</option>
          </select>
        </div>
      </div>
      <div class="form-group"><label class="form-label">Descrição</label><input type="text" class="form-input" id="ep-desc" value="${pop.desc}"></div>
      <div class="form-grid">
        <div class="form-group"><label class="form-label">Data de Criação</label><input type="date" class="form-input" id="ep-criacao" value="${pop.dataCriacao ? brToIso(pop.dataCriacao) : ''}"></div>
        <div class="form-group"><label class="form-label">Data de Revisão</label><input type="date" class="form-input" id="ep-revisao" value="${pop.dataRevisao ? brToIso(pop.dataRevisao) : ''}"></div>
      </div>
      ${anexosEditor(pop)}
      <div style="display:flex;gap:10px;margin-top:8px">
        <button class="btn btn-primary" onclick="salvarEditPOP('${code}')">Salvar Alterações</button>
        <button class="btn btn-outline" onclick="closeModal()">Cancelar</button>
      </div>
    `);
    console.log("3. Modal chamado com sucesso!");
  } catch (erro) {
    console.error("4. ERRO CRÍTICO AO MONTAR O MODAL:", erro);
    alert("Ocorreu um erro ao abrir. Verifique o console (F12).");
  }
}

function salvarEditPOP(code){
  const pop=POPS.find(p=>p.code===code);
  if(!pop)return;
  pop.popType=document.getElementById('ep-type').value;
  pop.docStatus=document.getElementById('ep-status').value;
  pop.vigencia=document.getElementById('ep-vigencia').value;
  pop.training=document.getElementById('ep-training').value;
  pop.desc=document.getElementById('ep-desc').value;
  const criacaoRaw=document.getElementById('ep-criacao').value;
  const revisaoRaw=document.getElementById('ep-revisao').value;
  pop.dataCriacao=criacaoRaw?isoToBr(criacaoRaw):'';
  pop.dataRevisao=revisaoRaw?isoToBr(revisaoRaw):'';
  // Salvar vínculos reais de anexos cadastrados no sistema
  const hasAnexo=document.getElementById('ep-has-anexo')?.value;
  if(hasAnexo==='sim'){
    const selectedIds=getSelectedAnexoIds('ep');
    const fileInput=document.getElementById('ep-anexo-file');
    pop.anexos=selectedIds;
    pop.anexoRef=selectedIds[0]||'';
    pop.hasAnexo=selectedIds.length>0 || !!(fileInput&&fileInput.files&&fileInput.files[0]);
    if(fileInput&&fileInput.files&&fileInput.files[0]) pop.anexoFile=fileInput.files[0].name;
    syncAnexosToPOP(pop.code, selectedIds);
  } else if(hasAnexo==='nao'){
    syncAnexosToPOP(pop.code, []);
    pop.hasAnexo=false;pop.anexos=[];pop.anexoRef='';pop.anexoFile='';
  }
  addLog(`POP Editado: ${code}`, 'edit', `${pop.desc} · Status: ${pop.docStatus}`);
  saveData();
  toast('POP Atualizado', `${code} salvo com sucesso.`, 'success');
  closeModal();
  renderPOPs();
}

function getAreaOptionsForSector(selectedSector){
  const all=Object.entries(ALL_SECTORS);
  return all.filter(([k])=>k!==selectedSector).map(([k,v])=>`<option value="${k}">${v}</option>`).join('');
}

function getRolesForSelectedSectors(){
  const setor=document.getElementById('new-pop-sector')?.value||'';
  const areaEl=document.getElementById('new-pop-area');
  const selectedAreas=areaEl?[...areaEl.selectedOptions].map(o=>o.value):[];
  const allSelected=[setor,...selectedAreas].filter(Boolean);
  const sectorNames=allSelected.map(k=>ALL_SECTORS[k]||k);
  const roles=new Set();
  sectorNames.forEach(sn=>{
    (ROLES_BY_SECTOR[sn]||[]).forEach(r=>roles.add(r));
  });
  // Also check TRAINING_MATRIX for roles in those sectors
  TRAINING_MATRIX.forEach(tm=>{
    if(sectorNames.some(sn=>sn.toLowerCase().includes(tm.sector.toLowerCase())||tm.sector.toLowerCase().includes(sn.toLowerCase())))
      roles.add(tm.role.charAt(0)+tm.role.slice(1).toLowerCase());
  });
  return [...roles];
}

function updateCargoOptions(selectId){
  const roles=getRolesForSelectedSectors();
  const sel=document.getElementById(selectId);
  if(!sel)return;
  const cur=sel.value;
  sel.innerHTML='<option value="">— Selecione o cargo —</option>'+roles.map(r=>`<option value="${r}"${r===cur?' selected':''}>${r}</option>`).join('');
}

function updateAreaOptions(areaSelectId, sectorSelectId){
  const sector=document.getElementById(sectorSelectId)?.value||'';
  const areaEl=document.getElementById(areaSelectId);
  if(!areaEl)return;
  const prevSelected=[...areaEl.selectedOptions].map(o=>o.value);
  areaEl.innerHTML=getAreaOptionsForSector(sector);
  // restore previous selections if still available
  [...areaEl.options].forEach(o=>{ if(prevSelected.includes(o.value))o.selected=true; });
}

function openNovoPOP(){
  const hoje = new Date().toISOString().slice(0,10);
  const sectorList = getAvailableSectorNames().map(s=>`<option value="${s}"></option>`).join('');
  const roleList = getAvailableRoleNames().map(r=>`<option value="${r}"></option>`).join('');
  openModal('+ Novo <span>POP</span>',`
    <datalist id="sector-options">${sectorList}</datalist>
    <datalist id="role-options">${roleList}</datalist>
    <div class="form-grid">
      <div class="form-group"><label class="form-label">Código</label><input type="text" class="form-input" placeholder="Ex: DE 001" id="new-pop-code"></div>
      <div class="form-group"><label class="form-label">Setor</label>
        <input type="text" class="form-input" id="new-pop-sector" list="sector-options" placeholder="Digite o setor do POP">
      </div>
      <div class="form-group"><label class="form-label">Área vinculada <span style="font-size:.7rem;color:var(--gray-soft)">(opcional)</span></label>
        <input type="text" class="form-input" id="new-pop-area" list="sector-options" placeholder="Área relacionada, se houver">
      </div>
      <div class="form-group"><label class="form-label">Cargo vinculado <span style="font-size:.7rem;color:var(--gray-soft)">(opcional)</span></label>
        <input type="text" class="form-input" id="new-pop-cargo" list="role-options" placeholder="Cargo relacionado, se houver">
      </div>
      <div class="form-group"><label class="form-label">Tipo do POP</label>
        <select class="form-select" id="new-pop-type"><option value="core">Core — Obrigatório</option><option value="area" selected>Área — Setor específico</option><option value="cargo">Cargo — Função específica</option></select>
      </div>
      <div class="form-group"><label class="form-label">Status Doc</label>
        <select class="form-select" id="new-pop-status"><option value="ELABORAR">Elaborar</option><option value="EM REVISÃO">Em Revisão</option><option value="APROVADO">Aprovado</option><option value="OBSOLETO">Obsoleto</option></select>
      </div>
    </div>
    <div class="form-group"><label class="form-label">Descrição</label><input type="text" class="form-input" placeholder="Descrição do procedimento" id="new-pop-desc"></div>
    <div class="form-grid">
      <div class="form-group">
        <label class="form-label">Data de Criação</label>
        <input type="date" class="form-input" id="new-pop-datacriacao" value="${hoje}" oninput="atualizarVencimentoPOP()">
      </div>
      <div class="form-group">
        <label class="form-label">Vencimento (5 anos)</label>
        <input type="text" class="form-input" id="new-pop-vencimento" readonly style="background:var(--gray-pale);cursor:not-allowed;font-weight:700;color:var(--green)">
      </div>
    </div>
    <div id="new-pop-venc-preview" style="padding:10px 14px;background:var(--green-bg);border-radius:var(--r);border-left:3px solid var(--green);font-size:var(--fs-sm);margin-bottom:14px">
      Vencimento em <strong id="new-pop-venc-label"></strong> · <span id="new-pop-dias-label" style="font-weight:700"></span>
    </div>
    ${anexosEditorNew()}
    <button type="button" class="btn btn-primary" onclick="salvarNovoPOP()">Salvar POP</button>
  `);
  atualizarVencimentoPOP();
}

function atualizarVencimentoPOP(){
  const raw = document.getElementById('new-pop-datacriacao')?.value;
  const vencEl = document.getElementById('new-pop-vencimento');
  const labelEl = document.getElementById('new-pop-venc-label');
  const diasEl = document.getElementById('new-pop-dias-label');
  const previewEl = document.getElementById('new-pop-venc-preview');
  if(!raw || !vencEl) return;
  const d = new Date(raw + 'T00:00:00');
  const venc = new Date(d);
  venc.setFullYear(venc.getFullYear() + 5);
  const vencStr = venc.toLocaleDateString('pt-BR');
  vencEl.value = vencStr;
  if(labelEl) labelEl.textContent = vencStr;
  const dias = Math.ceil((venc - new Date()) / 86400000);
  if(diasEl){
    if(dias < 0){ diasEl.textContent = `Vencido há ${Math.abs(dias)} dias`; diasEl.style.color='var(--red)'; }
    else if(dias <= 90){ diasEl.textContent = `⚠ ${dias} dias restantes`; diasEl.style.color='var(--orange)'; }
    else { diasEl.textContent = `✓ ${dias} dias restantes`; diasEl.style.color='var(--green)'; }
  }
  if(previewEl) previewEl.style.display = '';
}

function salvarNovoPOP(){
  const sectorRaw=(document.getElementById('new-pop-sector')?.value||'').trim();
  const sector=canonicalSectorName(sectorRaw);
  const area=(document.getElementById('new-pop-area')?.value||'').trim();
  const cargo=(document.getElementById('new-pop-cargo')?.value||'').trim();
  const code=(document.getElementById('new-pop-code')?.value||'').trim().toUpperCase();
  const desc=(document.getElementById('new-pop-desc')?.value||'').trim();
  const popType=document.getElementById('new-pop-type')?.value || 'area';
  const docStatus=document.getElementById('new-pop-status')?.value || 'ELABORAR';
  if(!code){toast('Código obrigatório','Informe um código para o POP.','error');return;}
  if(POPS.some(p=>normalizeTxt(p.code)===normalizeTxt(code))){toast('Código duplicado',`Já existe um POP com o código ${code}.`,'error');return;}
  if(!desc){toast('Descrição obrigatória','Informe a descrição do procedimento.','error');return;}
  const rawDate = document.getElementById('new-pop-datacriacao')?.value;
  let dataCriacao, dataVencimento;
  if(rawDate){
    const d = new Date(rawDate+'T00:00:00');
    dataCriacao = d.toLocaleDateString('pt-BR');
    const venc = new Date(d); venc.setFullYear(venc.getFullYear()+5);
    dataVencimento = venc.toLocaleDateString('pt-BR');
  } else {
    dataCriacao = new Date().toLocaleDateString('pt-BR');
    const venc = new Date(); venc.setFullYear(venc.getFullYear()+5);
    dataVencimento = venc.toLocaleDateString('pt-BR');
  }
  const novoPOP={
    code,
    type:'POP',
    popType,
    sector,
    sectorName:sector||'Não informado',
    areas:area?[area]:[],
    cargo:cargo,
    desc,
    docStatus,
    vigencia:'NO PRAZO',
    training:'N.A',
    dataCriacao,
    dataRevisao:'—',
    dataVencimento,
    versao:'1.0',
    ...getAnexoFromNew()
  };
  POPS.push(novoPOP);
  if(novoPOP.anexos && novoPOP.anexos.length) syncAnexosToPOP(code, novoPOP.anexos);
  addLog(`POP Criado: ${code}`, 'create', `${desc} · Setor: ${novoPOP.sectorName} · Venc: ${dataVencimento}`);
  saveData();
  toast('POP Criado', `${code} adicionado e salvo no Firebase.`, 'success');
  closeModal();renderPOPs();renderDashboard();
}

function openPOPDetail(code){
  const pop=POPS.find(p=>p.code===code);
  if(!pop)return;
  openModal(`POP — <span>${code}</span>`,`
    <div style="padding:14px;background:var(--red-pale);border-radius:var(--r);margin-bottom:16px;border-left:3px solid var(--red)">
      <div style="font-weight:700;font-size:var(--fs-base);color:var(--gray);margin-bottom:6px">${pop.desc}</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">${docBadge(pop.docStatus)} ${vigenciaBadge(pop.vigencia)}</div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">
      <button class="btn btn-primary" onclick="closeModal();setTimeout(()=>openPOPAnexos('${code}'),100)" style="padding:16px;flex-direction:column;gap:4px">Ver Anexos</button>
      <button class="btn btn-outline" onclick="closeModal();setTimeout(()=>openPOPEmployees('${code}'),100)" style="padding:16px;flex-direction:column;gap:4px">Ver Funcionários</button>
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <button class="btn btn-outline btn-sm" onclick="closeModal();setTimeout(()=>openRevisao('${code}'),100)">Revisar</button>
    </div>
  `);
}

function openRevisao(code){
  const pop=POPS.find(p=>p.code===code);
  if(!pop)return;
  const affected=TRAINING_MATRIX.filter(r=>r.pops.includes(code));
  const hoje = new Date().toISOString().slice(0,10);
  openModal(`Revisão — <span>${code}</span>`,`
    <div style="padding:12px 14px;background:var(--orange-bg);border-radius:var(--r);margin-bottom:14px;border-left:3px solid var(--orange)">
      <strong>${pop.desc}</strong>
      <div style="font-size:var(--fs-xs);color:var(--gray-soft);margin-top:4px">${pop.sectorName} · Status: ${pop.docStatus}</div>
      ${pop.dataVencimento?`<div style="font-size:var(--fs-xs);margin-top:4px">📅 Vencimento atual: <strong>${pop.dataVencimento}</strong></div>`:''}
    </div>
    <div style="font-weight:700;font-size:var(--fs-sm);margin-bottom:10px">Houve mudança na descrição do procedimento?</div>
    <div style="display:flex;gap:10px;flex-wrap:wrap">
      <button class="btn btn-primary btn-sm" onclick="mostrarCaixaRevisao('${code}', true)">Sim — Mudou o Procedimento</button>
      <button class="btn btn-outline btn-sm" onclick="mostrarCaixaRenovarData('${code}')">Não — Apenas Renovar Data</button>
    </div>
    <div id="revisao-caixa-extra" style="margin-top:16px;display:none">
      <div class="form-group"><label class="form-label">Descreva as mudanças realizadas:</label><textarea class="form-input" id="revisao-mudancas" rows="4" placeholder="Descreva detalhadamente as alterações feitas no procedimento..."></textarea></div>
      <div class="form-grid" style="margin-bottom:10px">
        <div class="form-group">
          <label class="form-label">Data de Início da Revisão</label>
          <input type="date" class="form-input" id="revisao-data-inicio" value="${hoje}" oninput="atualizarVencimentoRevisao('revisao')">
        </div>
        <div class="form-group">
          <label class="form-label">Novo Vencimento (5 anos)</label>
          <input type="text" class="form-input" id="revisao-vencimento" readonly style="background:var(--gray-pale);cursor:not-allowed;font-weight:700;color:var(--green)">
        </div>
      </div>
      <button class="btn btn-primary" onclick="confirmarRevisao('${code}', true)">Confirmar e Revalidar</button>
    </div>
    <div id="renovar-caixa" style="margin-top:16px;display:none">
      <div style="padding:10px 14px;background:var(--blue-bg);border-radius:var(--r);border-left:3px solid var(--blue);font-size:var(--fs-sm);margin-bottom:12px">
        Informe a data de início desta renovação. O novo vencimento será calculado automaticamente em <strong>5 anos</strong>.
      </div>
      <div class="form-grid" style="margin-bottom:10px">
        <div class="form-group">
          <label class="form-label">Data de Início da Renovação</label>
          <input type="date" class="form-input" id="renovar-data-inicio" value="${hoje}" oninput="atualizarVencimentoRevisao('renovar')">
        </div>
        <div class="form-group">
          <label class="form-label">Novo Vencimento (5 anos)</label>
          <input type="text" class="form-input" id="renovar-vencimento" readonly style="background:var(--gray-pale);cursor:not-allowed;font-weight:700;color:var(--green)">
        </div>
      </div>
      <div id="renovar-preview" style="padding:10px 14px;background:var(--green-bg);border-radius:var(--r);border-left:3px solid var(--green);font-size:var(--fs-sm);margin-bottom:12px">
        ✅ Vencimento renovado para: <strong id="renovar-venc-label" style="color:var(--green)"></strong> · <span id="renovar-dias-label" style="font-weight:700"></span>
      </div>
      <button class="btn btn-primary" onclick="confirmarRevisao('${code}', false)">Confirmar Renovação</button>
    </div>
    <div style="margin-top:14px">
      <div style="font-weight:700;font-size:var(--fs-sm);margin-bottom:8px">${affected.length} cargo(s) afetado(s):</div>
      ${affected.map(r=>`<div style="display:flex;align-items:center;justify-content:space-between;padding:7px 12px;border-radius:8px;background:var(--gray-pale);margin-bottom:5px;font-size:var(--fs-sm)"><span><strong>${r.role}</strong></span><span class="badge badge-blue">${r.sector}</span></div>`).join('')||'<div style="color:var(--gray-soft);font-size:var(--fs-sm)">Nenhum cargo mapeado.</div>'}
    </div>
  `);
  // Pre-fill vencimento fields
  atualizarVencimentoRevisao('revisao');
  atualizarVencimentoRevisao('renovar');
}

function mostrarCaixaRevisao(code, changed){
  document.getElementById('revisao-caixa-extra').style.display='block';
  document.getElementById('renovar-caixa').style.display='none';
  atualizarVencimentoRevisao('revisao');
}

function mostrarCaixaRenovarData(code){
  document.getElementById('renovar-caixa').style.display='block';
  document.getElementById('revisao-caixa-extra').style.display='none';
  atualizarVencimentoRevisao('renovar');
}

function atualizarVencimentoRevisao(prefix){
  const raw = document.getElementById(`${prefix==='revisao'?'revisao':'renovar'}-data-inicio`)?.value;
  const vencEl = document.getElementById(`${prefix==='revisao'?'revisao':'renovar'}-vencimento`);
  const labelEl = document.getElementById(`${prefix==='revisao'?'revisao':'renovar'}-venc-label`);
  const diasEl = document.getElementById(`${prefix==='revisao'?'revisao':'renovar'}-dias-label`);
  if(!raw || !vencEl) return;
  const d = new Date(raw+'T00:00:00');
  const venc = new Date(d); venc.setFullYear(venc.getFullYear()+5);
  const vencStr = venc.toLocaleDateString('pt-BR');
  vencEl.value = vencStr;
  if(labelEl) labelEl.textContent = vencStr;
  const dias = Math.ceil((venc - new Date()) / 86400000);
  if(diasEl){
    if(dias<0){ diasEl.textContent=`Vencido há ${Math.abs(dias)} dias`; diasEl.style.color='var(--red)'; }
    else if(dias<=90){ diasEl.textContent=`⚠ ${dias} dias restantes`; diasEl.style.color='var(--orange)'; }
    else { diasEl.textContent=`✓ ${dias} dias restantes`; diasEl.style.color='var(--green)'; }
  }
}

function confirmarRevisao(code, changed){
  const pop=POPS.find(p=>p.code===code);
  if(!pop)return;
  let count=0;

  // Get the date input based on which form was shown
  const dataInicioRaw = changed
    ? document.getElementById('revisao-data-inicio')?.value
    : document.getElementById('renovar-data-inicio')?.value;

  let dataInicio, dataVencimento;
  if(dataInicioRaw){
    const d = new Date(dataInicioRaw+'T00:00:00');
    dataInicio = d.toLocaleDateString('pt-BR');
    const venc = new Date(d); venc.setFullYear(venc.getFullYear()+5);
    dataVencimento = venc.toLocaleDateString('pt-BR');
  } else {
    dataInicio = new Date().toLocaleDateString('pt-BR');
    const venc = new Date(); venc.setFullYear(venc.getFullYear()+5);
    dataVencimento = venc.toLocaleDateString('pt-BR');
  }

  if(changed){
    TRAINING_MATRIX.forEach(r=>{const idx=r.pops.indexOf(code);if(idx!==-1){r.status[idx]='SOLICITADO';count++;}});
    pop.training='SOLICITADO';
    pop.vigencia='NO PRAZO';
    pop.docStatus='APROVADO';
    const mudancas=document.getElementById('revisao-mudancas');
    if(mudancas&&mudancas.value.trim()){pop.mudancas=mudancas.value.trim();}
  }
  pop.dataRevisao=dataInicio;
  pop.dataVencimento=dataVencimento;
  pop.vigencia='NO PRAZO';
  pop.revisao = (pop.revisao || 0) + 1;
  pop.versao = pop.revisao + '.0';
  addLog(`POP Revisado: ${code}`, 'edit', `${pop.desc} · ${changed?'Com mudanças':'Renovação de data'} · Venc: ${dataVencimento}`);
  saveData();
  closeModal();
  setTimeout(()=>openModal('✅ Revisão <span>Concluída</span>',`
    <div style="text-align:center;padding:20px 0">
      <div style="font-size:3rem;margin-bottom:12px"></div>
      <div style="font-size:var(--fs-lg);font-weight:700;color:var(--green);margin-bottom:8px">Revisão registrada!</div>
      <div style="font-size:var(--fs-base);color:var(--gray-soft);margin-bottom:8px">${changed?`Procedimento atualizado. <strong>${count} cargo(s)</strong> marcados para novo treinamento.`:`Data renovada com sucesso.`}</div>
      <div style="display:inline-flex;align-items:center;gap:8px;padding:10px 18px;background:var(--green-bg);border-radius:var(--r);border:1.5px solid #b8dbd8">
        <span>Início:</span><strong>${dataInicio}</strong>
        <span style="color:var(--gray-soft)">·</span>
        <span>Vencimento:</span><strong style="color:var(--green)">${dataVencimento}</strong>
      </div>
      <button class="btn btn-primary" style="margin-top:20px;display:block;width:100%" onclick="closeModal();renderPOPs()">OK</button>
    </div>
  `),100);
}

function openPOPEmployees(code){
  window.__lastPOPEmployeesCode = code;
  const pop=POPS.find(p=>p.code===code);
  if(!pop)return;
  const relAnexos=getPOPAnexos(pop);
  const linked=EMPLOYEES.filter(e=>!e.inactive && employeeLinkedToPOP(e,pop,relAnexos));
  const tableRows=linked.length?linked.map(emp=>{
    const relPOP=Array.isArray(emp.pops)?emp.pops.find(item=>{
      const vals=[item.code,item.pop,item.nome,item.name,item.desc,item.popCode,item.popVinculado].map(normalizeTxt);
      return vals.includes(normalizeTxt(pop.code)) || vals.includes(normalizeTxt(pop.desc)) || vals.some(v=>v && (v.includes(normalizeTxt(pop.code)) || v.includes(normalizeTxt(pop.desc))));
    }):null;
    const badge=relPOP?empStatusBadge(relPOP.status||'Pendente'):'<span class="badge badge-blue">Vinculado por setor/cargo/anexo</span>';
    const anexosBadge = relAnexos.length ? `<div style="font-size:var(--fs-xs);color:var(--gray-soft);margin-top:3px">Anexos do POP: ${relAnexos.map(a=>a.numero||a.nome).join(', ')}</div>` : '';
    return`<tr class="clickable-row" onclick="closeModal();setTimeout(()=>openEmpProfile(${emp.id}),100)">
      <td><div style="display:flex;align-items:center;gap:10px"><div style="width:30px;height:30px;border-radius:50%;background:var(--red);display:flex;align-items:center;justify-content:center;color:white;font-weight:800;font-size:.7rem;flex-shrink:0">${emp.name.charAt(0)}</div><div><div style="font-weight:700;font-size:var(--fs-sm)">${emp.name}</div><div style="font-size:var(--fs-xs);color:var(--gray-soft)">${emp.email||'Sem e-mail'}</div>${anexosBadge}</div></div></td>
      <td><span class="badge badge-blue">${emp.sector||'—'}</span></td>
      <td style="font-size:var(--fs-sm)">${emp.role||'—'}</td>
      <td>${badge}</td>
    </tr>`;
  }).join(''):`<tr><td colspan="4" style="text-align:center;padding:24px;color:var(--gray-soft)">Nenhum funcionário vinculado. Cadastre funcionários ou registre treinamentos/anexos para este POP.</td></tr>`;

  openModalWide(`Funcionários — <span>${code}</span>`,`
    <div style="padding:12px 14px;background:var(--red-pale);border-radius:var(--r);margin-bottom:16px;border-left:3px solid var(--red)">
      <div style="font-weight:700">${pop.desc}</div>
      <div style="font-size:var(--fs-xs);color:var(--gray-soft);margin-top:4px">${pop.sectorName||'—'} · ${linked.length} funcionário(s) vinculado(s) · ${relAnexos.length} anexo(s)</div>
    </div>
    <table class="data-table" style="min-width:500px"><thead><tr><th>Funcionário</th><th>Setor</th><th>Cargo</th><th>Status</th></tr></thead><tbody>${tableRows}</tbody></table>
  `);
}

function openPOPAnexos(code){
  const pop=POPS.find(p=>p.code===code);
  const relAnexos=getPOPAnexos(pop||code);
  openModal(`Anexos — <span>${code}</span>`,`
    <div style="padding:12px;background:var(--red-pale);border-radius:var(--r);margin-bottom:14px;border-left:3px solid var(--red);font-weight:700;font-size:var(--fs-sm)">${pop?pop.desc:code}</div>
    ${relAnexos.length?`<table class="data-table"><thead><tr><th>Nome</th><th>Nº</th><th>Status</th><th>Criado</th></tr></thead><tbody>
      ${relAnexos.map(a=>{const sb=a.status==='Aprovado'?'<span class="badge badge-green">✓</span>':a.status==='Em Revisão'?'<span class="badge badge-orange">Rev.</span>':'<span class="badge badge-gray">Obs.</span>';return`<tr><td><strong>${a.nome}</strong></td><td>${a.numero}</td><td>${sb}</td><td style="font-size:var(--fs-xs)">${a.dataCriacao}</td></tr>`;}).join('')}
    </tbody></table>`:'<div style="color:var(--gray-soft);padding:20px;text-align:center">Nenhum anexo vinculado.</div>'}
    <div style="margin-top:12px;display:flex;gap:8px">
      <button class="btn btn-primary btn-sm" onclick="closeModal();setTimeout(openCriarAnexo,100)">+ Criar Anexo</button>
      <button class="btn btn-outline btn-sm" onclick="closeModal();navigate('anexos')">Ver todos</button>
    </div>
  `);
}

function openRevisaoGeral(){
  const needRevision=POPS.filter(p=>p.vigencia==='VENCIDO'||p.vigencia==='VENCE EM 3 MESES'||p.docStatus==='EM REVISÃO');
  openModalWide('🔄 Revisar <span>POPs</span>',`
    <div style="margin-bottom:14px;padding:12px 14px;background:var(--orange-bg);border-radius:var(--r);border-left:3px solid var(--orange);font-size:var(--fs-sm)"><strong>${needRevision.length} POP(s)</strong> necessitam atenção.</div>
    <table class="data-table"><thead><tr><th>Código</th><th>Descrição</th><th>Setor</th><th>Status</th><th>Vigência</th><th>Ação</th></tr></thead><tbody>
      ${needRevision.map(p=>`<tr>
        <td><strong style="color:var(--red)">${p.code}</strong></td>
        <td style="font-size:var(--fs-sm)">${p.desc}</td>
        <td><span class="badge badge-gray">${p.sectorName}</span></td>
        <td>${docBadge(p.docStatus)}</td>
        <td>${vigenciaBadge(p.vigencia)}</td>
        <td style="white-space:nowrap">
          <button class="btn btn-sm btn-primary" onclick="closeModal();setTimeout(()=>openRevisao('${p.code}'),100)">Revisar</button>
        </td>
      </tr>`).join('')}
    </tbody></table>
    ${!needRevision.length?'<div style="text-align:center;padding:24px;color:var(--green);font-weight:700">✅ Todos os POPs estão em conformidade!</div>':''}
  `);
}

/* ══════════════════════════════════════════
   FUNCIONÁRIOS
══════════════════════════════════════════ */
function renderFuncionarios(){
  const sectors=[...new Set(EMPLOYEES.map(e=>e.sector).filter(Boolean))].sort();
  const sel=document.getElementById('emp-sector-filter');
  const current=sel ? sel.value : '';
  if(sel) sel.innerHTML='<option value="">Todos os Setores</option>'+sectors.map(s=>`<option value="${s}"${s===current?' selected':''}>${s}</option>`).join('');
  const filter=sel ? sel.value : '';
  const inativos=EMPLOYEES.filter(e=>e.inactive===true);
  const inativosBtn=document.getElementById('emp-inativos-section');
  if(inativosBtn){
    inativosBtn.style.display=inativos.length?'':'none';
    const countEl=document.getElementById('emp-inativos-count');
    if(countEl)countEl.textContent=inativos.length;
  }
  const list=(filter?EMPLOYEES.filter(e=>e.sector===filter):EMPLOYEES).filter(e=>e.inactive!==true);

  document.getElementById('emp-grid').innerHTML=list.map(emp=>{
    const pct=empCompliance(emp);
    const color=pct>=80?'var(--green)':pct>=50?'var(--orange)':'var(--red)';
    const inactive=emp.inactive===true;
    if(inactive){
      return`<div class="emp-card emp-card-inactive">
        <div class="emp-card-header">
          <div>
            <div class="emp-name" style="color:var(--gray-soft);pointer-events:none">${emp.name}</div>
            <div class="emp-role" style="opacity:.5">${emp.role} · <span class="badge badge-blue" style="font-size:.65rem">${emp.sector}</span></div>
          </div>
          <div class="emp-card-actions">
            <span style="font-size:var(--fs-xs);color:var(--gray-soft);font-weight:600;padding:4px 8px;background:var(--gray-pale);border-radius:6px">Inativo</span>
            <button class="btn btn-outline btn-sm" onclick="reintegrarFuncionario(${emp.id})" title="Reintegrar" style="color:var(--green);border-color:var(--green)">Reintegrar</button>
          </div>
        </div>
        <div style="display:flex;gap:8px;margin-bottom:8px;flex-wrap:wrap;opacity:.4">
          <span style="font-size:var(--fs-xs);color:var(--gray-soft)">Core: <strong>${emp.pops.filter(p=>p.type==='core').length}</strong></span>
          <span style="font-size:var(--fs-xs);color:var(--gray-soft)">Área: <strong>${emp.pops.filter(p=>p.type==='area').length}</strong></span>
          <span style="font-size:var(--fs-xs);color:var(--gray-soft);font-weight:700">${pct}% compliant</span>
        </div>
        <div class="emp-compliance" style="opacity:.4">
          <div class="emp-compliance-bar"><div class="emp-compliance-fill" style="width:${pct}%;background:var(--gray-soft)"></div></div>
        </div>
        <div style="margin-top:8px;display:flex;gap:5px;flex-wrap:wrap;opacity:.4">
          ${emp.pops.slice(0,3).map(p=>empStatusBadge(p.status)).join('')}
          ${emp.pops.length>3?`<span class="badge badge-gray">+${emp.pops.length-3}</span>`:''}
        </div>
      </div>`;
    }
    return`<div class="emp-card">
      <div class="emp-card-header">
        <div>
          <div class="emp-name" onclick="openEmpProfile(${emp.id})">${emp.name}</div>
          <div class="emp-role">${emp.role} · <span class="badge badge-blue" style="font-size:.65rem">${emp.sector}</span></div>
        </div>
        <div class="emp-card-actions">
          <button class="btn btn-outline btn-sm" onclick="openEditFuncionario(${emp.id})" title="Modificar">Editar</button>
          <button class="btn btn-sm" onclick="inativarFuncionario(${emp.id})" title="Inativar" style="background:var(--gray-soft);color:#fff;border:none;padding:5px 10px;border-radius:var(--r);cursor:pointer;font-size:var(--fs-xs);font-weight:600">Inativar</button>
        </div>
      </div>
      <div style="display:flex;gap:8px;margin-bottom:8px;flex-wrap:wrap">
        <span style="font-size:var(--fs-xs);color:var(--gray-soft)">Core: <strong>${emp.pops.filter(p=>p.type==='core').length}</strong></span>
        <span style="font-size:var(--fs-xs);color:var(--gray-soft)">Área: <strong>${emp.pops.filter(p=>p.type==='area').length}</strong></span>
        <span style="font-size:var(--fs-xs);color:${color};font-weight:700">${pct}% compliant</span>
      </div>
      <div class="emp-compliance">
        <div class="emp-compliance-bar"><div class="emp-compliance-fill" style="width:${pct}%;background:${color}"></div></div>
      </div>
      <div style="margin-top:8px;display:flex;gap:5px;flex-wrap:wrap">
        ${emp.pops.slice(0,3).map(p=>empStatusBadge(p.status)).join('')}
        ${emp.pops.length>3?`<span class="badge badge-gray">+${emp.pops.length-3}</span>`:''}
      </div>
    </div>`;
  }).join('') || '<div style="grid-column:1/-1;text-align:center;padding:24px;color:var(--gray-soft)">Nenhum funcionário cadastrado ainda.</div>';
}


function openInativosModal(){
  const inativos = EMPLOYEES.filter(e => e.inactive === true);
  if(!inativos.length){ toast('Sem inativos','Não há funcionários inativos.','info'); return; }
  openModal('Funcionários <span>Inativos</span>', `
    <div style="margin-bottom:14px;padding:10px 14px;background:var(--orange-bg);border-radius:var(--r);border-left:3px solid var(--orange);font-size:var(--fs-sm)">
      <strong>${inativos.length} funcionário(s) inativo(s)</strong> — clique em Reintegrar para reativar.
    </div>
    <div style="display:flex;flex-direction:column;gap:10px">
      ${inativos.map(emp => `
        <div style="display:flex;align-items:center;justify-content:space-between;background:var(--gray-pale);padding:12px 16px;border-radius:var(--r);flex-wrap:wrap;gap:8px">
          <div style="display:flex;align-items:center;gap:12px">
            <div style="width:36px;height:36px;border-radius:50%;background:var(--gray-soft);display:flex;align-items:center;justify-content:center;color:white;font-weight:800;font-size:.85rem;flex-shrink:0">${emp.name.charAt(0)}</div>
            <div>
              <div style="font-weight:700;font-size:var(--fs-sm)">${emp.name}</div>
              <div style="font-size:var(--fs-xs);color:var(--gray-soft)">${emp.role} · ${emp.sector}</div>
            </div>
          </div>
          <button class="btn btn-sm" onclick="closeModal();reintegrarFuncionario(${emp.id})" style="background:var(--green);color:#fff;border:none;padding:6px 14px;border-radius:var(--r);cursor:pointer;font-size:var(--fs-xs);font-weight:600">↩ Reintegrar</button>
        </div>
      `).join('')}
    </div>
  `, true);
}

function openEmpProfile(id){
  const emp=EMPLOYEES.find(e=>e.id===id);
  if(!emp)return;
  const pct=empCompliance(emp);
  const color=pct>=80?'var(--green)':pct>=50?'var(--orange)':'var(--red)';
  const corePops=emp.pops.filter(p=>p.type==='core');
  const areaPops=emp.pops.filter(p=>p.type==='area');
  const cargoPops=emp.pops.filter(p=>p.type==='cargo');
  const popSection=(title,list,badge)=>list.length?`
    <div style="margin-bottom:14px">
      <div style="font-weight:700;font-size:var(--fs-sm);margin-bottom:8px;display:flex;align-items:center;gap:8px">${title} ${badge}</div>
      ${list.map(p=>`<div style="display:flex;align-items:center;justify-content:space-between;background:var(--gray-pale);padding:8px 12px;border-radius:8px;margin-bottom:4px;gap:8px;flex-wrap:wrap">
        <span style="font-size:var(--fs-sm)">${p.pop}</span>
        <div style="display:flex;align-items:center;gap:6px">
          ${p.days!=null?`<span style="font-size:var(--fs-xs);color:var(--gray-soft)">${p.days>0?p.days+'d restantes':'Vencido há '+Math.abs(p.days)+'d'}</span>`:''}
          ${empStatusBadge(p.status)}
        </div>
      </div>`).join('')}
    </div>
  `:'';

  openModal(`Perfil — <span>${emp.name.split(' ')[0]}</span>`,`
    <div style="display:flex;align-items:center;gap:14px;margin-bottom:18px;padding:14px;background:var(--gray-pale);border-radius:var(--r);flex-wrap:wrap">
      <div style="width:48px;height:48px;border-radius:50%;background:var(--red);display:flex;align-items:center;justify-content:center;font-size:1.4rem;color:white;font-weight:800;flex-shrink:0">${emp.name.charAt(0)}</div>
      <div style="flex:1;min-width:150px">
        <div style="font-weight:700;font-size:var(--fs-md)">${emp.name}</div>
        <div style="font-size:var(--fs-sm);color:var(--gray-soft)">${emp.role} · ${emp.sector}</div>
        <div style="font-size:var(--fs-xs);color:var(--gray-soft)">Admissão: ${emp.admission} · ${emp.email}</div>
      </div>
      <div style="text-align:center">
        <div style="font-size:1.8rem;font-weight:800;color:${color}">${pct}%</div>
        <div style="font-size:var(--fs-xs);color:var(--gray-soft)">Compliance</div>
      </div>
    </div>
    ${popSection('POPs Core',corePops,'<span class="badge badge-blue">Obrigatório</span>')}
    ${popSection('POPs de Área',areaPops,'<span class="badge badge-green">Setor</span>')}
    ${popSection('POPs de Cargo',cargoPops,'<span class="badge badge-orange">Cargo</span>')}
    ${!emp.pops.length?'<div style="color:var(--gray-soft)">Nenhum POP atribuído.</div>':''}
    <div style="margin-top:16px;display:flex;gap:8px;flex-wrap:wrap">
      <button class="btn btn-primary btn-sm" onclick="closeModal();setTimeout(()=>openEditFuncionario(${emp.id}),100)">Modificar</button>
      <button class="btn btn-sm" onclick="closeModal();inativarFuncionario(${emp.id})" style="background:var(--gray-soft);color:#fff;border:none;padding:6px 14px;border-radius:var(--r);cursor:pointer;font-size:var(--fs-xs);font-weight:600">Inativar</button>
    </div>
  `);
}

function openEditFuncionario(id){
  const emp=EMPLOYEES.find(e=>e.id===id);
  if(!emp)return;
  const sectors=[...new Set([emp.sector, ...getAvailableSectorNames()].filter(Boolean))];
  const roles=[...new Set([emp.role, ...getAvailableRoleNames()].filter(Boolean))];
  openModal(`Modificar — <span>${emp.name.split(' ')[0]}</span>`,`
    <datalist id="ef-sector-options">${sectors.map(s=>`<option value="${s}"></option>`).join('')}</datalist>
    <datalist id="ef-role-options">${roles.map(r=>`<option value="${r}"></option>`).join('')}</datalist>
    <div class="form-grid">
      <div class="form-group"><label class="form-label">Nome Completo</label><input type="text" class="form-input" id="ef-name" value="${emp.name||''}"></div>
      <div class="form-group"><label class="form-label">E-mail</label><input type="text" class="form-input" id="ef-email" value="${emp.email||''}"></div>
      <div class="form-group"><label class="form-label">Setor</label><input type="text" class="form-input" id="ef-sector" list="ef-sector-options" value="${emp.sector||''}"></div>
      <div class="form-group"><label class="form-label">Data de Admissão</label><input type="date" class="form-input" id="ef-admission" value="${emp.admission||''}"></div>
    </div>
    <div class="form-group"><label class="form-label">Cargo</label><input type="text" class="form-input" id="ef-role" list="ef-role-options" value="${emp.role||''}"></div>
    <div style="display:flex;gap:10px;margin-top:8px;flex-wrap:wrap">
      <button class="btn btn-primary" onclick="salvarEditFuncionario(${id})">Salvar Alterações</button>
      <button class="btn btn-sm" onclick="closeModal();inativarFuncionario(${id})" style="background:var(--gray-soft);color:#fff;border:none;padding:6px 14px;border-radius:var(--r);cursor:pointer;font-size:var(--fs-xs);font-weight:600">Inativar Funcionário</button>
      <button class="btn btn-outline" onclick="closeModal()">Cancelar</button>
    </div>
  `);
}

function salvarEditFuncionario(id){
  const emp=EMPLOYEES.find(e=>e.id===id);
  if(!emp)return;
  emp.name=document.getElementById('ef-name').value.trim()||emp.name;
  emp.email=document.getElementById('ef-email').value.trim()||emp.email;
  emp.sector=document.getElementById('ef-sector').value||emp.sector;
  emp.role=document.getElementById('ef-role').value.trim()||emp.role;
  emp.admission=document.getElementById('ef-admission').value||emp.admission;
  addLog(`Funcionário Editado: ${emp.name}`, 'edit', `${emp.role} · ${emp.sector}`);
  closeModal();saveData();renderFuncionarios();
}

function deleteFuncionario(id){
  const emp=EMPLOYEES.find(e=>e.id===id);
  if(!emp)return;
  showConfirm('Excluir Funcionário',`Tem certeza que deseja excluir "${emp.name}"? Esta ação não pode ser desfeita.`,()=>{
    EMPLOYEES=EMPLOYEES.filter(e=>e.id!==id);
    addLog(`Funcionário Excluído: ${emp.name}`, 'delete', `${emp.role} · ${emp.sector}`);
    saveData();
    toast('Funcionário Removido', `${emp.name} excluído do sistema.`, 'warn');
    renderFuncionarios();
  });
}

function inativarFuncionario(id){
  const emp=EMPLOYEES.find(e=>e.id===id);
  if(!emp)return;
  showConfirm('Inativar Funcionário',`Deseja inativar "${emp.name}"? O registro será mantido, mas o funcionário ficará inativo e não poderá ser editado.`,()=>{
    emp.inactive=true;
    addLog(`Funcionário Inativado: ${emp.name}`, 'edit', `${emp.role} · ${emp.sector}`);
    saveData();
    toast('Funcionário Inativado', `${emp.name} foi inativado.`, 'warn');
    renderFuncionarios();
  }, 'Sim, inativar');
}

function reintegrarFuncionario(id){
  const emp=EMPLOYEES.find(e=>e.id===id);
  if(!emp)return;
  emp.inactive=false;
  addLog(`Funcionário Reintegrado: ${emp.name}`, 'edit', `${emp.role} · ${emp.sector}`);
  saveData();
  toast('Funcionário Reintegrado', `${emp.name} foi reintegrado ao sistema.`, 'success');
  renderFuncionarios();
}

function openNovoFuncionario(){
  const sectorOptions=getAvailableSectorNames().map(s=>`<option value="${s}"></option>`).join('');
  const roleOptions=getAvailableRoleNames().map(r=>`<option value="${r}"></option>`).join('');
  openModal('+ Registrar <span>Funcionário</span>',`
    <datalist id="nf-sector-options">${sectorOptions}</datalist>
    <datalist id="nf-role-options">${roleOptions}</datalist>
    <div class="form-grid">
      <div class="form-group"><label class="form-label">Nome completo</label><input type="text" class="form-input" id="nf-name" placeholder="Nome Sobrenome"></div>
      <div class="form-group"><label class="form-label">E-mail</label><input type="text" class="form-input" id="nf-email" placeholder="email@empresa.com"></div>
      <div class="form-group"><label class="form-label">Data de Admissão</label><input type="date" class="form-input" id="nf-admission"></div>
      <div class="form-group"><label class="form-label">Setor / Área</label>
        <input type="text" class="form-input" id="nf-sector" list="nf-sector-options" placeholder="Digite o setor" oninput="previewOnboarding()">
      </div>
      <div class="form-group" style="grid-column:span 2"><label class="form-label">Cargo</label><input type="text" class="form-input" id="nf-role" list="nf-role-options" placeholder="Cargo do funcionário"></div>
    </div>
    <div id="onboarding-preview" style="margin:10px 0"></div>
    <button type="button" class="btn btn-primary" onclick="salvarNovoFuncionario()">✓ Registrar</button>
  `);
}

function previewOnboarding(){
  const sector=document.getElementById('nf-sector').value;
  const pops=ONBOARDING_MAP[sector]||[];
  const el=document.getElementById('onboarding-preview');
  if(!pops.length){el.innerHTML='';return;}
  el.innerHTML=`<div style="padding:12px;background:var(--orange-bg);border-radius:var(--r);border-left:3px solid var(--orange)">
    <div style="font-weight:700;font-size:var(--fs-sm);margin-bottom:8px">POPs de Onboarding:</div>
    ${pops.map(p=>`<div class="pending-pop-item"><span class="badge badge-orange" style="flex-shrink:0">Pendente</span><span>${p}</span></div>`).join('')}
  </div>`;
}

function salvarNovoFuncionario(){
  const name=document.getElementById('nf-name').value.trim();
  const email=document.getElementById('nf-email').value.trim();
  const sector=document.getElementById('nf-sector').value;
  const role=document.getElementById('nf-role').value.trim();
  const admission=document.getElementById('nf-admission').value;
  if(!name||!sector){toast('Campos obrigatórios','Preencha nome e setor.','error');return;}
  const pops=[];
  EMPLOYEES.push({id:nextEmpId++,name,email,sector,role,admission:admission||new Date().toISOString().slice(0,10),pops:[],anexos:[]});
  addLog(`Funcionário Registrado: ${name}`, 'create', `${role} · ${sector}`);
  saveData();
  toast('Funcionário Registrado', `${name} adicionado com sucesso.`, 'success');
  const filterEl=document.getElementById('emp-sector-filter'); if(filterEl) filterEl.value='';
  closeModal();renderFuncionarios();renderDashboard();
}

function openNovoTreinamento(){
  openModal('+ Novo <span>Treinamento</span>',`
    <div class="form-group"><label class="form-label">Funcionário</label>
      <select class="form-select" id="nt-emp" onchange="onNTEmpChange()">
        <option value="">Selecione o funcionário...</option>
        ${EMPLOYEES.map(e=>`<option value="${e.id}">${e.name} — ${e.sector}</option>`).join('')}
      </select>
    </div>
    <div class="form-group"><label class="form-label">Setor (automático)</label><input type="text" class="form-input" id="nt-sector" readonly placeholder="Setor será preenchido automaticamente" style="background:var(--gray-pale);cursor:not-allowed"></div>
    <div class="form-group"><label class="form-label">POP / Procedimento</label>
      <select class="form-select" id="nt-pop"><option value="">— Selecione um funcionário primeiro —</option></select>
    </div>
    <button class="btn btn-primary" onclick="salvarNovoTreinamento()">Registrar Solicitação</button>
  `);
}

function onNTEmpChange(){
  const empId=parseInt(document.getElementById('nt-emp').value);
  const emp=EMPLOYEES.find(e=>e.id===empId);
  if(!emp)return;
  document.getElementById('nt-sector').value=emp.sector;
  const sectorCodeMap={'Almoxarifado':'AL','Qualidade':'CQ','Qualidade / CQ':'CQ','Des. Embalagem':'DE','P&D':'DP'};
  const prefix=sectorCodeMap[emp.sector];
  const empSectorNorm=normalizeTxt(emp.sector);
  const relevantPOPs=POPS.filter(p=>!prefix || p.sector===prefix || normalizeTxt(p.sectorName)===empSectorNorm);
  const finalPOPs=relevantPOPs.length?relevantPOPs:POPS;
  const popSel=document.getElementById('nt-pop');
  popSel.innerHTML=finalPOPs.length?finalPOPs.map(p=>`<option value="${p.code}">${p.code} — ${p.desc}</option>`).join(''):'<option value="">Nenhum POP cadastrado</option>';
}

function salvarNovoTreinamento(){
  const empId=parseInt(document.getElementById('nt-emp').value);
  const code=document.getElementById('nt-pop').value;
  const emp=EMPLOYEES.find(e=>e.id===empId);
  const pop=POPS.find(p=>p.code===code);
  if(!emp || !pop){toast('Seleção obrigatória','Escolha um funcionário e um POP.','warn');return;}
  if(!Array.isArray(emp.pops)) emp.pops=[];
  const existing = emp.pops.find(x=>x.code===code || x.pop===pop.desc || x.pop===code);
  const item = existing || {code, pop:pop.desc, version:String(pop.versao || '1.0'), type:pop.popType || 'area'};
  item.code = code;
  item.pop = pop.desc;
  item.version = String(pop.versao || item.version || '1.0');
  item.status = 'Pendente';
  item.days = null;
  item.requestedAt = new Date().toLocaleDateString('pt-BR');
  item.type = pop.popType || item.type || 'area';
  if(!existing) emp.pops.push(item);
  pop.training = 'SOLICITADO';
  addLog(`Treinamento Solicitado: ${emp.name}`, 'edit', `${code} · ${pop.desc}`);
  saveData();
  toast('Treinamento Solicitado', `${emp.name} vinculado a ${code}.`, 'success');
  closeModal();
  renderFuncionarios();
  renderAlertasPage();
}

/* ══════════════════════════════════════════
   MATRIX
══════════════════════════════════════════ */
function renderMatrix(){
  const table=document.getElementById('heatmap-table');
  if(!table)return;

  const activeEmployees=EMPLOYEES.filter(e=>!e.inactive);
  const pops=POPS.slice().sort((a,b)=>String(a.sectorName||a.sector||'').localeCompare(String(b.sectorName||b.sector||''),'pt-BR') || String(a.code).localeCompare(String(b.code),'pt-BR'));

  if(!pops.length || !activeEmployees.length){
    table.innerHTML='<tbody><tr><td style="padding:24px;text-align:center;color:var(--gray-soft)">Cadastre POPs e funcionários para gerar a matriz por setor/cargo.</td></tr></tbody>';
    return;
  }

  const sectorMatches=(emp,pop)=>{
    const empSector=normalizeTxt(emp.sector);
    const popSector=normalizeTxt(pop.sectorName || pop.sector);
    const popCode=normalizeTxt(pop.sector);
    return !!empSector && (empSector===popSector || empSector===popCode || popSector.includes(empSector) || empSector.includes(popSector));
  };
  const explicitPopMatch=(emp,pop)=>Array.isArray(emp.pops) && emp.pops.some(item=>{
    const vals=[item.pop,item.code,item.nome,item.name,item.desc,item.popVinculado].map(normalizeTxt);
    return vals.includes(normalizeTxt(pop.code)) || vals.includes(normalizeTxt(pop.desc));
  });
  const hasAnexoMatch=(emp,pop)=>{
    const anexosDoPop=ANEXOS.filter(a=>normalizeTxt(a.popVinculado)===normalizeTxt(pop.code));
    if(!anexosDoPop.length || !Array.isArray(emp.anexos))return false;
    const tokens=anexosDoPop.flatMap(a=>[a.id,a.numero,a.nome,a.name,a.popVinculado]).map(normalizeTxt).filter(Boolean);
    return emp.anexos.some(a=>{
      const vals=(typeof a==='object'?[a.id,a.numero,a.nome,a.name,a.pop,a.popVinculado]:[a]).map(normalizeTxt);
      return vals.some(v=>tokens.includes(v) || v===normalizeTxt(pop.code));
    });
  };

  const groups=new Map();
  activeEmployees.forEach(emp=>{
    const key=`${emp.sector||'Sem setor'}|||${emp.role||'Sem cargo'}`;
    if(!groups.has(key))groups.set(key,{sector:emp.sector||'Sem setor',role:emp.role||'Sem cargo',employees:[]});
    groups.get(key).employees.push(emp);
  });

  const popThClass=pop=>{
    if((pop.popType||'').toLowerCase()==='core')return'pop-th-core';
    if((pop.popType||'').toLowerCase()==='cargo')return'pop-th-cargo';
    return'pop-th-area';
  };

  const headerCells=pops.map(pop=>`<th class="${popThClass(pop)}" title="${pop.desc||''}">${pop.code}</th>`).join('');
  table.innerHTML=`
    <thead><tr><th class="row-label">Setor / Cargo</th>${headerCells}</tr></thead>
    <tbody>${[...groups.values()].sort((a,b)=>a.sector.localeCompare(b.sector,'pt-BR')||a.role.localeCompare(b.role,'pt-BR')).map(group=>{
      const cells=pops.map(pop=>{
        const explicit=group.employees.some(emp=>explicitPopMatch(emp,pop));
        const anexo=group.employees.some(emp=>hasAnexoMatch(emp,pop));
        const setor=group.employees.some(emp=>sectorMatches(emp,pop));
        if(explicit){
          return `<td title="${pop.code}: vinculado diretamente ao funcionário/cargo"><div class="heat-cell heat-ok">✓</div><div class="matrix-cell-label">Direto</div></td>`;
        }
        if(anexo){
          return `<td title="${pop.code}: vinculado por anexo do POP"><div class="heat-cell heat-pend">A</div><div class="matrix-cell-label">Anexo</div></td>`;
        }
        if(setor){
          return `<td title="${pop.code}: relação automática pelo setor"><div class="heat-cell heat-core">S</div><div class="matrix-cell-label">Setor</div></td>`;
        }
        return `<td title="${pop.code}: sem relação cadastrada"><div class="heat-cell heat-na">—</div></td>`;
      }).join('');
      return `<tr><td class="role-name"><div style="font-size:.8rem;font-weight:700">${group.role}</div><div class="role-sector">${group.sector} · ${group.employees.length} funcionário(s)</div></td>${cells}</tr>`;
    }).join('')}</tbody>
  `;
}

/* ══════════════════════════════════════════
   ALERTAS PAGE
══════════════════════════════════════════ */
function getEmployeePendingPops(emp){
  const byKey = new Map();
  (emp?.pops || []).filter(p=>p && p.status === 'Pendente').forEach(p=>{
    const key = normalizeTxt(p.code || p.pop || p.nome || p.name);
    byKey.set(key || String(byKey.size), {...p, status:'Pendente'});
  });

  POPS.filter(pop=>pop.training === 'SOLICITADO').forEach(pop=>{
    if(employeeLinkedToPOP(emp, pop, getPOPAnexos(pop))){
      const key = normalizeTxt(pop.code || pop.desc);
      if(!byKey.has(key)){
        byKey.set(key, {
          code: pop.code,
          pop: pop.desc || pop.code,
          version: String(pop.versao || '1.0'),
          status: 'Pendente',
          type: pop.popType || 'area',
          source: 'POP solicitado no Firebase'
        });
      }
    }
  });

  return [...byKey.values()];
}

function getEmployeesWithTrainingRequests(){
  return EMPLOYEES
    .filter(e=>!e.inactive)
    .map(emp=>({...emp, __pendingPops:getEmployeePendingPops(emp)}))
    .filter(emp=>emp.__pendingPops.length>0);
}

function renderAlertasPage(){
  const content=document.getElementById('alertas-page-content');
  if(!content)return;
  const critical=POPS.filter(p=>p.vigencia==='VENCIDO'||p.docStatus==='ELABORAR');
  const expiring=POPS.filter(p=>p.vigencia==='VENCE EM 3 MESES');
  const employeesWithPending=getEmployeesWithTrainingRequests();
  const pending=employeesWithPending;
  content.innerHTML=`
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:14px;margin-bottom:20px">
      <div class="kpi-card"><div class="kpi-val" style="color:var(--red)">${critical.length}</div><div class="kpi-label">POPs Críticos</div></div>
      <div class="kpi-card orange"><div class="kpi-val">${expiring.length}</div><div class="kpi-label">Vencendo em 3 Meses</div></div>
      <div class="kpi-card blue"><div class="kpi-val">${pending.length}</div><div class="kpi-label">Treinamentos Pendentes</div></div>
    </div>
    <div class="bento-card col-12" style="margin-bottom:16px">
      <h3><span>🚨</span> POPs que exigem ação imediata</h3>
      ${critical.map(p=>{
        const d=calcDaysUntilExpiry(p);
        const dStr=d!==null?(d<0?`<span class="days-badge overdue">⚠ Vencido há ${Math.abs(d)}d</span>`:`<span class="days-badge soon">${d}d restantes</span>`):'';
        return`
        <div class="alert-item danger" onclick="closeModal();navigate('pops')">
          <span class="alert-item-icon" style="color:var(--red);font-weight:900">!</span>
          <div class="alert-item-text"><strong>${p.code}</strong> — ${p.desc}<div style="font-size:var(--fs-xs);color:var(--gray-soft);margin-top:2px">${p.sectorName} · ${p.vigencia} ${dStr}</div></div>
          <div style="display:flex;gap:6px">
            ${docBadge(p.docStatus)}
          </div>
        </div>
      `}).join('')}
      ${!critical.length?'<div style="color:var(--green);font-weight:700;padding:12px">✅ Nenhum POP crítico.</div>':''}
    </div>
    <div class="bento-card col-12">
      <h3><span>⏳</span> Treinamentos Solicitados</h3>
      ${employeesWithPending.map(emp=>{
        const count=(emp.__pendingPops || getEmployeePendingPops(emp)).length;
        return `
        <div class="alert-item warn" onclick="abrirPendenciasFuncionario(${emp.id})" style="cursor:pointer">
          <span class="alert-item-icon" style="color:var(--orange);font-weight:900">!</span>
          <div class="alert-item-text"><strong>${emp.name}</strong><div style="font-size:var(--fs-xs);color:var(--gray-soft);margin-top:2px">${emp.sector||'—'} · ${emp.role||'—'} · ${count} treinamento(s) pendente(s)</div></div>
          <div style="display:flex;gap:6px">
            <span class="badge" style="background:var(--orange-bg);color:var(--orange);border:none">Pendente</span>
          </div>
        </div>`;
      }).join('')}
      ${!employeesWithPending.length?'<div style="color:var(--green);font-weight:700;padding:12px">✅ Nenhum treinamento pendente.</div>':''}
    </div>
  `;
}


function abrirPendenciasFuncionario(empId) {
  // Busca o funcionário pelo ID
  const emp = EMPLOYEES.find(e => e.id == empId);
  if (!emp) return;

  // Filtra apenas os POPs pendentes dele, incluindo solicitações sincronizadas pelo Firebase
  const pendingPops = getEmployeePendingPops(emp);

  // Monta o HTML da listagem de POPs
  let listHtml = pendingPops.map(p => `
    <div style="padding: 12px; border: 1px solid var(--border); border-radius: var(--r); margin-bottom: 8px; background: var(--surface); display: flex; justify-content: space-between; align-items: center;">
      <div>
        <strong style="color: var(--blue);">${p.pop}</strong>
        <div style="font-size: var(--fs-xs); color: var(--gray-soft); margin-top: 4px;">Versão: ${p.version || '1.0'}</div>
      </div>
      <span class="badge" style="background: var(--orange-bg); color: var(--orange); border: none;">Pendente</span>
    </div>
  `).join('');

  if (pendingPops.length === 0) {
    listHtml = `<p style="color: var(--green); font-weight: bold;">Nenhum treinamento pendente.</p>`;
  }

  // Abre o Modal usando a sua função existente
  openModal(`Pendências: <span>${emp.name}</span>`, `
    <div style="margin-bottom: 20px; max-height: 400px; overflow-y: auto;">
      <p style="font-size: var(--fs-sm); color: var(--gray-soft); margin-bottom: 16px;">
        Este funcionário possui <strong>${pendingPops.length}</strong> solicitação(ões) de treinamento aguardando realização:
      </p>
      ${listHtml}
    </div>
    <div style="display: flex; gap: 10px; justify-content: flex-end; border-top: 1px solid var(--border); padding-top: 16px;">
      <button class="btn btn-outline" onclick="closeModal()">Fechar</button>
      <button class="btn btn-primary" onclick="closeModal(); navigate('funcionarios'); setTimeout(() => viewFuncionario(${emp.id}), 150)">
        Ir para Ficha do Funcionário
      </button>
    </div>
  `);
}

function viewFuncionario(id){ return openEmpProfile(id); }

/* ══════════════════════════════════════════
   ANEXOS
══════════════════════════════════════════ */
function renderAnexos(){
  const search=(document.getElementById('anexo-search')?.value||'').toLowerCase();
  let items=ANEXOS;
  if(search)items=items.filter(a=>a.nome.toLowerCase().includes(search)||a.numero.toLowerCase().includes(search)||a.popVinculado.toLowerCase().includes(search));
  const body=document.getElementById('anexos-body');
  if(!body)return;
  body.innerHTML=items.map(a=>{
    const statusBadge=a.status==='Aprovado'?'<span class="badge badge-green">✓ Aprovado</span>':a.status==='Em Revisão'?'<span class="badge badge-orange">Em Revisão</span>':'<span class="badge badge-gray">Obsoleto</span>';
    const fi=a.file?fileIcon(a.file.type):fileIcon(null);
    const fileCell=a.file
      ?`<div style="display:flex;align-items:center;gap:7px"><div class="file-icon ${fi.cls}">${fi.icon}</div><div style="font-size:.7rem;color:var(--gray-soft);max-width:80px;word-break:break-all">${a.file.name.substring(0,18)}${a.file.name.length>18?'…':''}<br>${formatBytes(a.file.size)}</div></div>`
      :'<span style="color:var(--gray-soft);font-size:.75rem">—</span>';
    return`<tr>
      <td>${fileCell}</td>
      <td><strong style="color:var(--red)">${a.nome}</strong></td>
      <td style="font-weight:700">${a.numero}</td>
      <td><span class="badge badge-blue">${[a.popVinculado, ...(Array.isArray(a.popsVinculados)?a.popsVinculados:[])].filter(Boolean).filter((v,i,arr)=>arr.indexOf(v)===i).join(', ') || '—'}</span></td>
      <td style="max-width:200px;font-size:var(--fs-sm);color:var(--gray-soft)">${a.desc}</td>
      <td>${statusBadge}</td>
      <td style="font-size:var(--fs-xs);color:var(--gray-soft)">${a.dataCriacao}</td>
      <td style="font-size:var(--fs-xs);color:var(--gray-soft)">${a.dataRevisao}</td>
      <td style="font-size:var(--fs-xs);font-weight:700;color:${a.dataVencimento?'var(--green)':'var(--gray-soft)'}">${a.dataVencimento||'—'}</td>
      <td style="white-space:nowrap">
        <button class="btn btn-outline btn-sm" onclick="openEditAnexo(${a.id})" style="margin-right:4px">Editar</button>
      </td>
    </tr>`;
  }).join('');
  if(!items.length)body.innerHTML=`<tr><td colspan="10" style="text-align:center;padding:24px;color:var(--gray-soft)">Nenhum anexo encontrado${search?' para "'+search+'"':''}.</td></tr>`;
}

function deleteAnexo(id){
  const a=ANEXOS.find(x=>x.id===id);
  if(!a)return;
  showConfirm('Excluir Anexo',`Tem certeza que deseja excluir o anexo "${a.nome}"?`,()=>{
    addLog(`Anexo Excluído: ${a.numero}`, 'delete', `${a.nome} · POP: ${a.popVinculado}`);
    ANEXOS=ANEXOS.filter(x=>x.id!==id);
    saveData();
    toast('Anexo Excluído', `${a.nome} removido.`, 'warn');
    renderAnexos();
  });
}

function openEditAnexo(id){
  const a=ANEXOS.find(x=>x.id===id);
  if(!a)return;
  // Convert stored date (dd/mm/yyyy) to input format (yyyy-mm-dd)
  const toInputDate = str => {
    if(!str||str==='—') return '';
    const p=str.split('/'); if(p.length!==3) return '';
    return `${p[2]}-${p[1].padStart(2,'0')}-${p[0].padStart(2,'0')}`;
  };
  const dataRevisaoInput = toInputDate(a.dataRevisao) || new Date().toISOString().slice(0,10);
  openModal(`Editar Anexo — <span>${a.numero}</span>`,`
    <div class="form-grid">
      <div class="form-group"><label class="form-label">Nome</label><input type="text" class="form-input" id="ea-nome" value="${a.nome}"></div>
      <div class="form-group"><label class="form-label">Número</label><input type="text" class="form-input" id="ea-numero" value="${a.numero}"></div>
      <div class="form-group"><label class="form-label">POP Vinculado</label>
        <select class="form-select" id="ea-pop">
          ${POPS.map(p=>`<option value="${p.code}" ${p.code===a.popVinculado?'selected':''}>${p.code}</option>`).join('')}
        </select>
      </div>
      <div class="form-group"><label class="form-label">Status</label>
        <select class="form-select" id="ea-status">
          <option value="Aprovado" ${a.status==='Aprovado'?'selected':''}>Aprovado</option>
          <option value="Em Revisão" ${a.status==='Em Revisão'?'selected':''}>Em Revisão</option>
          <option value="Obsoleto" ${a.status==='Obsoleto'?'selected':''}>Obsoleto</option>
        </select>
      </div>
    </div>
    <div class="form-group"><label class="form-label">Descrição</label><textarea class="form-input" id="ea-desc" rows="3">${a.desc}</textarea></div>
    <div class="form-grid" style="margin-bottom:8px">
      <div class="form-group">
        <label class="form-label">Data de Revisão</label>
        <input type="date" class="form-input" id="ea-data-revisao" value="${dataRevisaoInput}" oninput="atualizarVencimentoEditAnexo()">
      </div>
      <div class="form-group">
        <label class="form-label">Vencimento (5 anos)</label>
        <input type="text" class="form-input" id="ea-vencimento" readonly style="background:var(--gray-pale);cursor:not-allowed;font-weight:700;color:var(--green)">
      </div>
    </div>
    <div id="ea-venc-preview" style="padding:10px 14px;background:var(--green-bg);border-radius:var(--r);border-left:3px solid var(--green);font-size:var(--fs-sm);margin-bottom:14px">
      Vencimento: <strong id="ea-venc-label" style="color:var(--green)"></strong> · <span id="ea-dias-label" style="font-weight:700"></span>
    </div>
    <div style="display:flex;gap:10px;margin-top:8px;flex-wrap:wrap">
      <button class="btn btn-primary" onclick="salvarEditAnexo(${id})">Salvar</button>
      <button class="btn btn-outline" onclick="closeModal()">Cancelar</button>
    </div>
  `);
  atualizarVencimentoEditAnexo();
}

function atualizarVencimentoEditAnexo(){
  const raw = document.getElementById('ea-data-revisao')?.value;
  const vencEl = document.getElementById('ea-vencimento');
  const labelEl = document.getElementById('ea-venc-label');
  const diasEl = document.getElementById('ea-dias-label');
  if(!raw || !vencEl) return;
  const d = new Date(raw+'T00:00:00');
  const venc = new Date(d); venc.setFullYear(venc.getFullYear()+5);
  const vencStr = venc.toLocaleDateString('pt-BR');
  vencEl.value = vencStr;
  if(labelEl) labelEl.textContent = vencStr;
  const dias = Math.ceil((venc - new Date()) / 86400000);
  if(diasEl){
    if(dias<0){ diasEl.textContent=`Vencido há ${Math.abs(dias)} dias`; diasEl.style.color='var(--red)'; }
    else if(dias<=90){ diasEl.textContent=`${dias} dias restantes`; diasEl.style.color='var(--orange)'; }
    else { diasEl.textContent=`${dias} dias restantes`; diasEl.style.color='var(--green)'; }
  }
}

function salvarEditAnexo(id){
  const a=ANEXOS.find(x=>x.id===id);
  if(!a)return;
  a.nome=document.getElementById('ea-nome').value.trim()||a.nome;
  a.numero=document.getElementById('ea-numero').value.trim()||a.numero;
  a.popVinculado=document.getElementById('ea-pop').value||a.popVinculado;
  a.status=document.getElementById('ea-status').value;
  a.desc=document.getElementById('ea-desc').value.trim()||a.desc;
  const rawDate = document.getElementById('ea-data-revisao')?.value;
  if(rawDate){
    const d = new Date(rawDate+'T00:00:00');
    a.dataRevisao = d.toLocaleDateString('pt-BR');
    const venc = new Date(d); venc.setFullYear(venc.getFullYear()+5);
    a.dataVencimento = venc.toLocaleDateString('pt-BR');
  }
  addLog(`Anexo Editado: ${a.numero}`, 'edit', `${a.nome} · Status: ${a.status}${a.dataVencimento?' · Venc: '+a.dataVencimento:''}`);
  saveData();
  toast('Anexo Atualizado', `${a.nome} salvo.`, 'success');
  closeModal();renderAnexos();
}

function openCriarAnexo(){
  const hoje = new Date().toISOString().slice(0,10);
  openModal('+ Criar <span>Anexo</span>',`
    <div class="form-grid">
      <div class="form-group"><label class="form-label">Nome do Anexo</label><input type="text" class="form-input" id="anx-nome" placeholder="Ex: Ficha de Calibração..."></div>
      <div class="form-group"><label class="form-label">Número (Romano)</label><input type="text" class="form-input" id="anx-numero" placeholder="Ex: I, II, III..."></div>
      <div class="form-group"><label class="form-label">POP Vinculado</label>
        <select class="form-select" id="anx-pop">
          <option value="">— Selecione —</option>
          ${POPS.map(p=>`<option value="${p.code}">${p.code} — ${p.desc.substring(0,38)}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Data de Criação</label>
        <input type="date" class="form-input" id="anx-data" value="${hoje}" oninput="atualizarVencimentoAnexo()">
      </div>
    </div>
    <div style="padding:10px 14px;background:var(--green-bg);border-radius:var(--r);border-left:3px solid var(--green);font-size:var(--fs-sm);margin-bottom:14px">
      ⏳ Vencimento automático (5 anos): <strong id="anx-venc-label" style="color:var(--green)"></strong> · <span id="anx-dias-label" style="font-weight:700"></span>
    </div>
    <div class="form-group"><label class="form-label">Arquivo (opcional)</label>
      <input type="file" class="form-input" id="anx-file" accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg" style="padding:8px">
    </div>
    <div class="form-group"><label class="form-label">Descrição</label><textarea class="form-input" id="anx-desc" rows="3" placeholder="Descreva o conteúdo e finalidade do anexo..."></textarea></div>
    <button class="btn btn-primary" onclick="salvarCriarAnexo()">✓ Criar Anexo</button>
  `);
  atualizarVencimentoAnexo();
}

function atualizarVencimentoAnexo(){
  const raw = document.getElementById('anx-data')?.value;
  const labelEl = document.getElementById('anx-venc-label');
  const diasEl = document.getElementById('anx-dias-label');
  if(!raw) return;
  const d = new Date(raw+'T00:00:00');
  const venc = new Date(d); venc.setFullYear(venc.getFullYear()+5);
  const vencStr = venc.toLocaleDateString('pt-BR');
  if(labelEl) labelEl.textContent = vencStr;
  const dias = Math.ceil((venc - new Date()) / 86400000);
  if(diasEl){
    if(dias < 0){ diasEl.textContent=`Vencido há ${Math.abs(dias)} dias`; diasEl.style.color='var(--red)'; }
    else if(dias<=90){ diasEl.textContent=`⚠ ${dias} dias restantes`; diasEl.style.color='var(--orange)'; }
    else { diasEl.textContent=`✓ ${dias} dias restantes`; diasEl.style.color='var(--green)'; }
  }
}

function salvarCriarAnexo(){
  const nome=document.getElementById('anx-nome').value.trim();
  const numero=document.getElementById('anx-numero').value.trim();
  const pop=document.getElementById('anx-pop').value;
  const desc=document.getElementById('anx-desc').value.trim();
  const dataRaw=document.getElementById('anx-data').value;
  const fileEl=document.getElementById('anx-file');
  if(!nome||!numero){toast('Campos obrigatórios','Preencha nome e número.','error');return;}
  let dataCriacao, dataVencimento;
  if(dataRaw){
    const d = new Date(dataRaw+'T00:00:00');
    dataCriacao = d.toLocaleDateString('pt-BR');
    const venc = new Date(d); venc.setFullYear(venc.getFullYear()+5);
    dataVencimento = venc.toLocaleDateString('pt-BR');
  } else {
    dataCriacao = new Date().toLocaleDateString('pt-BR');
    const venc = new Date(); venc.setFullYear(venc.getFullYear()+5);
    dataVencimento = venc.toLocaleDateString('pt-BR');
  }
  let fileData=null;
  if(fileEl&&fileEl.files&&fileEl.files[0]){
    const f=fileEl.files[0];
    fileData={name:f.name,size:f.size,type:f.type};
  }
  ANEXOS.push({id:nextAnexoId++,nome,numero,popVinculado:pop||'—',desc:desc||'Sem descrição.',status:'Em Revisão',dataCriacao,dataVencimento,dataRevisao:'—',file:fileData});
  addLog(`Anexo Criado: ${numero}`, 'create', `${nome} · POP: ${pop||'—'} · Venc: ${dataVencimento}`);
  saveData();
  toast('Anexo Criado', `${nome} — Vencimento: ${dataVencimento}.`, 'success');
  closeModal();renderAnexos();
}

function openRevisarAnexo(){
  const overlay=document.getElementById('revisar-anexo-overlay');
  const sel=document.getElementById('rev-anexo-select');
  sel.innerHTML='<option value="">— Selecione um anexo —</option>'+ANEXOS.map(a=>`<option value="${a.id}">${a.numero} — ${a.nome}</option>`).join('');
  document.getElementById('rev-anexo-preview').style.display='none';
  overlay.style.display='flex';
}
function fecharRevisarAnexo(){document.getElementById('revisar-anexo-overlay').style.display='none';}
function previewAnexoRevisao(){
  const id=parseInt(document.getElementById('rev-anexo-select').value);
  const preview=document.getElementById('rev-anexo-preview');
  if(!id){preview.style.display='none';return;}
  const a=ANEXOS.find(x=>x.id===id);
  if(!a)return;
  document.getElementById('rev-anexo-desc').value=a.desc;
  document.getElementById('rev-anexo-status').value=a.status;
  // Pre-fill date with today
  const hoje = new Date().toISOString().slice(0,10);
  document.getElementById('rev-anexo-data').value=hoje;
  document.getElementById('rev-anexo-datas').innerHTML=`Criado: <strong>${a.dataCriacao}</strong> · Última revisão: <strong>${a.dataRevisao}</strong>`;
  preview.style.display='block';
  atualizarVencimentoRevisaoAnexo();
}

function atualizarVencimentoRevisaoAnexo(){
  const raw = document.getElementById('rev-anexo-data')?.value;
  const vencEl = document.getElementById('rev-anexo-vencimento');
  const labelEl = document.getElementById('rev-anexo-venc-label');
  const diasEl = document.getElementById('rev-anexo-dias-label');
  const previewEl = document.getElementById('rev-anexo-venc-preview');
  if(!raw || !vencEl) return;
  const d = new Date(raw+'T00:00:00');
  const venc = new Date(d); venc.setFullYear(venc.getFullYear()+5);
  const vencStr = venc.toLocaleDateString('pt-BR');
  vencEl.value = vencStr;
  if(labelEl) labelEl.textContent = vencStr;
  const dias = Math.ceil((venc - new Date()) / 86400000);
  if(diasEl){
    if(dias<0){ diasEl.textContent=`Vencido há ${Math.abs(dias)} dias`; diasEl.style.color='var(--red)'; }
    else if(dias<=90){ diasEl.textContent=`${dias} dias restantes`; diasEl.style.color='var(--orange)'; }
    else { diasEl.textContent=`${dias} dias restantes`; diasEl.style.color='var(--green)'; }
  }
  if(previewEl) previewEl.style.display='';
}
function salvarRevisaoAnexo(){
  const id=parseInt(document.getElementById('rev-anexo-select').value);
  if(!id){toast('Selecione um anexo','Escolha um anexo para revisar.','warn');return;}
  const a=ANEXOS.find(x=>x.id===id);
  if(!a)return;
  a.desc=document.getElementById('rev-anexo-desc').value.trim();
  a.status=document.getElementById('rev-anexo-status').value;
  const rawDate = document.getElementById('rev-anexo-data')?.value;
  if(rawDate){
    const d = new Date(rawDate+'T00:00:00');
    a.dataRevisao = d.toLocaleDateString('pt-BR');
    const venc = new Date(d); venc.setFullYear(venc.getFullYear()+5);
    a.dataVencimento = venc.toLocaleDateString('pt-BR');
  } else {
    a.dataRevisao = new Date().toLocaleDateString('pt-BR');
    const venc = new Date(); venc.setFullYear(venc.getFullYear()+5);
    a.dataVencimento = venc.toLocaleDateString('pt-BR');
  }
  addLog(`Anexo Revisado: ${a.numero}`, 'edit', `${a.nome} · Novo status: ${a.status} · Venc: ${a.dataVencimento}`);
  saveData();
  toast('Revisão Salva', `${a.nome} revisado. Vencimento: ${a.dataVencimento}.`, 'success');
  fecharRevisarAnexo();renderAnexos();
}

/* ══════════════════════════════════════════
   EXPORT
══════════════════════════════════════════ */
function exportCSV(){
  const rows=[['Código','Setor','Descrição','Status','Vigência','Treinamento']];
  POPS.forEach(p=>rows.push([p.code,p.sectorName,p.desc,p.docStatus,p.vigencia,p.training]));
  const csv=rows.map(r=>r.map(v=>`"${v}"`).join(',')).join('\n');
  const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='NAZCA_POPs_Export.csv';a.click();
}

/* ══════════════════════════════════════════
   FIREBASE + LOCAL FALLBACK PERSISTENCE
══════════════════════════════════════════ */
const firebaseConfig = {
  apiKey: "AIzaSyCGQEg7rOySTF6wKy9x9RPTB1dcF_awkh0",
  authDomain: "teste-fc4e7.firebaseapp.com",
  databaseURL: "https://teste-fc4e7-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "teste-fc4e7",
  storageBucket: "teste-fc4e7.firebasestorage.app",
  messagingSenderId: "950741350244",
  appId: "1:950741350244:web:8e63b4ae058f0a0febec71",
  measurementId: "G-9SZNR98W01"
};

const DB_ROOT = 'nazca_gestaopop_live_clean_v2';
const LS_KEY_POPS = 'nazca_pops_clean_v1';
const LS_KEY_ANEXOS = 'nazca_anexos_clean_v1';
const LS_KEY_LOGS = 'nazca_logs_clean_v1';
const LS_KEY_EMPLOYEES = 'nazca_employees_clean_v1';

let firebaseApp = null;
let firebaseDb = null;
let firebaseReady = false;
let firebaseListening = false;
let isSyncingFromFirebase = false;
let lastFirebasePayload = '';

function initFirebase(){
  try{
    if(typeof firebase === 'undefined' || !firebase.database){
      console.warn('Firebase SDK não carregado. Usando localStorage.');
      return false;
    }
    if(!firebase.apps.length) firebaseApp = firebase.initializeApp(firebaseConfig);
    else firebaseApp = firebase.app();
    firebaseDb = firebase.database();
    firebaseReady = true;
    return true;
  }catch(e){
    firebaseReady = false;
    console.warn('Erro ao iniciar Firebase:', e);
    return false;
  }
}

function safeArray(value, fallback=[]){
  if(Array.isArray(value)) return value.filter(v=>v!==null && v!==undefined);
  if(value && typeof value === 'object') return Object.values(value).filter(v=>v!==null && v!==undefined);
  return fallback;
}

function recalcNextIds(){
  nextAnexoId = Math.max(0, ...ANEXOS.map(a=>Number(a.id)||0)) + 1;
  nextEmpId = Math.max(0, ...EMPLOYEES.map(e=>Number(e.id)||0)) + 1;
}


function normalizeTxt(v){
  return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();
}

function canonicalSectorName(value){
  const raw = String(value || '').trim().replace(/\s+/g, ' ');
  if(!raw) return 'Não informado';
  const norm = normalizeTxt(raw);
  for(const [code, name] of Object.entries(ALL_SECTORS || {})){
    if(norm === normalizeTxt(code) || norm === normalizeTxt(name)) return name;
  }
  const sameFromPops = (POPS || []).find(p => normalizeTxt(p.sectorName) === norm || normalizeTxt(p.sector) === norm);
  if(sameFromPops){
    const found = sameFromPops.sectorName || sameFromPops.sector;
    for(const [code, name] of Object.entries(ALL_SECTORS || {})){
      if(normalizeTxt(found) === normalizeTxt(code) || normalizeTxt(found) === normalizeTxt(name)) return name;
    }
    return String(found || raw).trim().replace(/\s+/g, ' ');
  }
  return raw;
}

function canonicalSectorKey(value){
  return normalizeTxt(canonicalSectorName(value)).replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'nao_informado';
}

function getPOPSectorInfo(pop){
  const name = canonicalSectorName(pop?.sectorName || pop?.sector || 'Não informado');
  return { key: canonicalSectorKey(name), name };
}

function anexoId(a){ return String(a?.id ?? a?.numero ?? a?.nome ?? ''); }
function isFictitiousAnexo(a){
  const id=normalizeTxt(a?.id);
  const nome=normalizeTxt(a?.nome || a?.name);
  const numero=normalizeTxt(a?.numero);
  const fakeNames=[
    'it-al-001 instrucao de trabalho.pdf',
    'pop-cq-controle qualidade rev3.pdf',
    'fluxograma recebimento mp v2.pdf',
    'checklist auditoria interna 2025.pdf',
    'procedimento de calibracao epi.pdf',
    'procedimento de limpeza cq 033',
    'ficha de calibracao phmetro'
  ];
  return /^anx\d+$/i.test(String(a?.id||'')) || fakeNames.some(n=>nome.includes(n)) || ['i','ii','iii','iv','v'].includes(numero) && fakeNames.some(n=>nome.includes(n.split(' ')[0]));
}
function cleanFictitiousData(){
  ANEXOS = safeArray(ANEXOS, []).filter(a=>!isFictitiousAnexo(a));
  const validIds = new Set(ANEXOS.map(a=>anexoId(a)));
  POPS = safeArray(POPS, []).map(pop=>{
    const refs = normalizePOPAnexoRefs(pop).filter(id=>validIds.has(String(id)));
    return {...pop, anexos:refs, anexoRef:refs[0]||'', hasAnexo:refs.length>0 || !!pop.anexoFile};
  });
}
function normalizePOPAnexoRefs(pop){
  const refs=[];
  if(Array.isArray(pop?.anexos)) refs.push(...pop.anexos);
  if(Array.isArray(pop?.anexoRefs)) refs.push(...pop.anexoRefs);
  if(pop?.anexoRef) refs.push(pop.anexoRef);
  return [...new Set(refs.map(v=>String(v)).filter(Boolean))];
}
function anexoLinkedToPop(a, code){
  const c=normalizeTxt(code);
  if(!a || !c) return false;
  const direct=[a.popVinculado,a.popCode,a.codigoPOP].map(normalizeTxt).includes(c);
  const arr=Array.isArray(a.popsVinculados)?a.popsVinculados:[];
  return direct || arr.map(normalizeTxt).includes(c);
}
function getPOPAnexos(popOrCode){
  const pop=typeof popOrCode==='object'?popOrCode:POPS.find(p=>normalizeTxt(p.code)===normalizeTxt(popOrCode));
  const code=typeof popOrCode==='object'?popOrCode.code:popOrCode;
  const refs=new Set(normalizePOPAnexoRefs(pop).map(String));
  return ANEXOS.filter(a=>refs.has(anexoId(a)) || anexoLinkedToPop(a, code));
}
function syncAnexosToPOP(code, selectedIds){
  const selected=new Set((selectedIds||[]).map(String));
  ANEXOS.forEach(a=>{
    const id=anexoId(a);
    const current=Array.isArray(a.popsVinculados)?a.popsVinculados.map(String):[];
    const has=current.includes(String(code)) || normalizeTxt(a.popVinculado)===normalizeTxt(code);
    if(selected.has(id) && !has){
      a.popsVinculados=[...new Set([...current, String(code)])];
      if(!a.popVinculado || a.popVinculado==='—') a.popVinculado=String(code);
    }
    if(!selected.has(id) && has){
      a.popsVinculados=current.filter(c=>normalizeTxt(c)!==normalizeTxt(code));
      if(normalizeTxt(a.popVinculado)===normalizeTxt(code)) a.popVinculado=a.popsVinculados[0] || '—';
    }
  });
}
function getSelectedAnexoIds(prefix){
  const sel=document.getElementById(`${prefix}-anexo-select`);
  return sel ? [...sel.selectedOptions].map(o=>String(o.value)).filter(Boolean) : [];
}
function computeSectorsData(){
  const data = {};
  POPS.forEach(p=>{
    const info = getPOPSectorInfo(p);
    const key = info.key;
    if(!data[key]) data[key] = {name:info.name,total:0,approved:0,inReview:0,expired:0,trainPending:0};
    data[key].total++;
    if(p.docStatus === 'APROVADO') data[key].approved++;
    if(p.docStatus === 'EM REVISÃO') data[key].inReview++;
    if(p.vigencia === 'VENCIDO') data[key].expired++;
    if(p.training === 'SOLICITADO') data[key].trainPending++;
  });
  return Object.fromEntries(Object.entries(data).sort((a,b)=>a[1].name.localeCompare(b[1].name,'pt-BR')));
}
function getAvailableSectorNames(){
  const names = new Map();
  Object.entries(ALL_SECTORS || {}).forEach(([,name])=>{ if(name) names.set(canonicalSectorKey(name), canonicalSectorName(name)); });
  POPS.forEach(p=>{ const info=getPOPSectorInfo(p); if(info.name) names.set(info.key, info.name); });
  EMPLOYEES.forEach(e=>{ if(e.sector) names.set(canonicalSectorKey(e.sector), canonicalSectorName(e.sector)); });
  ANEXOS.forEach(a=>{ if(a.setor) names.set(canonicalSectorKey(a.setor), canonicalSectorName(a.setor)); });
  return [...names.values()].filter(Boolean).sort((a,b)=>a.localeCompare(b,'pt-BR'));
}
function getAvailableRoleNames(){
  const roles = new Set();
  EMPLOYEES.forEach(e=>{ if(e.role) roles.add(e.role); });
  POPS.forEach(p=>{ if(p.cargo) roles.add(p.cargo); if(p.role) roles.add(p.role); });
  return [...roles].filter(Boolean).sort((a,b)=>a.localeCompare(b,'pt-BR'));
}
function refreshAllViews(){
  renderActivePage();
  if(window.__lastPOPEmployeesCode && document.getElementById('modal')?.classList.contains('active')){
    const title = document.getElementById('modal-title')?.textContent || '';
    if(title.includes('Funcionários')){
      const code = window.__lastPOPEmployeesCode;
      setTimeout(()=>openPOPEmployees(code), 0);
    }
  }
}

function employeeLinkedToPOP(emp, pop, anexosDoPop=[]){
  if(!emp || !pop) return false;
  const code = normalizeTxt(pop.code);
  const desc = normalizeTxt(pop.desc);
  const sectorName = normalizeTxt(pop.sectorName || ALL_SECTORS[pop.sector] || pop.sector);
  const sectorCode = normalizeTxt(pop.sector);
  const empSector = normalizeTxt(emp.sector);
  const empRole = normalizeTxt(emp.role);
  const popCargo = normalizeTxt(pop.cargo || pop.role);
  const directPOP = Array.isArray(emp.pops) && emp.pops.some(item=>{
    const vals = [item.code,item.pop,item.nome,item.name,item.desc,item.popCode,item.popVinculado].map(normalizeTxt);
    return vals.includes(code) || vals.includes(desc) || vals.some(v=>v && (v.includes(code) || code.includes(v) || v.includes(desc) || desc.includes(v)));
  });
  const popAreas = Array.isArray(pop.areas) ? pop.areas.map(normalizeTxt) : [];
  const bySector = !!sectorName && (empSector === sectorName || empSector === sectorCode || sectorName.includes(empSector) || empSector.includes(sectorName) || popAreas.some(a=>a && (a===empSector || a.includes(empSector) || empSector.includes(a))));
  const byCargo = !!popCargo && !!empRole && (empRole.includes(popCargo) || popCargo.includes(empRole));
  const anexoTokens = anexosDoPop.flatMap(a=>[a.id,a.numero,a.nome,a.name,a.popVinculado]).map(normalizeTxt).filter(Boolean);
  const byAnexo = Array.isArray(emp.anexos) && emp.anexos.some(a=>{
    const vals = typeof a === 'object' ? [a.id,a.numero,a.nome,a.name,a.popVinculado] : [a];
    return vals.map(normalizeTxt).some(v=>anexoTokens.includes(v) || v === code);
  });
  return directPOP || byAnexo || byCargo || bySector;
}

function getAppDataSnapshot(){
  return {
    pops: POPS,
    employees: EMPLOYEES,
    anexos: ANEXOS,
    logs: LOGS.slice(0,200),
    updatedAtText: new Date().toLocaleString('pt-BR')
  };
}

function applyRemoteData(data){
  if(!data) return;
  isSyncingFromFirebase = true;
  POPS = safeArray(data.pops, POPS);
  EMPLOYEES = safeArray(data.employees, EMPLOYEES).map(e=>({...e, pops:Array.isArray(e.pops)?e.pops:[], anexos:Array.isArray(e.anexos)?e.anexos:[]}));
  ANEXOS = safeArray(data.anexos, ANEXOS);
  LOGS = safeArray(data.logs, LOGS);
  cleanFictitiousData();
  recalcNextIds();
  try{
    localStorage.setItem(LS_KEY_POPS, JSON.stringify(POPS));
    localStorage.setItem(LS_KEY_EMPLOYEES, JSON.stringify(EMPLOYEES));
    localStorage.setItem(LS_KEY_ANEXOS, JSON.stringify(ANEXOS));
    localStorage.setItem(LS_KEY_LOGS, JSON.stringify(LOGS.slice(0,200)));
  }catch(e){ console.warn('LocalStorage sync error:', e); }
  isSyncingFromFirebase = false;
}

function renderActivePage(){
  const active = document.querySelector('.page.active');
  if(!active) return;
  if(active.id === 'page-dashboard') renderDashboard();
  if(active.id === 'page-analytics') renderAnalytics();
  if(active.id === 'page-pops') renderPOPs();
  if(active.id === 'page-funcionarios') renderFuncionarios();
  if(active.id === 'page-matrix' || active.id === 'page-matriz') renderMatrix();
  if(active.id === 'page-alertas') renderAlertasPage();
  if(active.id === 'page-anexos') renderAnexos();
  if(active.id === 'page-auditoria') renderAuditoria();
}

function setupFirebaseListeners(){
  if(!firebaseReady || firebaseListening) return;
  firebaseListening = true;
  firebaseDb.ref(DB_ROOT).on('value', snap => {
    const data = snap.val();
    const payload = JSON.stringify(data || {});
    if(payload === lastFirebasePayload) return;
    lastFirebasePayload = payload;
    applyRemoteData(data);
    if(currentUser) refreshAllViews();
  }, err => console.warn('Firebase listener error:', err));
}

function saveLocalData(){
  try {
    localStorage.setItem(LS_KEY_POPS, JSON.stringify(POPS));
    localStorage.setItem(LS_KEY_EMPLOYEES, JSON.stringify(EMPLOYEES));
    localStorage.setItem(LS_KEY_ANEXOS, JSON.stringify(ANEXOS));
    localStorage.setItem(LS_KEY_LOGS, JSON.stringify(LOGS.slice(0,200)));
  } catch(e) { console.warn('LocalStorage save error:', e); }
}

function saveData() {
  saveLocalData();
  if(!firebaseReady || !firebaseDb || isSyncingFromFirebase) return;
  const payload = getAppDataSnapshot();
  lastFirebasePayload = JSON.stringify(payload);
  firebaseDb.ref(DB_ROOT).set({
    ...payload,
    updatedAt: firebase.database.ServerValue.TIMESTAMP
  }).catch(e=>{
    console.warn('Firebase save error:', e);
    if(currentUser) toast('Firebase indisponível', 'Alteração salva localmente. Verifique as regras/conexão do Realtime Database.', 'warn');
  });
}

async function loadData() {
  try {
    const savedPOPs = localStorage.getItem(LS_KEY_POPS);
    const savedEmployees = localStorage.getItem(LS_KEY_EMPLOYEES);
    const savedAnexos = localStorage.getItem(LS_KEY_ANEXOS);
    const savedLogs = localStorage.getItem(LS_KEY_LOGS);
    if (savedPOPs) POPS = JSON.parse(savedPOPs);
    if (savedEmployees) EMPLOYEES = JSON.parse(savedEmployees);
    if (savedAnexos) ANEXOS = JSON.parse(savedAnexos);
    if (savedLogs) LOGS = JSON.parse(savedLogs);
    cleanFictitiousData();
    recalcNextIds();
  } catch(e) { console.warn('LocalStorage load error:', e); }

  if(!initFirebase()) return;
  try{
    const rootRef = firebaseDb.ref(DB_ROOT);
    const snap = await rootRef.once('value');
    if(snap.exists()){
      applyRemoteData(snap.val());
    }else{
      // Banco limpo: não semeia informações fictícias. Só grava estrutura vazia.
      await rootRef.set({...getAppDataSnapshot(), updatedAt: firebase.database.ServerValue.TIMESTAMP});
    }
    setupFirebaseListeners();
  }catch(e){
    firebaseReady = false;
    console.warn('Firebase load error:', e);
  }
}

/* ══════════════════════════════════════════
   AUDIT LOGS
══════════════════════════════════════════ */
let LOGS = [];

function addLog(action, type, detail) {
  LOGS.unshift({
    action,
    type, // 'create' | 'edit' | 'delete'
    detail,
    user: currentUser ? currentUser.name : 'Sistema',
    ts: new Date().toLocaleString('pt-BR')
  });
  saveData();
}

function renderAuditoria() {
  const typeFilter = document.getElementById('audit-type-filter')?.value || '';
  const filtered = typeFilter ? LOGS.filter(l => l.type === typeFilter) : LOGS;

  const creates = LOGS.filter(l=>l.type==='create').length;
  const edits   = LOGS.filter(l=>l.type==='edit').length;
  const deletes = LOGS.filter(l=>l.type==='delete').length;

  document.getElementById('audit-kpi-row').innerHTML = `
    <div class="kpi-card green glass-card" style="cursor:pointer" onclick="filterAuditByType('create')"><div class="kpi-val">${creates}</div><div class="kpi-label">Criações</div><div class="kpi-trend" style="color:var(--green)">${creates>0?'Clique para filtrar':'Nenhum registro'}</div></div>
    <div class="kpi-card blue glass-card" style="cursor:pointer" onclick="filterAuditByType('edit')"><div class="kpi-val">${edits}</div><div class="kpi-label">Edições</div><div class="kpi-trend" style="color:var(--blue)">${edits>0?'Clique para filtrar':'Nenhum registro'}</div></div>
    <div class="kpi-card glass-card" style="cursor:pointer" onclick="filterAuditByType('delete')"><div class="kpi-val">${deletes}</div><div class="kpi-label">Exclusões</div><div class="kpi-trend danger">${deletes>0?'Clique para filtrar':'Nenhum registro'}</div></div>
  `;

  const icons = {create:'+', edit:'✎', delete:'✕'};
  document.getElementById('audit-log-list').innerHTML = filtered.length
    ? filtered.map(l=>`
      <div class="log-entry ${l.type}">
        <div class="log-icon" style="font-style:normal;font-weight:800;font-size:1rem">${icons[l.type]||'·'}</div>
        <div class="log-body">
          <div class="log-action">${l.action}</div>
          <div class="log-detail">${l.detail}</div>
        </div>
        <div class="log-meta"><div>${l.user}</div><div>${l.ts}</div></div>
      </div>`).join('')
    : '<div style="text-align:center;padding:40px;color:var(--gray-soft)">Nenhum evento registrado ainda.</div>';
}

function filterAuditByType(type) {
  const sel = document.getElementById('audit-type-filter');
  if (sel) {
    // Toggle: if already filtering this type, clear filter
    sel.value = sel.value === type ? '' : type;
    renderAuditoria();
  }
}

function limparLogs() {
  showConfirm('Limpar Logs', 'Tem certeza que deseja apagar todo o histórico de auditoria?', () => {
    LOGS = [];
    saveData();
    renderAuditoria();
    toast('Logs apagados', 'Histórico de auditoria limpo.', 'info');
  });
}

/* ══════════════════════════════════════════
   TOAST NOTIFICATIONS
══════════════════════════════════════════ */
function toast(title, msg, type='success') {
  const icons = {success:'✅', error:'❌', warn:'⚠️', info:'ℹ️'};
  const container = document.getElementById('toast-container');
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.innerHTML = `
    <span class="toast-icon">${icons[type]||'📢'}</span>
    <div class="toast-body">
      <div class="toast-title">${title}</div>
      ${msg ? `<div class="toast-msg">${msg}</div>` : ''}
    </div>
    <button class="toast-close" onclick="dismissToast(this.parentElement)">✕</button>
  `;
  container.appendChild(el);
  setTimeout(() => dismissToast(el), 4500);
}

function dismissToast(el) {
  if (!el || el._dismissed) return;
  el._dismissed = true;
  el.classList.add('out');
  setTimeout(() => el.remove(), 320);
}

/* ══════════════════════════════════════════
   PRINT / RELATÓRIO
══════════════════════════════════════════ */
function gerarRelatorio() {
  // navigate to POPs page first so it prints
  navigate('pops');
  document.getElementById('print-meta').textContent =
    `Emitido em ${new Date().toLocaleString('pt-BR')} · Total: ${POPS.length} POPs · Usuário: ${currentUser?.name||'Sistema'}`;
  setTimeout(() => window.print(), 400);
}

/* ══════════════════════════════════════════
   FILE ICON HELPER
══════════════════════════════════════════ */
function fileIcon(type) {
  if (!type) return {cls:'other', icon:'📄'};
  if (type.includes('pdf')) return {cls:'pdf', icon:'📕'};
  if (type.startsWith('image/')) return {cls:'img', icon:'🖼'};
  if (type.includes('word') || type.includes('document')) return {cls:'doc', icon:'📝'};
  if (type.includes('sheet') || type.includes('excel') || type.includes('csv')) return {cls:'xls', icon:'📊'};
  return {cls:'other', icon:'📄'};
}

function formatBytes(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes/1024).toFixed(1) + ' KB';
  return (bytes/1048576).toFixed(1) + ' MB';
}

/* ══════════════════════════════════════════
   FEATURE 1: LIVE DASHBOARD CLOCK
══════════════════════════════════════════ */
let _clockInterval = null;
function startLiveClock() {
  if (_clockInterval) clearInterval(_clockInterval);
  function tick() {
    const now = new Date();
    const el = document.getElementById('dash-clock');
    const del = document.getElementById('dash-date-str');
    if (!el) return;
    el.textContent = now.toLocaleTimeString('pt-BR');
    del.textContent = now.toLocaleDateString('pt-BR', {weekday:'long',day:'numeric',month:'long',year:'numeric'});

    // Expiry badge counts from real dataRevisao
    const today = now;
    let overdue = 0, soon = 0;
    POPS.forEach(p => {
      const days = calcDaysUntilExpiry(p);
      if (days !== null) {
        if (days < 0) overdue++;
        else if (days <= 90) soon++;
      }
    });
    const ec = document.getElementById('dash-expiry-count');
    if (ec) {
      ec.innerHTML = `
        ${overdue > 0 ? `<span class="expiry-badge danger" onclick="navigate('alertas')">🔴 ${overdue} Vencido${overdue > 1 ? 's' : ''}</span>` : ''}
        ${soon > 0 ? `<span class="expiry-badge warn" onclick="navigate('alertas')">⏰ ${soon} Vencendo</span>` : ''}
        ${(overdue + soon) === 0 ? `<span class="expiry-badge ok">✅ Todos no prazo</span>` : ''}
      `;
    }
    const upd = document.getElementById('dash-updated');
    if (upd) upd.textContent = `Atualizado às ${now.toLocaleTimeString('pt-BR')}`;
  }
  tick();
  _clockInterval = setInterval(tick, 1000);
}

function calcDaysUntilExpiry(pop) {
  // Priority: use explicit dataVencimento if stored, else compute from dataRevisao (legacy 2yr) or dataCriacao (5yr)
  const parseDate = str => {
    if(!str || str==='—') return null;
    const p = str.split('/');
    if(p.length!==3) return null;
    return new Date(p[2], p[1]-1, p[0]);
  };
  let expiry = null;
  if(pop.dataVencimento) {
    expiry = parseDate(pop.dataVencimento);
  } else if(pop.dataCriacao) {
    const base = parseDate(pop.dataCriacao);
    if(base){ expiry = new Date(base); expiry.setFullYear(expiry.getFullYear()+5); }
  } else if(pop.dataRevisao) {
    const base = parseDate(pop.dataRevisao);
    if(base){ expiry = new Date(base); expiry.setFullYear(expiry.getFullYear()+2); }
  }
  if(!expiry) return null;
  return Math.ceil((expiry - new Date()) / 86400000);
}

function daysBadge(pop) {
  const d = calcDaysUntilExpiry(pop);
  if (d === null) return '<span class="days-badge na">—</span>';
  if (d < 0) return `<span class="days-badge overdue">${Math.abs(d)}d atrás</span>`;
  if (d <= 90) return `<span class="days-badge soon">${d}d</span>`;
  return `<span class="days-badge ok">✓ ${d}d</span>`;
}

/* ══════════════════════════════════════════
   FEATURE 2: CMD+K GLOBAL SEARCH PALETTE
══════════════════════════════════════════ */
let _cmdActiveIdx = -1;

function openCmdPalette() {
  document.getElementById('cmd-palette-overlay').classList.add('open');
  document.getElementById('cmd-palette-input').value = '';
  _cmdActiveIdx = -1;
  updateCmdResults();
  setTimeout(() => document.getElementById('cmd-palette-input').focus(), 60);
}

function closeCmdPalette() {
  document.getElementById('cmd-palette-overlay').classList.remove('open');
}

function updateCmdResults() {
  const q = (document.getElementById('cmd-palette-input').value || '').toLowerCase().trim();
  const container = document.getElementById('cmd-results');
  _cmdActiveIdx = -1;

  if (!q) {
    container.innerHTML = `<div class="cmd-empty">Digite para buscar POPs, funcionários e anexos...</div>`;
    return;
  }

  const popResults = POPS.filter(p =>
    p.code.toLowerCase().includes(q) ||
    p.desc.toLowerCase().includes(q) ||
    p.sectorName.toLowerCase().includes(q)
  ).slice(0, 5);

  const empResults = EMPLOYEES.filter(e =>
    e.name.toLowerCase().includes(q) ||
    e.role.toLowerCase().includes(q) ||
    e.sector.toLowerCase().includes(q)
  ).slice(0, 4);

  const anexoResults = ANEXOS.filter(a =>
    a.nome.toLowerCase().includes(q) ||
    a.popVinculado.toLowerCase().includes(q) ||
    a.desc.toLowerCase().includes(q)
  ).slice(0, 3);

  let html = '';

  if (popResults.length) {
    html += `<div class="cmd-result-group">📋 POPs (${popResults.length})</div>`;
    popResults.forEach((p, i) => {
      html += `<div class="cmd-result-item" data-idx="${i}" onclick="closeCmdPalette();navigate('pops');setTimeout(()=>openPOPDetail('${p.code}'),200)">
        <div class="cmd-result-icon">${p.popType === 'core' ? '⭐' : p.popType === 'area' ? '📂' : '🔧'}</div>
        <div style="flex:1;min-width:0">
          <div class="cmd-result-title">${p.code} — ${p.desc.substring(0, 45)}${p.desc.length > 45 ? '…' : ''}</div>
          <div class="cmd-result-sub">${p.sectorName}</div>
        </div>
        <div class="cmd-result-badge">${docBadge(p.docStatus)}</div>
      </div>`;
    });
  }

  if (empResults.length) {
    html += `<div class="cmd-result-group">👥 Funcionários (${empResults.length})</div>`;
    empResults.forEach(e => {
      html += `<div class="cmd-result-item" onclick="closeCmdPalette();navigate('funcionarios');setTimeout(()=>openEmpProfile(${e.id}),200)">
        <div class="cmd-result-icon" style="background:var(--red);color:white;font-weight:800;font-size:.75rem">${e.name.charAt(0)}</div>
        <div style="flex:1">
          <div class="cmd-result-title">${e.name}</div>
          <div class="cmd-result-sub">${e.role} · ${e.sector}</div>
        </div>
      </div>`;
    });
  }

  if (anexoResults.length) {
    html += `<div class="cmd-result-group">📎 Anexos (${anexoResults.length})</div>`;
    anexoResults.forEach(a => {
      html += `<div class="cmd-result-item" onclick="closeCmdPalette();navigate('anexos')">
        <div class="cmd-result-icon">📎</div>
        <div style="flex:1">
          <div class="cmd-result-title">${a.nome}</div>
          <div class="cmd-result-sub">Nº ${a.numero} · ${a.popVinculado}</div>
        </div>
      </div>`;
    });
  }

  if (!html) html = `<div class="cmd-empty">Nenhum resultado para "<strong>${q}</strong>"</div>`;
  container.innerHTML = html;
}

function cmdPaletteKey(e) {
  if (e.key === 'Escape') { closeCmdPalette(); return; }
  const items = document.querySelectorAll('#cmd-results .cmd-result-item');
  if (!items.length) return;
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    _cmdActiveIdx = Math.min(_cmdActiveIdx + 1, items.length - 1);
    items.forEach((el, i) => el.classList.toggle('active', i === _cmdActiveIdx));
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    _cmdActiveIdx = Math.max(_cmdActiveIdx - 1, 0);
    items.forEach((el, i) => el.classList.toggle('active', i === _cmdActiveIdx));
  } else if (e.key === 'Enter' && _cmdActiveIdx >= 0) {
    items[_cmdActiveIdx].click();
  }
}

/* ══════════════════════════════════════════
   FEATURE 3: KANBAN VIEW FOR POPs
══════════════════════════════════════════ */
let _popsView = 'table';

function setPOPsView(v) {
  _popsView = v;
  document.getElementById('view-table-btn').classList.toggle('active', v === 'table');
  document.getElementById('view-kanban-btn').classList.toggle('active', v === 'kanban');
  document.getElementById('pops-table-view').style.display = v === 'table' ? '' : 'none';
  document.getElementById('pops-kanban-view').style.display = v === 'kanban' ? '' : 'none';
  renderPOPs();
}

function renderKanban(items) {
  const statuses = [
    {key:'APROVADO', label:'✅ Aprovado', color:'var(--green)'},
    {key:'EM REVISÃO', label:'🔄 Em Revisão', color:'var(--orange)'},
    {key:'ELABORAR', label:'📝 Elaborar', color:'var(--sand-dark)'},
    {key:'OBSOLETO', label:'🗄 Obsoleto', color:'var(--gray-soft)'},
  ];
  const board = document.getElementById('pops-kanban-board');
  if (!board) return;
  board.innerHTML = statuses.map(st => {
    const cards = items.filter(p => p.docStatus === st.key);
    return `<div class="kanban-col">
      <div class="kanban-col-header">
        <div class="kanban-col-title" style="color:${st.color}">${st.label}</div>
        <span class="kanban-col-count">${cards.length}</span>
      </div>
      ${cards.map(p => `
        <div class="kanban-card" onclick="openPOPDetail('${p.code}')">
          <div class="kanban-card-code">${p.code}</div>
          <div class="kanban-card-desc">${p.desc.substring(0, 65)}${p.desc.length > 65 ? '…' : ''}</div>
          <div class="kanban-card-footer">
            ${popTypeBadge(p.popType)}
            ${vigenciaBadge(p.vigencia)}
            ${daysBadge(p)}
          </div>
        </div>
      `).join('')}
      ${!cards.length ? '<div style="text-align:center;padding:20px;font-size:.8rem;color:var(--gray-soft)">Nenhum POP</div>' : ''}
    </div>`;
  }).join('');
}

/* ══════════════════════════════════════════
   FEATURE 4: HISTORICAL COMPLIANCE TREND
══════════════════════════════════════════ */
function getHistoricalTrend() {
  const now = new Date();
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ label: d.toLocaleDateString('pt-BR', {month:'short', year:'2-digit'}), d });
  }
  const approved = POPS.filter(p => p.docStatus === 'APROVADO').length;
  const total = POPS.length;
  const base = total ? Math.round(approved / total * 100) : 0;
  return months.map(m => ({ label: m.label, value: base }));
}

/* ══════════════════════════════════════════
   ANEXOS HELPERS
══════════════════════════════════════════ */
function anexoOptionLabel(a){
  const numero=a.numero?`${a.numero} — `:'';
  return `${numero}${a.nome || a.name || 'Anexo sem nome'}`;
}
function anexoOptionsHTML(selectedIds=[]){
  const selected=new Set((selectedIds||[]).map(String));
  const realAnexos=ANEXOS.filter(a=>!isFictitiousAnexo(a));
  if(!realAnexos.length) return '<option value="" disabled>Nenhum anexo cadastrado ainda</option>';
  return realAnexos.map(a=>`<option value="${anexoId(a)}" ${selected.has(anexoId(a))?'selected':''}>${anexoOptionLabel(a)}</option>`).join('');
}
function anexosEditorNew(){
  const opts=anexoOptionsHTML([]);
  return `
  <div class="form-group" style="margin-bottom:14px">
    <label class="form-label">📎 Este POP possui anexo?</label>
    <div style="display:flex;gap:10px;margin-top:6px">
      <button type="button" class="btn btn-outline btn-sm" id="new-anexo-sim" onclick="toggleAnexoNew('sim')" style="border-color:var(--border)">📍Anexar</button>
    </div>
    <input type="hidden" id="new-has-anexo" value="">
    <div id="new-anexo-content" style="display:none;margin-top:12px;padding:14px;background:var(--blue-bg);border-radius:var(--r);border-left:3px solid var(--blue)">
      <div style="font-size:var(--fs-sm);font-weight:700;margin-bottom:10px;color:var(--blue)">Vincule anexos cadastrados no sistema:</div>
      <div style="font-size:var(--fs-xs);color:var(--gray-soft);margin-bottom:8px">Segure Ctrl para selecionar mais de um anexo. A lista mostra somente anexos criados por você.</div>
      <select class="form-select" id="new-anexo-select" multiple size="${Math.min(Math.max(ANEXOS.length,3),7)}" style="min-height:110px">
        ${opts}
      </select>
      <div style="display:flex;gap:10px;margin-top:12px;flex-wrap:wrap">
        <button type="button" class="btn btn-outline btn-sm" onclick="closeModal();setTimeout(openCriarAnexo,100)">+ Criar novo anexo</button>
        <button type="button" class="btn btn-outline btn-sm" id="new-anexo-upload-btn" onclick="toggleAnexoType('new','upload')">⬆️ Fazer Upload PDF</button>
      </div>
      <div id="new-anexo-db" style="display:block"></div>
      <div id="new-anexo-upload" style="display:none;margin-top:10px">
        <label class="form-label">Selecionar arquivo PDF:</label>
        <input type="file" accept=".pdf" class="form-input" id="new-anexo-file" style="padding:8px;cursor:pointer">
      </div>
    </div>
  </div>`;
}

function anexosEditor(pop){
  const selectedIds=normalizePOPAnexoRefs(pop);
  const hasA=!!(pop.hasAnexo || selectedIds.length || pop.anexoFile);
  const selectedLabels=getPOPAnexos(pop).map(anexoOptionLabel);
  const currentLabel=hasA?(selectedLabels.length?selectedLabels.join(', '):(pop.anexoFile||'Arquivo local')):'';
  const opts=anexoOptionsHTML(selectedIds);
  return `
  <div class="form-group" style="margin-bottom:14px">
    <label class="form-label">📎 Este POP possui anexo?</label>
    ${hasA?`<div style="margin-top:4px;font-size:var(--fs-xs);color:var(--green);font-weight:600">✅ Atual: ${currentLabel}</div>`:''}
    <div style="display:flex;gap:10px;margin-top:8px">
      <button type="button" class="btn btn-sm ${hasA?'btn-primary':'btn-outline'}" id="ep-anexo-sim" onclick="toggleAnexoEp('sim')" style="${hasA?'':'border-color:var(--border)'}">📍Anexar</button>
    </div>
    <input type="hidden" id="ep-has-anexo" value="${hasA?'sim':'nao'}">
    <div id="ep-anexo-content" style="display:${hasA?'block':'none'};margin-top:12px;padding:14px;background:var(--blue-bg);border-radius:var(--r);border-left:3px solid var(--blue)">
      <div style="font-size:var(--fs-sm);font-weight:700;margin-bottom:10px;color:var(--blue)">Vincule anexos cadastrados no sistema:</div>
      <div style="font-size:var(--fs-xs);color:var(--gray-soft);margin-bottom:8px">Segure Ctrl para selecionar mais de um anexo. A lista mostra somente anexos criados por você.</div>
      <select class="form-select" id="ep-anexo-select" multiple size="${Math.min(Math.max(ANEXOS.length,3),7)}" style="min-height:110px">
        ${opts}
      </select>
      <div style="display:flex;gap:10px;margin-top:12px;flex-wrap:wrap">
        <button type="button" class="btn btn-outline btn-sm" onclick="closeModal();setTimeout(openCriarAnexo,100)">+ Criar novo anexo</button>
        <button type="button" class="btn btn-outline btn-sm" id="ep-anexo-upload-btn" onclick="toggleAnexoType('ep','upload')">⬆️ Fazer Upload PDF</button>
      </div>
      <div id="ep-anexo-db" style="display:block"></div>
      <div id="ep-anexo-upload" style="display:${pop.anexoFile&&!selectedIds.length?'block':'none'};margin-top:10px">
        <label class="form-label">Selecionar arquivo PDF:</label>
        <input type="file" accept=".pdf" class="form-input" id="ep-anexo-file" style="padding:8px;cursor:pointer">
      </div>
    </div>
  </div>`;
}

function toggleAnexoNew(val){
  document.getElementById('new-has-anexo').value=val;
  const content=document.getElementById('new-anexo-content');
  if(content)content.style.display=val==='sim'?'block':'none';
  document.getElementById('new-anexo-sim').className='btn btn-sm '+(val==='sim'?'btn-primary':'btn-outline');
  document.getElementById('new-anexo-nao').className='btn btn-sm '+(val==='nao'?'btn-primary':'btn-outline');
}

function toggleAnexoEp(val){
  document.getElementById('ep-has-anexo').value=val;
  const content=document.getElementById('ep-anexo-content');
  if(content)content.style.display=val==='sim'?'block':'none';
  document.getElementById('ep-anexo-sim').className='btn btn-sm '+(val==='sim'?'btn-primary':'btn-outline');
  document.getElementById('ep-anexo-nao').className='btn btn-sm '+(val==='nao'?'btn-primary':'btn-outline');
}

function toggleAnexoType(prefix,type){
  const upload=document.getElementById(`${prefix}-anexo-upload`);
  if(upload) upload.style.display=type==='upload'?'block':'none';
  const btn=document.getElementById(`${prefix}-anexo-upload-btn`);
  if(btn) btn.className='btn btn-outline btn-sm'+(type==='upload'?' btn-primary':'');
}

function getAnexoFromNew(){
  const hasAnexo=document.getElementById('new-has-anexo')?.value;
  if(hasAnexo==='sim'){
    const selectedIds=getSelectedAnexoIds('new');
    const fileInput=document.getElementById('new-anexo-file');
    return {
      hasAnexo:selectedIds.length>0 || !!(fileInput&&fileInput.files&&fileInput.files[0]),
      anexos:selectedIds,
      anexoRef:selectedIds[0]||'',
      anexoFile:(fileInput&&fileInput.files&&fileInput.files[0])?fileInput.files[0].name:''
    };
  }
  return {hasAnexo:false,anexos:[],anexoRef:'',anexoFile:''};
}

/* ══════════════════════════════════════════
   KEYBOARD SHORTCUTS
══════════════════════════════════════════ */
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){closeModal();closeConfirm();fecharRevisarAnexo();closeCmdPalette();}
  if((e.metaKey||e.ctrlKey)&&e.key==='k'){e.preventDefault();openCmdPalette();}
});