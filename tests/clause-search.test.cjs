const test=require('node:test'),assert=require('node:assert/strict'),S=require('../223n/search.js'),data=require('../223n/document.json');
test('exact numbers distinguish parent clauses, subclauses and document sections',()=>{
 assert.equal(data.entries.filter(e=>e.scope==='regulation').length,55);
 assert.deepEqual(S.find(data.entries,'20.4').map(e=>e.number),['20.4']);
 assert.deepEqual(S.find(data.entries,'п. 20.1').map(e=>e.number),['20.1']);
 assert.deepEqual(S.find(data.entries,'20,4').map(e=>e.number),['20.4']);
 assert(S.find(data.entries,'20','regulation').length>1);assert(S.find(data.entries,'20','regulation').every(e=>e.number==='20'||e.number.startsWith('20.')));
 assert.deepEqual(S.find(data.entries,'1','order').map(e=>e.id),['order-1']);
 assert.deepEqual(S.find(data.entries,'1','regulation').map(e=>e.id),['regulation-1']);
 assert.deepEqual(S.find(data.entries,'1','forms').map(e=>e.id),['forms-1']);
 assert.deepEqual(S.find(data.entries,'999'),[]);assert.deepEqual(S.find(data.entries,''),[]);
 assert(S.find(data.entries,'1').some(e=>e.scope==='order'));assert(S.find(data.entries,'1').some(e=>e.scope==='regulation'));assert(S.find(data.entries,'1').some(e=>e.scope==='forms'));assert(S.find(data.entries,'Зарегистрировано').some(e=>e.scope==='context'));
});
test('full continuation paragraphs, footnotes, tables and immutable source metadata are present',()=>{
 const entry=data.entries.find(e=>e.id==='regulation-20.4');assert(entry.searchText.startsWith('20.4.'));assert(entry.blocks.length>1);
 assert(data.blocks.some(b=>b.type==='table'));assert(data.entries.find(e=>e.id==='forms-2').blocks.some(i=>data.blocks[i].type==='table'));
 assert.equal(data.sha256.length,64);assert(S.find(data.entries,'государственный инспектор труда').length>1);
});
