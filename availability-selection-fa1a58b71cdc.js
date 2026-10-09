/* Availability-only range selection. Does not modify the group demo or its controls. */
let availabilitySelection=null;
const rangeBookingsBase=availabilityBookings;
availabilityBookings=function(row){return [...rangeBookingsBase(row),...(state.availabilityEntries||[]).filter(b=>b.unit===row.unit&&b.type===row.type)];};
function availabilityRange(row,first,last){
 const start=first<last?first:last,final=first>last?first:last,end=availability.type==='Hourly'?new Date(Date.parse(final+'Z')+(availability.interval||30)*60000).toISOString().slice(0,16):availabilityDate(final,1);
 return {...row,start,end};
}
function availabilityRangeFree(range){return !availabilityBookings(range).some(b=>Date.parse(b.start)<Date.parse(range.end)&&Date.parse(b.end)>Date.parse(range.start));}
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
 document.querySelector('#overlay').innerHTML=`<div class="modal-backdrop"><section class="modal small" role="dialog" aria-modal="true" aria-labelledby="range-title"><header class="modal-header" id="range-title">${ooo?'Out of Order':'New Reservation'}</header><div class="modal-content"><form id="availability-range-form"><p>${esc(r.type)} · ${esc(r.unit)}</p><div class="grid2">${field('Start Date','start',r.start,availability.type==='Hourly'?'datetime-local':'date','readonly')}${field('End Date','end',r.end,availability.type==='Hourly'?'datetime-local':'date','readonly')}</div>${ooo?textarea('Reason','reason',''):field('Guest Name','guest','','text','required')+field('Email','email','','email')}<p id="availability-range-error" role="alert"></p></form></div><footer class="modal-footer">${button('Cancel','close-modal')}${button(ooo?'Save':'Create reservation',ooo?'availability-range-save-ooo':'availability-range-save-new','primary')}</footer></section></div>`;
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
 const dateAt=i=>availability.type==='Hourly'?new Date(Date.parse(availability.start+'T'+(availability.time||'00:00')+':00Z')+i*(availability.interval||30)*60000).toISOString().slice(0,16):availabilityDate(availabilityDate(availability.start,-3),i);
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
/* SLDS 2 calendar interaction, scoped to the two Availability filters. */
(()=>{
 let popup=null,trigger=null,month=null,focused=null;
 const iso=date=>date.toISOString().slice(0,10);
 const date=value=>new Date(value+'T12:00:00Z');
 const current=name=>document.querySelector('#availability-filters input[name="'+name+'"]');
 function close(restore=false){popup?.remove();popup=null;trigger?.setAttribute('aria-expanded','false');if(restore)trigger?.focus({preventScroll:true});}
 function allowed(value){return trigger.dataset.datepickerField!=='end'||value>current('start').value;}
 function draw(){
  const selected=current(trigger.dataset.datepickerField).value,year=month.getUTCFullYear(),m=month.getUTCMonth();
  const first=new Date(Date.UTC(year,m,1,12)),from=availabilityDate(iso(first),-first.getUTCDay()),today=iso(new Date());
  popup.innerHTML='<div class="availability-datepicker-header"><button type="button" data-calendar-action="prev" aria-label="Previous month">‹</button><b aria-live="polite">'+month.toLocaleDateString('en-US',{month:'long',timeZone:'UTC'})+'</b><select aria-label="Calendar year">'+Array.from({length:21},(_,i)=>year-10+i).map(y=>'<option '+(y===year?'selected':'')+'>'+y+'</option>').join('')+'</select><button type="button" data-calendar-action="next" aria-label="Next month">›</button></div><table role="grid" aria-label="'+month.toLocaleDateString('en-US',{month:'long',year:'numeric',timeZone:'UTC'})+'"><thead><tr>'+['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d=>'<th scope="col">'+d+'</th>').join('')+'</tr></thead><tbody>'+Array.from({length:6},(_,row)=>'<tr>'+Array.from({length:7},(_,col)=>{const value=availabilityDate(from,row*7+col),day=date(value);return '<td role="gridcell" aria-selected="'+(value===selected)+'"><button type="button" data-calendar-date="'+value+'" aria-label="'+dateLabel(value)+'" '+(!allowed(value)?'disabled':'')+' tabindex="'+(value===(focused||selected)?0:-1)+'" class="'+(day.getUTCMonth()!==m?'outside ':'')+(value===selected?'selected ':'')+(value===today?'today':'')+'">'+day.getUTCDate()+'</button></td>';}).join('')+'</tr>').join('')+'</tbody></table><div class="availability-datepicker-footer"><button type="button" data-calendar-action="today" '+(!allowed(today)?'disabled':'')+'>Today</button></div>';
  const box=trigger.getBoundingClientRect();popup.style.left=Math.max(8,Math.min(box.left,innerWidth-293))+'px';popup.style.top=Math.max(8,Math.min(box.bottom+4,innerHeight-330))+'px';
 }
 function pick(value){
  if(!allowed(value))return;
  const name=trigger.dataset.datepickerField,input=current(name);input.value=value;trigger.querySelector('span').textContent=dateLabel(value);
  if(name==='start'&&current('end')&&current('end').value<=value){const next=availabilityDate(value,1);current('end').value=next;document.querySelector('[data-datepicker-field="end"] span').textContent=dateLabel(next);}
  input.dispatchEvent(new Event('change',{bubbles:true}));close(true);
 }
 document.addEventListener('click',event=>{
  const button=event.target.closest('[data-datepicker-field]');
  if(button){const wasOpen=popup&&trigger===button;close();if(wasOpen)return;trigger=button;focused=current(button.dataset.datepickerField).value;month=date(focused);month.setUTCDate(1);popup=document.createElement('section');popup.className='availability-datepicker';popup.setAttribute('role','dialog');popup.setAttribute('aria-label',button.dataset.datepickerField==='start'?'Choose Start Date':'Choose End Date');document.body.append(popup);trigger.setAttribute('aria-expanded','true');draw();popup.querySelector('[data-calendar-date="'+focused+'"]').focus({preventScroll:true});return;}
  if(!popup)return;
  if(!popup.contains(event.target)){close();return;}
  const target=event.target.closest('button');if(!target||target.disabled)return;
  if(target.dataset.calendarDate)return pick(target.dataset.calendarDate);
  if(target.dataset.calendarAction==='today')return pick(iso(new Date()));
  month.setUTCMonth(month.getUTCMonth()+(target.dataset.calendarAction==='prev'?-1:1));draw();
 });
 document.addEventListener('change',event=>{if(popup?.contains(event.target)&&event.target.matches('select')){month.setUTCFullYear(Number(event.target.value));draw();}});
 document.addEventListener('keydown',event=>{
  if(!popup)return;if(event.key==='Escape'){event.preventDefault();close(true);return;}
  const cell=event.target.closest('[data-calendar-date]');if(!cell)return;
  const offsets={ArrowLeft:-1,ArrowRight:1,ArrowUp:-7,ArrowDown:7};if(!(event.key in offsets))return;
  event.preventDefault();const value=availabilityDate(cell.dataset.calendarDate,offsets[event.key]);if(!allowed(value))return;
  focused=value;month=date(value);month.setUTCDate(1);draw();popup.querySelector('[data-calendar-date="'+value+'"]').focus({preventScroll:true});
 });
 window.addEventListener('scroll',()=>close(),true);window.addEventListener('resize',()=>close());
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

// Switch calendar scale immediately; the existing Search applies remaining filters.
document.addEventListener('change',e=>{if(e.target.closest('#availability-filters')&&e.target.name==='type'){const values=Object.fromEntries(new FormData(e.target.form));availability={...availability,...values,type:e.target.value};if(availability.type==='Hourly')availability.end=availabilityDate(availability.start,parseInt(availability.duration)||1);render();}});
