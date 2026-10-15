const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'..'),context={window:{},URL,AbortController,setTimeout,clearTimeout,Date,console,fetch:()=>{throw Error('Japanese lookup must not use a network request');}};
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root,'data/japanese-cards.js'),'utf8'),context);
vm.runInContext(fs.readFileSync(path.join(root,'src/tcg-catalog.js'),'utf8'),context);
const db=context.window.JAPANESE_CARDS,api=context.window.TCGCatalog;
(async()=>{
 assert.equal(db.errors.length,0);assert.equal(db.cards.length,db.expected);assert.equal(new Set(db.cards.map(c=>c.id)).size,db.expected);
 for(const c of db.cards){assert.equal(api.safeImage(c.image),c.image,'Missing/unsafe official artwork: '+c.id);assert(c.name&&typeof c.setId==='string'&&c.setName);assert(c.speciesIds.every(id=>Number.isInteger(id)&&id>0&&id<=1025));}
 const bulb=await api.list(1,'ja');assert.equal(bulb.length,19);assert(bulb.every(c=>c.name==='フシギダネ'&&c.image));
 const movie=bulb.find(c=>c.id==='jp-36718');assert(movie);assert.equal(movie.number,'001/024');
 const record=await api.details(1,'ja',movie.id);assert.equal(record.provider,'pokemon-jp');assert(api.validate(record,1));assert(!api.validate(record,2));
 await assert.rejects(()=>api.details(2,'ja',movie.id));
 assert.equal(api.safeImage('https://www.pokemon-card.com/evil.jpg'),'');
 // Substring species must not match their evolution: Mew/Mewtwo, Charmeleon/Charizard.
 for(const c of db.cards.filter(c=>c.name.replace(/\s/g,'').match(/^ミュウツー(?:EX|GX|V|ex|LV|$)/))){assert(!c.speciesIds.includes(151),c.id+' misclassified as Mew');}
 for(const c of db.cards.filter(c=>c.name.replace(/\s/g,'').match(/^リザードン(?:EX|GX|V|ex|LV|$)/))){assert(!c.speciesIds.includes(5),c.id+' misclassified as Charmeleon');}
 const pika=await api.list(25,'ja');assert(pika.length>100);assert((await api.list(1025,'ja')).length>0);
 console.log('PASS: official Japanese database',db.cards.length,'cards;',bulb.length,'Bulbasaur;',pika.length,'Pikachu; offline metadata, species validation and official image paths.');
})().catch(e=>{console.error(e);process.exitCode=1;});
