'use strict';
// Optional printing selection. The original species check mark remains independent.
(() => {
  const dialog=document.createElement('dialog');dialog.id='cardPicker';dialog.className='cardPicker';document.body.appendChild(dialog);
  let speciesId=1,cardLanguage='en',cards=[],record=null,visible=24,sequence=0,target=null,archive=false;
  function shell(content) {
    const source=cardLanguage==='ja'&&!archive&&window.JAPANESE_CARDS?t('officialJapaneseSource',{count:window.JAPANESE_CARDS.cards.length,date:window.JAPANESE_CARDS.importedAt.slice(0,10)}):t('cardCatalogSource');
    dialog.innerHTML=`<div class="pickerHeader"><div><h2>${t('cardPickerTitle')}</h2><p>№ ${num(speciesId)} · ${esc(primaryName(D[speciesId-1]))}</p></div><button type="button" id="closePicker" aria-label="${esc(t('closePicker'))}">×</button></div><div class="pickerBody">${content}</div><div class="pickerFooter">${esc(source)}</div>`;
  }
  function sourceSelect(){return cardLanguage==='ja'?`<label class="catalogSourceLabel">${t('catalogSource')}<select id="printingSource"><option value="official" ${!archive?'selected':''}>${t('officialCatalog')}</option><option value="archive" ${archive?'selected':''}>${t('archiveCatalog')}</option></select></label>`:'';}
  function listView(loading=false,error=false) {
    visible=24;
    const setNames=new Map(cards.map(card=>[card.setId,card.setName]));
    shell(`${sourceSelect()}<div class="pickerFilters"><label>${t('cardLanguage')}<select id="printingLanguage"><option value="en" ${cardLanguage==='en'?'selected':''}>English</option><option value="ja" ${cardLanguage==='ja'?'selected':''}>日本語</option></select></label><label>${t('cardSet')}<select id="printingSet"><option value="all">${t('allSets')}</option>${[...setNames].sort((a,b)=>a[1].localeCompare(b[1])).map(([id,name])=>`<option value="${esc(id)}">${esc(name)} · ${esc(id)}</option>`).join('')}</select></label><label>${t('cardSort')}<select id="printingSort"><option value="set">${t('sortSet')}</option><option value="number">${t('sortNumber')}</option><option value="name">${t('sortName')}</option></select></label></div><input id="printingSearch" class="printingSearch" type="search" aria-label="${esc(t('cardSearch'))}" placeholder="${esc(t('cardSearch'))}"><div class="pickerListHeading"><span id="printingCount"></span><button type="button" id="manualPrinting">${t('manualCard')}</button></div><div id="printingResults" class="printingResults">${loading?`<p class="pickerMessage">${t('catalogLoading')}</p>`:error?`<p class="pickerMessage">${t('catalogError')}<br><button type="button" id="retryPrinting">${t('retry')}</button></p>`:''}</div><button type="button" id="morePrintings" class="morePrintings" hidden>${t('moreCards')}</button>`);
    if(!loading&&!error)results();
  }
  function results() {
    const query=norm($('printingSearch').value),set=$('printingSet').value,sort=$('printingSort').value;
    const items=cards.filter(card=>(set==='all'||card.setId===set)&&(!query||norm(card.name+' '+card.setName+' '+card.setId+' '+card.number+' '+(card.officialId||'')).includes(query)));
    const collator=new Intl.Collator(cardLanguage,{numeric:true,sensitivity:'base'});
    items.sort((a,b)=>sort==='name'?collator.compare(a.name,b.name)||collator.compare(a.number,b.number):sort==='number'?collator.compare(a.number,b.number)||collator.compare(a.setName,b.setName):collator.compare(a.setName,b.setName)||collator.compare(a.number,b.number));
    $('printingCount').textContent=t('cardCount',{count:items.length});
    $('printingResults').innerHTML=items.slice(0,visible).map(card=>`<button type="button" class="printingCandidate" data-candidate="${esc(card.id)}"><span class="candidateArtwork"><img src="${esc(card.image||D[speciesId-1].image)}" data-fallback="${D[speciesId-1].image}" alt="${esc(card.name)}" loading="lazy">${!card.image?`<small>${t('noCardImage')}</small>`:''}</span><strong>${esc(card.name)}</strong><span>${esc(card.setName)}${card.provider==='supplement'?' · '+esc(t('supplementTag')):''}</span><small>${esc(card.setId)}${card.number?' · #'+esc(card.number):card.officialId?' · '+esc(t('catalogId',{id:card.officialId})):''}</small></button>`).join('')||`<p class="pickerMessage">${t('catalogEmpty')}</p>`;
    $('morePrintings').hidden=items.length<=visible;
  }
  async function loadList(refresh=false) {
    const requestId=++sequence;cards=[];record=null;listView(true);
    try{const list=await window.TCGCatalog.list(speciesId,cardLanguage,{refresh,archive});if(requestId!==sequence||!dialog.open)return;cards=list;listView();}
    catch{if(requestId===sequence&&dialog.open)listView(false,true);}
  }
  async function loadDetails(cardId) {
    const requestId=++sequence;record=null;
    shell(`<button type="button" id="printingBack">${t('cardBack')}</button><p class="pickerMessage">${t('cardDetailsLoading')}</p>`);
    try{const item=await window.TCGCatalog.details(speciesId,cardLanguage,cardId);if(requestId!==sequence||!dialog.open)return;record=item;detailView();}
    catch{if(requestId===sequence&&dialog.open)shell(`<button type="button" id="printingBack">${t('cardBack')}</button><p class="pickerMessage">${t('cardDetailsError')}</p><button type="button" id="manualPrinting">${t('manualCard')}</button>`);}
  }
  function detailView() {
    const existing=target?target.existing:printings[speciesId];
    const variant=existing?.cardId===record.cardId&&existing.cardLanguage===record.cardLanguage&&record.availableVariants.includes(existing.variant)?existing.variant:record.availableVariants[0];
    shell(`<button type="button" id="printingBack">${t('cardBack')}</button><div class="printingDetail"><div class="chosenArtwork"><img src="${esc(record.image||D[speciesId-1].image)}" data-fallback="${D[speciesId-1].image}" alt="${esc(record.name)}">${!record.image?`<p>${t('noCardImage')}</p>`:''}</div><div><p class="eyebrow">${t('cardDetails')}</p><h3>${esc(record.name)}</h3><p>${esc(record.setName)}<br><strong>${esc(record.setId)} · ${esc(printingNumber(record))}</strong></p><p class="muted">${esc([record.seriesName,record.releaseDate,record.rarity,record.cardLanguage.toUpperCase()].filter(Boolean).join(" · "))}</p>${record.provider==='pokemon-jp'?`<p><a href="https://www.pokemon-card.com/card-search/details.php/card/${record.cardId.slice(3)}/regu/all" target="_blank" rel="noopener noreferrer">${t('officialCardPage')} ↗</a></p>`:''}${record.provider==='supplement'?`<p class="supplementNote">${t('supplementSource')} <a href="https://www.c-labo-online.jp/product/408773" target="_blank" rel="noopener noreferrer">${t('sourcePage')} ↗</a></p>`:''}<p class="muted artworkNote">${t(record.provider==='pokemon-jp'?'officialFinishHint':'catalogArtworkHint')}</p>${record.provider==='pokemon-jp'&&!record.collectorNumber?`<label>${t('manualNumber')}<input id="officialCollectorNumber" maxlength="50" placeholder="${esc(t('optional'))}" value="${esc(existing?.cardId===record.cardId?existing.collectorNumber:'')}"></label>`:''}<label>${t('cardVariant')}<select id="printingVariant">${record.availableVariants.map(key=>`<option value="${esc(key)}" ${variant===key?'selected':''}>${esc(variantLabel(key))}</option>`).join('')}</select></label>${record.firstEditionAvailable?`<label class="editionToggle"><input id="printingFirstEdition" type="checkbox" ${existing?.cardId===record.cardId&&existing.cardLanguage===record.cardLanguage&&existing.firstEdition?'checked':''}>${t('firstEdition')}</label>`:''}<button type="button" id="insertPrinting" class="mark">${t('insertCard')}</button></div></div>`);
  }
  function manualView() {
    sequence++;record=null;
    shell(`<button type="button" id="printingBack">${t('cardBack')}</button><p class="muted">${t('manualHint')}</p><form id="manualPrintingForm" class="manualPrintingForm"><label>${t('manualName')}<input id="manualCardName" maxlength="150" required value="${esc(primaryName(D[speciesId-1]))}"></label><div><label>${t('manualSet')}<input id="manualCardSet" maxlength="150"></label><label>${t('manualNumber')}<input id="manualCardNumber" maxlength="50"></label></div><div><label>${t('cardLanguage')}<select id="manualCardLanguage"><option value="en" ${cardLanguage==='en'?'selected':''}>English</option><option value="ja" ${cardLanguage==='ja'?'selected':''}>日本語</option><option value="other">${t('otherCardLanguage')}</option></select></label><label>${t('cardVariant')}<select id="manualCardVariant">${['unspecified','normal','holo','reverse','other'].map(key=>`<option value="${key}">${variantLabel(key)}</option>`).join('')}</select></label></div><button type="submit" class="mark">${t('insertCard')}</button></form>`);
  }
  function open(id,options=null) {
    target=options;archive=false;speciesId=id;cardLanguage=(target?target.existing:printings[id])?.cardLanguage==='ja'?'ja':language==='ja'?'ja':'en';
    shell('');dialog.showModal();loadList();
  }
  function finish(item) {if(target?.onAssign)target.onAssign(item);else assignPrinting(speciesId,item);sequence++;dialog.close();}
  document.addEventListener('click',event=>{
    const choose=event.target.closest('[data-choose-printing]'),clear=event.target.closest('[data-clear-printing]');
    if(choose)open(Number(choose.dataset.choosePrinting));
    else if(clear)clearPrinting(Number(clear.dataset.clearPrinting));
  });
  dialog.addEventListener('click',event=>{
    const candidate=event.target.closest('[data-candidate]');
    if(candidate)loadDetails(candidate.dataset.candidate);
    else if(event.target.id==='closePicker'){sequence++;dialog.close();}
    else if(event.target.id==='manualPrinting')manualView();
    else if(event.target.id==='retryPrinting')loadList(true);
    else if(event.target.id==='printingBack'){sequence++;record=null;listView();}
    else if(event.target.id==='morePrintings'){visible+=24;results();}
    else if(event.target.id==='insertPrinting'&&record){finish({...record,collectorNumber:record.collectorNumber||$('officialCollectorNumber')?.value.trim()||'',variant:$('printingVariant').value,firstEdition:!!$('printingFirstEdition')?.checked});}
  });
  dialog.addEventListener('change',event=>{
    if(event.target.id==='printingLanguage'){cardLanguage=event.target.value;archive=false;loadList();}
    else if(event.target.id==='printingSource'){archive=event.target.value==='archive';loadList();}
    else if(['printingSet','printingSort'].includes(event.target.id)){visible=24;results();}
  });
  dialog.addEventListener('input',event=>{if(event.target.id==='printingSearch'){visible=24;results();}});
  dialog.addEventListener('submit',event=>{
    if(event.target.id!=='manualPrintingForm')return;event.preventDefault();
    const name=$('manualCardName').value.trim();if(!name){toast(t('manualRequired'));return;}
    finish({provider:'manual',speciesId,cardId:'manual-'+Date.now(),cardLanguage:$('manualCardLanguage').value,name,setId:$('manualCardSet').value.trim(),setName:$('manualCardSet').value.trim(),collectorNumber:$('manualCardNumber').value.trim(),variant:$('manualCardVariant').value,image:'',firstEdition:false});
  });
  window.CardPicker={open};
  dialog.addEventListener('close',()=>{sequence++;});
})();
