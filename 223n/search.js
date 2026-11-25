(function(root){
function normalize(q){return String(q).toLocaleLowerCase('ru').replace(/ё/g,'е').replace(/\s+/g,' ').trim();}
function find(entries,input,scope='regulation'){
 let query=normalize(input).replace(/^(?:пункт(?:а|ы)?|пп?)\.?\s*(?=\d)/,'').trim();
 if(!query)return [];
 const numbered=/^\d+(?:[.,]\d+)*\.?$/.test(query);if(numbered)query=query.replace(/,/g,'.').replace(/\.$/,'');
 return entries.filter(e=>scope==='all'||e.scope===scope).filter(e=>{
  if(!numbered)return query.split(' ').every(term=>normalize(e.searchText).includes(term));
  if(e.scope!=='classifiers')return e.number===query||e.number.startsWith(query+'.');
  return e.number===query||e.searchText.split('\n').some(line=>{const code=line.trim().match(/^(\d+(?:\.\d+)*)(?:[.\s]|$)/);return code&&(code[1]===query||code[1].startsWith(query+'.'));});
 });
}
const api={find,normalize};if(typeof module==='object'&&module.exports)module.exports=api;else root.ClauseSearch=api;
})(globalThis);
