/* Availability-only range selection. Does not modify the group demo or its controls. */
let availabilitySelection=null;
const rangeBookingsBase=availabilityBookings;
availabilityBookings=function(row){return [...rangeBookingsBase(row),...(state.availabilityEntries||[]).filter(b=>b.unit===row.unit&&b.type===row.type)];};
function availabilityRange(row,first,last){
 const start=first<last?first:last,end=availabilityDate(first>last?first:last,1);
 return {...row,start,end};
}
function availabilityRangeFree(range){return !availabilityBookings(range).some(b=>b.start<range.end&&b.end>range.start);}
function saveAvailabilityRange(kind,values){
 requireState(availabilitySelection&&availabilityRangeFree(availabilitySelection),'These dates are no longer available. Select another range.');
 const r=availabilitySelection;
 const entry={...r,id:'AV-'+Date.now(),label:kind==='ooo'?'Out of order':values.guest.trim(),status:kind==='ooo'?'Out of order':'Confirmed',reason:values.reason?.trim(),email:values.email?.trim(),createdAt:new Date().toISOString()};
 requireState(kind==='ooo'?entry.reason:entry.label,kind==='ooo'?'Enter the reason.':'Enter the guest name.');
 (state.availabilityEntries??=[]).push(entry);save();return entry;
}
const rangeHandleBase=handle,rangeOverlayBase=renderOverlay;
handle=function(action,el){
 if(action==='availability-range-new'||action==='availability-range-ooo'){
  if(!availabilitySelection)return;
  openModal(action);return;
 }
 if(action==='availability-range-save-new'||action==='availability-range-save-ooo'){
  const form=document.querySelector('#availability-range-form');if(!form.reportValidity())return;
  try{saveAvailabilityRange(action.endsWith('ooo')?'ooo':'new',Object.fromEntries(new FormData(form)));modal=null;availabilitySelection=null;render();toast(action.endsWith('ooo')?'Room marked out of order.':'Reservation created.');}catch(error){document.querySelector('#availability-range-error').textContent=error.message;}return;
 }
 return rangeHandleBase(action,el);
};
renderOverlay=function(){
 if(!['availability-range-new','availability-range-ooo'].includes(modal))return rangeOverlayBase();
 const r=availabilitySelection,ooo=modal.endsWith('ooo');
 document.body.style.overflow='hidden';
 document.querySelector('#overlay').innerHTML=`<div class="modal-backdrop"><section class="modal small" role="dialog" aria-modal="true" aria-labelledby="range-title"><header class="modal-header" id="range-title">${ooo?'Out of Order':'New Reservation'}</header><div class="modal-content"><form id="availability-range-form"><p>${esc(r.type)} · ${esc(r.unit)}</p><div class="grid2">${field('Start Date','start',r.start,'date','readonly')}${field('End Date','end',r.end,'date','readonly')}</div>${ooo?textarea('Reason','reason',''):field('Guest Name','guest','','text','required')+field('Email','email','','email')}<p id="availability-range-error" role="alert"></p></form></div><footer class="modal-footer">${button('Cancel','close-modal')}${button(ooo?'Save':'Create reservation',ooo?'availability-range-save-ooo':'availability-range-save-new','primary')}</footer></section></div>`;
};
(()=>{
 let drag=null,menu=null;
 const clear=()=>{menu?.remove();menu=null;document.querySelectorAll('.calendar-selection').forEach(x=>x.remove());};
 const cellInfo=el=>{
  const cell=el?.closest?.('.calendar-cell');if(!cell)return null;
  const row=cell.closest('.calendar-row'),track=cell.parentElement;
  const unit=row.querySelector('.unit-label').textContent.trim(),type=row.children[1].textContent.trim();
  return {cell,track,row:availabilityUnits().find(r=>r.unit===unit&&r.type===type),index:[...track.querySelectorAll('.calendar-cell')].indexOf(cell)};
 };
 const dateAt=i=>availabilityDate(availabilityDate(availability.start,-3),i);
 function paint(){
  clear();const from=Math.min(drag.first,drag.last),to=Math.max(drag.first,drag.last),cells=drag.track.querySelectorAll('.calendar-cell');
  const box=document.createElement('div');box.className='calendar-selection';box.style.left=cells[from].offsetLeft+'px';box.style.width=(cells[to].offsetLeft+cells[to].offsetWidth-cells[from].offsetLeft)+'px';drag.track.append(box);
 }
 document.addEventListener('pointerdown',event=>{
  if(event.button!==0||modal||event.target.closest('.availability-cell-menu'))return;
  clear();const info=cellInfo(event.target);if(!info?.row)return;
  const range=availabilityRange(info.row,dateAt(info.index),dateAt(info.index));if(!availabilityRangeFree(range))return;
  event.preventDefault();drag={...info,first:info.index,last:info.index};document.body.classList.add('availability-selecting');document.querySelectorAll('.design-hover').forEach(x=>x.remove());paint();
 });
 document.addEventListener('pointermove',event=>{
  if(!drag)return;
  const bounds=drag.track.getBoundingClientRect(),cells=drag.track.querySelectorAll('.calendar-cell');
  const index=Math.max(0,Math.min(cells.length-1,Math.floor((event.clientX-bounds.left)/cells[0].offsetWidth)));
  if(availabilityRangeFree(availabilityRange(drag.row,dateAt(drag.first),dateAt(index)))){drag.last=index;paint();}
 });
 document.addEventListener('pointerup',event=>{
  if(!drag)return;
  availabilitySelection=availabilityRange(drag.row,dateAt(drag.first),dateAt(drag.last));drag=null;document.body.classList.remove('availability-selecting');
  menu=document.createElement('div');menu.className='availability-cell-menu';menu.setAttribute('role','menu');menu.setAttribute('aria-label','Selected room actions');
  menu.innerHTML=`<button role="menuitem" data-action="availability-range-new">${img('3f327.svg')}New Reservation</button><button role="menuitem" data-action="availability-range-ooo">${img('83a4c.svg')}Out of Order</button>`;
  const selected=document.querySelector('.calendar-selection').getBoundingClientRect();
  menu.style.left=Math.max(8,Math.min(event.clientX-30,innerWidth-181))+'px';menu.style.top=Math.max(8,Math.min(selected.bottom+2,innerHeight-92))+'px';document.body.append(menu);
 });
 document.addEventListener('click',event=>{if(event.target.closest('.availability-cell-menu'))clear();});
 document.addEventListener('keydown',event=>{if(event.key==='Escape'){drag=null;document.body.classList.remove('availability-selecting');clear();}});
 document.addEventListener('pointercancel',()=>{drag=null;document.body.classList.remove('availability-selecting');clear();});
 window.addEventListener('scroll',()=>{if(!drag)clear();},true);
})();
render();
/* A real top scrollbar for the Availability timeline, matching the Figma rail. */
(()=>{
 let scrolling=null;
 const elements=()=>({bar:document.querySelector('.calendar-scrollbar'),view:document.querySelector('.calendar-scroll')});
 function sync(){
  const {bar,view}=elements();if(!bar||!view)return;
  const max=Math.max(0,view.scrollWidth-view.clientWidth),thumb=bar.firstElementChild;
  const width=Math.min(bar.clientWidth,Math.max(24,bar.clientWidth*view.clientWidth/view.scrollWidth));
  thumb.style.width=width+'px';thumb.style.left=(max?(bar.clientWidth-width)*view.scrollLeft/max:0)+'px';
  bar.setAttribute('aria-valuenow',String(max?Math.round(view.scrollLeft/max*100):0));
  bar.setAttribute('aria-disabled',String(!max));
 }
 document.addEventListener('scroll',event=>{if(event.target.matches?.('.calendar-scroll'))sync();},true);
 document.addEventListener('pointerdown',event=>{
  const bar=event.target.closest?.('.calendar-scrollbar');if(!bar||event.button!==0)return;
  const {view}=elements(),max=view.scrollWidth-view.clientWidth;if(max<=0)return;
  event.preventDefault();sync();bar.focus({preventScroll:true});
  const thumb=bar.firstElementChild,track=bar.getBoundingClientRect(),width=thumb.getBoundingClientRect().width;
  if(event.target!==thumb)view.scrollLeft=Math.max(0,Math.min(max,(event.clientX-track.left-width/2)/(bar.clientWidth-width)*max));
  scrolling={bar,view,x:event.clientX,start:view.scrollLeft,max,travel:bar.clientWidth-width};bar.setPointerCapture(event.pointerId);sync();
 });
 document.addEventListener('pointermove',event=>{if(!scrolling)return;scrolling.view.scrollLeft=scrolling.start+(event.clientX-scrolling.x)/scrolling.travel*scrolling.max;sync();});
 document.addEventListener('pointerup',()=>{scrolling=null;});document.addEventListener('pointercancel',()=>{scrolling=null;});
 document.addEventListener('keydown',event=>{
  if(!event.target.matches?.('.calendar-scrollbar'))return;
  const {view}=elements(),max=view.scrollWidth-view.clientWidth;
  const changes={ArrowLeft:-64,ArrowRight:64,PageUp:-view.clientWidth,PageDown:view.clientWidth};
  if(event.key==='Home')view.scrollLeft=0;else if(event.key==='End')view.scrollLeft=max;else if(event.key in changes)view.scrollLeft+=changes[event.key];else return;
  event.preventDefault();sync();
 });
 document.addEventListener('input',()=>{if(typeof requestAnimationFrame==='function')requestAnimationFrame(sync);});
 document.addEventListener('change',()=>{if(typeof requestAnimationFrame==='function')requestAnimationFrame(sync);});
 if(typeof MutationObserver==='function')new MutationObserver(sync).observe(document.querySelector('#app'),{childList:true,subtree:true});
 if(typeof ResizeObserver==='function')new ResizeObserver(sync).observe(document.querySelector('#app'));
 sync();
})();
