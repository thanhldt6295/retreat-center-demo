/* Previous follows the visited page sequence, without undoing booking data. */
(()=>{
 const baseRender=render,baseHandle=handle,baseBar=demoBar,baseOverlay=renderOverlay;
 const history=[];let current=null,restoring=false;
 const copy=x=>x==null?x:JSON.parse(JSON.stringify(x));
 function route(){const u=state.ui;return JSON.stringify([u.app,u[u.app],u.portalRole,u.portalPage,u.portalGuestId,u.mailRecipient,u.mailMessage,u.clientDocument,u.documentType,u.video,u.demoSelectedVideo,u.recordingSteps,u.reservationTab,u.arrivalStage,u.posItemDraft,state.pickup?.detailTab,modal,wizard?.step,resWizard?.step,pickerDraft,state.ui.keyboardFlow]);}
 function snapshot(){return {key:route(),ui:copy(state.ui),detailTab:state.pickup?.detailTab,modal,wizard:copy(wizard),resWizard:copy(resWizard),pickerDraft:copy(pickerDraft)};}
 window.demoCanGoBack=()=>history.length>0;
 demoBar=function(){return baseBar().replace('data-action="guided-prev" disabled','data-action="guided-prev"'+(history.length?'':' disabled'));};
 function remember(){const next=snapshot();if(!restoring&&current&&current.key!==next.key)history.push(current);current=next;}
 render=function(){remember();baseRender();};
 renderOverlay=function(){remember();baseOverlay();};
 handle=function(action,el){if(action!=='guided-prev'||!history.length)return baseHandle(action,el);const previous=history.pop(),recording=state.ui.recording;restoring=true;modal=previous.modal;wizard=copy(previous.wizard);resWizard=copy(previous.resWizard);pickerDraft=copy(previous.pickerDraft);state.ui=copy(previous.ui);state.ui.recording=recording;if(state.pickup)state.pickup.detailTab=previous.detailTab;current=previous;save();render();renderOverlay();restoring=false;window.scrollTo(0,0);};
 render();
})();
