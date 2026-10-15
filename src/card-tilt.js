'use strict';
// Delegate events so re-rendered binder cards need no individual listeners.
(()=>{
 const motion=window.matchMedia('(hover: hover) and (prefers-reduced-motion: no-preference)');
 let active=null,bounds=null,pending=null,frame=0;
 function reset(){if(frame)cancelAnimationFrame(frame);frame=0;pending=null;if(active){active.classList.remove('is-tilting');active.style.removeProperty('--tilt-x');active.style.removeProperty('--tilt-y');}active=null;bounds=null;}
 function paint(){frame=0;if(!active?.isConnected||!pending){reset();return;}const clamp=n=>Math.max(-1,Math.min(1,n));const x=clamp((pending.x-bounds.left)/bounds.width*2-1),y=clamp((pending.y-bounds.top)/bounds.height*2-1);active.style.setProperty('--tilt-x',(-y*6).toFixed(2)+'deg');active.style.setProperty('--tilt-y',(x*7).toFixed(2)+'deg');active.classList.add('is-tilting');}
 document.addEventListener('pointermove',event=>{
  if(!motion.matches||event.pointerType!=='mouse'){reset();return;}
  const card=event.target.closest('.binderGrid .exactPrinting');if(!card){reset();return;}
  if(card!==active){reset();active=card;bounds=(card.closest('.pocket')||card).getBoundingClientRect();}
  if(!bounds.width||!bounds.height){reset();return;}
  pending={x:event.clientX,y:event.clientY};if(!frame)frame=requestAnimationFrame(paint);
 },{passive:true});
 document.addEventListener('pointerout',event=>{if(active&&!active.contains(event.relatedTarget))reset();},{passive:true});
 document.addEventListener('pointerleave',reset);document.addEventListener('dragstart',reset);document.addEventListener('scroll',reset,{capture:true,passive:true});window.addEventListener('blur',reset);motion.addEventListener('change',reset);
})();
