const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const events={},values={},classes=new Set(),frames=new Map();let sequence=0;
const motion={matches:true,addEventListener:(name,fn)=>events['motion:'+name]=fn};
const pocket={getBoundingClientRect:()=>({left:100,top:100,width:200,height:300})};
const card={isConnected:true,style:{setProperty:(k,v)=>values[k]=v,removeProperty:k=>delete values[k]},classList:{add:k=>classes.add(k),remove:k=>classes.delete(k)},closest:()=>pocket,contains:target=>target===card};
const target={closest:()=>card};
const context={window:{matchMedia:()=>motion,addEventListener:(name,fn)=>events[name]=fn},document:{addEventListener:(name,fn)=>events[name]=fn},requestAnimationFrame:fn=>{frames.set(++sequence,fn);return sequence;},cancelAnimationFrame:id=>frames.delete(id)};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../src/card-tilt.js'),'utf8'),context);
function move(x,y,type='mouse'){events.pointermove({target,clientX:x,clientY:y,pointerType:type});}
function flush(){for(const [id,fn] of [...frames]){frames.delete(id);fn();}}
move(100,100);flush();assert.equal(values['--tilt-x'],'6.00deg');assert.equal(values['--tilt-y'],'-7.00deg');assert(classes.has('is-tilting'));
move(300,400);move(200,250);assert.equal(frames.size,1,'One update per animation frame');flush();assert.equal(values['--tilt-x'],'0.00deg');assert.equal(values['--tilt-y'],'0.00deg');
move(300,400);flush();assert.equal(values['--tilt-x'],'-6.00deg');assert.equal(values['--tilt-y'],'7.00deg');
events.pointerout({relatedTarget:card});assert(classes.has('is-tilting'));events.pointerout({relatedTarget:null});assert(!classes.size);assert(!Object.keys(values).length);
move(200,200);events.scroll();assert.equal(frames.size,0);assert(!classes.size);
motion.matches=false;move(100,100);flush();assert(!classes.size);motion.matches=true;move(100,100,'touch');flush();assert(!classes.size);
move(100,100);card.isConnected=false;flush();assert(!classes.size);
console.log('TILT PASS: cursor direction, centered position, one frame update, exit/scroll cleanup, reduced motion, touch and detached cards.');
