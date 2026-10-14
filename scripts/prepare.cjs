const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..'),sourceDir=path.join(root,'data','source');
function csv(file){const text=fs.readFileSync(path.join(sourceDir,file),'utf8').trim().split(/\r?\n/); const keys=text.shift().split(','); return text.map(line=>{const v=line.match(/("(?:[^"]|"")*"|[^,]*)(,|$)/g).map(x=>x.replace(/,$/,'').replace(/^"|"$/g,'').replace(/""/g,'"'));return Object.fromEntries(keys.map((k,i)=>[k,v[i]]));});}
const names=csv('names.csv'),species=csv('species.csv');
const official=JSON.parse(fs.readFileSync(path.join(sourceDir,'official.json'),'utf8').replace(/^\uFEFF/,''));
const english=new Map(names.filter(x=>x.local_language_id==='9').map(x=>[+x.pokemon_species_id,x.name]));
const gen=new Map(species.map(x=>[+x.id,+x.generation_id]));
const data=official.results.filter(x=>x.sub===0).map(x=>({id:+x.no,ja:x.name,en:english.get(+x.no)||x.name,gen:gen.get(+x.no),types:[x.type_1,x.type_2].filter(Boolean),height:x.takasa,weight:x.omosa,image:`assets/${+x.no}.png`,url:x.image_m,forms:official.results.filter(f=>f.no===x.no).map(f=>({name:f.sub_name||'Base form',key:f.zukan_no,url:f.image_m,types:[f.type_1,f.type_2].filter(Boolean)}))}));
if(data.length!==1025||data.some((x,i)=>x.id!==i+1||!x.en||!x.gen)) throw Error('Incomplete dataset');
fs.writeFileSync(path.join(root,'data','pokedex.js'),'window.POKEMON='+JSON.stringify(data)+';\n');
console.log(`Validated ${data.length} species, ${official.results.length} forms`);
if(process.argv.includes('--images')) (async()=>{fs.mkdirSync(path.join(root,'assets'),{recursive:true});let next=0,ok=0;const failures=[]; await Promise.all(Array.from({length:8},async()=>{while(next<data.length){const p=data[next++],dest=path.join(root,p.image);if(fs.existsSync(dest)){ok++;continue;}for(let attempt=0;attempt<3;attempt++){try{const r=await fetch(p.url,{signal:AbortSignal.timeout(30000)});if(!r.ok)throw Error(r.status);fs.writeFileSync(dest,Buffer.from(await r.arrayBuffer()));ok++;break;}catch(e){if(attempt===2)failures.push(p.id);}}if(ok%100===0)console.log(`${ok}/${data.length}`);}}));console.log(JSON.stringify({downloaded:ok,failures}));if(failures.length)process.exitCode=1;})();
