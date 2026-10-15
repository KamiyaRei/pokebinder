const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const c={window:{}};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../src/binder-model.js'),'utf8'),c);const B=c.window.BinderModel;
const plain=x=>JSON.parse(JSON.stringify(x));
let bs=B.legacy();assert.equal(bs.length,3);assert.deepEqual(plain(B.position(bs,481)),{binder:2,page:1,slot:1,row:1,col:1});
B.resize(bs[0],{columns:3,rows:3,pages:20});B.resize(bs[1],{columns:4,rows:3,pages:40});B.ensureCoverage(bs);
assert.equal(B.capacity(bs[0]),180);assert.equal(B.capacity(bs[1]),480);assert.deepEqual(plain(B.position(bs,181)),{binder:2,page:1,slot:1,row:1,col:1});assert.equal(B.position(bs,661).binder,3);
const free=B.create('free',{columns:3,rows:3,pages:2},'free-test');free.name='Favorites';free.color='#8855aa';bs.splice(1,0,free);
assert.equal(B.position(bs,181).binder,3,'Free binders do not consume dex IDs');
free.slots[0]={speciesId:132};free.slots[1]={speciesId:132};free.slots[17]={speciesId:0,title:'Energy'};assert(B.validate(bs,()=>true));
const before=JSON.stringify(free);assert.throws(()=>B.resize(free,{columns:2,rows:2,pages:2}));assert.equal(JSON.stringify(free),before,'Blocked resize must be atomic');
B.move(free,17,2);B.resize(free,{columns:2,rows:2,pages:2});assert.equal(free.slots[2].title,'Energy');assert.equal(free.slots[0].speciesId,132);assert.equal(free.slots[1].speciesId,132);
B.move(free,0,2);assert.equal(free.slots[0].title,'Energy');assert.equal(free.slots[2].speciesId,132);assert.throws(()=>B.move(free,0,999));
const restored=plain(bs);assert(B.validate(restored,()=>true));assert.equal(restored[1].name,'Favorites');assert.equal(restored[1].slots[2].speciesId,132);
for(const change of [b=>b[1].slots[-1]={speciesId:25},b=>b[1].slots[7]={speciesId:1026},b=>b[1].color='red;',b=>b[1].id=b[0].id,b=>b[1].slots[7]={speciesId:0,title:''},b=>b[1].mode='dex']){const bad=plain(bs);change(bad);assert.throws(()=>B.validate(bad,()=>true));}
let randomSeed=17;const random=n=>{randomSeed=(randomSeed*1664525+1013904223)>>>0;return randomSeed%n;};
for(let run=0;run<50;run++){const items=Array.from({length:3},(_,i)=>B.create('dex',{columns:1+random(6),rows:1+random(6),pages:1+random(80)},'d-'+i));B.ensureCoverage(items);assert(B.validate(items,()=>true));for(let id=1;id<=1025;id++){const p=B.position(items,id),b=items[p.binder-1],r=B.range(items,p.binder-1);assert.equal(r.start+(p.page-1)*b.columns*b.rows+p.slot-1,id);assert(p.col<=b.columns&&p.row<=b.rows&&p.page<=b.pages);}}
console.log('PASS: independent sizes, mixed dex/free ranges, duplicate species, custom cards, atomic resize protection, slot swapping, backup validation and 51,250 mixed-layout locations.');
