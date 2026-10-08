/* Guided review: starting a story is explicit; Continue checks actual records. */
const guidedBase={handle,render};
const guidedTitles={1:'Group request → Confirmed booking',2:'Group rooms → Individual reservations',3:'Organizer & Guest Portal',4:'Cashier → Connected guest record'};
const guidedResults={1:['A new group request appears in Admin App.','The request is confirmed and ready to convert.','The organizer receives a quote email.','Signed documents and the deposit are saved.','The group reservation is confirmed.'],2:['The organizer secure link opens the group portal.','A room invitation or group code email is sent.','The guest secure link opens their room booking.','A paid individual reservation appears in PMS.','Staff reviews room changes or availability.'],3:['The organizer secure link opens the group portal.','Invoices, documents and schedule / meals have been reviewed.','The guest secure link opens My Stay.','A new service request is sent to staff.','Staff confirms or declines the request.','The guest sees the staff response.'],4:['Priya is checked in with a saved waiver.','An order is charged to Priya’s room.','The same order appears in the reservation record.','Priya can see the connected charges.','The remaining balance is settled and the stay is checked out.']};
function guided(){return state.ui.walkthrough;}
function guidedSelected(){return state.ui.demoSelectedVideo||guided()?.video||recordingVideo();}
function guidedObserve(){const g=guided();if(!g||g.finished)return;const guestView=state.ui.app==='guest'&&state.ui.guest!=='mailbox';if(guestView&&state.ui.portalRole==='organizer'&&['organizer','organizer-portal'].includes(state.ui.guest))g.organizerOpened=true;if(guestView&&state.ui.portalRole==='guest'&&['guest-portal','group-code','choose-room','individual-payment','individual-confirmed'].includes(state.ui.guest))g.guestOpened=true;
 if(guestView&&state.ui.portalRole==='organizer'){const p=state.ui.portalPage||'overview';g.organizerPages[p==='billing'?'invoices':p]=true;}
 if(state.ui.app==='admin'&&state.ui.admin==='individual-detail')g.recordSeen=true;
 if(state.ui.app==='admin'&&state.ui.admin==='availability')g.availabilitySeen=true;
 if(guestView&&state.ui.portalRole==='guest'&&state.ui.portalPage==='charges')g.chargesSeen=true;
 if(guestView&&state.ui.portalRole==='guest'&&['stay','charges','schedule'].includes(state.ui.portalPage)&&g.requestId&&guidedRequests(g).every(q=>['Confirmed','Declined'].includes(q.status)))g.responseSeen=true;
 if(g.video===3&&!g.requestId){const q=ops().requests.find(q=>!g.initialRequests.includes(q.id));if(q)g.requestId=q.id;}
}
function guidedRequests(g){const q=ops().requests.find(q=>q.id===g.requestId);return q?(q.batchId?ops().requests.filter(x=>x.batchId===q.batchId):[q]):[];}
function guidedReady(index=recordingStep()){const g=guided();if(!g)return false;const v=g.video,r=v2Active()?individualById(g.guestId):null;
 if(v===1)return !![!!state.request,['Confirmed','Converted'].includes(state.request?.status),['Sent','Executed'].includes(state.quote?.status),!!(state.quote?.signature&&state.quote?.paid),state.reservation?.status==='Confirmed'][index];
 if(v===2)return !![g.organizerOpened,!!(g.invitationSent||pickup().sharedEmail),g.guestOpened,pickup().reservations.some(r=>r.paid&&!g.initialPaid.includes(r.id)),!!(g.roomChanged||g.availabilitySeen)][index];
 if(v===3){const requests=guidedRequests(g);return !![g.organizerOpened,['invoices','documents','schedule'].every(p=>g.organizerPages[p]),g.guestOpened,!!requests.length,!!requests.length&&requests.every(q=>['Confirmed','Declined'].includes(q.status)),g.responseSeen][index];}
 return !![!!(r?.checkedIn&&r?.waiver),ordersFor(r).some(o=>!g.initialOrders.includes(o.id)&&o.payment==='Room'),g.recordSeen,g.chargesSeen,!!r?.checkedOut][index];
}
function guidedStart(video){requireState(!modal,'Close the current dialog first.');localStorage.setItem(STORE+'-before-guided-start',JSON.stringify(state));state=initial();modal=null;wizard=null;resWizard=null;availability=null;state.ui.demoSelectedVideo=video;state.ui.recording=false;
 if(video>=2)startVideo2Sample();if(video>=3)ensureLaterStory(video);state.ui.video=video;
 state.ui.walkthrough={video,organizerPages:{},initialPaid:video>=2?pickup().reservations.filter(r=>r.paid).map(r=>r.id):[],initialRequests:video>=3?ops().requests.map(q=>q.id):[],initialOrders:video>=3?ops().orders.map(o=>o.id):[],guestId:video>=3?'00032':null};state.ui.recordingSteps={[video]:0};save();recordingOpenStep(0);
}

function guidedCompleteSample(){
 const g=guided(),i=recordingStep();if(!g||g.video>3)return;
 if(g.video===1){
  state.request??={...defaults,id:'GBR-008',status:'Pending'};
  if(i>=1)state.request.status='Confirmed';
  if(i>=2){state.quote??=buildQuote();const q=state.quote;q.rooms.forEach((r,j)=>r.qty=[state.request.single,state.request.double,state.request.cabin||0][j]);q.cateringQty=Number(state.request.guests)*nights();q.status='Sent';}
  if(i>=3){const q=state.quote;q.signature??={name:name(),date:'Sep 22, 2026'};q.venueConfirmed=true;q.venueSignature??={name:'Jordan Reyes',date:'Sep 22, 2026'};q.paid=true;q.payment??={amount:totals().deposit,last4:'4242',reference:'PAY-008',date:'Sep 22, 2026'};q.status='Executed';}
  if(i>=4){state.request.status='Converted';state.reservation??={id:'00031',groupCode:'GBR-008',assigned:true,color:'#fad659',notes:''};state.reservation.status='Confirmed';}
 }else if(g.video===2){
  if(i===0)g.organizerOpened=true;
  if(i===1){const r=pickup().reservations.find(r=>!r.paid);if(r){slotById(r.slotId).invited=true;g.guestId=r.id;}g.invitationSent=true;}
  if(i===2)g.guestOpened=true;
  if(i===3&&!guidedReady()){const r=individualById(g.guestId)||pickup().reservations.find(r=>!r.paid);if(r){pickup().invitedSlot=r.slotId;payIndividual({...r.guest,phone:r.guest.phone||'+1 415 555 0142',card:'4242424242424242',expiry:'12/29',cvc:'123'});}else{pickup().selectedType=v2Types[0];payIndividual({first:'Elena',last:'Rossi',email:'elena.rossi@horizon.example',phone:'+1 415 555 0142',card:'4242424242424242',expiry:'12/29',cvc:'123'});}}
  if(i===4)g.availabilitySeen=true;
 }else{
  if(i===0)g.organizerOpened=true;
  if(i===1)Object.assign(g.organizerPages,{invoices:true,documents:true,schedule:true});
  if(i===2)g.guestOpened=true;
  if(i===3&&!guidedRequests(g).length){const r=individualById(g.guestId),existing=requestsFor(r).find(q=>q.serviceId==='forest'&&q.status!=='Declined');g.requestId=(existing||requestService('forest',r)).id;}
  if(i===4)for(const q of guidedRequests(g))if(q.status==='New')resolveService(q.id,'Confirmed','Meet in the lobby 10 minutes before departure.','Alex Rivera');
  if(i===5)g.responseSeen=true;
 }
 save();
}

function guidedRecipient(){const g=guided();if(!g||g.video!==2)return 'priya';const shared=pickup().sharedEmail;if(shared){const person=mailboxPeople().find(p=>p.email===shared);g.guestId=pickup().reservations.find(r=>r.guest.email===shared)?.id||null;return person?.id||'shared';}const invited=pickup().reservations.find(r=>!r.paid&&slotById(r.slotId)?.invited)||pickup().reservations.find(r=>!r.paid);if(invited){g.guestId=invited.id;return invited.id;}return 'priya';}
function guidedOpen(index){const g=guided(),v=g.video;requireState(!modal,'Finish or close the current dialog first.');if(index>recordingStep())requireState(guidedReady(),'Complete the current action before continuing.');if(index>0)requireState(Array.from({length:index},(_,i)=>i).every(i=>g.completed?.[i]),'Complete the earlier steps first.');const route=recordingSteps[v][index][3];if(route==='guest-email'){(state.ui.recordingSteps??={})[v]=index;openMailbox(guidedRecipient());return;}if(route==='guest-room'){(state.ui.recordingSteps??={})[v]=index;const person=mailboxPerson();const target=pickup().reservations.find(r=>r.guest.email===person.email);if(target){state.ui.portalGuestId=target.id;return openGuestPortal('room',target.id);}return guidedBase.handle('mail-link-code');}if(v===4&&index===1){(state.ui.recordingSteps??={})[v]=index;ops().reservationId=g.guestId;return navigate('admin','pos-order');}if(v===4&&index===4){(state.ui.recordingSteps??={})[v]=index;ops().reservationId=g.guestId;return navigate('admin','pos-departure');}if(['stay','charges'].includes(route)&&g.guestId)state.ui.portalGuestId=g.guestId;recordingOpenStep(index);}
demoBar=function(){if(state.ui.recording)return '';const v=guidedSelected(),g=guided(),active=g?.video===v,i=active?recordingStep():0,step=recordingSteps[v][i],destination=recordingDestination();const apps=[['Guest Portals','guest'],['Admin App','admin'],['Cashier App','cashier'],['Email Inbox','email']];let html='<div class="demo-bar recording-navigation"><div class="switcher" role="group" aria-label="Switch demo app">'+apps.map(([name,id])=>'<button data-action="demo-app-'+id+'" class="'+(destination===id?'active':'')+'" aria-pressed="'+(destination===id)+'">'+name+'</button>').join('')+'</div><div class="demo-tools"><div class="recording-videos" role="group" aria-label="Select demo video">'+[1,2,3].map(n=>button('Video '+n,'guided-select-'+n,n===v?'video-active':'')).join('')+'</div>'+button('Recording mode (Ctrl + Shift + H)','recording')+'</div></div>';
 if(!active)return html+'<section class="guided-start"><div><small>VIDEO '+v+'</small><h2>'+guidedTitles[v]+'</h2><p>'+(v===1?'Start with an empty public request form.':'Start with a confirmed Horizon Foundation group and the sample guests needed for this story.')+'</p><small>Start demo creates a fresh story. Existing demo progress is saved locally as a recovery snapshot.</small></div>'+button('Start demo','guided-start-'+v,'primary')+(g?button('Resume Video '+g.video,'guided-resume'):'')+'</section>';
 const ready=g.video<=3||guidedReady(),completed=g.finished;return html+'<section class="recording-guide guided-running" aria-label="Video walkthrough"><div class="recording-step-copy"><label for="guided-step">Video '+v+' · Step '+(i+1)+' of '+recordingSteps[v].length+'</label><select id="guided-step" name="guided-step">'+recordingSteps[v].map((s,j)=>'<option value="'+j+'" '+(i===j?'selected':'')+' '+(j>i&&!g.completed?.[j-1]?'disabled':'')+'>'+(j+1)+'. '+s[0]+'</option>').join('')+'</select><p><b>'+step[1]+' → </b>'+step[2]+'</p><p class="guided-expected"><b>Expected result:</b> '+guidedResults[v][i]+'</p><p class="guided-status '+(ready?'ready':'')+'">'+(completed?'✓ Demo complete. You can review the connected records or restart.':ready?'✓ Step complete. Continue when you are ready.':'Complete the action on this screen to unlock Continue.')+'</p>'+(v===4&&i===0?'<p>Demo QR code: <b>CV-0412</b> · Guest: <b>Priya Nair</b></p>':'')+((v===1&&i===3||v===2&&i===3)?'<p>Demo card: <b>4242 4242 4242 4242</b> · Expiry <b>12/29</b> · CVC <b>123</b></p>':'')+'</div><div class="recording-step-actions">'+button('← Previous','guided-prev','',i===0)+button('Open step','guided-open')+button(i===recordingSteps[v].length-1?'Finish demo':'Continue →','guided-next','primary',!ready||completed)+(v===1&&i===0&&!state.request?button('Fill sample details','guided-fill'):'')+button('Restart','guided-restart','link')+'</div></section>';};
render=function(){guidedObserve();guidedBase.render();};
handle=function(a,el){try{
 if(a==='guided-fill'){const f=document.querySelector('#request-form');requireState(f,'Request form is not open.');const values={...defaults,rooms:'22 · 12 single, 6 double, 4 cabins'};for(const [name,value]of Object.entries(values)){if(f.elements[name])f.elements[name].value=value;}state.draft={...values};save();return;}
 if(a.startsWith('guided-select-')){requireState(!modal,'Close the current dialog before selecting a video.');state.ui.demoSelectedVideo=Number(a.slice(14));save();render();return;}
 if(a==='guided-resume'){state.ui.demoSelectedVideo=guided().video;save();render();return;}
 if(a.startsWith('guided-start-'))return guidedStart(Number(a.slice(13)));
 if(a==='guided-restart')return openModal('guided-restart');
 if(a==='guided-confirm-restart'){modal=null;return guidedStart(guided().video);}
 if(['guided-open','guided-prev','guided-next'].includes(a)){const g=guided();requireState(g,'No video selected.');if(a==='guided-open')return guidedOpen(recordingStep());if(a==='guided-prev')return guidedOpen(recordingStep()-1);if(g.video<=3)guidedCompleteSample();else requireState(guidedReady(),'Complete this step first.');(g.completed??={})[recordingStep()]=true;if(recordingStep()===recordingSteps[g.video].length-1){g.finished=true;save();if(g.video<3){const recording=state.ui.recording;guidedStart(g.video+1);state.ui.recording=recording;save();render();return;}render();return;}return guidedOpen(recordingStep()+1);}
 const before=guided()?JSON.stringify(state.pickup?.slots):null;guidedBase.handle(a,el);const g=guided();if(g){if(a==='v2-send-invites'&&!modal&&pickup().slots.some(s=>s.invited))g.invitationSent=true;if(a==='v2-save-room'&&!modal&&before!==JSON.stringify(state.pickup?.slots))g.roomChanged=true;guidedObserve();save();if(!modal)$('#demo').innerHTML=demoBar();}
 }catch(error){toast(error.message,true);}};
const guidedOverlayBase=renderOverlay;
renderOverlay=function(){if(modal!=='guided-restart')return guidedOverlayBase();$('#overlay').innerHTML='<div class="modal-backdrop"><section class="modal small" role="dialog" aria-modal="true" aria-labelledby="guided-restart-title"><header class="modal-header" id="guided-restart-title">Restart Video '+guided().video+'?</header><div class="modal-content"><p>This starts a fresh sample story. Current progress is saved locally as a recovery snapshot.</p></div><footer class="modal-footer">'+button('Cancel','close-modal')+button('Restart demo','guided-confirm-restart','primary')+'</footer></section></div>';};
document.addEventListener('change',event=>{if(event.target.name==='guided-step')try{guidedOpen(Number(event.target.value));}catch(error){toast(error.message,true);render();}});
render();


document.addEventListener('keydown',e=>{
 if(e.ctrlKey&&e.shiftKey&&e.code==='KeyH'){e.preventDefault();if(!e.repeat)handle('recording');return;}
 if(e.repeat||e.ctrlKey||e.altKey||e.metaKey||e.shiftKey||modal||e.target.closest?.('input,textarea,select,[contenteditable="true"],[role="textbox"],[role="combobox"]'))return;
 const g=guided();if(!g||g.video!==guidedSelected())return;
 if(e.key==='ArrowLeft'&&(recordingStep()>0||window.demoCanGoBack?.())){e.preventDefault();handle('guided-prev');}
 if(e.key==='ArrowRight'&&!g.finished&&(g.video<=3||guidedReady())){e.preventDefault();handle('guided-next');}
});
