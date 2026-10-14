const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const elements=new Map(),storage=new Map(),listeners=new Map();
function element(id){if(!elements.has(id))elements.set(id,{id,value:['status','generation','type'].includes(id)?'all':'',innerHTML:'',textContent:'',hidden:false,style:{},disabled:false,files:[],dataset:{},setAttribute(){},showModal(){this.open=true;},close(){this.open=false;},classList:{add(){},remove(){},toggle(){}},add(){},focus(){},click(){},addEventListener(type,fn){listeners.set(id+':'+type,fn);}});return elements.get(id);}
const c={console,window:{addEventListener(){}},document:{getElementById:element,documentElement:{lang:"",dataset:{},style:{setProperty(){}}},querySelectorAll:()=>[],addEventListener(type,fn){listeners.set(type,fn);}},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},location:{hash:''},history:{replaceState(){}},Option:function(){},URL,Blob,setTimeout:()=>0,clearTimeout(){},confirm:()=>true};
vm.createContext(c);vm.runInContext(fs.readFileSync(path.join(__dirname,'data.js'),'utf8'),c);vm.runInContext(fs.readFileSync(path.join(__dirname,'i18n.js'),'utf8'),c);vm.runInContext(fs.readFileSync(path.join(__dirname,'app.js'),'utf8'),c);
const run=s=>vm.runInContext(s,c);
for(const [id,binder,page,slot] of [[1,1,1,1],[12,1,1,12],[13,1,2,1],[480,1,40,12],[481,2,1,1],[960,2,40,12],[961,3,1,1],[1025,3,6,5]])assert.equal(run(`JSON.stringify(position(${id}))`),JSON.stringify({binder,page,slot,row:Math.floor((slot-1)/4)+1,col:(slot-1)%4+1}));
assert.equal(run('D.length'),1025);assert.equal(run('new Set(D.map(p=>p.id)).size'),1025);
for(const p of c.window.POKEMON){assert(p.en&&p.ja&&p.gen);if(process.argv.includes('--skip-images'))continue;const image=fs.readFileSync(path.join(__dirname,p.image));assert(image.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])),`Invalid PNG ${p.id}`);}
for(const [q,id] of [['#0025',25],['pikachu',25],['ピカチュウ',25],['пикачу',25],['бульбазавр',1],['Pecharunt',1025]]){element('search').value=q;run('renderCatalog()');assert.equal(run('filtered[0].id'),id,q);}
element('search').value='';run('toggle(25)');assert(run('owned.has(25)'));assert.deepEqual(JSON.parse(storage.get('pokebinder.v1')).owned,[25]);run('owned.clear(); readState()');assert(run('owned.has(25)'),'Persistence reload');
element('status').value='owned';run('renderCatalog()');assert.equal(run('filtered.length'),1);assert.equal(run('filtered[0].id'),25);
element('status').value='missing';run('renderCatalog()');assert.equal(run('filtered.length'),1024);
element('status').value='all';element('generation').value='9';run('renderCatalog()');assert(run('filtered.every(p=>p.gen===9)'));
element('generation').value='all';element('type').value='5';run('renderCatalog()');assert(run('filtered.every(p=>p.types.includes(5))'));
element('type').value='all';run('binder=1;sheet=40;moveSheet(1)');assert.equal(run('binder'),2);assert.equal(run('sheet'),1);run('moveSheet(-1)');assert.equal(run('binder'),1);assert.equal(run('sheet'),40);
run('select(1025); showLocation()');assert.equal(run('binder'),3);assert.equal(run('sheet'),6);assert.equal((element('binderGrid').innerHTML.match(/class="emptySlot"/g)||[]).length,7);
run('select(0)');assert.equal(run('selected'),1025);run('select(1026)');assert.equal(run('selected'),1025);
for(const invalid of [{version:1,owned:[1026]},{version:1,owned:['25']},{version:2,owned:[]},{version:1,owned:[-1]},{}]){assert.throws(()=>run('validateBackup('+JSON.stringify(invalid)+')'));}
console.log('BASE PASS: 1025 unique species; artwork checks '+(process.argv.includes('--skip-images')?'skipped':'passed')+'; Japanese/English/Russian/number search; filters; mark and persisted reload; binder boundaries; final partial page; backup validation.');

// Interface translation coverage and saved-language behavior.
assert.equal(run('language'),'en');
const keys=Object.keys(c.window.TRANSLATIONS.en).sort();
for(const locale of ['en','ja','ru']) {
  assert.deepEqual(Object.keys(c.window.TRANSLATIONS[locale]).sort(),keys);
  run(`setLanguage('${locale}')`);
  assert.equal(run('language'),locale);
  assert.equal(c.document.documentElement.lang,locale);
  assert(run('owned.has(25)'));
  assert.equal(JSON.parse(storage.get('pokebinder.v1')).language,locale);
  assert(!element('detail').innerHTML.includes('undefined'));
  assert(!element('detail').innerHTML.match(/\{\w+\}/));
  for(const [query,id] of [['ピカチュウ',25],['пикачу',25],['Pikachu',25]]) {
    element('search').value=query;run('renderCatalog()');assert.equal(run('filtered[0].id'),id);
  }
}
run("setLanguage('ja'); select(25)");assert(element('detail').innerHTML.includes('<h2>ピカチュウ</h2>'));
run("setLanguage('en'); select(25)");assert(element('detail').innerHTML.includes('<h2>Pikachu</h2>'));
// Old backups keep working; new backups retain layout and language.
run('validateBackup({version:1,owned:[1,25]})');
for(const [columns,rows,pages] of [[3,3,40],[2,2,40],[4,4,40],[6,2,20],[1,1,1],[6,6,200],[4,3,40]]) {
  run(`applyLayout({columns:${columns},rows:${rows},pages:${pages}})`);
  assert(run('owned.has(25)'));
  assert.equal(run('binderCapacity()'),columns*rows*pages);
  assert.equal(run('binderCount()'),Math.ceil(1025/(columns*rows*pages)));
  const capacity=columns*rows*pages;
  if(capacity<1025) {const location=JSON.parse(run(`JSON.stringify(position(${capacity+1}))`));assert.equal(location.binder,2);assert.equal(location.page,1);assert.equal(location.slot,1);}
  run('select(1025);showLocation()');
  assert.equal((element('binderGrid').innerHTML.match(/class="pocket"/g)||[]).length,((1025-1)%(columns*rows))+1);
  const backup=JSON.parse(run('JSON.stringify(snapshot())'));
  assert.deepEqual(backup.layout,{columns,rows,pages});
}
for(const value of [{columns:0,rows:3,pages:40},{columns:4,rows:7,pages:40},{columns:4,rows:3,pages:201},{columns:4.5,rows:3,pages:40}])assert.throws(()=>run(`applyLayout(${JSON.stringify(value)})`));
// Recovery snapshots include layout/marks, capped at five; navigation does not displace them.
run('toggle(2);toggle(3);toggle(4);toggle(5);toggle(6);toggle(7)');assert.equal(run('recoveryPoints().length'),5);
const recoveryBefore=storage.get('pokebinder.v1.recovery');run('select(300);setLanguage("ru")');assert.equal(storage.get('pokebinder.v1.recovery'),recoveryBefore);
const previous=JSON.parse(recoveryBefore)[0];element('recover').onclick();assert.equal(run('owned.size'),new Set(previous.owned).size);assert.equal(run('recoveryPoints().length'),4);
// Theme changes are persisted, exported and do not alter marks or recovery points.
const marksBeforeTheme=run('JSON.stringify(snapshot().owned)');
const pointsBeforeTheme=storage.get('pokebinder.v1.recovery');
run('setTheme("dark")');
assert.equal(c.document.documentElement.dataset.theme,'dark');
assert.equal(JSON.parse(storage.get('pokebinder.v1')).theme,'dark');
assert.equal(run('snapshot().theme'),'dark');
assert.equal(run('JSON.stringify(snapshot().owned)'),marksBeforeTheme);
assert.equal(storage.get('pokebinder.v1.recovery'),pointsBeforeTheme);
run('theme="light";readState();applyTheme()');
assert.equal(run('theme'),'dark');
assert.throws(()=>run('validateBackup({version:1,owned:[],theme:"unknown"})'));
run('setTheme("light")');
assert.equal(c.document.documentElement.dataset.theme,'light');
console.log('V3 PASS: theme toggling, persisted reload, export, validation, and unchanged collection/recovery points.');
// Restore a legacy JSON backup through the actual handler.
(async()=>{
  element('importFile').files=[{size:80,text:async()=>JSON.stringify({version:1,owned:[1,480,481,1025]})}];
  await element('importFile').onchange();
  assert.equal(run('owned.size'),4);assert(run('owned.has(480)&&owned.has(481)&&owned.has(1025)'));
  const expected=run('JSON.stringify(snapshot())');
  element('importFile').files=[{size:80,text:async()=>JSON.stringify({version:1,owned:[2000]})}];
  await element('importFile').onchange();assert.equal(run('JSON.stringify(snapshot().owned)'),JSON.stringify([1,480,481,1025]));
  console.log('V2 PASS: translation parity; all-language search; language persistence; 7 layouts; species-stable marks; physical pocket counts; backup migration; five recovery points; previous-save recovery; invalid import rejection.');
})().catch(error=>{console.error(error);process.exitCode=1;});


