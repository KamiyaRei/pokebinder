// Reproducible, resumable import of the public Japanese physical-card catalog.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'), cache=path.join(root,'data','catalog-cache');
fs.mkdirSync(cache,{recursive:true});
const origin='https://www.pokemon-card.com';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let blocked=false;
async function get(url){for(let n=0;n<5;n++){try{if(blocked)throw Error('Import stopped after source denied further requests');const r=await fetch(url,{signal:AbortSignal.timeout(30000)});if(r.status===403){blocked=true;throw Error('Source denied further requests (403)');}if(!r.ok)throw Error('HTTP '+r.status);return await r.text();}catch(e){if(blocked||n===4)throw e;await sleep(1000*(n+1));}}}
async function pool(items,fn,workers=4){let index=0;await Promise.all(Array.from({length:workers},async()=>{while(index<items.length){const i=index++;await fn(items[i],i);if(!process.argv.includes('--index-only'))await sleep(120);}}));}
function text(s){return String(s||'').replace(/<[^>]*>/g,' ').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/\s+/g,' ').trim();}
async function page(n){const file=path.join(cache,`page-${n}.json`);if(fs.existsSync(file))return JSON.parse(fs.readFileSync(file));const j=JSON.parse(await get(`${origin}/card-search/resultAPI.php?se_ta=pokemon&regulation_sidebar_form=all&page=${n}`));if(j.result!==1||!Array.isArray(j.cardList))throw Error('Invalid page '+n);fs.writeFileSync(file,JSON.stringify(j));return j;}
async function main(){
 const first=await page(1),pages=[first]; console.log('Catalog:',first.hitCnt,'cards;',first.maxPage,'pages');
 await pool(Array.from({length:first.maxPage-1},(_,i)=>i+2),async n=>{pages[n-1]=await page(n);if(n%25===0)console.log('Pages',n,'/',first.maxPage);});
 const all=[...new Map(pages.flatMap(p=>p.cardList).map(c=>[c.cardID,c])).values()];
 if(all.length!==first.hitCnt)throw Error(`Pagination mismatch: ${all.length} vs ${first.hitCnt}`);
 fs.writeFileSync(path.join(cache,'list.json'),JSON.stringify(all));
 const records=[],errors=[];let done=0;
 await pool(all,async c=>{
  const file=path.join(cache,`card-${c.cardID}.json`);let record;
  try{if(fs.existsSync(file))record=JSON.parse(fs.readFileSync(file));else if(process.argv.includes('--index-only')||blocked){record={id:'jp-'+c.cardID,officialId:c.cardID,name:c.cardNameAltText,number:'',setId:c.cardThumbFile.split('/').at(-2),setName:c.cardThumbFile.split('/').at(-2),image:origin+c.cardThumbFile,speciesIds:[],rarity:'',sourceUrl:`${origin}/card-search/details.php/card/${c.cardID}/regu/all`,metadataStatus:'index-only'};}else{
   const html=await get(`${origin}/card-search/details.php/card/${c.cardID}/regu/all`);
   const left=html.split('class="LeftBox"')[1]?.split('class="RightBox"')[0]||'';
   const ids=[...left.matchAll(/No\.\s*(\d{3,4})/g)].map(m=>Number(m[1]));
   const sub=html.match(/<div class="subtext Text-fjalla">([\s\S]*?)<\/div>/)?.[1]||'';
   const number=text(sub).match(/(\d+|[A-Z]+\d+)\s*\/\s*(\d+|[A-Z]+\d+)/)?.[0]?.replace(/\s/g,'')||'';
   const setId=c.cardThumbFile.split('/').at(-2);
   const product=html.match(/<li class="List_item"><a[^>]*class="Link Link-arrow"[^>]*>([\s\S]*?)<\/a>/)?.[1];
   record={id:'jp-'+c.cardID,officialId:c.cardID,name:c.cardNameAltText,number,setId,setName:text(product)||setId,image:origin+c.cardThumbFile,speciesIds:[...new Set(ids)],rarity:sub.match(/ic_rare_([^"/]+)\./)?.[1]||'',sourceUrl:`${origin}/card-search/details.php/card/${c.cardID}/regu/all`};
   fs.writeFileSync(file,JSON.stringify(record));
  }records.push(record);}catch(e){errors.push({id:c.cardID,error:e.message});}
  done++;if(done%250===0)console.log('Details',done,'/',all.length,'errors',errors.length);
 });
 const setNames=new Map(records.filter(c=>c.setName!==c.setId).map(c=>[c.setId,c.setName]));
 for(const c of records){if(c.setName===c.setId&&setNames.has(c.setId))c.setName=setNames.get(c.setId);if(!c.setName)c.setName='—';if(c.image.includes('/noimage/'))c.artworkStatus='placeholder';if(c.rarity)c.rarity=c.rarity.split('_')[0].toUpperCase();}
 const unmatched=records.filter(c=>!c.speciesIds.length);
 // TAG TEAM and special cards without a printed National Dex line are mapped
 // by longest non-overlapping Japanese species names, never by evolution text.
 const sandbox={window:{}};vm.runInNewContext(fs.readFileSync(path.join(root,'data/pokedex.js'),'utf8'),sandbox);
 const species=[...sandbox.window.POKEMON].sort((a,b)=>b.ja.length-a.ja.length);
 for(const c of unmatched){let title=c.name.replace(/\s/g,'');for(const p of species){const name=p.ja.replace(/\s/g,'');if(title.includes(name)){c.speciesIds.push(p.id);title=title.replaceAll(name,' ');}}c.mapping='card-title';}
 records.sort((a,b)=>Number(b.officialId)-Number(a.officialId));
 const data={schema:1,source:origin+'/card-search/',importedAt:new Date().toISOString(),expected:first.hitCnt,cards:records,errors,unmatched:records.filter(c=>!c.speciesIds.length).map(c=>({id:c.id,name:c.name})),titleMapped:unmatched.length,detailRecords:records.filter(c=>c.metadataStatus!=='index-only').length,indexOnlyRecords:records.filter(c=>c.metadataStatus==='index-only').length};
 fs.writeFileSync(path.join(root,'data/japanese-cards.js'),'window.JAPANESE_CARDS='+JSON.stringify(data)+';\n');
 fs.writeFileSync(path.join(root,'data/japanese-catalog-audit.json'),JSON.stringify({...data,cards:undefined},null,2));
 console.log('DONE',records.length,'Bulbasaur',records.filter(c=>c.speciesIds.includes(1)).length,'unmatched',data.unmatched.length);
 if(errors.length)process.exitCode=1;
}
main().catch(e=>{console.error(e);process.exitCode=1;});
