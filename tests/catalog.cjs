const assert=require('assert'),fs=require('fs'),path=require('path'),vm=require('vm');
const calls=[];
const fixtures={
  'en/cards?dexId=eq:6':[{id:'base1-4',name:'Charizard',localId:'4',image:'https://assets.tcgdex.net/en/base/base1/4'},{id:'A1-35',name:'Charizard',localId:'35'}],
  'en/sets':[{id:'base1',name:'Base Set'},{id:'A1',name:'Digital set'}],
  'en/series/tcgp':{sets:[{id:'A1'}]},
  'en/cards/base1-4':{id:'base1-4',name:'Charizard',category:'Pokemon',dexId:[6],localId:'4',set:{id:'base1',name:'Base Set'},variants:{normal:false,holo:true,reverse:false,firstEdition:true},image:'https://assets.tcgdex.net/en/base/base1/4'},
  'en/sets/base1':{id:'base1',serie:{id:'base',name:'Base'},releaseDate:'1999-01-09'},
  'en/cards/tag-1':{id:'tag-1',name:'Reshiram & Charizard',category:'Pokemon',dexId:[643,6],localId:'1',set:{id:'base1'},variants:{holo:true}},
  'en/cards/digital-1':{id:'digital-1',name:'Charizard',category:'Pokemon',dexId:[6],localId:'1',set:{id:'A1'}},
  'en/sets/A1':{serie:{id:'tcgp',name:'TCG Pocket'}}
};
const context={window:{},URL,AbortController,setTimeout,clearTimeout,Date,console,fetch:async url=>{const key=url.replace('https://api.tcgdex.net/v2/','');calls.push(key);if(!fixtures[key])return {ok:false,status:404};return {ok:true,json:async()=>fixtures[key]};}};
vm.createContext(context);vm.runInContext(fs.readFileSync(path.join(__dirname,'../src/tcg-catalog.js'),'utf8'),context);
const api=context.window.TCGCatalog;
(async()=>{
  const list=await api.list(6,'en');assert.equal(list.length,1);assert.equal(list[0].setName,'Base Set');assert.equal(list[0].image,'https://assets.tcgdex.net/en/base/base1/4/high.webp');
  assert(calls.includes('en/cards?dexId=eq:6'));
  const record=await api.details(6,'en','base1-4');assert.equal(record.speciesId,6);assert.equal(record.availableVariants[0],'holo');assert(record.firstEditionAvailable);assert(api.validate(record,6));assert(!api.validate(record,25));
  await assert.rejects(()=>api.details(25,'en','base1-4'));
  await assert.rejects(()=>api.details(6,'en','digital-1'));
  const tag=await api.details(6,'en','tag-1');assert.equal(tag.speciesId,6);
  assert.equal(api.safeImage('javascript:alert(1)'),'');assert.equal(api.safeImage('https://evil.example/image.png'),'');assert(!api.validate({...record,image:'https://evil.example/image.png'},6));
  const before=calls.length;await api.list(6,'en');assert.equal(calls.length,before,'Same-species searches use cache');
  delete fixtures['en/cards?dexId=eq:6'];assert.equal((await api.list(6,'en',{refresh:true})).length,1,'Previously fetched list is usable during provider failure');
  console.log('CATALOG PASS: strict species query, physical-card exclusion, exact ID verification, multi-Pokémon card support, variants, image URL validation and cache fallback.');
})().catch(error=>{console.error(error);process.exitCode=1;});
