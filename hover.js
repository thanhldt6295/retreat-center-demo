/* Figma Availability hover details, kept outside the scrolling grid. */
(()=>{
let timer,anchor,card;
const hide=()=>{clearTimeout(timer);card?.remove();card=null;anchor=null;};
const line=(k,v)=>`<div class="hover-detail"><span>${esc(k)}</span><b>${esc(v)}</b></div>`;
function content(el){
 const row=el.closest('.calendar-row'),grid=document.querySelector('.availability-grid');
 if(el.matches('.calendar-booking')){
  const rows=[...grid.querySelectorAll('.calendar-row')],unit=row.querySelector('.unit-label').textContent.trim(),type=row.children[1].textContent.trim();
  const model=availabilityUnits().find(r=>r.unit===unit&&r.type===type),b=availabilityBookings(model)[[...row.querySelectorAll('.calendar-booking')].indexOf(el)];if(!b)return null;
  const slot=b.demo&&state.pickup?.active?roomSlots().find(s=>s.unit===unit&&s.type===type):null,r=slot&&slotReservation(slot),held=slot&&!slot.guest,ooo=b.status==='Out of order';
  const title=ooo?'Out of Order':b.label,status=held?'Held':b.status;
  let body=ooo?line('Reason','Plumbing repair')+line('Set by','Sam Patel · Oct 20')+line('Back in service',dateLabel(b.end)):line('Dates',dateLabel(b.start)+' – '+dateLabel(b.end))+line('Room',type+' · '+unit);
  if(!ooo)body+=held?line('Released on',dateLabel(state.pickup?.release||'2026-10-30')):line('Group',b.demo?(state.request.organization+' · GBR-008'):'Direct booking')+(r?line('Total',money(r.amount)+' · balance '+money(r.paid?0:r.amount)): '');
  let actions='';if(r)actions=button('Change room','hover-change-'+r.id)+button('Open reservation','v2-record-'+r.id,'primary');else if(slot)actions=button(held?'Assign guest':'Open reservation','v2-slot-'+slot.id,'primary');else if(b.demo)actions=button('Open reservation','open-reservation','primary');
  return {rich:true,html:`<div class="hover-head"><div><b>${esc(title)}</b><small>${ooo?'Room unavailable':r?'#'+r.id+' · Group Block GBR-008':held?'GBR-008 · room not assigned':b.demo?'#00031 · Group booking':'Direct booking'}</small></div>${badge(status)}</div>${body}<div class="hover-actions">${actions}</div>`};
 }
 if(el.matches('.calendar-cell,.calendar-day')){
  const index=[...el.parentElement.children].indexOf(el),d=availabilityDate(availabilityDate(availability.start,-3),index);
  if(el.matches('.calendar-day')){const units=availabilityUnits(),booked=units.filter(u=>availabilityBookings(u).some(b=>b.start<=d&&b.end>d)).length;return {html:`<b>${esc(dateLabel(d))}</b><span>${booked} of ${units.length} units booked · ${units.length-booked} free</span>`};}
  return {html:`<b>${esc(row.querySelector('.unit-label').textContent.trim())} · ${esc(dateLabel(d))}</b><span>${el.classList.contains('requested')?'Requested stay · '+(state.request.single+state.request.double)+' rooms needed':'Free · available to book'}</span>`};
 }
 const descriptions={'availability-zoom-out':['Zoom out','Show more days at once'],'availability-zoom-in':['Zoom in','Show fewer days with more detail'],'availability-sort':['Sort direction','Reverse the current sort order'],'availability-reset':['Refresh','Reset the timeline'],'close-modal':['Close',''],'v2-change-room':['Room actions','Change the assigned room']};
 const info=descriptions[el.dataset.action];const label=info?.[0]||el.getAttribute('aria-label')||el.getAttribute('title');if(!label)return null;
 return {html:`<b>${esc(label)}</b>${info?.[1]?'<span>'+esc(info[1])+'</span>':''}`};
}
function show(el){hide();const data=content(el);if(!data)return;anchor=el;card=document.createElement('div');card.className=data.rich?'design-hover design-popover':'design-hover design-tooltip';card.id='prototype-hover';card.setAttribute('role',data.rich?'dialog':'tooltip');card.innerHTML=data.html;document.body.append(card);const box=el.getBoundingClientRect(),rect=card.getBoundingClientRect();card.style.left=Math.max(8,Math.min(box.left,innerWidth-rect.width-8))+'px';card.style.top=(box.bottom+8+rect.height>innerHeight?Math.max(8,box.top-rect.height-8):box.bottom+8)+'px';}
const selector='.calendar-booking,.calendar-cell,.calendar-day,button[aria-label],button[title],.modal-close,.room-action';
document.addEventListener('mouseover',e=>{const el=e.target.closest(selector);if(el&&el!==anchor){clearTimeout(timer);timer=setTimeout(()=>show(el),250);}else if(e.target.closest('.design-hover'))clearTimeout(timer);});
document.addEventListener('mouseout',e=>{if(e.relatedTarget?.closest?.('.design-hover')||e.relatedTarget===anchor||anchor?.contains(e.relatedTarget))return;if(e.target.closest(selector)||e.target.closest('.design-hover')){clearTimeout(timer);timer=setTimeout(hide,200);}});
document.addEventListener('focusin',e=>{if(e.target.matches(selector))show(e.target);});
document.addEventListener('focusout',e=>{if(!e.relatedTarget?.closest?.('.design-hover'))hide();});
document.addEventListener('keydown',e=>{if(e.key==='Escape')hide();});document.addEventListener('scroll',hide,true);window.addEventListener('resize',hide);
document.addEventListener('click',e=>{const a=e.target.closest('[data-action]')?.dataset.action;if(a?.startsWith('hover-change-')){pickup().currentId=a.slice(13);handle('v2-change-room');}hide();});
})();
