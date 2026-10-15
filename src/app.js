'use strict';
const D = window.POKEMON;
const $ = id => document.getElementById(id);
const KEY = 'pokebinder.local.0.10'; // Isolated from the stable 0.03 collection.
const APP_VERSION = '0.10';
const DEFAULT_LAYOUT = {columns:4, rows:3, pages:40};
const CARD_COLORS = ['', '#aaa98d','#dd9a65','#8cb8cf','#a2bb86','#d9c574','#9cbec4','#bb9077','#b4a0c1','#c0ad82','#a8b5c3','#bf9cbb','#b2bd7a','#b7ac8b','#a59abb','#a1a6c3','#aa9d91','#a4b7b0','#cfacbd'];
let owned = new Set(), selected = 1, tab = 'dex', binder = 1, sheet = 1;
let listPage = 1, filtered = [], storageOK = true, language = 'en';
let layout = {...DEFAULT_LAYOUT}, theme = 'light', toastTimer;
let printings = Object.create(null),referenceCollection=false;
const BM=window.BinderModel;
let binders=BM.legacy(),freePocketIndex=null,binderScope='dex';
const scopeViews={dex:null,free:null};
function scopeBinders(){return binders.map((b,i)=>({b,number:i+1})).filter(x=>x.b.mode===binderScope);}
function rememberScope(){if(currentBinder().mode===binderScope)scopeViews[binderScope]={id:currentBinder().id,page:sheet};}
function activateScope(mode){rememberScope();binderScope=mode;const items=scopeBinders(),saved=scopeViews[mode],target=items.find(x=>x.b.id===saved?.id)||items[0];if(target){binder=target.number;sheet=target.b.id===saved?.id?saved.page:1;}freePocketIndex=null;syncBinder();}

const currentBinder=()=>binders[binder-1];
const binderName=(number=binder)=>binders[number-1].name||t('binder',{number});
function syncBinder(){binder=Math.max(1,Math.min(binder,binders.length));layout={columns:currentBinder().columns,rows:currentBinder().rows,pages:currentBinder().pages};sheet=Math.max(1,Math.min(sheet,layout.pages));}

const printingImages = new Map();
const t = (key, values={}) => String(window.TRANSLATIONS[language][key] ?? window.TRANSLATIONS.en[key] ?? key).replace(/\{(\w+)\}/g, (_,name) => values[name] ?? `{${name}}`);
const slotsPerPage = (number=binder) => binders[number-1].columns * binders[number-1].rows;
const binderCapacity = (number=binder) => BM.capacity(binders[number-1]);
const binderCount = () => binders.length;
const primaryName = p => language === 'ja' ? p.ja : p.en;
const secondaryName = p => language === 'ja' ? p.en : p.ja;
const ALIASES={1:'бульбазавр бульбасавр булбасавр',2:'ивизавр',3:'венузавр',4:'чармандер',5:'чармелеон',6:'чаризард',7:'сквиртл сквиртл',8:'вартортл',9:'бластойз',25:'пикачу',26:'райчу',39:'джигглипуфф',52:'мяут',54:'псайдак',94:'генгар',129:'мэджикарп магикарп',130:'гьярадос гярадос',132:'дитто метамон метамоно',133:'иви',134:'вапореон',135:'джолтеон',136:'флареон',143:'снорлакс',149:'драгонайт',150:'мьюту',151:'мью',196:'эспеон',197:'амбреон',249:'лугия',250:'хо ох хо-ох',251:'селеби',282:'гардевуар',384:'рейкваза',448:'лукарио',658:'грениндзя',700:'сильвеон',778:'мимикью'};
const translit=s=>s.toLowerCase().replace(/tch|ch/g,'ч').replace(/sh/g,'ш').replace(/th/g,'т').replace(/ph/g,'ф').replace(/ee/g,'и').replace(/oo/g,'у').replace(/[a-z]/g,c=>({a:'а',b:'б',c:'к',d:'д',e:'е',f:'ф',g:'г',h:'х',i:'и',j:'дж',k:'к',l:'л',m:'м',n:'н',o:'о',p:'п',q:'к',r:'р',s:'с',t:'т',u:'у',v:'в',w:'в',x:'кс',y:'й',z:'з'}[c]));
const norm=s=>String(s).normalize('NFKC').toLowerCase().replace(/ё/g,'е').replace(/[\s.'’\-:#]/g,'');
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=id=>String(id).padStart(4,'0');
function position(id) {return BM.position(binders,id);}
function toast(message) {
  $('toast').textContent=message; $('toast').classList.add('show');
  clearTimeout(toastTimer); toastTimer=setTimeout(()=>$('toast').classList.remove('show'),5000);
}
function validLayout(value) {
  return value && ['columns','rows','pages'].every(key=>Number.isInteger(value[key]) && value[key]>=1 && value[key]<=(key==='pages'?200:6));
}
function validateBackup(data) {
  if (!data || ![1,2,3].includes(data.version) || !Array.isArray(data.owned) || data.owned.some(id=>!Number.isInteger(id)||id<1||id>D.length) || (data.layout!==undefined&&!validLayout(data.layout)) || (data.language!==undefined&&!['en','ja','ru'].includes(data.language)) || (data.theme!==undefined&&!['light','dark'].includes(data.theme))) throw Error(t('invalidBackup'));
  if(data.referenceCollection!==undefined&&typeof data.referenceCollection!=='boolean')throw Error(t('invalidBackup'));
  if(data.version===3){try{BM.validate(data.binders,window.TCGCatalog.validate);}catch{throw Error(t('invalidBackup'));}}
  if(data.printings!==undefined) {
    if(!data.printings||typeof data.printings!=='object'||Array.isArray(data.printings))throw Error(t('invalidBackup'));
    for(const [key,record] of Object.entries(data.printings)) {
      const id=Number(key);
      if(String(id)!==key||!Number.isInteger(id)||id<1||id>D.length||!window.TCGCatalog.validate(record,id))throw Error(t('invalidBackup'));
    }
  }
}
function snapshot() {
  return {app:'PokéBinder', appVersion:APP_VERSION, version:3, binders:JSON.parse(JSON.stringify(binders)), activeBinder:currentBinder().id, activePage:sheet, referenceCollection, exportedAt:new Date().toISOString(), owned:[...owned].sort((a,b)=>a-b), selected, language, theme, layout:{...layout},printings:{...printings}};
}
function applySnapshot(data, restoreSettings=true) {
  validateBackup(data); binders=data.version===3?JSON.parse(JSON.stringify(data.binders)):BM.legacy(data.layout||DEFAULT_LAYOUT); binder=Math.max(1,binders.findIndex(b=>b.id===data.activeBinder)+1);sheet=Number.isInteger(data.activePage)?Math.max(1,Math.min(currentBinder().pages,data.activePage)):1;freePocketIndex=null;binderScope=currentBinder().mode;scopeViews.dex=null;scopeViews.free=null;syncBinder();owned=new Set(data.owned);printings=Object.assign(Object.create(null),data.printings||{});
  if (Number.isInteger(data.selected)&&data.selected>=1&&data.selected<=D.length) selected=data.selected;
  if (restoreSettings) {
    referenceCollection=data.referenceCollection===true;$('referenceCollection').checked=referenceCollection;
    syncBinder();
    if (data.language) language=data.language;
    if (data.theme) theme=data.theme;
  }
}
function readState() {
  try { const value=localStorage.getItem(KEY)||localStorage.getItem('pokebinder.local.0.09')||localStorage.getItem('pokebinder.local.0.08')||localStorage.getItem('pokebinder.local.0.07')||localStorage.getItem('pokebinder.local.0.06'); if(value) applySnapshot(JSON.parse(value)); }
  catch(error) {storageOK=false; toast(t('readError'));}
}
function recoveryPoints() {
  try {const points=JSON.parse(localStorage.getItem(KEY+'.recovery')||'[]'); return Array.isArray(points)?points.filter(point=>{try{validateBackup(point);return true;}catch{return false;}}).slice(0,5):[];} catch {return [];}
}
function save() {
  try {
    const previous=localStorage.getItem(KEY), current=snapshot();
    if(previous) {
      const old=JSON.parse(previous); validateBackup(old);
      // Navigation and language switches do not displace collection recovery points.
      if(JSON.stringify(old.owned)!==JSON.stringify(current.owned)||JSON.stringify(old.printings||{})!==JSON.stringify(current.printings)||JSON.stringify(old.binders||[])!==JSON.stringify(current.binders)) {
        localStorage.setItem(KEY+'.recovery',JSON.stringify([old,...recoveryPoints()].slice(0,5)));
      }
    }
    localStorage.setItem(KEY,JSON.stringify(current)); storageOK=true;
  } catch(error) {storageOK=false; toast(t('saveError'));}
}
function updateOptions(id, entries) {
  const element=$(id), current=element.value;
  element.innerHTML=entries.map(([value,label])=>`<option value="${value}">${esc(label)}</option>`).join('');
  if(entries.some(([value])=>String(value)===String(current))) element.value=current;
}
function applyLanguage() {
  document.documentElement.lang=language; document.title=t('title'); $('language').value=language;
  document.querySelectorAll('[data-i18n]').forEach(element=>element.textContent=t(element.dataset.i18n, {total:D.length}));
  document.querySelectorAll('[data-i18n-aria]').forEach(element=>element.setAttribute('aria-label',t(element.dataset.i18nAria)));
  document.querySelectorAll('[data-i18n-placeholder]').forEach(element=>element.setAttribute('placeholder',t(element.dataset.i18nPlaceholder)));
  const words=window.TRANSLATIONS[language];
  updateOptions('generation',[['all',t('allGenerations')],...words.regions.slice(1).map((region,index)=>[index+1,`${index+1} · ${region}`])]);
  updateOptions('type',[['all',t('allTypes')],...words.types.slice(1).map((type,index)=>[index+1,type])]);
  updateLayoutControls();
  applyTheme();
}
function applyTheme() {
  document.documentElement.dataset.theme=theme;
  $('themeToggle').textContent=theme==='dark'?'☀':'☾';
  $('themeToggle').setAttribute('aria-label',t(theme==='dark'?'switchLight':'switchDark'));
  $('themeToggle').setAttribute('title',t(theme==='dark'?'switchLight':'switchDark'));
  $('themeToggle').setAttribute('aria-pressed',String(theme==='dark'));
  $('themePreference').value=theme;
}
function setTheme(value) {
  if(!['light','dark'].includes(value))return;
  theme=value;applyTheme();save();
}
function updateLayoutControls() {
  syncBinder();updateOptions('binder',scopeBinders().map(({number})=>[number,binderName(number)]));
  updateOptions('sheet',Array.from({length:layout.pages},(_,i)=>[i+1,i+1]));$('pageTotal').textContent=layout.pages;
  document.querySelectorAll('[data-i18n="capacity"]').forEach(el=>el.textContent=t('capacity',{...layout,capacity:binderCapacity()}));
  document.documentElement.style.setProperty('--binder-columns',layout.columns);
  $('binderShell').style.setProperty('--binder-cover',currentBinder().color);
}
function setLanguage(value) {
  if(!window.TRANSLATIONS[value]) return;
  language=value; applyLanguage(); save(); render(); updateBackupStatus();
}
const searchable=D.map(p=>norm(`${p.en} ${p.ja} ${translit(p.en)} ${ALIASES[p.id]||''}`));
function matches(p) {
  const query=norm($('search').value.trim()), status=$('status').value, generation=$('generation').value, type=$('type').value;
  const match=!query||(/^\d+$/.test(query)?p.id===Number(query):searchable[p.id-1].includes(query));
  return match&&(status==='all'||owned.has(p.id)===(status==='owned'))&&(generation==='all'||p.gen===Number(generation))&&(type==='all'||p.types.includes(Number(type)));
}
function printingNumber(record) {
  return record.collectorNumber?'#'+record.collectorNumber:record.provider==='pokemon-jp'?t('catalogId',{id:record.cardId.slice(3)}):'';
}
function tile(p,reference=false) {
  const yes=!reference&&owned.has(p.id), name=primaryName(p);
  const record=yes&&printings[p.id];
  if(record?.image)return `<article class="poke exactPrinting ${p.id===selected?'selected':''} owned"><button class="check" data-mark="${p.id}" aria-label="${esc(t('removeMark',{name}))}" aria-pressed="true">✓</button><button class="open" data-open="${p.id}" aria-label="${esc(t('openPokemon',{name,number:p.id}))}"><span class="printingArt"><img class="printingFront" src="${esc(printingImage(p.id))}" data-fallback="${p.image}" alt="${esc(record.name+' · '+record.setName+' '+printingNumber(record))}" loading="lazy"></span>${printingCaption(p,record)}</button></article>`;
  return `<article class="poke ${yes?'owned':''} ${p.id===selected?'selected':''}" style="--card-color:${CARD_COLORS[p.types[0]]}">${reference?'':`<button class="check" data-mark="${p.id}" aria-label="${esc(t(yes?'removeMark':'addMark',{name}))}" aria-pressed="${yes}">${yes?'✓':'+'}</button>`}<button class="open" data-open="${p.id}" aria-label="${esc(t('openPokemon',{name,number:p.id}))}"><span class="number">#${num(p.id)}</span><span class="cardArt"><img src="${p.image}" alt="${esc(name)}" loading="lazy"></span><span class="cardNames"><span class="name">${esc(name)}</span><span class="ja">${esc(secondaryName(p))}</span></span><span class="cardType">${esc(window.TRANSLATIONS[language].types[p.types[0]])}</span></button></article>`;
}
function renderCatalog() {
  filtered=D.filter(matches); const pages=Math.max(1,Math.ceil(filtered.length/60)); listPage=Math.min(listPage,pages);
  $('catalog').innerHTML=filtered.slice((listPage-1)*60,listPage*60).map(p=>tile(p,!referenceCollection)).join('')||`<p class="noResults">${esc(t('noResults'))}</p>`;
  $('resultCount').textContent=t('resultCount',{count:filtered.length}); $('catalogPage').textContent=`${listPage} / ${pages}`;
  $('catalogPrev').disabled=listPage===1; $('catalogNext').disabled=listPage===pages;
}
function miniGrid(p) {
 const loc=position(p.id),b=binders[loc.binder-1],slots=b.columns*b.rows,start=BM.range(binders,loc.binder-1).start+(loc.page-1)*slots;
 return Array.from({length:slots},(_,i)=>{const id=start+i;if(id>D.length)return '<span class="miniEmpty" aria-hidden="true"></span>';const yes=owned.has(id);return '<button data-open="'+id+'" class="miniCard '+(yes?'owned':'')+' '+(yes&&printings[id]?.image?'exactMini':'')+' '+(id===p.id?'selected':'')+'" aria-label="'+esc(t('pocketLabel',{slot:i+1,name:primaryName(D[id-1]),status:yes?t('insertedSuffix'):''}))+'"><span>'+num(id)+'</span><img src="'+esc(printingImage(id))+'" data-fallback="'+D[id-1].image+'" alt="" loading="lazy">'+(yes?'<b>✓</b>':'')+'</button>';}).join('');
}
function renderDetail() {
  if(tab==='binder'&&currentBinder().mode==='free'){if(window.BinderUI)window.BinderUI.renderDetail();else $('detail').innerHTML='';return;}
  const p=D[selected-1], location=position(p.id), yes=owned.has(p.id), words=window.TRANSLATIONS[language];
  if(tab==='dex'&&!referenceCollection){renderReference(p,words);return;}
  $('detail').innerHTML=`<div class="detailTop"><span>№ ${num(p.id)}</span><span class="statusPill ${yes?'yes':''}">${esc(t(yes?'inBinder':'notInserted'))}</span></div><div class="portrait ${owned.has(p.id)&&printings[p.id]?.image?'exactPortrait':''} "><img src="${esc(printingImage(p.id))}" data-fallback="${p.image}" alt="${esc(primaryName(p))}"></div><div class="detailBody"><h2>${esc(primaryName(p))}</h2><p class="jname">${esc(secondaryName(p))}</p><div class="types">${p.types.map(type=>`<span class="type">${words.types[type]}</span>`).join('')}</div><div class="facts"><div>${t('generation')}<strong>${p.gen} · ${words.regions[p.gen]}</strong></div><div>${t('height')}<strong>${p.height} ${t('meters')}</strong></div><div>${t('weight')}<strong>${p.weight} ${t('kilograms')}</strong></div></div>${renderPrintingSummary(p.id)}<div class="location"><p class="eyebrow">${t('collectionLocation')}</p><strong>${esc(t('namedLocation',{...location,name:binderName(location.binder)}))}</strong><p>${t('rowColumn',{row:location.row,column:location.col})} · <a href="#" id="showLocation">${t('showPage')}</a></p><div class="miniBinder" style="--binder-columns:${binders[location.binder-1].columns};--binder-cover:${binders[location.binder-1].color}"><div class="miniSpine" aria-hidden="true"><i></i><i></i><i></i></div><div class="miniGrid">${miniGrid(p)}</div></div></div><button id="markSelected" class="mark ${yes?'yes':''}" aria-pressed="${yes}">${t(yes?'markRemoved':'markInserted')}</button><div class="detailNav"><button id="prevPokemon" ${selected===1?'disabled':''}>← № ${num(Math.max(1,selected-1))}</button><button id="nextPokemon" ${selected===D.length?'disabled':''}>№ ${num(Math.min(D.length,selected+1))} →</button></div><a class="official" href="https://zukan.pokemon.co.jp/detail/${num(p.id)}" target="_blank" rel="noopener">${t('officialLink')}</a><p class="keys">${t('keys')}</p></div>`;
}
function binderSummary(number) {
 const b=binders[number-1],slots=slotsPerPage(number),r=BM.range(binders,number-1),free=b.mode==='free',total=free?binderCapacity(number):Math.max(0,r.end-r.start+1);
 const count=free?Object.keys(b.slots).length:[...owned].filter(id=>id>=r.start&&id<=r.end).length;
 let complete=0;for(let page=0;page<b.pages;page++){const start=page*slots,n=free?slots:Math.max(0,Math.min(slots,total-start));if(n&&Array.from({length:n},(_,j)=>free?!!b.slots[start+j]:owned.has(r.start+start+j)).every(Boolean))complete++;}
 return {...r,total,count,complete,percent:total?count/total*100:0};
}
function renderStats() {
 const percent=(owned.size/D.length*100).toFixed(1);$('total').textContent=owned.size;$('remainingText').textContent=t('remaining',{percent,count:D.length-owned.size});$('overallBar').style.width=percent+'%';
 $('collectionSummary').innerHTML='<p class="eyebrow">'+t('collectionSummary')+'</p><div class="summaryCards">'+binders.map((b,i)=>{if(b.mode!==(tab==='dex'?'dex':binderScope))return '';const info=binderSummary(i+1);return '<button class="summaryCard" data-binder="'+(i+1)+'" style="--cover:'+b.color+'"><span class="summaryRing" style="--fill:'+info.percent+'%"><b>'+Math.round(info.percent)+'%</b></span><span><strong>'+esc(binderName(i+1))+'</strong><span>'+t('binderSummary',info)+'</span><small>'+t(b.mode==='free'?'freeMode':'dexMode')+' · '+b.columns+' × '+b.rows+' · '+t('completedPages',{count:info.complete})+'</small></span></button>';}).join('')+'</div>';
}
function renderBinder() {
 updateLayoutControls();const empty=!scopeBinders().length;$('binderPanel').classList.toggle('emptyBinderGroup',empty);$('binder').disabled=empty;$('editBinder').disabled=empty;$('binderHeadingTitle').textContent=t(binderScope==='free'?'freeBinders':'dexBinders');$('newBinder').textContent=t(binderScope==='free'?'newFreeBinder':'newDexBinder');if(empty){$('binderIntro').textContent=t('noFreeBinders');$('detail').innerHTML='<h2>'+t('freeBinders')+'</h2><p>'+t('noFreeBinders')+'</p>';return;}const b=currentBinder(),info=binderSummary(binder),slots=slotsPerPage(),free=b.mode==='free';
 $('binder').value=binder;$('sheet').value=sheet;
 $('binderIntro').textContent=t(free?'freeIntro':'mixedIntro');
 $('binderHint').textContent=t(free?'freeHint':'binderHint');
 $('binderStats').innerHTML='<div class="binderProgress"><div><strong>'+esc(binderName())+' · '+t(free?'freeMode':'dexMode')+'</strong><span>'+t('binderProgress',{count:info.count,total:info.total,capacity:binderCapacity()})+'</span></div><div class="progress"><i style="width:'+info.percent+'%"></i></div></div>';
 $('pageMap').innerHTML=Array.from({length:b.pages},(_,i)=>{const start=i*slots,n=free?slots:Math.max(0,Math.min(slots,info.total-start));let done=0;const pockets=Array.from({length:slots},(_,j)=>{const valid=free||start+j<info.total,filled=free?!!b.slots[start+j]:owned.has(info.start+start+j);if(valid&&filled)done++;return '<i class="'+(!valid?'unused':filled?'filled':'')+'"></i>';}).join('');return '<button data-sheet="'+(i+1)+'" class="'+(n&&done===n?'complete':done?'partial':'')+' '+(i+1===sheet?'active':'')+'" aria-label="'+esc(t('pageProgress',{page:i+1,count:done,total:n}))+'"><span>'+(i+1)+'<small>'+done+'/'+n+'</small></span><span class="pagePockets">'+pockets+'</span></button>';}).join('');
 const offset=(sheet-1)*slots;
 $('binderGrid').innerHTML=Array.from({length:slots},(_,i)=>{const index=offset+i;if(free){const entry=b.slots[index];return '<div class="pocket">'+(window.BinderUI?window.BinderUI.pocket(index,entry):'')+'</div>';}const p=D[info.start+index-1];return p&&index<info.total?'<div class="pocket">'+tile(p)+'</div>':'<div class="emptySlot"><span>'+t('freePocket')+'</span></div>';}).join('');
 $('binderLabel').textContent=binderName();$('pageCaption').textContent=t('pageCaption',{page:sheet,pages:b.pages});
 const group=scopeBinders();$('pagePrev').disabled=binder===group[0].number&&sheet===1;$('pageNext').disabled=binder===group[group.length-1].number&&sheet===b.pages;
}
function render() {renderWorkspaceIdentity();syncBinder();renderStats();renderDetail();if(tab==='dex')renderCatalog();else renderBinder();}
function select(id) {
  if(!Number.isInteger(id)||id<1||id>D.length)return;
  selected=id;
  freePocketIndex=null;if(tab==='binder') {const location=position(id);binder=location.binder;sheet=location.page;syncBinder();}
  history.replaceState(null,'','#'+id); save(); render();
}
function toggle(id) {
  if(!Number.isInteger(id)||id<1||id>D.length)return;
  if(owned.has(id))owned.delete(id);else owned.add(id);
  save();render();if(storageOK)toast(t(owned.has(id)?'cardMarked':'cardUnmarked',{name:primaryName(D[id-1])}));
}
function switchTab(value) {
  if(value==='free'){activateScope('free');value='binder';}else if(value==='dex'){activateScope('dex');}else if(currentBinder().mode!==binderScope){binderScope=currentBinder().mode;}
  tab=value;if(tab==='dex')$('status').value='all';updateLayoutControls(); $('dexPanel').hidden=value!=='dex'; $('binderPanel').hidden=value!=='binder';
  document.querySelectorAll('[data-tab]').forEach(button=>button.classList.toggle('active',button.dataset.tab===(value==='binder'&&binderScope==='free'?'free':value)));render();
}
function showLocation() {rememberScope();binderScope='dex';const location=position(selected);binder=location.binder;sheet=location.page;switchTab('binder');}
function moveSheet(delta) {
 const group=scopeBinders(),index=group.findIndex(x=>x.number===binder);if(index<0)return;
 if(delta>0){if(sheet<currentBinder().pages)sheet++;else if(index<group.length-1){binder=group[index+1].number;sheet=1;}}
 else if(sheet>1)sheet--;else if(index>0){binder=group[index-1].number;sheet=currentBinder().pages;}
 freePocketIndex=null;syncBinder();save();render();
}
function download(content,name,type) {
  const url=URL.createObjectURL(new Blob([content],{type})), anchor=document.createElement('a');
  anchor.href=url;anchor.download=name;anchor.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function exportBackup() {
  download(JSON.stringify(snapshot(),null,2),`pokebinder-${new Date().toISOString().slice(0,10)}.json`,'application/json');
  try{localStorage.setItem(KEY+'.lastBackup',new Date().toISOString());}catch{}
  updateBackupStatus();
}
function updateBackupStatus() {
  let date;try{date=localStorage.getItem(KEY+'.lastBackup');}catch{}
  $('backupStatus').textContent=date?t('lastBackup',{date:new Date(date).toLocaleString(language)}):t('neverBackedUp');
  $('recover').disabled=recoveryPoints().length===0;
}
function draftLayout() {return {columns:Number($('layoutColumns').value),rows:Number($('layoutRows').value),pages:Number($('layoutPages').value)};}
function updateLayoutPreview() {
 const draft=draftLayout();$('layoutPreview').textContent=validLayout(draft)?t('individualPreview',{slots:draft.columns*draft.rows,capacity:draft.columns*draft.rows*draft.pages}):t('invalidLayout');
}
function openSettings() {
  $('themePreference').value=theme;$('referenceCollection').checked=referenceCollection;updateBackupStatus();$('settingsDialog').showModal();
}
function openBinderSettings() {
  if(!scopeBinders().length){toast(t('noFreeBinders'));return;}
  syncBinder();window.BinderUI?.settings();
  $('layoutColumns').value=layout.columns; $('layoutRows').value=layout.rows; $('layoutPages').value=layout.pages;
  const preset=`${layout.columns}x${layout.rows}`;
  $('layoutPreset').value=['4x3','3x3','2x2','4x4'].includes(preset)?preset:'custom';
  updateLayoutPreview();$('binderSettingsDialog').showModal();
}
function applyLayout(value) {
 if(!validLayout(value))throw Error(t('invalidLayout'));
 try{BM.resize(currentBinder(),value);}catch{throw Error(t('occupiedResize'));}
 BM.ensureCoverage(binders);syncBinder();updateLayoutControls();save();render();
}
readState();activateScope('dex');
const hash=Number(location.hash.slice(1));if(Number.isInteger(hash)&&hash>=1&&hash<=D.length)selected=hash;
applyLanguage();
document.addEventListener('click',event=>{
  const mark=event.target.closest('[data-mark]'),open=event.target.closest('[data-open]'),page=event.target.closest('[data-sheet]'),section=event.target.closest('[data-tab]'),summary=event.target.closest('[data-binder]');
  if(mark)toggle(Number(mark.dataset.mark));
  else if(open)select(Number(open.dataset.open));
  else if(page){sheet=Number(page.dataset.sheet);renderBinder();}
  else if(section){if(section.dataset.tab==='binder')activateScope('dex');switchTab(section.dataset.tab);}
  else if(summary){rememberScope();binder=Number(summary.dataset.binder);binderScope=currentBinder().mode;sheet=1;switchTab('binder');}
  else if(event.target.id==='markSelected')toggle(selected);
  else if(event.target.id==='prevPokemon')select(selected-1);
  else if(event.target.id==='nextPokemon')select(selected+1);
  else if(event.target.id==='showLocation'){event.preventDefault();showLocation();}
});
['search','status','generation','type'].forEach(id=>$(id).addEventListener(id==='search'?'input':'change',()=>{listPage=1;renderCatalog();}));
$('language').onchange=()=>setLanguage($('language').value);
$('themeToggle').onclick=()=>setTheme(theme==='dark'?'light':'dark');
$('referenceCollection').onchange=()=>{referenceCollection=$('referenceCollection').checked;if(!referenceCollection)$('status').value='all';save();render();};
$('themePreference').onchange=()=>setTheme($('themePreference').value);
$('catalogPrev').onclick=()=>{listPage--;renderCatalog();};$('catalogNext').onclick=()=>{listPage++;renderCatalog();};
$('nextMissing').onclick=()=>{
  const candidates=filtered.filter(p=>!owned.has(p.id)), p=candidates.find(p=>p.id>selected)||candidates[0];
  if(p){select(p.id);listPage=Math.floor(filtered.findIndex(x=>x.id===p.id)/60)+1;renderCatalog();}else toast(t('allComplete'));
};
$('binder').onchange=()=>{binder=Number($('binder').value);sheet=1;freePocketIndex=null;syncBinder();save();render();};$('sheet').onchange=()=>{sheet=Number($('sheet').value);freePocketIndex=null;save();render();};
$('pagePrev').onclick=()=>moveSheet(-1);$('pageNext').onclick=()=>moveSheet(1);
$('export').onclick=exportBackup;$('backupNow').onclick=exportBackup;$('import').onclick=()=>$('importFile').click();
$('importFile').onchange=async()=>{
  const file=$('importFile').files[0];if(!file)return;
  try {
    if(file.size>20000000)throw Error(t('fileTooLarge'));
    const backup=JSON.parse(await file.text());validateBackup(backup);
    if(!confirm(t('restoreConfirm',{count:new Set(backup.owned).size,current:owned.size})))return;
    applySnapshot(backup);applyLanguage();save();render();warmPrintingImages();if(storageOK)toast(t('restored'));
  } catch(error){toast(t('restoreError',{error:error.message}));}
  finally{$('importFile').value='';}
};
$('closeBinderSettings').onclick=()=>$('binderSettingsDialog').close();
$('settings').onclick=openSettings;$('closeSettings').onclick=()=>$('settingsDialog').close();
$('layoutPreset').onchange=()=>{
  const preset=$('layoutPreset').value;if(preset!=='custom'){const [columns,rows]=preset.split('x').map(Number);$('layoutColumns').value=columns;$('layoutRows').value=rows;}
  updateLayoutPreview();
};
['layoutColumns','layoutRows','layoutPages'].forEach(id=>$(id).addEventListener('input',()=>{if(id!=='layoutPages')$('layoutPreset').value='custom';updateLayoutPreview();}));
$('settingsForm').onsubmit=event=>{
  event.preventDefault();try{window.BinderUI.saveSettings(draftLayout());$('binderSettingsDialog').close();if(storageOK)toast(t('settingsSaved'));}catch(error){toast(error.message);}
};
$('recover').onclick=()=>{
  const points=recoveryPoints(), previous=points[0];if(!previous){toast(t('noRecovery'));return;}
  if(!confirm(t('recoveryConfirm',{count:new Set(previous.owned).size})))return;
  try {
    applySnapshot(previous);applyLanguage();
    // Consume the recovery point without replacing it with the state just undone.
    localStorage.setItem(KEY,JSON.stringify(snapshot()));localStorage.setItem(KEY+'.recovery',JSON.stringify(points.slice(1)));
    render();warmPrintingImages();updateBackupStatus();toast(t('recovered'));
  } catch{toast(t('recoveryError'));}
};
document.addEventListener('keydown',event=>{
  if($('cardPicker')?.open||$('binderCreateDialog')?.open||$('freePocketDialog')?.open||$('settingsDialog').open||$('binderSettingsDialog').open||event.ctrlKey||event.metaKey||event.altKey||/INPUT|SELECT|TEXTAREA|BUTTON|A/.test(event.target.tagName))return;
  if(event.key==='ArrowRight'){event.preventDefault();select(selected+1);}
  else if(event.key==='ArrowLeft'){event.preventDefault();select(selected-1);}
  else if(event.code==='Space'&&(tab==='binder'&&binderScope==='dex'||tab==='dex'&&referenceCollection)){event.preventDefault();toggle(selected);}
  else if(event.key==='/'){event.preventDefault();switchTab('dex');$('search').focus();}
});
window.addEventListener('hashchange',()=>{const id=Number(location.hash.slice(1));if(id>=1&&id<=D.length)select(id);});
window.addEventListener('storage',event=>{if(event.key===KEY){readState();applyLanguage();render();warmPrintingImages();}});
render();



function printingImage(id) {
  const record=owned.has(id)&&printings[id];
  return record?.image?(printingImages.get(record.image)||record.image):D[id-1].image;
}
function variantLabel(value) {return t('variant_'+value)===('variant_'+value)?value:t('variant_'+value);}
function renderPrintingSummary(id) {
  const record=printings[id];
  return `<section class="printingSummary"><div class="printingHeading"><strong>${t('exactCard')}</strong><span>${t('optional')}</span></div>${record?`<p><strong>${esc(record.name)}</strong><br>${esc(record.setName)} · ${esc(printingNumber(record))}<br><small>${esc(record.cardLanguage.toUpperCase())} · ${esc(variantLabel(record.variant))}${record.firstEdition?' · 1st Edition':''}</small></p>`:`<p>${t('exactCardHint')}</p>`}<div><button data-choose-printing="${id}">${t(record?'changeCard':'chooseCard')}</button>${record?`<button data-clear-printing="${id}">${t('clearCardLink')}</button>`:''}</div></section>`;
}
function assignPrinting(id,record) {
  if(!window.TCGCatalog.validate(record,id))throw Error(t('invalidCard'));
  printings[id]={...record};owned.add(id);save();render();
  if(storageOK)toast(t('cardAssigned'));
  window.TCGCatalog.artwork(record,true).then(url=>{if(url){printingImages.set(record.image,url);render();}}).catch(()=>{});
}
function clearPrinting(id) {
  delete printings[id];save();render();if(storageOK)toast(t('cardLinkCleared'));
}
async function warmPrintingImages() {
  let changed=false;
  await Promise.all(Object.values(printings).concat(binders.filter(b=>b.mode==='free').flatMap(b=>Object.values(b.slots).map(entry=>entry.printing).filter(Boolean))).filter(record=>record.image&&!printingImages.has(record.image)).map(async record=>{try{const url=await window.TCGCatalog.artwork(record);if(url){printingImages.set(record.image,url);changed=true;}}catch{}}));
  if(changed)render();
}
// Artwork is optional: preserve the saved printing even if its image cannot load.
document.addEventListener('error',event=>{
  const image=event.target;if(image.tagName!=='IMG'||!image.dataset.fallback||image.dataset.failed)return;
  image.dataset.failed='true';image.src=image.dataset.fallback;
  image.closest('.exactPrinting')?.classList.add('artworkUnavailable');
  image.closest('.exactMini')?.classList.remove('exactMini');
},true);
warmPrintingImages();

function printingCaption(p,record){return '<span class="printingDexNumber">'+(p?'№ '+num(p.id):'')+'</span><span class="printingCaption"><strong>' +esc(p?primaryName(p):record.name)+'</strong><small>'+esc(p?secondaryName(p):'')+'</small><span>'+esc(record.setId||record.setName)+' · '+esc(printingNumber(record))+'</span></span>';}
function renderReference(p,words){
 $('detail').innerHTML='<div class="detailTop"><span>№ '+num(p.id)+'</span><span class="referenceTag">'+t('reference')+'</span></div><div class="portrait"><img src="'+esc(p.image)+'" alt="'+esc(primaryName(p))+'"></div><div class="detailBody"><h2>'+esc(primaryName(p))+'</h2><p class="jname">'+esc(secondaryName(p))+'</p><div class="types">'+p.types.map(type=>'<span class="type">'+words.types[type]+'</span>').join('')+'</div><div class="facts"><div>'+t('generation')+'<strong>'+p.gen+' · '+words.regions[p.gen]+'</strong></div><div>'+t('height')+'<strong>'+p.height+' '+t('meters')+'</strong></div><div>'+t('weight')+'<strong>'+p.weight+' '+t('kilograms')+'</strong></div></div><div class="detailNav"><button id="prevPokemon" '+(selected===1?'disabled':'')+'>← № '+num(Math.max(1,selected-1))+'</button><button id="nextPokemon" '+(selected===D.length?'disabled':'')+'>№ '+num(Math.min(D.length,selected+1))+' →</button></div><a class="official" href="https://zukan.pokemon.co.jp/detail/'+num(p.id)+'" target="_blank" rel="noopener">'+t('officialLink')+'</a></div>';
}
function renderWorkspaceIdentity(){const reference=tab==='dex',pure=reference&&!referenceCollection;$('referenceCollection').checked=referenceCollection;document.documentElement.dataset.workspace=pure?'reference':'collection';$('collectionSummary').hidden=pure;$('status').hidden=pure;$('nextMissing').hidden=pure;$('overallSummary').hidden=pure;$('referenceBanner').hidden=!reference;$('capacityLabel').hidden=false;$('capacityLabel').style.visibility=reference?'hidden':'visible';$('capacityLabel').setAttribute('aria-hidden',String(reference));for(const [id,key] of [['heroEyebrow','eyebrow'],['heroHeading','heading'],['heroAccent','headingAccent'],['heroIntro','intro']])$(id).textContent=t(reference?'reference_'+key:key);}
