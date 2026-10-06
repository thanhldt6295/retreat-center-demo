/* Guest add-ons share one basket; submitted lines remain individual staff requests. */
'use strict';
const addonBase={guest:guestPortal,handle,sent:serviceSentPage,detail:serviceRequestDetail};
serviceCatalog.push(
 {id:'vegetarian',title:'Vegetarian dinner',category:'Meals',when:'Fri, Nov 13, 2026 · 6:30 PM',description:'Fri, Nov 13 · 6:30 PM · Dining Hall',price:0,capacity:60,booked:0,included:'Included in the group dinner'},
 {id:'glutenfree',title:'Gluten-free breakfast',category:'Meals',when:'Sat, Nov 14, 2026 · 7:30 AM',description:'Sat, Nov 14 · 7:30 AM · Dining Hall',price:0,capacity:60,booked:0,included:'Included in your group booking'},
 {id:'boxed',title:'Boxed lunch for the trail',category:'Meals',when:'Sat, Nov 14, 2026 · 11:30 AM',description:'Sat, Nov 14 · pick up at 11:30 AM',price:0,capacity:60,booked:0,included:'Included in your group booking'},
 {id:'arrivalshuttle',title:'Airport shuttle seat',category:'Shuttle',when:'Thu, Nov 12, 2026 · 1:30 PM',description:'Thu, Nov 12 · 1:30 PM · SeaTac to Cedar Valley',price:0,capacity:40,booked:0,included:'Included for the group'},
 {id:'lateone',title:'Late check-out until 1:00 PM',category:'Extras',when:'Sun, Nov 15, 2026 · 1:00 PM',description:'Sun, Nov 15 · subject to availability',price:0,capacity:10,booked:0,priceLabel:'Request'},
 {id:'candle',title:'Cedar candle (gift shop)',category:'Extras',when:'During your stay · Gift shop',description:'Pick up at the gift shop',price:12,capacity:100,booked:0}
);
const addonCategoryIds={Activities:['forest','campfire','spa','canoe'],Meals:['vegetarian','glutenfree','boxed'],Shuttle:['arrivalshuttle'],Extras:['lateone','candle']};
const addonBasket=r=>(ops().addonBaskets??={})[guestKey(r)]??=[];
const addonExisting=(r,id)=>requestsFor(r).find(q=>q.serviceId===id&&q.status!=='Declined');
function validateAddon(r,id){
 requireState(r?.paid&&!r.checkedOut,'Confirm your stay before requesting an add-on.');
 const s=serviceById(id);requireState(s,'Choose an available add-on.');
 requireState(!addonExisting(r,id),'This add-on has already been requested.');
 requireState(s.booked+ops().requests.filter(q=>q.serviceId===id&&q.status==='Confirmed').length<s.capacity,'This add-on is fully booked.');
}
function toggleAddon(id){const r=portalGuest(),basket=addonBasket(r),index=basket.indexOf(id);if(index>=0)basket.splice(index,1);else{validateAddon(r,id);basket.push(id);}save();}
function submitAddonBasket(){
 const r=portalGuest(),ids=addonBasket(r).slice();requireState(ids.length,'Add at least one item to your basket.');
 ids.forEach(id=>validateAddon(r,id));
 const batchId='ADD-'+ops().nextRequest;
 const requests=ids.map(id=>{const q=requestService(id,r);q.batchId=batchId;return q;});
 ops().lastAddonBatch=requests.map(q=>q.id);ops().addonBaskets[guestKey(r)]=[];save();return requests;
}
function addonRow(s,r,activity=false){
 const added=addonBasket(r).includes(s.id),existing=addonExisting(r,s.id);
 const label=existing?existing.status==='New'?'Requested':existing.status:added?'Added':'Add';
 const price=s.included||s.priceLabel||(s.price?money(s.price)+(activity?' per person':''):'Included in your group booking');
 return '<article class="addon-row '+(activity?'addon-activity ':'')+(added?'is-added':'')+'">'+(activity?'<span class="service-thumb" aria-hidden="true"></span>':'')+'<div class="addon-row-text"><h3>'+esc(s.title)+'</h3><p>'+esc(s.description)+'</p>'+(activity?v2Pill(price):'')+'</div>'+(!activity?'<span class="v2-pill '+(s.price||s.priceLabel?'addon-cream':'')+'">'+esc(price)+'</span>':'')+button(label,'addon-toggle-'+s.id,added?'primary':'',!!existing)+'</article>';
}
function guestAddonPage(){
 const r=portalGuest(),cat=ops().addonCategory||'Activities',basket=addonBasket(r),items=basket.map(serviceById);
 const browse=cat==='Activities'?'<div class="stack">'+addonCategoryIds.Activities.map(id=>addonRow(serviceById(id),r,true)).join('')+'</div>':'<div class="stack">'+['Meals','Shuttle','Extras'].map(c=>'<section class="panel addon-group" id="addon-'+c.toLowerCase()+'"><header class="panel-head"><h2>'+c+'</h2></header>'+addonCategoryIds[c].map(id=>addonRow(serviceById(id),r)).join('')+'</section>').join('')+'</div>';
 const later=cent(items.reduce((sum,s)=>sum+s.price*1.1,0));
 const cart='<section class="panel addon-cart"><header class="panel-head"><h2>Your add-ons</h2>'+v2Pill(items.length+' '+(items.length===1?'item':'items'))+'</header><div class="panel-body">'+(items.length?items.map(s=>'<div class="addon-cart-item"><small>'+({Activities:'ACTIVITY',Meals:'MEAL',Shuttle:'SHUTTLE',Extras:'EXTRA'})[s.category]+'</small><b>'+esc(s.title)+'</b><p>'+esc(s.description)+' · '+(s.price?money(s.price)+' + tax':'Included / subject to confirmation')+'</p>'+button('Remove','addon-toggle-'+s.id,'link')+'</div>').join(''):'<p class="muted addon-empty">Choose an activity, meal, shuttle seat or extra to add it here.</p>')+'<div class="addon-cart-totals">'+line('Due today',money(0),'total')+(later?line('Added to stay after confirmation',money(later)):'')+'<p>Included items are covered by your group booking. Paid extras are added to your stay after staff confirm and settled at check-out.</p></div>'+button('Send '+items.length+' '+(items.length===1?'request':'requests'),'addon-submit','primary wide-btn',!items.length||r.checkedOut)+'</div></section>';
 return v2Page('<div class="guest-addons">'+v2Title('Add-ons','Pick activities, meals, a shuttle seat or extras. They go in one cart and the venue team is notified once.')+'<div class="addon-categories">'+Object.keys(addonCategoryIds).map(c=>button(c,'addon-category-'+c,cat===c?'active':'')).join('')+'</div><div class="addon-columns">'+browse+cart+'</div></div>');
}
guestPortal=function(){return state.ui.portalPage==='extras'&&portalGuest()?guestAddonPage():addonBase.guest();};
serviceRequestDetail=function(){
 const q=ops().requests.find(q=>q.id===ops().currentRequest)||ops().requests[0];let html=addonBase.detail().replace(esc(badge(q.status)),badge(q.status));
 q.defaultMessage=q.title+' is confirmed for '+q.when+'. '+(q.serviceId==='candle'?'Pick up at the gift shop.':'We look forward to welcoming you.');if(q.serviceId!=='forest')html=html.replace('Meet at the Main Lodge Lobby at 8:50 AM.',esc(q.defaultMessage));
 const batch=q.batchId?ops().requests.filter(x=>x.batchId===q.batchId):[];
 if(batch.length>1)html=html.replace('<div class="admin-main request-layout">','<div class="admin-main request-layout"><div class="addon-staff-batch">'+panel('Requests in this submission',batch.map(x=>'<div class="row between">'+button(x.title,'cx-request-'+x.id,'link')+badge(x.status)+'</div>').join(''))+'</div>');
 return html;
};
serviceSentPage=function(){
 const batch=(ops().lastAddonBatch||[]).map(id=>ops().requests.find(q=>q.id===id)).filter(Boolean);
 if(!batch.length||!batch.some(q=>q.id===ops().lastRequest))return addonBase.sent();
 return v2Page('<div class="pickup-confirmation"><span class="pickup-success">'+img('a79b9.svg')+'</span><h1>'+(batch.length===1?'Request sent':batch.length+' requests sent')+'</h1><p>The venue team has been notified and will confirm each item by message.</p></div><div class="pickup-confirmed-columns">'+panel('Your add-ons',table(['ITEM','DATE AND TIME','STATUS'],batch.map(q=>[esc(q.title),esc(q.when),v2Pill(q.status)])))+panel('What happens next','<p>Your requests are connected to Reservation #'+batch[0].reservationId+'.</p><p class="mt">Included items remain included. Paid extras appear in your charges after confirmation.</p>')+'</div><div class="row mt">'+button('Back to add-ons','portal-guest-extras')+button('View my stay','portal-guest-stay','primary')+'</div>');
};
handle=function(a,el){try{
 if(a.startsWith('addon-toggle-')){toggleAddon(a.slice(13));render();return;}
 if(a.startsWith('addon-category-')){ops().addonCategory=a.slice(15);save();render();if(ops().addonCategory==='Shuttle'||ops().addonCategory==='Extras')$('#addon-'+ops().addonCategory.toLowerCase())?.scrollIntoView?.({block:'nearest'});return;}
 if(a==='addon-submit'){const requests=submitAddonBasket();navigate('guest','service-sent');toast(requests.length+' '+(requests.length===1?'request sent':'requests sent')+'. The venue team has been notified.');return;}
 return addonBase.handle(a,el);
 }catch(e){toast(e.message,true);}
};
