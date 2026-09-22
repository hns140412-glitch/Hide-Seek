(() => {
  'use strict';

  function syncViewport(){
    const vv=window.visualViewport;
    const h=vv?.height||window.innerHeight;
    const top=vv?.offsetTop||0;
    document.documentElement.style.setProperty('--v2-visual-height',Math.max(320,Math.round(h))+'px');
    document.documentElement.style.setProperty('--v2-visual-top',Math.max(0,Math.round(top))+'px');
  }

  function keepFocusedControlVisible(target){
    if(!(target instanceof HTMLElement))return;
    if(!target.matches('input,textarea,select,[contenteditable="true"]'))return;
    setTimeout(()=>{
      const r=target.getBoundingClientRect();
      const vv=window.visualViewport;
      const top=vv?.offsetTop||0;
      const bottom=top+(vv?.height||window.innerHeight);
      const margin=20;
      if(r.bottom>bottom-margin||r.top<top+margin){
        target.scrollIntoView({block:'center',behavior:'auto'});
      }
    },80);
  }

  window.addEventListener('resize',syncViewport);
  window.visualViewport?.addEventListener?.('resize',syncViewport);
  window.visualViewport?.addEventListener?.('scroll',syncViewport);
  document.addEventListener('focusin',e=>keepFocusedControlVisible(e.target));
  syncViewport();

  globalThis.HideV2MobileShell=Object.freeze({syncViewport,keepFocusedControlVisible});
})();
