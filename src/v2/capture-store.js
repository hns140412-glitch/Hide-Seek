(() => {
  'use strict';
  const DB_NAME='hide-seek-v2-assets';
  const STORE='captures';

  function openDb(){
    return new Promise((resolve,reject)=>{
      const req=indexedDB.open(DB_NAME,1);
      req.onupgradeneeded=()=>{
        if(!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
      };
      req.onsuccess=()=>resolve(req.result);
      req.onerror=()=>reject(req.error);
    });
  }

  async function withStore(mode,fn){
    const db=await openDb();
    try{
      return await new Promise((resolve,reject)=>{
        const tx=db.transaction(STORE,mode);
        const store=tx.objectStore(STORE);
        let result;
        try{ result=fn(store,resolve,reject); }catch(e){ reject(e); }
        tx.onerror=()=>reject(tx.error);
        tx.onabort=()=>reject(tx.error||new Error('CAPTURE_STORE_ABORTED'));
        if(result!==undefined && !(result&&typeof result.onsuccess==='function')) resolve(result);
      });
    }finally{
      db.close();
    }
  }

  function put(key,blob){
    return withStore('readwrite',(store,resolve,reject)=>{
      const req=store.put(blob,key);
      req.onsuccess=()=>resolve(true);
      req.onerror=()=>reject(req.error);
    });
  }

  function get(key){
    return withStore('readonly',(store,resolve,reject)=>{
      const req=store.get(key);
      req.onsuccess=()=>resolve(req.result||null);
      req.onerror=()=>reject(req.error);
    });
  }

  function remove(key){
    return withStore('readwrite',(store,resolve,reject)=>{
      const req=store.delete(key);
      req.onsuccess=()=>resolve(true);
      req.onerror=()=>reject(req.error);
    });
  }

  async function removeMany(keys=[]){
    for(const key of keys.filter(Boolean)) await remove(key);
    return true;
  }

  window.HideV2CaptureStore=Object.freeze({DB_NAME,STORE,put,get,remove,removeMany});
})();
