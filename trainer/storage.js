(function(){
'use strict';
let db;
window.TrainerStorage={
 async open(){db=await new Promise((resolve,reject)=>{const request=indexedDB.open('ot-exam-trainer',1);request.onupgradeneeded=()=>request.result.createObjectStore('progress');request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);request.onblocked=()=>reject(Error('Закройте другую вкладку тренажёра и повторите.'));});db.onversionchange=()=>db.close();},
 async load(){return new Promise((resolve,reject)=>{const request=db.transaction('progress').objectStore('progress').get('state');request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});},
 async save(state){const copy=structuredClone(state);return new Promise((resolve,reject)=>{const tx=db.transaction('progress','readwrite');tx.objectStore('progress').put(copy,'state');tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||Error('Сохранение прервано'));});}
};
})();
