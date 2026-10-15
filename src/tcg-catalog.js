'use strict';
// Read-only provider adapter. Collection records never depend on the cache.
window.TCGCatalog = (() => {
  const API='https://api.tcgdex.net/v2', memory=new Map();
  let database;
  function db() {
    if(!database) database=new Promise(resolve=>{
      if(typeof indexedDB==='undefined'){resolve(null);return;}
      try {
        const request=indexedDB.open('pokebinder-catalog-0.06',1);
        request.onupgradeneeded=()=>request.result.createObjectStore('cache');
        request.onsuccess=()=>resolve(request.result);
        request.onerror=()=>resolve(null);request.onblocked=()=>resolve(null);
      } catch {resolve(null);}
    });return database;
  }
  async function cached(key) {
    if(memory.has(key))return memory.get(key);
    const database=await db();if(!database)return null;
    return new Promise(resolve=>{try{const request=database.transaction('cache').objectStore('cache').get(key);request.onsuccess=()=>{if(request.result)memory.set(key,request.result);resolve(request.result||null);};request.onerror=()=>resolve(null);}catch{resolve(null);}});
  }
  async function remember(key,value) {
    memory.set(key,value);const database=await db();if(!database)return;
    await new Promise(resolve=>{try{const transaction=database.transaction('cache','readwrite');transaction.objectStore('cache').put(value,key);transaction.oncomplete=()=>resolve();transaction.onerror=()=>resolve();transaction.onabort=()=>resolve();}catch{resolve();}});
  }
  async function request(path,{refresh=false}={}) {
    const key='json:'+path, old=await cached(key);
    if(old&&!refresh&&Date.now()-old.time<86400000)return old.data;
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),20000);
    try {
      const response=await fetch(API+'/'+path,{signal:controller.signal});
      if(!response.ok)throw Error('Catalog HTTP '+response.status);
      const data=await response.json();await remember(key,{time:Date.now(),data});return data;
    } catch(error){if(old)return old.data;throw error;}finally{clearTimeout(timer);}
  }
  function language(value){if(!['en','ja'].includes(value))throw Error('Unsupported card language');return value;}
  function safeImage(value) {
    if(!value)return '';
    if(value==='https://www.c-labo-online.jp/data/c-labo/product/M6a_121.jpg')return value;
    try{const url=new URL(value);if(url.protocol!=='https:')return '';if(url.hostname==='www.pokemon-card.com'&&(/^\/assets\/images\/card_images\/(large|legend)\/[\w-]*\/[\w.-]+\.(jpg|gif|png)$/.test(url.pathname)||url.pathname==='/assets/images/noimage/poke_ura.jpg'))return url.href;if(url.hostname!=='assets.tcgdex.net')return '';return /\.(webp|png|jpg)$/i.test(url.pathname)?url.href:url.href+'/high.webp';}catch{return '';}
  }
  function setId(card){return String(card.id||'').slice(0,String(card.id||'').lastIndexOf('-'));}
  async function list(speciesId,lang,options={}) {
    language(lang);if(!Number.isInteger(speciesId)||speciesId<1||speciesId>1025)throw Error('Invalid species');
    if(lang==='ja'&&window.JAPANESE_CARDS&&!options.archive)return window.JAPANESE_CARDS.cards.filter(card=>card.speciesIds.includes(speciesId)).map(card=>({...card,image:card.artworkStatus==='placeholder'?'':safeImage(card.image)})).concat((window.CARD_SUPPLEMENTS||[]).filter(card=>card.speciesId===speciesId&&card.cardLanguage===lang).map(card=>({...card})));
    const [cards,sets,pocket]=await Promise.all([
      request(`${lang}/cards?dexId=eq:${speciesId}`,options),
      request(`${lang}/sets`,options).catch(()=>[]),
      request(`${lang}/series/tcgp`,options).catch(()=>null)
    ]);
    if(!Array.isArray(cards))throw Error('Invalid catalog response');
    const digital=new Set((pocket?.sets||[]).map(set=>set.id));
    const names=new Map((Array.isArray(sets)?sets:[]).map(set=>[set.id,set.name]));
    return cards.filter(card=>card&&typeof card.id==='string'&&!digital.has(setId(card))).map(card=>({id:card.id,name:String(card.name||card.id),number:String(card.localId||''),setId:setId(card),setName:names.get(setId(card))||setId(card),image:safeImage(card.image)}));
  }
  function variants(card) {
    const flags=card.variants;
    if(Array.isArray(flags))return [...new Set(flags.map(value=>String(value.type||value.variant||value.name||'unspecified')))];
    const result=['normal','holo','reverse'].filter(key=>flags?.[key]);
    return result.length?result:['unspecified'];
  }
  async function details(speciesId,lang,cardId) {
    language(lang);if(!/^[\w.-]+$/.test(cardId))throw Error('Invalid card ID');
    if(cardId.startsWith('supplement-')){const card=(window.CARD_SUPPLEMENTS||[]).find(card=>card.cardId===cardId&&card.speciesId===speciesId&&card.cardLanguage===lang);if(!card)throw Error('Invalid supplementary card');return {...card,availableVariants:[...card.availableVariants]};}
    if(lang==='ja'&&cardId.startsWith('jp-')) {
      const card=window.JAPANESE_CARDS?.cards.find(card=>card.id===cardId&&card.speciesIds.includes(speciesId));
      if(!card)throw Error('This card does not match the selected Pokémon');
      return {provider:'pokemon-jp',speciesId,cardId:card.id,cardLanguage:'ja',name:card.name,setId:card.setId,setName:card.setName,collectorNumber:card.number,seriesName:'',releaseDate:'',rarity:card.rarity,image:card.artworkStatus==='placeholder'?'':safeImage(card.image),sourceUrl:card.sourceUrl,variant:'unspecified',availableVariants:['unspecified','normal','holo','reverse','other'],firstEditionAvailable:false,firstEdition:false};
    }
    const card=await request(`${lang}/cards/${encodeURIComponent(cardId)}`);
    if(card.category!=='Pokemon'||!Array.isArray(card.dexId)||!card.dexId.includes(speciesId))throw Error('This card does not match the selected Pokémon');
    if(!card.set?.id)throw Error('Missing set information');
    const set=await request(`${lang}/sets/${encodeURIComponent(card.set.id)}`);
    if(!set.serie?.id)throw Error('Cannot verify physical card set');
    if(set.serie.id==='tcgp')throw Error('Digital-only card');
    return {provider:'tcgdex',speciesId,cardId:card.id,cardLanguage:lang,name:String(card.name),setId:card.set.id,setName:String(card.set.name||set.name||card.set.id),collectorNumber:String(card.localId||''),seriesName:String(set.serie.name||set.serie.id),releaseDate:String(set.releaseDate||''),rarity:String(card.rarity||''),image:safeImage(card.image),variant:'unspecified',availableVariants:variants(card),firstEditionAvailable:!!card.variants?.firstEdition,firstEdition:false};
  }
  function validate(record,speciesId) {
    if(!record||record.speciesId!==speciesId||!['tcgdex','pokemon-jp','manual','supplement'].includes(record.provider)||!['en','ja','other'].includes(record.cardLanguage))return false;
    if(record.provider==='supplement'&&!(window.CARD_SUPPLEMENTS||[]).some(card=>card.cardId===record.cardId&&card.speciesId===speciesId&&card.cardLanguage===record.cardLanguage&&card.image===record.image))return false;
    for(const key of ['cardId','name','setId','setName','collectorNumber','variant'])if(typeof record[key]!=='string'||record[key].length>300)return false;
    if(!record.name.trim()||!record.cardId.trim())return false;
    if(record.provider==='pokemon-jp'&&(record.cardLanguage!=='ja'||!/^jp-\d+$/.test(record.cardId)))return false;
    if(record.image!==undefined&&(typeof record.image!=='string'||(record.image!==''&&safeImage(record.image)!==record.image)))return false;
    if(record.firstEdition!==undefined&&typeof record.firstEdition!=='boolean')return false;
    return true;
  }
  async function artwork(record,download=false) {
    const url=safeImage(record.image);if(!url)return null;
    const key='image:'+url, old=await cached(key);
    if(old?.blob)return URL.createObjectURL(old.blob);
    if(!download)return null;
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
    try {
      const response=await fetch(url,{signal:controller.signal});if(!response.ok)return null;
      const blob=await response.blob();if(!blob.type.startsWith('image/')||blob.size>5000000)return null;
      await remember(key,{blob});return URL.createObjectURL(blob);
    } catch{return null;}finally{clearTimeout(timer);}
  }
  return {list,details,validate,artwork,variants,safeImage};
})();
