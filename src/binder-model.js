'use strict';
// Pure collection model; physical layouts and free pockets have independent identities.
window.BinderModel=(()=>{
 const DEFAULT={columns:4,rows:3,pages:40},MAX_SPECIES=1025;
 const capacity=b=>b.columns*b.rows*b.pages;
 const validLayout=b=>b&&['columns','rows','pages'].every(k=>Number.isInteger(b[k])&&b[k]>=1&&b[k]<=(k==='pages'?200:6));
 function create(mode='dex',layout=DEFAULT,id='binder-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,9)){
  if(!['dex','free'].includes(mode)||!validLayout(layout))throw Error('Invalid binder');
  return {id,mode,name:'',color:mode==='free'?'#8b4e82':'#295c48',columns:layout.columns,rows:layout.rows,pages:layout.pages,slots:{}};
 }
 function legacy(layout=DEFAULT){return Array.from({length:Math.ceil(MAX_SPECIES/capacity(layout))},(_,i)=>create('dex',layout,'dex-'+(i+1)));}
 function ensureCoverage(binders){let total=binders.filter(b=>b.mode==='dex').reduce((n,b)=>n+capacity(b),0);while(total<MAX_SPECIES){const b=create();binders.push(b);total+=capacity(b);}return binders;}
 function range(binders,index){let start=1;for(let i=0;i<index;i++)if(binders[i].mode==='dex')start+=capacity(binders[i]);return {start,end:Math.min(MAX_SPECIES,start+capacity(binders[index])-1)};}
 function position(binders,id){if(!Number.isInteger(id)||id<1||id>MAX_SPECIES)throw Error('Invalid species');for(let i=0;i<binders.length;i++){const b=binders[i];if(b.mode!=='dex')continue;const r=range(binders,i);if(id>=r.start&&id<=r.end){const offset=id-r.start,slots=b.columns*b.rows;return {binder:i+1,page:Math.floor(offset/slots)+1,slot:offset%slots+1,row:Math.floor(offset%slots/b.columns)+1,col:offset%b.columns+1};}}throw Error('Missing Pokédex capacity');}
 function validate(binders,validatePrinting){
  if(!Array.isArray(binders)||!binders.length||binders.length>2048)throw Error('Invalid binders');
  const ids=new Set();
  for(const b of binders){
   if(!b||typeof b.id!=='string'||!/^[a-zA-Z0-9-]{1,90}$/.test(b.id)||ids.has(b.id)||!['dex','free'].includes(b.mode)||!validLayout(b)||typeof b.name!=='string'||b.name.length>80||!/^#[a-fA-F0-9]{6}$/.test(b.color)||!b.slots||typeof b.slots!=='object'||Array.isArray(b.slots))throw Error('Invalid binder');
   ids.add(b.id);
   for(const [key,entry] of Object.entries(b.slots)){
    const slot=Number(key);
    if(b.mode!=='free'||String(slot)!==key||!Number.isInteger(slot)||slot<0||slot>=capacity(b)||!entry||!Number.isInteger(entry.speciesId)||entry.speciesId<0||entry.speciesId>MAX_SPECIES||(entry.speciesId===0&&(typeof entry.title!=='string'||!entry.title.trim()||entry.title.length>150||entry.printing!==undefined))||(entry.printing!==undefined&&!validatePrinting(entry.printing,entry.speciesId)))throw Error('Invalid pocket');
   }
  }
  if(binders.filter(b=>b.mode==='dex').reduce((n,b)=>n+capacity(b),0)<MAX_SPECIES)throw Error('Missing Pokédex capacity');
  return true;
 }
 function resize(b,layout){if(!validLayout(layout))throw Error('Invalid layout');if(b.mode==='free'&&Object.keys(b.slots).some(k=>Number(k)>=capacity(layout)))throw Error('Occupied pockets would be lost');Object.assign(b,layout);}
 function move(b,from,to){if(b.mode!=='free'||![from,to].every(i=>Number.isInteger(i)&&i>=0&&i<capacity(b)))throw Error('Invalid pocket');const a=b.slots[from],z=b.slots[to];if(a)b.slots[to]=a;else delete b.slots[to];if(z)b.slots[from]=z;else delete b.slots[from];}
 return {DEFAULT,capacity,validLayout,create,legacy,ensureCoverage,range,position,validate,resize,move};
})();
