/* Previous follows the visited page sequence, without undoing booking data. */
(()=>{
 const baseRender=render,baseHandle=handle,baseBar=demoBar;
 const history=[];let current=null,restoring=false;
 const copy=x=>JSON.parse(JSON.stringify(x));
 function route(){const u=state.ui;return JSON.stringify([u.app,u[u.app],u.portalRole,u.portalPage,u.portalGuestId,u.mailRecipient,u.mailMessage,u.clientDocument,u.documentType,u.video,u.demoSelectedVideo,u.recordingSteps,u.reservationTab,state.pickup?.detailTab]);}
 function snapshot(){return {key:route(),ui:copy(state.ui),detailTab:state.pickup?.detailTab};}
 window.demoCanGoBack=()=>history.length>0;
 demoBar=function(){return baseBar().replace('data-action="guided-prev" disabled','data-action="guided-prev"'+(history.length?'':' disabled'));};
 render=function(){const next=snapshot();if(!restoring&&current&&current.key!==next.key)history.push(current);current=next;baseRender();};
 handle=function(action,el){if(action!=='guided-prev'||!history.length)return baseHandle(action,el);const previous=history.pop(),recording=state.ui.recording;restoring=true;modal=null;state.ui=copy(previous.ui);state.ui.recording=recording;if(state.pickup)state.pickup.detailTab=previous.detailTab;current=previous;save();render();restoring=false;window.scrollTo(0,0);};
 render();
})();
