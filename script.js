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
  loadData();
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('navbar').style.display = 'flex';
  const initials = currentUser.name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
  document.getElementById('user-avatar').textContent = initials;
  document.getElementById('user-name-display').textContent = currentUser.name.split(' ')[0];
  navigate('dashboard');
  startLiveClock();
  setTimeout(()=>toast('Bem-vindo, '+currentUser.name.split(' ')[0]+'!', 'Dados carregados do armazenamento local.', 'success'), 400);
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
let POPS = [
  {code:'AL 001',type:'POP',popType:'core',sector:'AL',sectorName:'Almoxarifado',desc:'Recebimento e Armazenamento de MP e Embalagem',docStatus:'APROVADO',vigencia:'NO PRAZO',training:'OK',dataCriacao:'10/01/2023',dataRevisao:'10/01/2025'},
  {code:'AL 002',type:'POP',popType:'area',sector:'AL',sectorName:'Almoxarifado',desc:'Utilização de Empilhadeira',docStatus:'APROVADO',vigencia:'NO PRAZO',training:'SOLICITADO',dataCriacao:'15/03/2023',dataRevisao:'15/03/2025'},
  {code:'AL 003',type:'POP',popType:'area',sector:'AL',sectorName:'Almoxarifado',desc:'Separação de Embalagem e Semiacabado',docStatus:'APROVADO',vigencia:'NO PRAZO',training:'SOLICITADO'},
  {code:'CQ 005',type:'POP',popType:'area',sector:'CQ',sectorName:'Qualidade',desc:'Amostragem e Análise de Água',docStatus:'EM REVISÃO',vigencia:'NO PRAZO',training:'OK'},
  {code:'CQ 006',type:'POP',popType:'area',sector:'CQ',sectorName:'Qualidade',desc:'Controle Estatístico de Processo',docStatus:'EM REVISÃO',vigencia:'NO PRAZO',training:'OK'},
  {code:'CQ 008',type:'POP',popType:'area',sector:'CQ',sectorName:'Qualidade',desc:'Calibração e Utilização pHmetro Q400AS',docStatus:'APROVADO',vigencia:'VENCE EM 3 MESES',training:'OK',dataCriacao:'05/02/2022',dataRevisao:'05/02/2025'},
  {code:'CQ 009',type:'POP',popType:'area',sector:'CQ',sectorName:'Qualidade',desc:'Preparo e Controle de Soluções e Reagentes',docStatus:'EM REVISÃO',vigencia:'NO PRAZO',training:'OK'},
  {code:'CQ 010',type:'POP',popType:'core',sector:'CQ',sectorName:'Qualidade',desc:'Análise e Liberação Físico-Química de PA',docStatus:'APROVADO',vigencia:'NO PRAZO',training:'SOLICITADO'},
  {code:'CQ 012',type:'POP',popType:'core',sector:'CQ',sectorName:'Qualidade',desc:'Recebimento de Amostra e Controle de Retenção',docStatus:'APROVADO',vigencia:'NO PRAZO',training:'OK'},
  {code:'CQ 013',type:'POP',popType:'cargo',sector:'CQ',sectorName:'Qualidade',desc:'Análise de Amostras de Enxague e Liberação',docStatus:'APROVADO',vigencia:'NO PRAZO',training:'OK'},
  {code:'CQ 017',type:'POP',popType:'core',sector:'CQ',sectorName:'Qualidade',desc:'Boas Práticas e Segurança de Laboratório',docStatus:'APROVADO',vigencia:'NO PRAZO',training:'OK'},
  {code:'CQ 018',type:'POP',popType:'cargo',sector:'CQ',sectorName:'Qualidade',desc:'Recebimento e Liberação de Material de Embalagem',docStatus:'APROVADO',vigencia:'NO PRAZO',training:'SOLICITADO'},
  {code:'CQ 019',type:'POP',popType:'cargo',sector:'CQ',sectorName:'Qualidade',desc:'Recebimento e Liberação de Matéria Prima',docStatus:'APROVADO',vigencia:'NO PRAZO',training:'SOLICITADO'},
  {code:'CQ 027',type:'POP',popType:'area',sector:'CQ',sectorName:'Qualidade',desc:'Limpeza e Utilização do Barrilete 20L',docStatus:'EM REVISÃO',vigencia:'NO PRAZO',training:'OK'},
  {code:'CQ 029',type:'POP',popType:'cargo',sector:'CQ',sectorName:'Qualidade',desc:'Inspeção de Qualidade em Linha',docStatus:'APROVADO',vigencia:'NO PRAZO',training:'SOLICITADO'},
  {code:'CQ 033',type:'POP',popType:'area',sector:'CQ',sectorName:'Qualidade',desc:'Limpeza e Utilização da Estufa Fabbe',docStatus:'APROVADO',vigencia:'VENCIDO',training:'OK',dataCriacao:'20/06/2021',dataRevisao:'20/06/2023'},
  {code:'CQ 039',type:'POP',popType:'cargo',sector:'CQ',sectorName:'Qualidade',desc:'Resultado Fora de Especificação',docStatus:'ELABORAR',vigencia:'ELABORAR',training:'N.A'},
  {code:'CQ 040',type:'POP',popType:'area',sector:'CQ',sectorName:'Qualidade',desc:'Lançamento de Produtos Controlados',docStatus:'EM REVISÃO',vigencia:'NO PRAZO',training:'N.A'},
  {code:'DE 001',type:'POP',popType:'area',sector:'DE',sectorName:'Des. Embalagem',desc:'Desenvolvimento de Embalagem',docStatus:'APROVADO',vigencia:'NO PRAZO',training:'OK'},
  {code:'DE 002',type:'POP',popType:'area',sector:'DE',sectorName:'Des. Embalagem',desc:'Teste de Embalagem em Linha',docStatus:'APROVADO',vigencia:'NO PRAZO',training:'OK'},
  {code:'DE 003',type:'POP',popType:'area',sector:'DE',sectorName:'Des. Embalagem',desc:'Estudo de Compatibilidade de Embalagem',docStatus:'APROVADO',vigencia:'NO PRAZO',training:'OK'},
  {code:'DE 004',type:'POP',popType:'cargo',sector:'DE',sectorName:'Des. Embalagem',desc:'Rotina do Desenvolvimento de Embalagens',docStatus:'APROVADO',vigencia:'NO PRAZO',training:'OK'},
  {code:'DE 005',type:'POP',popType:'cargo',sector:'DE',sectorName:'Des. Embalagem',desc:'Etapas de Projetos de Novos Produtos',docStatus:'APROVADO',vigencia:'NO PRAZO',training:'OK'},
  {code:'DE 007',type:'POP',popType:'cargo',sector:'DE',sectorName:'Des. Embalagem',desc:'Cadastro Nacional de Produtos - GS1',docStatus:'APROVADO',vigencia:'NO PRAZO',training:'OK'},
  {code:'DP 001',type:'POP',popType:'area',sector:'DP',sectorName:'P&D',desc:'Limpeza e Sanitização Barrilete Desmineralizada',docStatus:'APROVADO',vigencia:'NO PRAZO',training:'OK'},
  {code:'DP 002',type:'POP',popType:'area',sector:'DP',sectorName:'P&D',desc:'Transferência de Escala',docStatus:'APROVADO',vigencia:'NO PRAZO',training:'OK'},
  {code:'DP 003',type:'POP',popType:'cargo',sector:'DP',sectorName:'P&D',desc:'Rotinas do Laboratório de P&D',docStatus:'APROVADO',vigencia:'NO PRAZO',training:'SOLICITADO'},
  {code:'DP 004',type:'POP',popType:'cargo',sector:'DP',sectorName:'P&D',desc:'Manuseio e Limpeza do Reator de Inox 10kg',docStatus:'APROVADO',vigencia:'NO PRAZO',training:'SOLICITADO'},
  {code:'DP 007',type:'POP',popType:'area',sector:'DP',sectorName:'P&D',desc:'Desenvolvimento de Formulações',docStatus:'APROVADO',vigencia:'NO PRAZO',training:'SOLICITADO'},
];

const SECTORS_DATA = {
  AL:{name:'Almoxarifado',total:3,approved:3,inReview:0,expired:0,trainPending:2},
  CQ:{name:'Qualidade / CQ',total:16,approved:10,inReview:4,expired:1,trainPending:5},
  DE:{name:'Des. Embalagem',total:6,approved:6,inReview:0,expired:0,trainPending:0},
  DP:{name:'P&D',total:5,approved:5,inReview:0,expired:0,trainPending:3},
};

let EMPLOYEES = [
  {id:1,name:'Ana Beatriz Lima',email:'ana.lima@nazca.com',sector:'Qualidade de Vida',role:'Auxiliar de Qualidade',admission:'2025-06-01',pops:[
    {pop:'Higiene e Manipulação de Alimentos',version:'2.0',status:'Válido',days:305,type:'core'},
    {pop:'Uso de EPI e Segurança no Trabalho',version:'1.0',status:'Crítico',days:25,type:'core'},
    {pop:'Controle de Qualidade e Inspeção',version:'3.0',status:'Vencido',days:-15,type:'area'},
    {pop:'Gestão de Resíduos',version:'1.0',status:'Válido',days:275,type:'area'},
    {pop:'Atendimento e Bem-Estar do Colaborador',version:'1.0',status:'Pendente',days:null,type:'cargo'},
  ]},
  {id:2,name:'Carlos Eduardo Silva',email:'carlos.silva@nazca.com',sector:'Qualidade de Vida',role:'Supervisor de Higiene',admission:'2024-03-15',pops:[
    {pop:'Higiene e Manipulação de Alimentos',version:'2.0',status:'Revisão Pendente',days:-35,type:'core'},
    {pop:'Uso de EPI e Segurança no Trabalho',version:'1.0',status:'Válido',days:245,type:'core'},
    {pop:'Controle de Qualidade e Inspeção',version:'3.0',status:'Crítico',days:10,type:'area'},
    {pop:'Gestão de Resíduos',version:'1.0',status:'Pendente',days:null,type:'area'},
    {pop:'Atendimento e Bem-Estar do Colaborador',version:'1.0',status:'Pendente',days:null,type:'cargo'},
  ]},
  {id:3,name:'Mariana Costa',email:'mariana.costa@nazca.com',sector:'Nutrição',role:'Nutricionista',admission:'2024-08-01',pops:[
    {pop:'Higiene e Manipulação de Alimentos',version:'2.0',status:'Válido',days:165,type:'core'},
  ]},
  {id:4,name:'Pedro Henrique Santos',email:'pedro.santos@nazca.com',sector:'Operações',role:'Gerente Operacional',admission:'2023-11-01',pops:[
    {pop:'Uso de EPI e Segurança no Trabalho',version:'1.0',status:'Vencido',days:-5,type:'core'},
    {pop:'Gestão de Resíduos',version:'1.0',status:'Pendente',days:null,type:'area'},
  ]},
  {id:5,name:'Fernanda Oliveira',email:'f.oliveira@nazca.com',sector:'Segurança do Trabalho',role:'Técnica de Segurança',admission:'2025-01-10',pops:[
    {pop:'Uso de EPI e Segurança no Trabalho',version:'1.0',status:'Válido',days:215,type:'core'},
  ]},
  {id:6,name:'Rafael Mendes',email:'r.mendes@nazca.com',sector:'Administrativo',role:'Auxiliar Administrativo',admission:'2025-09-01',pops:[
    {pop:'LGPD — Proteção de Dados',version:'2.0',status:'Válido',days:315,type:'core'},
  ]},
  {id:7,name:'Juliana Ferreira',email:'j.ferreira@nazca.com',sector:'RH',role:'Coordenadora de RH',admission:'2023-05-01',pops:[
    {pop:'Atendimento e Bem-Estar do Colaborador',version:'1.0',status:'Válido',days:335,type:'core'},
    {pop:'LGPD — Proteção de Dados',version:'2.0',status:'Revisão Pendente',days:-35,type:'area'},
  ]},
  {id:8,name:'Bruno Alves',email:'b.alves@nazca.com',sector:'Jurídico',role:'Analista Jurídico',admission:'2024-02-01',pops:[
    {pop:'LGPD — Proteção de Dados',version:'2.0',status:'Válido',days:265,type:'core'},
  ]},
  {id:9,name:'Larissa Rocha',email:'l.rocha@nazca.com',sector:'Qualidade de Vida',role:'Auxiliar de Qualidade',admission:'2026-04-01',pops:[
    {pop:'Higiene e Manipulação de Alimentos',version:'2.0',status:'Pendente',days:null,type:'core'},
    {pop:'Uso de EPI e Segurança no Trabalho',version:'1.0',status:'Pendente',days:null,type:'core'},
    {pop:'Controle de Qualidade e Inspeção',version:'3.0',status:'Pendente',days:null,type:'area'},
    {pop:'Gestão de Resíduos',version:'1.0',status:'Pendente',days:null,type:'area'},
    {pop:'Atendimento e Bem-Estar do Colaborador',version:'1.0',status:'Pendente',days:null,type:'cargo'},
  ]},
  {id:10,name:'Mikaela Santos',email:'mikaela@nazca.com',sector:'Qualidade de Vida',role:'Gestora de Qualidade de Vida',admission:'2024-01-15',pops:[
    {pop:'Higiene e Manipulação de Alimentos',version:'2.0',status:'Válido',days:345,type:'core'},
    {pop:'Uso de EPI e Segurança no Trabalho',version:'1.0',status:'Válido',days:340,type:'core'},
    {pop:'Controle de Qualidade e Inspeção',version:'3.0',status:'Válido',days:350,type:'area'},
    {pop:'Gestão de Resíduos',version:'1.0',status:'Válido',days:347,type:'area'},
    {pop:'Atendimento e Bem-Estar do Colaborador',version:'1.0',status:'Válido',days:343,type:'core'},
  ]},
];

const ONBOARDING_MAP = {
  'Qualidade de Vida':['Higiene e Manipulação de Alimentos','Uso de EPI e Segurança no Trabalho','Gestão de Resíduos','Controle de Qualidade e Inspeção','Atendimento e Bem-Estar do Colaborador'],
  'Operações':['Uso de EPI e Segurança no Trabalho','Gestão de Resíduos'],
  'Segurança do Trabalho':['Uso de EPI e Segurança no Trabalho'],
  'Nutrição':['Higiene e Manipulação de Alimentos'],
  'RH':['Atendimento e Bem-Estar do Colaborador','LGPD — Proteção de Dados'],
  'Jurídico':['LGPD — Proteção de Dados'],
  'Administrativo':['LGPD — Proteção de Dados'],
};

const TRAINING_MATRIX = [
  {role:'ANALISTA DE CONTROLE DE QUALIDADE',sector:'Qualidade',pops:['AL 001','CQ 005','CQ 006','CQ 008','CQ 009','CQ 010','CQ 012','CQ 017'],status:['OK','OK','OK','OK','OK','SOLICITADO','OK','OK']},
  {role:'ASSISTENTE DA QUALIDADE',sector:'Qualidade',pops:['CQ 005','CQ 006','CQ 007','CQ 008','CQ 009','CQ 010','CQ 012','CQ 017'],status:['OK','OK','OK','OK','OK','SOLICITADO','OK','OK']},
  {role:'ANALISTA DA GARANTIA DA QUALIDADE',sector:'Qualidade',pops:['CQ 005','CQ 006','CQ 008','CQ 009','CQ 010','CQ 011','CQ 012','CQ 017'],status:['OK','OK','OK','OK','OK','OK','OK','OK']},
  {role:'ANALISTA DE LABORATÓRIO',sector:'Qualidade',pops:['CQ 005','CQ 006','CQ 007','CQ 008','CQ 010','CQ 012','CQ 013','CQ 017'],status:['OK','OK','OK','OK','SOLICITADO','OK','OK','OK']},
  {role:'ESTAGIÁRIO (Qualidade)',sector:'Qualidade',pops:['CQ 005','CQ 007','CQ 008','CQ 009','CQ 010'],status:['OK','OK','OK','OK','SOLICITADO']},
  {role:'ASSISTENTE ADM ALMOXARIFADO',sector:'Almoxarifado',pops:['AL 001','AL 002','AL 003'],status:['OK','OK','OK']},
  {role:'AUXILIAR DE ALMOXARIFADO',sector:'Almoxarifado',pops:['AL 001','AL 002','AL 003'],status:['OK','SOLICITADO','OK']},
  {role:'OPERADOR DE EMPILHADEIRA',sector:'Almoxarifado',pops:['AL 001','AL 002','AL 003'],status:['OK','OK','OK']},
  {role:'ANALISTA DE PCP',sector:'PCP',pops:['AL 001','CQ 012'],status:['OK','OK']},
  {role:'LÍDER DE PRODUÇÃO',sector:'Produção',pops:['CQ 006','CQ 010','CQ 012'],status:['OK','SOLICITADO','OK']},
  {role:'OPERADOR DE PRODUÇÃO',sector:'Produção',pops:['CQ 006','CQ 012'],status:['OK','OK']},
  {role:'AUXILIAR DE MANIPULAÇÃO',sector:'Manipulação',pops:['CQ 010'],status:['SOLICITADO']},
  {role:'PESQUISADOR JÚNIOR',sector:'P&D',pops:['CQ 010','DP 002','DP 003','DP 007'],status:['OK','OK','SOLICITADO','SOLICITADO']},
  {role:'ASSISTENTE DE P&D',sector:'P&D',pops:['CQ 007','CQ 010','DP 002','DP 003','DP 004','DP 007'],status:['OK','OK','OK','SOLICITADO','SOLICITADO','SOLICITADO']},
  {role:'ANALISTA DE DESIGN',sector:'Des. Embalagem',pops:['DE 001','DE 004','DE 005','DE 006'],status:['OK','OK','OK','OK']},
];

const CORE_POPS = ['AL 001','CQ 010','CQ 012','CQ 017'];
const MATRIX_POPS = ['AL 001','AL 002','AL 003','CQ 005','CQ 006','CQ 007','CQ 008','CQ 009','CQ 010','CQ 012','CQ 013','CQ 017','DE 001','DP 002','DP 007'];

let ANEXOS = [
  {id:1,nome:'Procedimento de Limpeza CQ 033',numero:'I',popVinculado:'CQ 033',desc:'Instruções detalhadas de limpeza e sanitização da Estufa Fabbe, incluindo frequência e produtos aprovados.',status:'Aprovado',dataCriacao:'20/06/2021',dataRevisao:'20/06/2023'},
  {id:2,nome:'Ficha de Calibração pHmetro',numero:'II',popVinculado:'CQ 008',desc:'Planilha de registros de calibração diária do pHmetro Q400AS com valores de referência e tolerâncias.',status:'Em Revisão',dataCriacao:'05/02/2022',dataRevisao:'05/02/2025'},
  {id:3,nome:'Instrução de Uso de Empilhadeira',numero:'III',popVinculado:'AL 002',desc:'Manual operacional simplificado para empilhadeira do almoxarifado, incluindo checklist de segurança.',status:'Aprovado',dataCriacao:'15/03/2023',dataRevisao:'15/03/2025'},
  {id:4,nome:'Registro de Recebimento de MP',numero:'IV',popVinculado:'AL 001',desc:'Formulário padrão para registro de entrada e inspeção de matéria-prima e embalagens.',status:'Obsoleto',dataCriacao:'10/01/2023',dataRevisao:'10/01/2025'},
];
let nextAnexoId = 5;
let nextEmpId = 11;
let currentSectorFilter = null;
let tvMode = false;
let chartsInit = {};
let confirmCallback = null;

/* ══════════════════════════════════════════
   CONFIRM DELETE
══════════════════════════════════════════ */
function showConfirm(title, msg, cb) {
  confirmCallback = cb;
  document.getElementById('confirm-title').textContent = title;
  document.getElementById('confirm-msg').textContent = msg;
  document.getElementById('confirm-yes-btn').onclick = () => { closeConfirm(); if(confirmCallback) confirmCallback(); };
  document.getElementById('confirm-overlay').classList.add('open');
}
function closeConfirm() {
  document.getElementById('confirm-overlay').classList.remove('open');
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
  const compliance=Math.round(approved/totalPOPs*100);
  const critical=POPS.filter(p=>p.vigencia==='VENCIDO'||p.docStatus==='ELABORAR').length;
  const expiring=POPS.filter(p=>p.vigencia==='VENCE EM 3 MESES').length;
  const pendTrain=POPS.filter(p=>p.training==='SOLICITADO').length;

  document.getElementById('kpi-grid').innerHTML=`
    <div class="kpi-card green glass-card" onclick="navigate('analytics')"><div class="kpi-val">${compliance}%</div><div class="kpi-label">Compliance Global</div><div class="kpi-trend">▲ ${approved} de ${totalPOPs} POPs aprovados</div></div>
    <div class="kpi-card glass-card" onclick="showAlertasModal()"><div class="kpi-val">${critical}</div><div class="kpi-label">Alertas Críticos</div><div class="kpi-trend danger">${critical>0?'Ação imediata requerida':'Sem críticos'}</div></div>
    <div class="kpi-card orange glass-card" onclick="showPendenciasModal()"><div class="kpi-val">${expiring+pendTrain}</div><div class="kpi-label">Pendências Totais</div><div class="kpi-trend warn">${expiring} vencendo · ${pendTrain} trein. solicitados</div></div>
    <div class="kpi-card blue glass-card" onclick="navigate('funcionarios')"><div class="kpi-val">${EMPLOYEES.length}</div><div class="kpi-label">Colaboradores</div><div class="kpi-trend">Cobrindo ${Object.keys(SECTORS_DATA).length} setores ativos</div></div>
  `;
  document.getElementById('alert-badge').textContent=`${critical+expiring} Alertas`;

  document.getElementById('sector-table').innerHTML=Object.entries(SECTORS_DATA).map(([key,s])=>{
    const pct=Math.round(s.approved/s.total*100);
    const color=pct===100?'var(--green)':pct>=70?'var(--orange)':'var(--red)';
    return`<div class="sector-row">
      <span class="clickable" onclick="navigate('analytics','${key}')">${s.name}</span>
      <span style="text-align:center">${s.total}</span>
      <span style="text-align:center;color:var(--green);font-weight:700">${s.approved}</span>
      <span style="text-align:center;color:${(s.expired>0||s.inReview>2)?'var(--red)':'var(--gray-soft)'};font-weight:700" class="sector-col-3">${s.inReview+s.expired}</span>
      <div style="flex:1"><div style="display:flex;justify-content:flex-end;font-size:var(--fs-xs);margin-bottom:2px"><span style="font-weight:700;color:${color}">${pct}%</span></div><div class="prog-bar"><div class="prog-fill" style="width:${pct}%;background:${color}"></div></div></div>
      <span>${pct===100?'<span class="badge badge-green">OK</span>':pct>=70?'<span class="badge badge-orange">Atenção</span>':'<span class="badge badge-red">Crítico</span>'}</span>
    </div>`;
  }).join('');

  const alerts=[
    {icon:'🔴',text:'CQ 033 — Estufa Fabbe: Vigência <strong>VENCIDA</strong>',type:'danger'},
    {icon:'🟡',text:'CQ 008 — pHmetro Q400AS: Vence em <strong>3 meses</strong>',type:'warn'},
    {icon:'🟠',text:'CQ 039 — Resultado OOS: Aguardando elaboração',type:'warn'},
    {icon:'🔵',text:'5 treinamentos com assinatura pendente (AL/CQ)',type:'info'},
    {icon:'🟢',text:'DE — Des. Embalagem: <strong>100% em conformidade</strong>',type:'ok'},
  ];
  document.getElementById('alerts-list').innerHTML=alerts.map(a=>`
    <div class="alert-item ${a.type}" onclick="showAlertasModal()">
      <span class="alert-item-icon">${a.icon}</span>
      <span class="alert-item-text">${a.text}</span>
    </div>
  `).join('');

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
  const sectors=[...new Set(POPS.map(p=>p.sector))];
  const sectorNames={AL:'Almoxarifado',CQ:'Qualidade',DE:'Des. Embalagem',DP:'P&D'};
  document.getElementById('filter-bar').innerHTML=[
    `<div class="filter-pill ${!currentSectorFilter?'active':''}" onclick="setFilter(null)">Todos</div>`,
    ...sectors.map(s=>`<div class="filter-pill ${currentSectorFilter===s?'active':''}" onclick="setFilter('${s}')">${sectorNames[s]||s}</div>`)
  ].join('');

  const fp=currentSectorFilter?POPS.filter(p=>p.sector===currentSectorFilter):POPS;
  const sName=currentSectorFilter?(sectorNames[currentSectorFilter]||currentSectorFilter):'Todos os Setores';
  document.getElementById('analytics-subtitle').textContent=`Indicadores avançados · ${sName}`;
  document.getElementById('filter-label').textContent=currentSectorFilter?`· ${sName}`:'';
  document.getElementById('clear-filter-btn').style.display=currentSectorFilter?'':'none';

  const total=fp.length;
  const approved=fp.filter(p=>p.docStatus==='APROVADO').length;
  const inReview=fp.filter(p=>p.docStatus==='EM REVISÃO').length;
  const expired=fp.filter(p=>p.vigencia==='VENCIDO').length;
  const pendTrain=fp.filter(p=>p.training==='SOLICITADO').length;

  document.getElementById('analytics-kpis').innerHTML=`
    <div class="kpi-card green glass-card"><div class="kpi-val">${total}</div><div class="kpi-label">POPs no Filtro</div></div>
    <div class="kpi-card glass-card"><div class="kpi-val">${total?Math.round(approved/total*100):0}%</div><div class="kpi-label">Taxa de Aprovação</div></div>
    <div class="kpi-card orange glass-card"><div class="kpi-val">${inReview}</div><div class="kpi-label">Em Revisão</div></div>
    <div class="kpi-card ${expired>0?'':'green'} glass-card"><div class="kpi-val">${expired+pendTrain}</div><div class="kpi-label">Vencidos + Trein. Pend.</div></div>
  `;

  document.getElementById('pops-analytics-body').innerHTML=fp.map(p=>`
    <tr>
      <td><strong style="color:var(--red)">${p.code}</strong></td>
      <td style="max-width:220px">${p.desc}</td>
      <td>${popTypeBadge(p.popType)} <span class="badge badge-blue">${p.sectorName}</span></td>
      <td>${docBadge(p.docStatus)}</td>
      <td>${vigenciaBadge(p.vigencia)}</td>
      <td>${trainBadge(p.training)}</td>
      <td style="text-align:center">
        <span style="display:inline-flex;align-items:center;justify-content:center;min-width:28px;height:28px;background:var(--blue-bg);color:var(--blue);font-weight:800;font-size:.8rem;border-radius:6px;border:1.5px solid rgba(38,46,69,.18);padding:0 7px">${p.revision||1}</span>
      </td>
      <td><button class="btn btn-sm" style="background:var(--green);color:#fff;border:none;padding:5px 12px;border-radius:7px;font-family:inherit;font-size:var(--fs-xs);font-weight:700;cursor:pointer" onclick="openQuickRevision('${p.code}')">Revisão</button></td>
    </tr>
  `).join('');

  if(chartsInit.trend){chartsInit.trend.destroy();chartsInit.doughnut.destroy();}
  const tc=tvMode?'#d0d0ce':'#6b6b68';
  const gc=tvMode?'rgba(255,255,255,0.08)':'rgba(0,0,0,0.06)';

  // Feature 4: Historical compliance trend by month
  const trendData = getHistoricalTrend();
  chartsInit.trend=new Chart(document.getElementById('trendChart'),{
    type:'line',
    data:{labels:trendData.map(t=>t.label),datasets:[{
      label:'Compliance (%)',
      data:trendData.map(t=>t.value),
      borderColor:'#12544d',
      backgroundColor:'rgba(18,84,77,.12)',
      fill:true,
      tension:.4,
      pointBackgroundColor:'#12544d',
      pointRadius:5,
      pointHoverRadius:7,
    }]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:ctx=>`${ctx.parsed.y}% compliance`}}},scales:{y:{beginAtZero:false,min:30,max:100,ticks:{color:tc,callback:v=>v+'%'},grid:{color:gc}},x:{ticks:{color:tc},grid:{color:gc}}}}
  });

  const statusData=['APROVADO','EM REVISÃO','ELABORAR','OBSOLETO'].map(s=>fp.filter(p=>p.docStatus===s).length);
  const approvedPct=total?Math.round(approved/total*100):0;
  chartsInit.doughnut=new Chart(document.getElementById('donutChart'),{
    type:'doughnut',
    data:{labels:['Aprovado','Em Revisão','Elaborar','Obsoleto'],datasets:[{data:statusData,backgroundColor:['#12544d','#db6645','#c4956a','#6b6b68'],borderWidth:tvMode?2:0,borderColor:tvMode?'#1e1e1c':'transparent',hoverOffset:8}]},
    options:{responsive:true,maintainAspectRatio:false,cutout:'68%',plugins:{legend:{position:'bottom',labels:{color:tc,font:{size:11},usePointStyle:true}}}}
  });
  document.getElementById('donut-pct-anl').textContent=approvedPct+'%';
}
function setFilter(s){currentSectorFilter=s;renderAnalytics();}
function clearFilter(){setFilter(null);}

/* ══════════════════════════════════════════
   QUICK REVISION (Analytics)
══════════════════════════════════════════ */
function openQuickRevision(code){
  const pop=POPS.find(p=>p.code===code);
  if(!pop)return;
  const rev=pop.revision||1;
  openModal(`Revisão Rápida — <span>${code}</span>`,`
    <div style="padding:12px 14px;background:var(--green-bg);border-radius:var(--r);margin-bottom:16px;border-left:3px solid var(--green)">
      <div style="font-weight:700;font-size:var(--fs-sm);color:var(--gray)">${pop.desc}</div>
      <div style="font-size:var(--fs-xs);color:var(--gray-soft);margin-top:4px">${pop.sectorName} · ${pop.docStatus}</div>
    </div>
    <div class="form-group">
      <label class="form-label">Alterações realizadas nesta revisão</label>
      <textarea class="form-input" id="qr-desc" rows="5" placeholder="Descreva o que foi alterado, corrigido ou atualizado neste procedimento...">${pop.lastRevisionNote||''}</textarea>
    </div>
    <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:var(--blue-bg);border-radius:var(--r);border:1.5px solid rgba(38,46,69,.12);margin-bottom:16px">
      <div>
        <div style="font-size:var(--fs-xs);font-weight:700;color:var(--gray-soft);text-transform:uppercase;letter-spacing:.7px;margin-bottom:2px">Revisão atual</div>
        <div style="font-size:1.6rem;font-weight:800;color:var(--blue);line-height:1">Rev. ${rev}</div>
      </div>
      <div style="text-align:right">
        <div style="font-size:var(--fs-xs);font-weight:700;color:var(--gray-soft);text-transform:uppercase;letter-spacing:.7px;margin-bottom:2px">Após salvar</div>
        <div style="font-size:1.6rem;font-weight:800;color:var(--green);line-height:1">Rev. ${rev+1}</div>
      </div>
    </div>
    <div style="display:flex;gap:10px;flex-wrap:wrap">
      <button class="btn btn-primary" onclick="saveQuickRevision('${code}')" style="background:var(--green)">✓ Salvar Revisão</button>
      <button class="btn btn-outline" onclick="closeModal()">Cancelar</button>
    </div>
  `);
}

function saveQuickRevision(code){
  const pop=POPS.find(p=>p.code===code);
  if(!pop)return;
  const note=document.getElementById('qr-desc')?.value?.trim();
  if(!note){toast('Campo obrigatório','Descreva as alterações realizadas nesta revisão.','warn');return;}
  pop.revision=(pop.revision||1)+1;
  pop.lastRevisionNote=note;
  pop.dataRevisao=new Date().toLocaleDateString('pt-BR');
  const venc=new Date();venc.setFullYear(venc.getFullYear()+5);
  pop.dataVencimento=venc.toLocaleDateString('pt-BR');
  pop.vigencia='NO PRAZO';
  if(pop.docStatus!=='APROVADO')pop.docStatus='APROVADO';
  addLog(`POP Revisado: ${code}`, 'edit', `Rev. ${pop.revision} · ${note.substring(0,60)}${note.length>60?'…':''}`);
  saveData();
  toast('Revisão Salva', `${code} atualizado para Rev. ${pop.revision}.`, 'success');
  closeModal();
  renderAnalytics();
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

  document.getElementById('pops-body').innerHTML=items.map(p=>`
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
        <button class="btn btn-outline btn-sm" onclick="openEditPOP('${p.code}')" style="margin-right:4px">Editar</button>
        <button class="btn btn-danger btn-sm" onclick="deletePOP('${p.code}')">Excluir</button>
      </td>
    </tr>
  `).join('');
}

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
  const pop=POPS.find(p=>p.code===code);
  if(!pop)return;
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
      <div class="form-group"><label class="form-label">Data de Criação</label><input type="date" class="form-input" id="ep-criacao" value="${brToIso(pop.dataCriacao)}"></div>
      <div class="form-group"><label class="form-label">Data de Revisão</label><input type="date" class="form-input" id="ep-revisao" value="${brToIso(pop.dataRevisao)}"></div>
    </div>
    ${tagsEditor(pop)}
    ${anexosEditor(pop)}
    <div style="display:flex;gap:10px;margin-top:8px">
      <button class="btn btn-primary" onclick="salvarEditPOP('${code}')">Salvar Alterações</button>
      <button class="btn btn-danger" onclick="closeModal();deletePOP('${code}')">Excluir POP</button>
      <button class="btn btn-outline" onclick="closeModal()">Cancelar</button>
    </div>
  `);
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
  // Salvar estado do anexo
  const hasAnexo=document.getElementById('ep-has-anexo')?.value;
  if(hasAnexo==='sim'){
    const sel=document.getElementById('ep-anexo-select');
    const fileInput=document.getElementById('ep-anexo-file');
    if(sel&&sel.value){pop.anexoRef=sel.value;pop.hasAnexo=true;}
    else if(fileInput&&fileInput.files&&fileInput.files[0]){
      pop.anexoFile=fileInput.files[0].name;pop.hasAnexo=true;pop.anexoRef='';
    }
  } else if(hasAnexo==='nao'){
    pop.hasAnexo=false;pop.anexoRef='';pop.anexoFile='';
  }
  addLog(`POP Editado: ${code}`, 'edit', `${pop.desc} · Status: ${pop.docStatus}`);
  saveData();
  toast('POP Atualizado', `${code} salvo com sucesso.`, 'success');
  closeModal();
  renderPOPs();
}

function openNovoPOP(){
  const hoje = new Date().toISOString().slice(0,10);
  openModal('+ Novo <span>POP</span>',`
    <div class="form-grid">
      <div class="form-group"><label class="form-label">Código</label><input type="text" class="form-input" placeholder="Ex: CQ 041" id="new-pop-code"></div>
      <div class="form-group"><label class="form-label">Tipo</label>
        <select class="form-select" id="new-pop-type"><option value="core">Core</option><option value="area">Área</option><option value="cargo">Cargo</option></select>
      </div>
      <div class="form-group"><label class="form-label">Setor</label>
        <select class="form-select" id="new-pop-sector"><option value="AL">Almoxarifado</option><option value="CQ">Qualidade / CQ</option><option value="DE">Des. Embalagem</option><option value="DP">P&D</option></select>
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
    <button class="btn btn-primary" onclick="salvarNovoPOP()">Salvar POP</button>
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
  const sectorMap={AL:'Almoxarifado',CQ:'Qualidade',DE:'Des. Embalagem',DP:'P&D'};
  const sector=document.getElementById('new-pop-sector').value;
  const code=document.getElementById('new-pop-code').value.trim()||'N/A';
  const desc=document.getElementById('new-pop-desc').value.trim()||'Sem descrição';
  if(!code||code==='N/A'){toast('Código obrigatório','Informe um código para o POP.','error');return;}
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
  POPS.push({code,type:'POP',popType:document.getElementById('new-pop-type').value,sector,sectorName:sectorMap[sector]||sector,desc,docStatus:document.getElementById('new-pop-status').value,vigencia:'NO PRAZO',training:'N.A',dataCriacao,dataVencimento,...getAnexoFromNew()});
  addLog(`POP Criado: ${code}`, 'create', `${desc} · Setor: ${sectorMap[sector]||sector} · Venc: ${dataVencimento}`);
  saveData();
  toast('POP Criado', `${code} adicionado. Vencimento: ${dataVencimento}.`, 'success');
  closeModal();renderPOPs();
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
  const pop=POPS.find(p=>p.code===code);
  if(!pop)return;
  const matrixRoles=TRAINING_MATRIX.filter(r=>r.pops.includes(code));
  const roleNames=matrixRoles.map(r=>r.role.toUpperCase());
  const linked=EMPLOYEES.filter(e=>{
    const roleUp=e.role.toUpperCase();
    return roleNames.some(rn=>roleUp.includes(rn)||rn.includes(roleUp))||e.sector.toLowerCase()===pop.sectorName.toLowerCase();
  });
  const tableRows=linked.length?linked.map(emp=>{
    const relPOP=emp.pops.find(p=>p.pop.toLowerCase().includes(pop.desc.split(' ')[0].toLowerCase()));
    const badge=relPOP?empStatusBadge(relPOP.status):'<span class="badge badge-gray">Sem registro</span>';
    return`<tr class="clickable-row" onclick="closeModal();setTimeout(()=>openEmpProfile(${emp.id}),100)">
      <td><div style="display:flex;align-items:center;gap:10px"><div style="width:30px;height:30px;border-radius:50%;background:var(--red);display:flex;align-items:center;justify-content:center;color:white;font-weight:800;font-size:.7rem;flex-shrink:0">${emp.name.charAt(0)}</div><div><div style="font-weight:700;font-size:var(--fs-sm)">${emp.name}</div><div style="font-size:var(--fs-xs);color:var(--gray-soft)">${emp.email}</div></div></div></td>
      <td><span class="badge badge-blue">${emp.sector}</span></td>
      <td style="font-size:var(--fs-sm)">${emp.role}</td>
      <td>${badge}</td>
    </tr>`;
  }).join(''):`<tr><td colspan="4" style="text-align:center;padding:24px;color:var(--gray-soft)">Nenhum funcionário vinculado.</td></tr>`;

  openModalWide(`Funcionários — <span>${code}</span>`,`
    <div style="padding:12px 14px;background:var(--red-pale);border-radius:var(--r);margin-bottom:16px;border-left:3px solid var(--red)">
      <div style="font-weight:700">${pop.desc}</div>
      <div style="font-size:var(--fs-xs);color:var(--gray-soft);margin-top:4px">${pop.sectorName}</div>
    </div>
    <table class="data-table" style="min-width:500px"><thead><tr><th>Colaborador</th><th>Setor</th><th>Cargo</th><th>Status</th></tr></thead><tbody>${tableRows}</tbody></table>
  `);
}

function openPOPAnexos(code){
  const relAnexos=ANEXOS.filter(a=>a.popVinculado===code);
  const pop=POPS.find(p=>p.code===code);
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
          <button class="btn btn-sm btn-danger" style="margin-left:4px" onclick="closeModal();deletePOP('${p.code}')">Excluir</button>
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
  const sectors=[...new Set(EMPLOYEES.map(e=>e.sector))].sort();
  const sel=document.getElementById('emp-sector-filter');
  const current=sel.value;
  sel.innerHTML='<option value="">Todos os Setores</option>'+sectors.map(s=>`<option value="${s}"${s===current?' selected':''}>${s}</option>`).join('');
  const filter=sel.value;
  const list=filter?EMPLOYEES.filter(e=>e.sector===filter):EMPLOYEES;

  document.getElementById('emp-grid').innerHTML=list.map(emp=>{
    const pct=empCompliance(emp);
    const color=pct>=80?'var(--green)':pct>=50?'var(--orange)':'var(--red)';
    return`<div class="emp-card">
      <div class="emp-card-header">
        <div>
          <div class="emp-name" onclick="openEmpProfile(${emp.id})">${emp.name}</div>
          <div class="emp-role">${emp.role} · <span class="badge badge-blue" style="font-size:.65rem">${emp.sector}</span></div>
        </div>
        <div class="emp-card-actions">
          <button class="btn btn-outline btn-sm" onclick="openEditFuncionario(${emp.id})" title="Modificar">Editar</button>
          <button class="btn btn-danger btn-sm" onclick="deleteFuncionario(${emp.id})" title="Excluir">Excluir</button>
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
  }).join('');
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
      <button class="btn btn-danger btn-sm" onclick="closeModal();deleteFuncionario(${emp.id})">Excluir</button>
    </div>
  `);
}

function openEditFuncionario(id){
  const emp=EMPLOYEES.find(e=>e.id===id);
  if(!emp)return;
  const sectors=Object.keys({...{[emp.sector]:[]}, 'Qualidade de Vida':[], 'Nutrição':[], 'Operações':[], 'Segurança do Trabalho':[], 'RH':[], 'Jurídico':[], 'Administrativo':[], 'Almoxarifado':[], 'Qualidade':[], 'Des. Embalagem':[], 'P&D':[], 'Produção':[], 'Manipulação':[], 'PCP':[] });
  openModal(`Modificar — <span>${emp.name.split(' ')[0]}</span>`,`
    <div class="form-grid">
      <div class="form-group"><label class="form-label">Nome Completo</label><input type="text" class="form-input" id="ef-name" value="${emp.name}"></div>
      <div class="form-group"><label class="form-label">E-mail</label><input type="text" class="form-input" id="ef-email" value="${emp.email}"></div>
      <div class="form-group"><label class="form-label">Setor</label>
        <select class="form-select" id="ef-sector">
          ${sectors.map(s=>`<option value="${s}" ${s===emp.sector?'selected':''}>${s}</option>`).join('')}
        </select>
      </div>
      <div class="form-group"><label class="form-label">Data de Admissão</label><input type="date" class="form-input" id="ef-admission" value="${emp.admission}"></div>
    </div>
    <div class="form-group"><label class="form-label">Cargo</label><input type="text" class="form-input" id="ef-role" value="${emp.role}"></div>
    <div style="display:flex;gap:10px;margin-top:8px;flex-wrap:wrap">
      <button class="btn btn-primary" onclick="salvarEditFuncionario(${id})">Salvar Alterações</button>
      <button class="btn btn-danger" onclick="closeModal();deleteFuncionario(${id})">Excluir Funcionário</button>
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
  closeModal();renderFuncionarios();
}

function deleteFuncionario(id){
  const emp=EMPLOYEES.find(e=>e.id===id);
  if(!emp)return;
  showConfirm('Excluir Funcionário',`Tem certeza que deseja excluir "${emp.name}"? Esta ação não pode ser desfeita.`,()=>{
    addLog(`Funcionário Excluído: ${emp.name}`, 'delete', `${emp.role} · ${emp.sector}`);
    EMPLOYEES=EMPLOYEES.filter(e=>e.id!==id);
    toast('Funcionário Removido', `${emp.name} excluído do sistema.`, 'warn');
    renderFuncionarios();
  });
}

function openNovoFuncionario(){
  openModal('+ Registrar <span>Funcionário</span>',`
    <div class="form-grid">
      <div class="form-group"><label class="form-label">Nome completo</label><input type="text" class="form-input" id="nf-name" placeholder="Nome Sobrenome"></div>
      <div class="form-group"><label class="form-label">E-mail</label><input type="text" class="form-input" id="nf-email" placeholder="email@nazca.com"></div>
      <div class="form-group"><label class="form-label">Data de Admissão</label><input type="date" class="form-input" id="nf-admission"></div>
      <div class="form-group"><label class="form-label">Setor / Área</label>
        <select class="form-select" id="nf-sector" onchange="previewOnboarding()">
          <option value="">Selecione o setor...</option>
          ${Object.keys(ONBOARDING_MAP).map(s=>`<option value="${s}">${s}</option>`).join('')}
          <option value="Outro">Outro</option>
        </select>
      </div>
      <div class="form-group" style="grid-column:span 2"><label class="form-label">Cargo</label><input type="text" class="form-input" id="nf-role" placeholder="Cargo do funcionário"></div>
    </div>
    <div id="onboarding-preview" style="margin:10px 0"></div>
    <button class="btn btn-primary" onclick="salvarNovoFuncionario()">✓ Registrar</button>
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
  const pops=(ONBOARDING_MAP[sector]||[]).map(p=>({pop:p,version:'1.0',status:'Pendente',days:null,type:p.includes('LGPD')||p.includes('Higiene')?'core':'area'}));
  EMPLOYEES.push({id:nextEmpId++,name,email,sector,role,admission:admission||new Date().toISOString().slice(0,10),pops});
  addLog(`Funcionário Registrado: ${name}`, 'create', `${role} · ${sector}`);
  toast('Funcionário Registrado', `${name} adicionado com sucesso.`, 'success');
  closeModal();renderFuncionarios();
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
    <button class="btn btn-primary" onclick="closeModal()">Registrar Treinamento</button>
  `);
}

function onNTEmpChange(){
  const empId=parseInt(document.getElementById('nt-emp').value);
  const emp=EMPLOYEES.find(e=>e.id===empId);
  if(!emp)return;
  document.getElementById('nt-sector').value=emp.sector;
  const sectorCodeMap={'Almoxarifado':'AL','Qualidade':'CQ','Des. Embalagem':'DE','P&D':'DP'};
  const prefix=sectorCodeMap[emp.sector];
  const relevantPOPs=POPS.filter(p=>!prefix||p.sector===prefix||CORE_POPS.includes(p.code));
  const popSel=document.getElementById('nt-pop');
  popSel.innerHTML=relevantPOPs.map(p=>`<option value="${p.code}">${p.code} — ${p.desc}</option>`).join('');
}

/* ══════════════════════════════════════════
   MATRIX
══════════════════════════════════════════ */
function renderMatrix(){
  const table=document.getElementById('heatmap-table');
  const corePopsSet=new Set(CORE_POPS);
  const cargoPopsSet=new Set(MATRIX_POPS.filter(p=>p.startsWith('DE')));
  const popThClass=p=>{
    if(corePopsSet.has(p))return'pop-th-core';
    if(cargoPopsSet.has(p))return'pop-th-cargo';
    return'pop-th-area';
  };
  const headerCells=MATRIX_POPS.map(p=>`<th class="${popThClass(p)}" title="${POPS.find(x=>x.code===p)?.desc||''}">${p}</th>`).join('');
  table.innerHTML=`
    <thead><tr><th class="row-label">Cargo / Setor</th>${headerCells}</tr></thead>
    <tbody>${TRAINING_MATRIX.map(role=>{
      const cells=MATRIX_POPS.map(pop=>{
        const idx=role.pops.indexOf(pop);
        if(idx===-1)return`<td><div class="heat-cell heat-na" title="N/A">—</div></td>`;
        const s=role.status[idx];
        const isCore=corePopsSet.has(pop);
        if(isCore&&s==='OK')return`<td title="${pop}: Core OK"><div class="heat-cell heat-core">★</div></td>`;
        return`<td title="${pop}: ${s}"><div class="heat-cell ${s==='OK'?'heat-ok':'heat-pend'}">${s==='OK'?'✓':'⏳'}</div></td>`;
      }).join('');
      return`<tr><td class="role-name"><div style="font-size:.8rem;font-weight:700">${role.role}</div><div class="role-sector">${role.sector}</div></td>${cells}</tr>`;
    }).join('')}</tbody>
  `;
}

/* ══════════════════════════════════════════
   ALERTAS PAGE
══════════════════════════════════════════ */
function renderAlertasPage(){
  const content=document.getElementById('alertas-page-content');
  if(!content)return;
  const critical=POPS.filter(p=>p.vigencia==='VENCIDO'||p.docStatus==='ELABORAR');
  const expiring=POPS.filter(p=>p.vigencia==='VENCE EM 3 MESES');
  const pending=POPS.filter(p=>p.training==='SOLICITADO');
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
            <button class="btn btn-danger btn-sm" onclick="event.stopPropagation();deletePOP('${p.code}')">Excluir</button>
          </div>
        </div>
      `}).join('')}
      ${!critical.length?'<div style="color:var(--green);font-weight:700;padding:12px">✅ Nenhum POP crítico.</div>':''}
    </div>
    <div class="bento-card col-12">
      <h3><span>⏳</span> Treinamentos Solicitados</h3>
      ${pending.map(p=>`
        <div class="alert-item warn">
          <span class="alert-item-icon" style="color:var(--orange);font-weight:900">!</span>
          <div class="alert-item-text"><strong>${p.code}</strong> — ${p.desc}<div style="font-size:var(--fs-xs);color:var(--gray-soft);margin-top:2px">${p.sectorName}</div></div>
          <div style="display:flex;gap:6px">
            ${trainBadge(p.training)}
            <button class="btn btn-danger btn-sm" onclick="deletePOP('${p.code}');renderAlertasPage()">Excluir</button>
          </div>
        </div>
      `).join('')}
      ${!pending.length?'<div style="color:var(--green);font-weight:700;padding:12px">✅ Nenhum treinamento pendente.</div>':''}
    </div>
  `;
}

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
      <td><span class="badge badge-blue">${a.popVinculado}</span></td>
      <td style="max-width:200px;font-size:var(--fs-sm);color:var(--gray-soft)">${a.desc}</td>
      <td>${statusBadge}</td>
      <td style="font-size:var(--fs-xs);color:var(--gray-soft)">${a.dataCriacao}</td>
      <td style="font-size:var(--fs-xs);color:var(--gray-soft)">${a.dataRevisao}</td>
      <td style="font-size:var(--fs-xs);font-weight:700;color:${a.dataVencimento?'var(--green)':'var(--gray-soft)'}">${a.dataVencimento||'—'}</td>
      <td style="white-space:nowrap">
        <button class="btn btn-outline btn-sm" onclick="openEditAnexo(${a.id})" style="margin-right:4px">Editar</button>
        <button class="btn btn-danger btn-sm" onclick="deleteAnexo(${a.id})">Excluir</button>
      </td>
    </tr>`;
  }).join('');
  if(!items.length)body.innerHTML=`<tr><td colspan="9" style="text-align:center;padding:24px;color:var(--gray-soft)">Nenhum anexo encontrado${search?' para "'+search+'"':''}.</td></tr>`;
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
      <button class="btn btn-danger" onclick="closeModal();deleteAnexo(${id})">Excluir</button>
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
   LOCALSTORAGE PERSISTENCE
══════════════════════════════════════════ */
const LS_KEY_POPS = 'nazca_pops_v2';
const LS_KEY_ANEXOS = 'nazca_anexos_v2';
const LS_KEY_LOGS = 'nazca_logs_v2';

function saveData() {
  try {
    localStorage.setItem(LS_KEY_POPS, JSON.stringify(POPS));
    localStorage.setItem(LS_KEY_ANEXOS, JSON.stringify(ANEXOS));
    localStorage.setItem(LS_KEY_LOGS, JSON.stringify(LOGS.slice(-200))); // keep last 200 logs
  } catch(e) { console.warn('LocalStorage save error:', e); }
}

function loadData() {
  try {
    const savedPOPs = localStorage.getItem(LS_KEY_POPS);
    const savedAnexos = localStorage.getItem(LS_KEY_ANEXOS);
    const savedLogs = localStorage.getItem(LS_KEY_LOGS);
    if (savedPOPs) POPS = JSON.parse(savedPOPs);
    if (savedAnexos) {
      ANEXOS = JSON.parse(savedAnexos);
      nextAnexoId = Math.max(...ANEXOS.map(a=>a.id), 0) + 1;
    }
    if (savedLogs) LOGS = JSON.parse(savedLogs);
  } catch(e) { console.warn('LocalStorage load error:', e); }
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
            ${(p.tags || []).map(t => `<span class="tag-chip">#${t}</span>`).join('')}
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
  // Simulate compliance trend: base on current + small random variation seeded by month
  const approved = POPS.filter(p => p.docStatus === 'APROVADO').length;
  const total = POPS.length;
  const base = total ? Math.round(approved / total * 100) : 75;
  return months.map((m, i) => {
    // pseudo-deterministic variation
    const seed = (m.d.getMonth() * 7 + m.d.getFullYear()) % 10;
    const variation = (seed - 5) * 1.2;
    return { label: m.label, value: Math.max(40, Math.min(100, Math.round(base - (5 - i) * 2 + variation))) };
  });
}

/* ══════════════════════════════════════════
   FEATURE 5: TAGS SYSTEM
══════════════════════════════════════════ */
let _activeTagFilter = null;

function getAllTags() {
  const set = new Set();
  POPS.forEach(p => (p.tags || []).forEach(t => set.add(t)));
  return [...set].sort();
}

function setTagFilter(tag) {
  _activeTagFilter = tag;
  // update UI
  document.querySelectorAll('[data-tag-pill]').forEach(el => {
    el.classList.toggle('tag-filter-active', el.dataset.tagPill === (tag || '__all__'));
  });
  document.getElementById('tag-all')?.classList.toggle('tag-filter-active', !tag);
  renderPOPs();
}

function renderTagFilterBar() {
  const bar = document.getElementById('tag-filter-bar');
  if (!bar) return;
  const tags = getAllTags();
  const pills = tags.map(t => `<span class="tag-chip ${_activeTagFilter === t ? 'tag-filter-active' : ''}" data-tag-pill="${t}" onclick="setTagFilter('${t}')">#${t}</span>`).join('');
  bar.innerHTML = `
    <span style="font-size:var(--fs-xs);font-weight:700;color:var(--gray-soft);text-transform:uppercase;letter-spacing:.6px">🏷 Tags:</span>
    <span class="tag-chip ${!_activeTagFilter ? 'tag-filter-active' : ''}" data-tag-pill="__all__" id="tag-all" onclick="setTagFilter(null)">Todos</span>
    ${pills}
  `;
}

function tagsEditor(pop) {
  const tags = pop.tags || [];
  return `
    <div class="form-group">
      <label class="form-label">🏷 Tags</label>
      <div class="tags-input-wrap" id="tags-wrap-${pop.code}">
        ${tags.map(t => `<span class="tag-chip">#${t} <span class="tag-x" onclick="removeTagFromPOP('${pop.code}','${t}')">✕</span></span>`).join('')}
        <input class="tags-text-input" id="tags-input-${pop.code}" placeholder="Nova tag (Enter)" onkeydown="addTagFromInput(event,'${pop.code}')">
      </div>
    </div>
  `;
}

function addTagFromInput(e, code) {
  if (e.key !== 'Enter' && e.key !== ',') return;
  e.preventDefault();
  const input = document.getElementById(`tags-input-${code}`);
  const val = input.value.trim().toLowerCase().replace(/[^a-z0-9À-ú\-]/g, '');
  if (!val) return;
  const pop = POPS.find(p => p.code === code);
  if (!pop) return;
  if (!pop.tags) pop.tags = [];
  if (!pop.tags.includes(val)) {
    pop.tags.push(val);
    saveData();
    renderTagFilterBar();
    // re-render the tag wrap
    const wrap = document.getElementById(`tags-wrap-${code}`);
    if (wrap) {
      wrap.innerHTML = pop.tags.map(t => `<span class="tag-chip">#${t} <span class="tag-x" onclick="removeTagFromPOP('${code}','${t}')">✕</span></span>`).join('') +
        `<input class="tags-text-input" id="tags-input-${code}" placeholder="Nova tag (Enter)" onkeydown="addTagFromInput(event,'${code}')">`;
      document.getElementById(`tags-input-${code}`)?.focus();
    }
  } else {
    input.value = '';
  }
}

function removeTagFromPOP(code, tag) {
  const pop = POPS.find(p => p.code === code);
  if (!pop || !pop.tags) return;
  pop.tags = pop.tags.filter(t => t !== tag);
  saveData();
  renderTagFilterBar();
  const wrap = document.getElementById(`tags-wrap-${code}`);
  if (wrap) {
    wrap.innerHTML = pop.tags.map(t => `<span class="tag-chip">#${t} <span class="tag-x" onclick="removeTagFromPOP('${code}','${t}')">✕</span></span>`).join('') +
      `<input class="tags-text-input" id="tags-input-${code}" placeholder="Nova tag (Enter)" onkeydown="addTagFromInput(event,'${code}')">`;
  }
}

/* ══════════════════════════════════════════
   DATE HELPERS
══════════════════════════════════════════ */
function brToIso(br){
  if(!br||!br.includes('/'))return '';
  const [d,m,y]=br.split('/');
  return `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`;
}
function isoToBr(iso){
  if(!iso)return '';
  const [y,m,d]=iso.split('-');
  return `${d}/${m}/${y}`;
}

/* ══════════════════════════════════════════
   ANEXOS HELPERS
══════════════════════════════════════════ */
// Simulated DB of existing attachments
const ANEXOS_DB=[
  {id:'ANX001',name:'IT-AL-001 Instrução de Trabalho.pdf'},
  {id:'ANX002',name:'POP-CQ-Controle Qualidade Rev3.pdf'},
  {id:'ANX003',name:'Fluxograma Recebimento MP v2.pdf'},
  {id:'ANX004',name:'Checklist Auditoria Interna 2025.pdf'},
  {id:'ANX005',name:'Procedimento de Calibração EPI.pdf'},
];

function anexosEditorNew(){
  const opts=ANEXOS_DB.map(a=>`<option value="${a.id}">${a.name}</option>`).join('');
  return `
  <div class="form-group" style="margin-bottom:14px">
    <label class="form-label">📎 Este POP possui anexo?</label>
    <div style="display:flex;gap:10px;margin-top:6px">
      <button type="button" class="btn btn-outline btn-sm" id="new-anexo-sim" onclick="toggleAnexoNew('sim')" style="border-color:var(--border)">✅ Sim</button>
      <button type="button" class="btn btn-outline btn-sm" id="new-anexo-nao" onclick="toggleAnexoNew('nao')" style="background:var(--gray-pale)">❌ Não</button>
    </div>
    <input type="hidden" id="new-has-anexo" value="">
    <div id="new-anexo-content" style="display:none;margin-top:12px;padding:14px;background:var(--blue-bg);border-radius:var(--r);border-left:3px solid var(--blue)">
      <div style="font-size:var(--fs-sm);font-weight:700;margin-bottom:10px;color:var(--blue)">Selecione o tipo de anexo:</div>
      <div style="display:flex;gap:10px;margin-bottom:12px;flex-wrap:wrap">
        <button type="button" class="btn btn-outline btn-sm" id="new-anexo-db-btn" onclick="toggleAnexoType('new','db')">📂 Selecionar do Sistema</button>
        <button type="button" class="btn btn-outline btn-sm" id="new-anexo-upload-btn" onclick="toggleAnexoType('new','upload')">⬆️ Fazer Upload PDF</button>
      </div>
      <div id="new-anexo-db" style="display:none">
        <label class="form-label">Anexos disponíveis no sistema:</label>
        <select class="form-select" id="new-anexo-select">
          <option value="">— Selecione um arquivo —</option>
          ${opts}
        </select>
      </div>
      <div id="new-anexo-upload" style="display:none">
        <label class="form-label">Selecionar arquivo PDF:</label>
        <input type="file" accept=".pdf" class="form-input" id="new-anexo-file" style="padding:8px;cursor:pointer">
        <div style="font-size:var(--fs-xs);color:var(--gray-soft);margin-top:4px">Apenas arquivos PDF são aceitos</div>
      </div>
    </div>
  </div>`;
}

function anexosEditor(pop){
  const hasA=pop.hasAnexo;
  const opts=ANEXOS_DB.map(a=>`<option value="${a.id}" ${pop.anexoRef===a.id?'selected':''}>${a.name}</option>`).join('');
  const currentLabel=hasA?(pop.anexoRef?ANEXOS_DB.find(a=>a.id===pop.anexoRef)?.name||pop.anexoRef:pop.anexoFile||'Arquivo local'):'';
  return `
  <div class="form-group" style="margin-bottom:14px">
    <label class="form-label">📎 Este POP possui anexo?</label>
    ${hasA?`<div style="margin-top:4px;font-size:var(--fs-xs);color:var(--green);font-weight:600">✅ Atual: ${currentLabel}</div>`:''}
    <div style="display:flex;gap:10px;margin-top:8px">
      <button type="button" class="btn btn-sm ${hasA?'btn-primary':'btn-outline'}" id="ep-anexo-sim" onclick="toggleAnexoEp('sim')" style="${hasA?'':'border-color:var(--border)'}">✅ Sim</button>
      <button type="button" class="btn btn-sm ${!hasA?'btn-primary':'btn-outline'}" id="ep-anexo-nao" onclick="toggleAnexoEp('nao')" style="${!hasA?'':'background:var(--gray-pale)'}">❌ Não</button>
    </div>
    <input type="hidden" id="ep-has-anexo" value="${hasA?'sim':'nao'}">
    <div id="ep-anexo-content" style="display:${hasA?'block':'none'};margin-top:12px;padding:14px;background:var(--blue-bg);border-radius:var(--r);border-left:3px solid var(--blue)">
      <div style="font-size:var(--fs-sm);font-weight:700;margin-bottom:10px;color:var(--blue)">Selecione o tipo de anexo:</div>
      <div style="display:flex;gap:10px;margin-bottom:12px;flex-wrap:wrap">
        <button type="button" class="btn btn-outline btn-sm" id="ep-anexo-db-btn" onclick="toggleAnexoType('ep','db')">📂 Selecionar do Sistema</button>
        <button type="button" class="btn btn-outline btn-sm" id="ep-anexo-upload-btn" onclick="toggleAnexoType('ep','upload')">⬆️ Fazer Upload PDF</button>
      </div>
      <div id="ep-anexo-db" style="display:${pop.anexoRef?'block':'none'}">
        <label class="form-label">Anexos disponíveis no sistema:</label>
        <select class="form-select" id="ep-anexo-select">
          <option value="">— Selecione um arquivo —</option>
          ${opts}
        </select>
      </div>
      <div id="ep-anexo-upload" style="display:${pop.anexoFile&&!pop.anexoRef?'block':'none'}">
        <label class="form-label">Selecionar arquivo PDF:</label>
        <input type="file" accept=".pdf" class="form-input" id="ep-anexo-file" style="padding:8px;cursor:pointer">
        <div style="font-size:var(--fs-xs);color:var(--gray-soft);margin-top:4px">Apenas arquivos PDF são aceitos</div>
      </div>
    </div>
  </div>`;
}

function toggleAnexoNew(val){
  document.getElementById('new-has-anexo').value=val;
  const content=document.getElementById('new-anexo-content');
  content.style.display=val==='sim'?'block':'none';
  document.getElementById('new-anexo-sim').className='btn btn-sm '+(val==='sim'?'btn-primary':'btn-outline');
  document.getElementById('new-anexo-nao').className='btn btn-sm '+(val==='nao'?'btn-primary':'btn-outline');
}

function toggleAnexoEp(val){
  document.getElementById('ep-has-anexo').value=val;
  const content=document.getElementById('ep-anexo-content');
  content.style.display=val==='sim'?'block':'none';
  document.getElementById('ep-anexo-sim').className='btn btn-sm '+(val==='sim'?'btn-primary':'btn-outline');
  document.getElementById('ep-anexo-nao').className='btn btn-sm '+(val==='nao'?'btn-primary':'btn-outline');
}

function toggleAnexoType(prefix,type){
  document.getElementById(`${prefix}-anexo-db`).style.display=type==='db'?'block':'none';
  document.getElementById(`${prefix}-anexo-upload`).style.display=type==='upload'?'block':'none';
  document.getElementById(`${prefix}-anexo-db-btn`).className='btn btn-outline btn-sm'+(type==='db'?' btn-primary':'');
  document.getElementById(`${prefix}-anexo-upload-btn`).className='btn btn-outline btn-sm'+(type==='upload'?' btn-primary':'');
}

function getAnexoFromNew(){
  const hasAnexo=document.getElementById('new-has-anexo')?.value;
  if(hasAnexo==='sim'){
    const sel=document.getElementById('new-anexo-select');
    const fileInput=document.getElementById('new-anexo-file');
    if(sel&&sel.value) return {hasAnexo:true,anexoRef:sel.value,anexoFile:''};
    if(fileInput&&fileInput.files&&fileInput.files[0]) return {hasAnexo:true,anexoFile:fileInput.files[0].name,anexoRef:''};
    return {hasAnexo:true,anexoRef:'',anexoFile:''};
  }
  return {hasAnexo:false,anexoRef:'',anexoFile:''};
}

/* ══════════════════════════════════════════
   KEYBOARD SHORTCUTS
══════════════════════════════════════════ */
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){closeModal();closeConfirm();fecharRevisarAnexo();closeCmdPalette();}
  if((e.metaKey||e.ctrlKey)&&e.key==='k'){e.preventDefault();openCmdPalette();}
});