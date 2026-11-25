(function(root){
'use strict';
const labels={regulation:'Положение · приложение № 1',order:'Приказ',forms:'Формы · приложение № 2',classifiers:'Классификаторы · приложение № 3',context:'Текст документа'};
function appendBlock(parent,block,source){
 if(block.type==='p'){
  if(block.text){const p=document.createElement('p');p.className='document-block';p.textContent=block.text;parent.append(p);}
  for(const src of block.images||[]){if(/\.(png|jpe?g|gif)$/i.test(src)){const img=document.createElement('img');img.src=new URL(src,source.base).href;img.alt='Иллюстрация из документа';img.className='document-image';parent.append(img);}else{const a=document.createElement('a');a.href=new URL('sources/'+source.file,source.base).href;a.textContent='Иллюстрация в исходном DOCX';parent.append(a);}}
  return;
 }
 const wrap=document.createElement('div');wrap.className='document-table-wrap';const table=document.createElement('table');table.className='document-table';
 block.rows.forEach(row=>{const tr=document.createElement('tr');row.forEach(cell=>{const td=document.createElement('td');td.colSpan=cell.span;cell.blocks.forEach(b=>appendBlock(td,b,source));tr.append(td);});table.append(tr);});wrap.append(table);parent.append(wrap);
}
function entry(parent,e,data,base){
 const article=document.createElement('article');article.className='clause-card';article.dataset.entryId=e.id;
 const context=document.createElement('p');context.className='clause-context';context.textContent=(labels[e.scope]||'Текст документа')+(e.chapter?' · '+e.chapter:'');
 const h=document.createElement('h2');h.textContent=e.title;article.append(context,h);
 e.blocks.forEach(i=>appendBlock(article,data.blocks[i],{file:data.source,base}));parent.append(article);
}
root.ClauseView={appendBlock,entry};
})(globalThis);
