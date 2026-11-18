const test=require('node:test'),assert=require('node:assert/strict');
const E=require('../trainer/engine.js');
const bank=require('../trainer/questions.json').questions;
const q=bank[0],multi=bank.find(q=>q.correct.length>1);
test('bank has stable unique keys and complete answer sets',()=>{
 assert.equal(bank.length,675);assert.equal(new Set(bank.map(q=>q.id)).size,675);
 assert.equal(bank.filter(q=>q.correct.length>1).length,261);
 for(const q of bank){assert(q.text&&q.topic&&q.sources.length);assert.equal(new Set(q.options.map(o=>o.id)).size,q.options.length);assert(q.correct.length);for(const id of q.correct)assert(q.options.some(o=>o.id===id));assert(!q.text.includes('(верно)'));}
});
test('single and multiple answers are checked by identity, never display order',()=>{
 const s=E.fresh();assert(E.record(s,q,[...q.correct].reverse(),1000,'a',100000,'study'));
 assert(E.record(s,multi,[...multi.correct].reverse(),2000,'a',101000,'study'));
 assert(!E.record(s,multi,multi.correct.slice(1),2000,'a',102000,'study'));
 const wrong=multi.options.find(o=>!multi.correct.includes(o.id));
 if(wrong)assert(!E.record(s,multi,[...multi.correct,wrong.id],1000,'a',103000,'study'));
});
test('a mistake returns after the configured gap, unseen questions are not starved',()=>{
 const s=E.fresh();s.settings.gap=7;
 const a={mode:'reinforce',day:0,order:bank.map(q=>q.id),seen:[]};
 E.record(s,q,[],1000,'a',100000,'reinforce');a.seen.push(q.id);
 for(let i=0;i<7;i++){
  const next=E.pick(bank,s,a,100001+i);assert.notEqual(next,q.id);
  E.record(s,bank.find(q=>q.id===next),bank.find(q=>q.id===next).correct,1000,'a',100010+i,'reinforce');a.seen.push(next);
 }
 assert.equal(E.pick(bank,s,a,100100),q.id);
 // Three overdue errors cannot monopolize training forever.
 a.seen=['x','y','z'];assert.equal(E.pick(bank,s,a,100100),bank.find(q=>!s.questions[q.id]).id);
});
test('small banks do not deadlock or immediately repeat if an alternative exists',()=>{
 const s=E.fresh(),a={mode:'reinforce',order:bank.slice(0,2).map(q=>q.id),seen:[q.id]};
 assert.equal(E.pick(bank.slice(0,2),s,a),bank[1].id);
 assert.equal(E.pick([q],s,{...a,order:[q.id]}),q.id);
});
test('mastery needs a delayed recall and distinct sessions; due mastered items return',()=>{
 const s=E.fresh();for(let i=0;i<4;i++)E.record(s,q,q.correct,1000,'a',100000+i,'reinforce');
 assert(!s.questions[q.id].mastered);
 E.record(s,q,q.correct,1000,'b',100000+31*60000,'reinforce');assert(s.questions[q.id].mastered);
 assert(E.isDue(s.questions[q.id],s,100000+10*86400000));
 E.record(s,q,[],1000,'b',200000000,'reinforce');assert.equal(E.level(s.questions[q.id]),'hard');assert.equal(s.questions[q.id].streak,0);
});
test('speed threshold scales with content; slow correct answers remain in training',()=>{
 assert(E.speedLimit({text:'x',options:[{text:'a'}],correct:['1']})<E.speedLimit({text:'x'.repeat(1000),options:[{text:'a'}],correct:['1']}));
 const s=E.fresh();for(let i=0;i<4;i++)E.record(s,q,q.correct,60000,'s'+i,100000+i*3600000,'automatic');assert(!s.questions[q.id].mastered);
});
test('backup validation keeps unknown question progress and rejects broken imports',()=>{
 const s=E.fresh();E.record(s,q,q.correct,1000,'a',100000,'study');s.questions['q-99999999']={...E.empty()};
 assert.deepEqual(E.validateProgress(JSON.parse(JSON.stringify(s))).questions,s.questions);
 assert.throws(()=>E.validateProgress({...s,schemaVersion:9}));
 assert.throws(()=>E.validateProgress({...s,questions:{[q.id]:{...s.questions[q.id],correct:99}}}));
 assert.throws(()=>E.validateProgress({...s,settings:{gap:-1}}));
});
test('day 3 mixes uncovered questions and lengthens successful intervals',()=>{
 const s=E.fresh(),small=bank.slice(0,5);
 for(const q of small)E.record(s,q,q.correct,1000,'old',100000,'study');
 s.questions[small[0].id].dueStep=0;s.questions[small[0].id].errors=1;
 s.days[3]=[small[0].id];s.settings.gap=1;
 const a={mode:'reinforce',day:3,order:small.map(q=>q.id),seen:[small[3].id,small[4].id]};
 assert.equal(E.pick(small,s,a,100001),small[1].id);
 const normal=E.fresh(),mixed=E.fresh();
 E.record(normal,q,q.correct,1000,'a',100000,'reinforce');E.record(mixed,q,q.correct,1000,'a',100000,'consolidate');
 assert(mixed.questions[q.id].dueStep>normal.questions[q.id].dueStep);
});
test('study topics and explicit NTD groups cover the bank exactly once',()=>{
 const topics=E.studyGroups(bank);assert.deepEqual(topics.map(t=>t.ids.length),[92,133,450]);
 const all=topics.flatMap(t=>t.documents.flatMap(d=>d.ids));assert.equal(all.length,675);assert.equal(new Set(all).size,675);
 assert.equal(topics[0].documents.find(d=>d.id==='unspecified').ids.length,11);
 for(const t of topics)for(const d of t.documents){
  const session={mode:'study',day:0,order:d.ids,seen:[]},state=E.fresh();
  while(true){const id=E.pick(bank,state,session);if(!id)break;assert(d.ids.includes(id));session.seen.push(id);}
  assert.equal(session.seen.length,d.ids.length);
 }
 assert.equal(E.documentGroup({text:'Вопрос без ссылки'}).id,'unspecified');
});
