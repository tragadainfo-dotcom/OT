(async function(){
'use strict';const $=s=>document.querySelector(s);let data=null;
const labels={regulation:'Положение · приложение № 1',order:'Приказ',forms:'Формы · приложение № 2',classifiers:'Классификаторы · приложение № 3'};
function appendBlock(parent,block){
 if(block.type==='p'){if(block.text){const p=document.createElement('p');p.className='document-block';p.textContent=block.text;parent.append(p);}for(const src of block.images||[]){if(/\.(png|jpe?g|gif)$/i.test(src)){const img=document.createElement('img');img.src=src;img.alt='Иллюстрация из исходного документа';img.className='document-image';parent.append(img);}else{const link=document.createElement('a');link.href='sources/'+data.source;link.textContent='Посмотреть иллюстрацию в исходном DOCX';link.className='source';parent.append(link);}}return;}
 const wrap=document.createElement('div');wrap.className='document-table-wrap';const table=document.createElement('table');table.className='document-table';
 block.rows.forEach(row=>{const tr=document.createElement('tr');row.forEach(cell=>{const td=document.createElement('td');td.colSpan=cell.span;cell.blocks.forEach(b=>appendBlock(td,b));tr.append(td);});table.append(tr);});wrap.append(table);parent.append(wrap);
}
function render(){
 $('#clause-clear').hidden=!$('#clause-query').value.length;if(!data)return;
 const query=$('#clause-query').value;$('#clause-results').replaceChildren();
 if(!query.trim()){$('#clause-status').textContent='Введите номер пункта, например 20.4.';return;}
 const found=ClauseSearch.find(data.entries,query,$('#clause-scope').value);
 $('#clause-status').textContent=found.length?'Найдено: '+found.length:'Такой пункт не найден в выбранной части документа. Проверьте номер или выберите другую часть.';
 found.forEach(e=>{const article=document.createElement('article');article.className='panel clause-card';article.dataset.entryId=e.id;
 const context=document.createElement('p');context.className='clause-context';context.textContent=labels[e.scope]+(e.chapter?' · '+e.chapter:'');const h=document.createElement('h2');h.textContent=e.title;article.append(context,h);e.blocks.forEach(i=>appendBlock(article,data.blocks[i]));$('#clause-results').append(article);});
}
$('#clause-query').addEventListener('input',render);$('#clause-scope').addEventListener('change',render);$('#clause-form').onsubmit=e=>{e.preventDefault();render();};$('#clause-clear').onclick=()=>{$('#clause-query').value='';render();$('#clause-query').focus();};
$('#full-document').addEventListener('toggle',()=>{if(data&&$('#full-document').open&&!$('#document-content').childElementCount)data.blocks.forEach(b=>appendBlock($('#document-content'),b));});
try{const response=await fetch('document.json');if(!response.ok)throw Error('HTTP '+response.status);data=await response.json();render();if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js',{scope:'./'}).catch(()=>{});}catch(error){$('#clause-status').textContent='Не удалось загрузить документ. Подключитесь к интернету и обновите страницу.';}
})();
