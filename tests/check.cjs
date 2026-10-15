const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const PROJECT_ROOT=path.resolve(__dirname,'..');
const entry=fs.readFileSync(path.join(PROJECT_ROOT,'index.html'),'utf8');
for(const match of entry.matchAll(/(?:src|href)="((?:src|data)\/[^"]+)"/g)) assert(fs.existsSync(path.join(PROJECT_ROOT,match[1])),`Missing app resource: ${match[1]}`);
for(const match of fs.readFileSync(path.join(PROJECT_ROOT,'README.md'),'utf8').matchAll(/\]\((docs\/[^)]+)\)/g)) assert(fs.existsSync(path.join(PROJECT_ROOT,match[1])),`Missing documentation resource: ${match[1]}`);
const elements=new Map(),storage=new Map(),listeners=new Map();
function element(id){if(!elements.has(id))elements.set(id,{id,value:['status','generation','type'].includes(id)?'all':'',innerHTML:'',textContent:'',hidden:false,style:{setProperty(){}},disabled:false,files:[],dataset:{},setAttribute(){},showModal(){this.open=true;},close(){this.open=false;},classList:{add(){},remove(){},toggle(){}},add(){},focus(){},click(){},addEventListener(type,fn){listeners.set(id+':'+type,fn);}});return elements.get(id);}
const c={console,window:{addEventListener(){}},document:{getElementById:element,documentElement:{lang:"",dataset:{},style:{setProperty(){}}},querySelectorAll:()=>[],addEventListener(type,fn){listeners.set(type,fn);}},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},location:{hash:''},history:{replaceState(){}},Option:function(){},URL,Blob,setTimeout:()=>0,clearTimeout(){},confirm:()=>true};
vm.createContext(c);vm.runInContext(fs.readFileSync(path.join(PROJECT_ROOT,'data/pokedex.js'),'utf8'),c);vm.runInContext(fs.readFileSync(path.join(PROJECT_ROOT,'src/i18n.js'),'utf8'),c);vm.runInContext(fs.readFileSync(path.join(PROJECT_ROOT,'src/tcg-catalog.js'),'utf8'),c);vm.runInContext(fs.readFileSync(path.join(PROJECT_ROOT,'src/binder-model.js'),'utf8'),c);vm.runInContext(fs.readFileSync(path.join(PROJECT_ROOT,'src/binder-i18n.js'),'utf8'),c);vm.runInContext(fs.readFileSync(path.join(PROJECT_ROOT,'src/app.js'),'utf8'),c);
const run=s=>vm.runInContext(s,c);
for(const [id,binder,page,slot] of [[1,1,1,1],[12,1,1,12],[13,1,2,1],[480,1,40,12],[481,2,1,1],[960,2,40,12],[961,3,1,1],[1025,3,6,5]])assert.equal(run(`JSON.stringify(position(${id}))`),JSON.stringify({binder,page,slot,row:Math.floor((slot-1)/4)+1,col:(slot-1)%4+1}));
assert.equal(run('D.length'),1025);assert.equal(run('new Set(D.map(p=>p.id)).size'),1025);
for(const p of c.window.POKEMON){assert(p.en&&p.ja&&p.gen);if(process.argv.includes('--skip-images'))continue;const image=fs.readFileSync(path.join(PROJECT_ROOT,p.image));assert(image.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])),`Invalid PNG ${p.id}`);}
for(const [q,id] of [['#0025',25],['pikachu',25],['ピカチュウ',25],['пикачу',25],['бульбазавр',1],['Pecharunt',1025]]){element('search').value=q;run('renderCatalog()');assert.equal(run('filtered[0].id'),id,q);}
element('search').value='';run('toggle(25)');assert(run('owned.has(25)'));assert.deepEqual(JSON.parse(storage.get('pokebinder.local.0.10')).owned,[25]);run('owned.clear(); readState()');assert(run('owned.has(25)'),'Persistence reload');
element('status').value='owned';run('renderCatalog()');assert.equal(run('filtered.length'),1);assert.equal(run('filtered[0].id'),25);
element('status').value='missing';run('renderCatalog()');assert.equal(run('filtered.length'),1024);
element('status').value='all';element('generation').value='9';run('renderCatalog()');assert(run('filtered.every(p=>p.gen===9)'));
element('generation').value='all';element('type').value='5';run('renderCatalog()');assert(run('filtered.every(p=>p.types.includes(5))'));
element('type').value='all';run('binder=1;sheet=40;moveSheet(1)');assert.equal(run('binder'),2);assert.equal(run('sheet'),1);run('moveSheet(-1)');assert.equal(run('binder'),1);assert.equal(run('sheet'),40);
run('select(1025); showLocation()');assert.equal(run('binder'),3);assert.equal(run('sheet'),6);assert.equal((element('binderGrid').innerHTML.match(/class="emptySlot"/g)||[]).length,7);
run('select(0)');assert.equal(run('selected'),1025);run('select(1026)');assert.equal(run('selected'),1025);
for(const invalid of [{version:1,owned:[1026]},{version:1,owned:['25']},{version:99,owned:[]},{version:1,owned:[-1]},{}]){assert.throws(()=>run('validateBackup('+JSON.stringify(invalid)+')'));}
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
  assert.equal(JSON.parse(storage.get('pokebinder.local.0.10')).language,locale);
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
 run('binder=1;syncBinder()');const others=run('JSON.stringify(binders.slice(1))');
 run('applyLayout('+JSON.stringify({columns,rows,pages})+')');
 assert(run('owned.has(25)'));assert.equal(run('binderCapacity()'),columns*rows*pages);
 const before=JSON.parse(others);const after=JSON.parse(run('JSON.stringify(binders.slice(1))'));assert.deepEqual(after.slice(0,before.length),before,'Other binder settings remain unchanged');
 const backup=JSON.parse(run('JSON.stringify(snapshot())'));assert.equal(backup.version,3);assert.deepEqual({columns:backup.binders[0].columns,rows:backup.binders[0].rows,pages:backup.binders[0].pages},{columns,rows,pages});
 run('select(1025);showLocation()');assert(!element('detail').innerHTML.includes('undefined'));
}
for(const value of [{columns:0,rows:3,pages:40},{columns:4,rows:7,pages:40},{columns:4,rows:3,pages:201},{columns:4.5,rows:3,pages:40}])assert.throws(()=>run(`applyLayout(${JSON.stringify(value)})`));
// Recovery snapshots include layout/marks, capped at five; navigation does not displace them.
run('toggle(2);toggle(3);toggle(4);toggle(5);toggle(6);toggle(7)');assert.equal(run('recoveryPoints().length'),5);
const recoveryBefore=storage.get('pokebinder.local.0.10.recovery');run('select(300);setLanguage("ru")');assert.equal(storage.get('pokebinder.local.0.10.recovery'),recoveryBefore);
const previous=JSON.parse(recoveryBefore)[0];element('recover').onclick();assert.equal(run('owned.size'),new Set(previous.owned).size);assert.equal(run('recoveryPoints().length'),4);
// Theme changes are persisted, exported and do not alter marks or recovery points.
const marksBeforeTheme=run('JSON.stringify(snapshot().owned)');
const pointsBeforeTheme=storage.get('pokebinder.local.0.10.recovery');
run('setTheme("dark")');
assert.equal(c.document.documentElement.dataset.theme,'dark');
assert.equal(JSON.parse(storage.get('pokebinder.local.0.10')).theme,'dark');
assert.equal(run('snapshot().theme'),'dark');
assert.equal(run('JSON.stringify(snapshot().owned)'),marksBeforeTheme);
assert.equal(storage.get('pokebinder.local.0.10.recovery'),pointsBeforeTheme);
run('theme="light";readState();applyTheme()');
assert.equal(run('theme'),'dark');
assert.throws(()=>run('validateBackup({version:1,owned:[],theme:"unknown"})'));
run('setTheme("light")');
assert.equal(c.document.documentElement.dataset.theme,'light');
console.log('V3 PASS: theme toggling, persisted reload, export, validation, and unchanged collection/recovery points.');
// Optional exact-card records survive export, reload, layout changes and recovery.
// Free pockets survive persistence and backups without changing dex marks.
run('binders.push(BM.create("free",{columns:3,rows:3,pages:2},"free-test"));binders[binders.length-1].slots[0]={speciesId:132};save()');
const savedFree=JSON.parse(storage.get('pokebinder.local.0.10'));assert.equal(savedFree.binders.at(-1).slots['0'].speciesId,132);
const marksWithFree=run('JSON.stringify(snapshot().owned)');run('readState()');assert.equal(run('binders.at(-1).slots[0].speciesId'),132);assert.equal(run('JSON.stringify(snapshot().owned)'),marksWithFree);
const manual={provider:'manual',speciesId:6,cardId:'manual-test',cardLanguage:'en',name:'Charizard',setId:'base1',setName:'Base Set',collectorNumber:'4',variant:'holo',image:'',firstEdition:false};
run('assignPrinting(6,'+JSON.stringify(manual)+')');
assert(run('owned.has(6)'));assert.equal(run('snapshot().version'),3);assert.equal(run('printings[6].collectorNumber'),'4');
const savedPrinting=JSON.parse(storage.get('pokebinder.local.0.10'));assert.equal(savedPrinting.printings['6'].variant,'holo');
run('printings={};readState()');assert.equal(run('printings[6].setId'),'base1');
run('applyLayout({columns:3,rows:3,pages:40})');assert.equal(run('printings[6].cardId'),'manual-test');
const countWithPrinting=run('owned.size');run('clearPrinting(6)');assert.equal(run('owned.size'),countWithPrinting);assert.equal(run('printings[6]'),undefined);
element('recover').onclick();assert.equal(run('printings[6].cardId'),'manual-test');
run('toggle(6)');assert(!run('owned.has(6)'));assert.equal(run('printings[6].cardId'),'manual-test');
for(const bad of [{...manual,speciesId:25},{...manual,image:'https://evil.example/image.png'},{...manual,cardLanguage:'unknown'}])assert.throws(()=>run('validateBackup('+JSON.stringify({version:2,owned:[6],printings:{6:bad}})+')'));
run('applySnapshot({version:1,owned:[25]})');assert(run('owned.has(25)'));assert.equal(run('Object.keys(printings).length'),0);
console.log('0.10 PASS: exact-printing backup, persistent reload, stable layout mapping, link removal without losing collection marks, recovery, validation and legacy migration.');
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



// Separate group navigation must never cross dex/free boundaries.
run("binders=BM.legacy();const f1=BM.create('free',{columns:3,rows:3,pages:2},'free-a');const f2=BM.create('free',{columns:2,rows:2,pages:3},'free-b');binders.splice(1,0,f1);binders.push(f2);binder=1;sheet=40;binderScope='dex';moveSheet(1)");
assert.equal(run('binder'),3,'Skip free binder when paging National Dex');
run("activateScope('free');sheet=2;moveSheet(1)");assert.equal(run('currentBinder().id'),'free-b');assert.equal(run('sheet'),1);
run("sheet=3;moveSheet(1)");assert.equal(run('currentBinder().id'),'free-b');assert.equal(run('sheet'),3);
run("activateScope('dex');activateScope('free')");assert.equal(run('currentBinder().id'),'free-b');assert.equal(run('sheet'),3,'Remember each group page');
run("renderBinder()");assert(!element('binder').innerHTML.includes('value="1"'),'Free selector excludes dex');
run("activateScope('dex');renderStats()");assert(!element('collectionSummary').innerHTML.includes('free-b'),'Summary excludes other group');
run("binders=BM.legacy();binder=1;sheet=1;activateScope('free');renderBinder()");assert(element('editBinder').disabled,'No settings mutation for empty free group');assert(element('binderIntro').textContent.includes(c.window.TRANSLATIONS[run('language')].noFreeBinders));
console.log('GROUP PASS: separate selectors, summaries, page boundaries, session view memory and empty group.');

// Reference stays independent of inserted printings and collection marks.
run("tab='dex';selected=25;owned.add(25);printings[25]={image:'https://example.invalid/card.png',cardLanguage:'en',variant:'unspecified',name:'Test printing',setName:'Set',setId:'TEST',collectorNumber:'25/100'};render()");
assert(!element('catalog').innerHTML.includes('printingFront'));assert(!element('catalog').innerHTML.includes('data-mark='));assert(!element('detail').innerHTML.includes('printingSummary'));assert(!element('detail').innerHTML.includes('markSelected'));assert(!element('detail').innerHTML.includes('example.invalid'));assert(element('detail').innerHTML.includes(run('D[24].image')));assert(element('collectionSummary').hidden);assert(element('overallSummary').hidden);
run("tab='binder';binderScope='dex';render()");assert(!element('collectionSummary').hidden);const caption=run('printingCaption(D[24],printings[25])');assert(caption.includes('0025')&&caption.includes('Pikachu')&&caption.includes('25/100'));assert(run('tile(D[24])').includes('printingCaption'));
console.log('REFERENCE PASS: standard species artwork, no marks or collection details, separate visual context; exact-card captions retain species and printing identity.');



run("referenceCollection=true;tab='dex';render()");assert(element('catalog').innerHTML.includes('printingFront'));assert(element('catalog').innerHTML.includes('data-mark='));assert(element('detail').innerHTML.includes('printingSummary'));assert(!element('collectionSummary').hidden);assert(run('snapshot().referenceCollection'));run("delete printings[25];save();referenceCollection=false;readState()");assert(run('referenceCollection'),'Preference survives reload');run("referenceCollection=false");
console.log('PREFERENCE PASS: optional collection view, persisted preference and pure reference default.');

// App settings and binder settings are independent dialogs.
const generalDialog=entry.match(/<dialog id="settingsDialog">[\s\S]*?<\/dialog>/)[0],binderDialog=entry.match(/<dialog id="binderSettingsDialog">[\s\S]*?<\/dialog>/)[0];
assert(generalDialog.includes('themePreference')&&generalDialog.includes('referenceCollection')&&generalDialog.includes('backupNow'));assert(!generalDialog.includes('settingsForm'));assert(binderDialog.includes('settingsForm'));assert(!binderDialog.includes('themePreference')&&!binderDialog.includes('referenceCollection')&&!binderDialog.includes('backupNow'));
run("binders=BM.legacy();binder=1;binderScope='free';openSettings()");assert(element('settingsDialog').open,'Global settings work even without a free binder');run("binderScope='dex';openBinderSettings()");assert(element('binderSettingsDialog').open);
for(const [locale,prompt] of [['en','Number or name…'],['ja','図鑑番号・名前…'],['ru','Номер или имя…']])assert.equal(c.window.TRANSLATIONS[locale].placeholder,prompt);assert(entry.includes('https://github.com/KamiyaRei'));
console.log('SETTINGS PASS: separate app/binder dialogs, global access in empty groups, localized search prompts and creator credit.');
