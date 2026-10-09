/* Keyboard recording follows individual UI actions, never bulk-completes a story. */
(()=>{
 const baseHandle=handle;
 const marks=()=>state.ui.keyboardFlow??=( {} );
 const seen=key=>!!marks()[guided().video+':'+key];
 const mark=key=>{marks()[guided().video+':'+key]=true;save();};
 const act=a=>handle(a);
 function fill(selector,values){const f=document.querySelector(selector);if(!f)return false;for(const [key,value]of Object.entries(values)){const e=f.elements?.[key]||f.querySelector('[name="'+key+'"]');if(e){if(e.type==='checkbox')e.checked=!!value;else e.value=value;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));}}return true;}
 function advance(){if(!guidedReady())return false;baseHandle('guided-next');return true;}
 function mailbox(){if(state.ui.guest!=='mailbox')return false;const messages=mailboxMessages(),m=messages.find(x=>x.id===state.ui.mailMessage);if(!m){const target=guided().video===1?messages.find(x=>x.id==='quote'):messages[0];if(target)act('mail-open-'+target.id);}else act(m.action);return true;}
 function docReview(){if(state.ui.guest==='document-viewer'){return act('client-doc-back');}if(!seen('beo')){mark('beo');return act('doc-beo');}if(!seen('contract')){mark('contract');return act('doc-contract');}const c=document.querySelector('#review-checkbox');if(c){c.checked=true;c.dispatchEvent(new Event('change',{bubbles:true}));}return act('continue-sign');}
 function modalNext(){
  if(modal==='wizard'){
   if(state.quote){modal=null;renderOverlay();return navigate('admin','block');}
   if(wizard.step===2){if(!seen('rooms')){mark('rooms');return act('room-picker');}if(!seen('addons')){mark('addons');return act('addon-picker');}}
   return act(wizard.step===4?'send-quote':'wizard-next');
  }
  if(modal==='room-picker'){pickerDraft.forEach((r,i)=>r.qty=[state.request.single,state.request.double,state.request.cabin||0,0][i]||0);return act('picker-save');}
  if(modal==='addon-picker'){const c=pickerDraft.find(x=>x.id==='catering');if(c){c.selected=true;c.qty=state.request.guests*nights();}return act('picker-save');}
  if(modal==='review-booking')return act('venue-confirm');
  if(modal==='reservation'&&state.reservation){modal=null;renderOverlay();return navigate('admin','reservation');}
  if(modal==='reservation')return act(resWizard.step===1?'reservation-next':'book-reservation');
  if(modal==='v2-invites')return act('v2-send-invites');
  if(modal==='v2-change-room')return act('v2-save-room');
  if(modal==='cx-meals')return act('cx-meals-save');
  if(['cx-checkout-pay','cx-charge-card','cx-guest-pay'].includes(modal)){fill('#cx-pay-form',{card:'4242 4242 4242 4242',expiry:'12 / 29',cvc:'123',holder:'Priya Nair'});return act('cx-pay-save');}
  return act('close-modal');
 }
 function video1(i){
  const u=state.ui;
  if(i===0){if(u.guest==='form'){if(!seen('request-filled')){mark('request-filled');return act('guided-fill');}return document.querySelector('#request-form')?.requestSubmit();}if(advance())return navigate('admin','list');}
  if(i===1){if(u.admin==='list')return act('open-request');if(state.request.status==='Pending')return act('confirm-request');return advance();}
  if(i===2){if(!state.quote)return act('start-wizard');return advance();}
  if(i===3){if(mailbox())return;if(u.guest==='review'||u.guest==='document-viewer')return docReview();if(u.guest==='sign'){if(!seen('signature')){mark('signature');return fill('#signature-form',{fullname:name(),agree:true});}return act('sign-contract');}if(u.guest==='payment')return act('pay-deposit');return advance();}
  if(i===4){if(!state.quote.venueConfirmed)return act('review-booking');if(!state.reservation)return act('start-reservation');if(state.reservation.status!=='Confirmed')return act('approve-reservation');return advance();}
 }
 function video2(i){
  const u=state.ui;
  if(i===0){if(mailbox())return;return advance();}
  if(i===1){if(!seen('auto-one')){mark('auto-one');return act('v2-auto');}if(!seen('auto-all')){mark('auto-all');return act('v2-auto');}if(!seen('invites')){mark('invites');return act('v2-invites');}return advance();}
  if(i===2){if(mailbox())return;return advance();}
  if(i===3){if(u.guest==='group-code')return act(pickup().codeApplied?'v2-choose':'v2-apply');if(u.guest==='choose-room')return act('v2-checkout');if(u.guest==='individual-payment'){if(guidedReady())return navigate('guest','individual-confirmed');return act('v2-pay');}const r=portalGuest();if(r&&!r.paid)return act('portal-guest-payment');return advance();}
  if(i===4){if(u.admin==='individual-list')return act('v2-record-'+(guided().guestId||pickup().lastBooking));if(!seen('room-change')){mark('room-change');return act('v2-change-room');}if(!seen('availability')){mark('availability');return act('nav-Availability');}return advance();}
 }
 function visit(keys,role){for(const key of keys){if(!seen(role+'-'+key)){mark(role+'-'+key);return act('portal-'+role+'-'+key);}}return false;}
 function video3(i){
  const u=state.ui;
  if(i===0||i===2){if(mailbox())return;return advance();}
  if(i===1){if(u.guest==='document-viewer')return act('client-doc-back');if(visit(['rooms','guests','billing','documents'],'organizer')!==false)return;if(!seen('organizer-beo')){mark('organizer-beo');return act('doc-beo');}if(!seen('organizer-contract')){mark('organizer-contract');return act('doc-contract');}if(visit(['schedule'],'organizer')!==false)return;if(!seen('meals')){mark('meals');return act('cx-meals');}if(visit(['invite'],'organizer')!==false)return;return advance();}
  if(i===3){if(u.guest==='service-sent')return advance();if(visit(['room','schedule','documents','charges','extras'],'guest')!==false)return;const r=portalGuest();if(!seen('service')){mark('service');return act('addon-toggle-forest');}return act('addon-submit');}
  if(i===4){const q=guidedRequests(guided()).find(x=>x.status==='New');if(q){if(u.admin!=='service-detail'||ops().currentRequest!==q.id)return act('cx-request-'+q.id);return act('cx-service-confirm');}return advance();}
  if(i===5){if(!seen('response-schedule')){mark('response-schedule');return act('portal-guest-schedule');}return advance();}
 }
 function video4(i){
  const u=state.ui,r=activePosGuest();
  if(i===0){const s=u.arrivalStage||ops().arrivalStage||'scan';if(s==='scan'){if(!ops().scanPending)return act('v4-scan');return;}if(s==='find')return act('cx-arrival-'+guided().guestId);if(s==='confirm')return act('cx-waiver');if(s==='waiver'){if(!seen('waiver')){mark('waiver');return fill('#cx-waiver-form',{signature:v2Full(r.guest),agree:true});}return act('cx-sign-checkin');}return advance();}
  if(i===1){if(u.admin==='pos-item')return act('v4-item-save');if(u.admin==='pos-order'){if(!ops().cart.some(x=>x.id==='steak'||x.title==='Grilled Beef Steak'))return act('cx-item-steak');if(!ops().cart.some(x=>x.id==='coffee'||x.title==='Coffee')){if(ops().category!=='Beverages')return act('cx-pos-category-Beverages');return act('cx-item-coffee');}return act('cx-pos-checkout');}if(u.admin==='pos-checkout')return act('cx-charge-room');if(u.admin==='pos-list')return act('cx-pos-guest-'+guided().guestId);return advance();}
  if(i===2){if(!seen('record-payments')){mark('record-payments');return act('v2-tab-Payments');}if(!seen('record-details')){mark('record-details');return act('v2-tab-Details');}return advance();}
  if(i===3)return advance();
  if(i===4){if(r.checkedOut)return advance();return act('cx-checkout-pay');}
 }
 function next(){const g=guided();if(!g||g.finished)return;if(modal)return modalNext();return [null,video1,video2,video3,video4][g.video](recordingStep());}
 window.demoFlowNext=next;
 document.addEventListener('keydown',e=>{
  if(!['ArrowLeft','ArrowRight'].includes(e.key)||e.repeat||e.ctrlKey||e.altKey||e.metaKey||e.shiftKey||e.target.closest?.('input,textarea,select,[contenteditable="true"]'))return;
  const g=guided();if(!g||g.video!==guidedSelected())return;
  e.preventDefault();e.stopImmediatePropagation();
  try{if(e.key==='ArrowLeft'){if(window.demoCanGoBack?.()||recordingStep()>0)act('guided-prev');}else next();}catch(error){toast(error.message,true);}
 },true);
})();
