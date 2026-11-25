(async function(){
'use strict';const $=s=>document.querySelector(s);let data=null;
function render(){
 $('#clause-clear').hidden=!$('#clause-query').value.length;if(!data)return;
 const query=$('#clause-query').value;$('#clause-results').replaceChildren();
 if(!query.trim()){$('#clause-status').textContent='Введите номер пункта, например 20.4.';return;}
 const found=ClauseSearch.find(data.entries,query);
 $('#clause-status').textContent=found.length?'Найдено: '+found.length:'Такой пункт не найден в документе. Проверьте номер или формулировку.';
 found.forEach(e=>ClauseView.entry($('#clause-results'),e,data,new URL('./',location.href)));
}
$('#clause-query').addEventListener('input',render);$('#clause-form').onsubmit=e=>{e.preventDefault();render();};$('#clause-clear').onclick=()=>{$('#clause-query').value='';render();$('#clause-query').focus();};
$('#full-document').addEventListener('toggle',()=>{if(data&&$('#full-document').open&&!$('#document-content').childElementCount)data.blocks.forEach(b=>ClauseView.appendBlock($('#document-content'),b,{file:data.source,base:new URL('./',location.href)}));});
try{const response=await fetch('document.json');if(!response.ok)throw Error('HTTP '+response.status);data=await response.json();render();if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js',{scope:'./'}).catch(()=>{});}catch(error){$('#clause-status').textContent='Не удалось загрузить документ. Подключитесь к интернету и обновите страницу.';}
})();
