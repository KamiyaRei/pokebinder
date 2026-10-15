'use strict';
window.BinderUI=(()=>{
 const createDialog=document.createElement('dialog');createDialog.id='binderCreateDialog';document.body.appendChild(createDialog);
 const pocketDialog=document.createElement('dialog');pocketDialog.id='freePocketDialog';document.body.appendChild(pocketDialog);
 let draftSlot=0,dragSource=null;
 function title(entry){return entry.printing?.name||(entry.speciesId?primaryName(D[entry.speciesId-1]):entry.title);}
 function art(entry){return entry.printing?.image?(printingImages.get(entry.printing.image)||entry.printing.image):entry.speciesId?D[entry.speciesId-1].image:'';}
 function image(entry,cls=''){const src=art(entry);return src?`<img class="${cls}" src="${esc(src)}" ${entry.speciesId?`data-fallback="${D[entry.speciesId-1].image}"`:''} alt="${esc(title(entry))}" loading="lazy">`:'<span class="customCardArt" aria-hidden="true">◆</span>';}
 function pocket(index,entry){
  if(!entry)return `<button class="emptyFreePocket" data-free-pocket="${index}" aria-label="${esc(t('addAtPocket',{slot:index+1}))}"><b>＋</b><span>${t('addCard')}</span><small>${index+1}</small></button>`;
  return `<article class="poke owned freeCard ${index===freePocketIndex?'selected':''} ${entry.printing?.image?'exactPrinting':''}" draggable="true" data-drag-pocket="${index}"><button class="open" data-free-pocket="${index}" aria-label="${esc(t('pocketLabel',{slot:index+1,name:title(entry),status:''}))}">${entry.printing?.image?'<span class="printingArt">'+image(entry,'printingFront')+'</span>'+printingCaption(entry.speciesId?D[entry.speciesId-1]:null,entry.printing):`<span class="number">${index+1}</span><span class="cardArt">${image(entry)}</span><span class="cardNames"><span class="name">${esc(title(entry))}</span><span class="ja">${entry.speciesId?esc(secondaryName(D[entry.speciesId-1])):''}</span></span><span class="cardType">${t('freeMode')}</span>`}</button></article>`;
 }
 function renderDetail(){
  const b=currentBinder(),entry=freePocketIndex===null?null:b.slots[freePocketIndex];
  $('detail').innerHTML=`<div class="freeDetail"><p class="eyebrow">${t('freeMode')}</p><div class="coverPreview" style="--cover:${b.color}"><span>PokéBinder</span><strong>${esc(binderName())}</strong><small>${b.columns} × ${b.rows} · ${t('pageCount',{count:b.pages})}</small></div>${entry?`<div class="freePortrait ${entry.printing?.image?'actualCard':''}">${image(entry)}</div><h2>${esc(title(entry))}</h2><p>${esc(binderName())} · ${t('page')} ${Math.floor(freePocketIndex/slotsPerPage())+1} · ${t('pocketNumber',{slot:freePocketIndex%slotsPerPage()+1})}</p>${entry.printing?`<p class="muted">${esc(entry.printing.setName)} · ${esc(printingNumber(entry.printing))}</p>`:''}<div class="freeActions"><button data-free-edit="${freePocketIndex}">${t('replaceContents')}</button>${entry.speciesId?`<button id="freePrinting">${t(entry.printing?'changeCard':'chooseCard')}</button>`:''}<button id="freeRemove">${t('removeFromPocket')}</button></div><label>${t('moveDestination')}<input id="moveDestination" type="number" min="1" max="${binderCapacity()}" value="${freePocketIndex+1}"></label><button id="moveFree">${t('moveSwap')}</button>`:`<h2>${esc(binderName())}</h2><p>${t('freeIntro')}</p><p class="muted">${t('freeIndependent')}</p>`}</div>`;
 }
 function settings(){
  updateOptions('settingsBinder',scopeBinders().map(({number})=>[number,binderName(number)]));$('settingsBinder').value=binder;
  $('binderNameInput').value=currentBinder().name;$('binderColorInput').value=currentBinder().color;
 }
 function saveSettings(value){
  const name=$('binderNameInput').value.trim(),color=$('binderColorInput').value;
  if(name.length>80||!/^#[a-fA-F0-9]{6}$/.test(color))throw Error(t('invalidBackup'));
  if(!validLayout(value))throw Error(t('invalidLayout'));
  // Do the lossy-operation check before changing identity or any other state.
  if(currentBinder().mode==='free'&&Object.keys(currentBinder().slots).some(k=>Number(k)>=BM.capacity(value)))throw Error(t('occupiedResize'));
  currentBinder().name=name;currentBinder().color=color;applyLayout(value);
 }
 function openCreate(){
  createDialog.innerHTML=`<div class="dialogHeading"><h2>${t(binderScope==='free'?'newFreeBinder':'newDexBinder')}</h2><button id="cancelCreate">${t('cancel')}</button></div><form id="createBinderForm"><label>${t('binderName')}<input id="newBinderName" maxlength="80" placeholder="${esc(t('binder',{number:binders.length+1}))}"></label><p class="modeNotice">${t(binderScope==='free'?'freeMode':'dexMode')}<small>${t(binderScope==='free'?'freeIndependent':'dexSequential')}</small></p><div class="binderIdentity"><label>${t('preset')}<select id="newLayout"><option value="4x3">4 × 3</option><option value="3x3">3 × 3</option><option value="2x2">2 × 2</option><option value="4x4">4 × 4</option></select></label><label>${t('pages')}<input id="newPages" type="number" min="1" max="200" value="20" required></label><label>${t('coverColor')}<input id="newColor" type="color" value="${binderScope==='free'?'#8b4e82':'#295c48'}"></label></div><p class="muted">${t('editLater')}</p><button class="mark" type="submit">${t('createBinder')}</button></form>`;
  createDialog.showModal();
 }
 function openPocket(index){
  if(currentBinder().mode!=='free'||!Number.isInteger(index)||index<0||index>=binderCapacity())return;
  freePocketIndex=index;renderDetail();
  if(!currentBinder().slots[index])editPocket(index);
  else renderBinder();
 }
 function editPocket(index){
  draftSlot=index;
  pocketDialog.innerHTML=`<div class="dialogHeading"><h2>${t('addAtPocket',{slot:index+1})}</h2><button id="cancelPocket">${t('cancel')}</button></div><p class="muted">${t('freeIndependent')}</p><input id="freeSpeciesSearch" type="search" placeholder="${esc(t('placeholder'))}" aria-label="${esc(t('search'))}"><div id="freeSpeciesResults" class="speciesResults"></div><form id="customPocketForm"><label>${t('customCard')}<input id="customCardTitle" maxlength="150" placeholder="${esc(t('customCardExample'))}" required></label><button type="submit">${t('addCard')}</button></form>`;
  speciesResults();pocketDialog.showModal();
 }
 function speciesResults(){const query=norm($('freeSpeciesSearch').value),items=D.filter(p=>!query||(/^\d+$/.test(query)?p.id===Number(query):searchable[p.id-1].includes(query))).slice(0,24);$('freeSpeciesResults').innerHTML=items.map(p=>`<button data-free-species="${p.id}"><img src="${p.image}" alt="" loading="lazy"><span><small>#${num(p.id)}</small>${esc(primaryName(p))}<small>${esc(secondaryName(p))}</small></span></button>`).join('')||`<p>${t('noResults')}</p>`;}
 function put(entry){currentBinder().slots[draftSlot]=entry;freePocketIndex=draftSlot;save();render();pocketDialog.close();}
 function choosePrinting(){
  const b=currentBinder(),index=freePocketIndex,entry=b.slots[index];if(!entry?.speciesId)return;
  window.CardPicker.open(entry.speciesId,{existing:entry.printing,onAssign:record=>{
   const target=binders.find(x=>x.id===b.id);if(!target||index>=BM.capacity(target))return;
   target.slots[index]={speciesId:entry.speciesId,printing:{...record}};save();render();
   window.TCGCatalog.artwork(record,true).then(url=>{if(url){printingImages.set(record.image,url);render();}}).catch(()=>{});
  }});
 }
 $('newBinder').onclick=openCreate;$('editBinder').onclick=openBinderSettings;
 $('settingsBinder').onchange=()=>{binder=Number($('settingsBinder').value);sheet=1;freePocketIndex=null;syncBinder();openBinderSettings();render();};
 document.addEventListener('click',event=>{
  const slot=event.target.closest('[data-free-pocket]'),edit=event.target.closest('[data-free-edit]');
  if(slot)openPocket(Number(slot.dataset.freePocket));else if(edit)editPocket(Number(edit.dataset.freeEdit));
  else if(event.target.id==='freePrinting')choosePrinting();
  else if(event.target.id==='freeRemove'){
   if(confirm(t('removePocketConfirm'))){delete currentBinder().slots[freePocketIndex];save();render();}
  }else if(event.target.id==='moveFree'){
   const to=Number($('moveDestination').value)-1;
   try{BM.move(currentBinder(),freePocketIndex,to);freePocketIndex=to;sheet=Math.floor(to/slotsPerPage())+1;save();render();}catch{toast(t('invalidDestination'));}
  }
 });
 createDialog.addEventListener('click',e=>{if(e.target.id==='cancelCreate')createDialog.close();});
 createDialog.addEventListener('submit',e=>{
  if(e.target.id!=='createBinderForm')return;e.preventDefault();
  const [columns,rows]=$('newLayout').value.split('x').map(Number),pages=Number($('newPages').value),mode=binderScope;
  try{const b=BM.create(mode,{columns,rows,pages});b.name=$('newBinderName').value.trim();b.color=$('newColor').value;if(b.name.length>80||!/^#[a-fA-F0-9]{6}$/.test(b.color))throw Error();binders.push(b);binder=binders.length;sheet=1;freePocketIndex=null;syncBinder();save();createDialog.close();switchTab('binder');}catch{toast(t('invalidLayout'));}
 });
 pocketDialog.addEventListener('click',e=>{const p=e.target.closest('[data-free-species]');if(p)put({speciesId:Number(p.dataset.freeSpecies)});else if(e.target.id==='cancelPocket')pocketDialog.close();});
 pocketDialog.addEventListener('input',e=>{if(e.target.id==='freeSpeciesSearch')speciesResults();});
 pocketDialog.addEventListener('submit',e=>{if(e.target.id!=='customPocketForm')return;e.preventDefault();const title=$('customCardTitle').value.trim();if(title&&title.length<=150)put({speciesId:0,title});});
 document.addEventListener('dragstart',e=>{const el=e.target.closest('[data-drag-pocket]');if(!el)return;dragSource={binderId:currentBinder().id,index:Number(el.dataset.dragPocket)};e.dataTransfer.setData('text/plain','pokebinder-pocket');});
 document.addEventListener('dragover',e=>{if(dragSource&&e.target.closest('[data-free-pocket]'))e.preventDefault();});
 document.addEventListener('drop',e=>{const el=e.target.closest('[data-free-pocket]');if(!dragSource||!el||dragSource.binderId!==currentBinder().id)return;e.preventDefault();BM.move(currentBinder(),dragSource.index,Number(el.dataset.freePocket));dragSource=null;save();render();});
 document.addEventListener('dragend',()=>{dragSource=null;});
 return {pocket,renderDetail,settings,saveSettings};
})();
render();
