(() => {
  'use strict';
  let route={name:'home',params:{}};
  const listeners=new Set();
  function current(){return {...route,params:{...route.params}}}
  function go(name,params={}){route={name,params};listeners.forEach(fn=>fn(current()))}
  function subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn)}
  window.HideV2Router=Object.freeze({current,go,subscribe});
})();