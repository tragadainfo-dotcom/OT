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
test('study excludes 18 correct answers from the next batch of 20, retains errors and unseen',()=>{
 const s=E.fresh(),scope=bank.slice(0,20),a={mode:'study',day:0,order:scope.map(q=>q.id),seen:[]};
 for(let i=0;i<20;i++)E.record(s,scope[i],i<18?scope[i].correct:[],1000,'batch1',100000+i,'study');
 assert.equal(scope.filter(q=>E.studyPassed(s.questions[q.id])).length,18);
 assert.equal(E.pick(bank,s,a),scope[18].id);a.seen.push(scope[18].id);
 assert.equal(E.pick(bank,s,a),scope[19].id);a.seen.push(scope[19].id);assert.equal(E.pick(bank,s,a),null);
 E.record(s,scope[18],scope[18].correct,1000,'batch2',200000,'study');a.seen=[];
 assert.equal(E.pick(bank,s,a),scope[19].id);
 E.record(s,scope[0],[],1000,'other',300000,'reinforce');assert(E.studyPassed(s.questions[scope[0].id]));
 const before=structuredClone(s.questions[scope[0].id]);E.resetStudy(s,[scope[0].id]);
 assert.equal(E.studyPassed(s.questions[scope[0].id]),false);assert.equal(s.questions[scope[0].id].correct,before.correct);assert.equal(s.questions[scope[0].id].errors,before.errors);
 assert(E.studyPassed(s.questions[scope[1].id]));assert.equal(E.pick(bank,s,a),scope[0].id);
 const restored=E.validateProgress(JSON.parse(JSON.stringify(s)));assert.equal(restored.questions[scope[0].id].studyPassed,false);
});
test('existing correct answers migrate without resetting statistics; other modes do not pass new study questions',()=>{
 const s=E.fresh();s.questions[q.id]={...E.empty(),shows:1,correct:1,streak:1};delete s.questions[q.id].studyPassed;
 assert(E.studyPassed(s.questions[q.id]));const imported=E.validateProgress(JSON.parse(JSON.stringify(s)));assert(imported.questions[q.id].studyPassed);
 const before=structuredClone(s.questions[q.id]);E.record(s,q,[],1000,'a',100000,'study');s.questions[q.id]=before;assert(E.studyPassed(s.questions[q.id]));
 const other=E.fresh();E.record(other,q,q.correct,1000,'a',100000,'reinforce');assert(!E.studyPassed(other.questions[q.id]));
});
test('mistake review keeps history but excludes correct answers until an explicit restart',()=>{
 const s=E.fresh(),qs=bank.slice(0,5);
 E.record(s,qs[0],qs[0].correct,1000,'study1',100000,'study');
 E.record(s,qs[1],[],1000,'study1',100001,'study');
 E.record(s,qs[1],qs[1].correct,1000,'study2',100002,'study');
 E.record(s,qs[2],[],1000,'other',100003,'reinforce');
 s.questions[qs[3].id]={...E.empty(),manual:true};
 const a={mode:'mistakes',order:qs.map(q=>q.id),seen:[]};
 assert.equal(E.pick(bank,s,a),qs[1].id);
 E.record(s,qs[1],qs[1].correct,1000,'review',100004,'mistakes');
 assert.equal(E.studyErrors(s.questions[qs[1].id]),1);
 a.seen.push(qs[1].id);assert.equal(E.pick(bank,s,a),null);
 a.seen=[];assert.equal(E.pick(bank,s,a),null);
 E.resetRound(s,[qs[1].id],'mistakes');assert.equal(E.pick(bank,s,a),qs[1].id);
 const before=structuredClone(s.questions[qs[0].id]);E.record(s,qs[0],[],1000,'study3',100005,'study');
 assert.equal(E.studyErrors(s.questions[qs[0].id]),1);s.questions[qs[0].id]=before;
 assert.equal(E.studyErrors(s.questions[qs[0].id]),0);
 E.resetStudy(s,qs.map(q=>q.id));assert.equal(E.studyErrors(s.questions[qs[1].id]),1);
 const restored=E.validateProgress(JSON.parse(JSON.stringify(s)));assert.equal(E.studyErrors(restored.questions[qs[1].id]),1);
 assert.equal(E.studyErrors(restored.questions[qs[2].id]),0);
 assert.throws(()=>E.validateProgress({...s,questions:{[qs[0].id]:{...s.questions[qs[0].id],studyErrors:99}}}));
});
test('legacy mistakes are retained with missing mode provenance; new non-study mistakes are excluded',()=>{
 const old={...E.empty(),shows:1,errors:1};delete old.studyErrors;
 assert.equal(E.studyErrors(old),1);
 const s=E.fresh();s.questions[q.id]=old;
 assert.equal(E.studyErrors(E.validateProgress(JSON.parse(JSON.stringify(s))).questions[q.id]),1);
 E.record(s,q,q.correct,1000,'review',100000,'mistakes');assert.equal(s.questions[q.id].studyErrors,1);
 const modern=E.fresh();E.record(modern,q,[],1000,'other',100000,'automatic');assert.equal(E.studyErrors(modern.questions[q.id]),0);
});
test('60 accumulated study mistakes are all reached across batches even in original order',()=>{
 const s=E.fresh(),scope=bank.slice(0,60);for(const q of scope)E.record(s,q,[],1000,'study',100000,'study');
 const visited=[];
 for(let batch=0;batch<3;batch++){
  const a={mode:'mistakes',order:scope.map(q=>q.id),seen:[]};
  for(let i=0;i<20;i++){
   const id=E.pick(bank,s,a);assert(!visited.includes(id));const question=scope.find(q=>q.id===id);
   E.record(s,question,question.correct,1000,'review'+batch,200000+i,'mistakes');a.seen.push(id);visited.push(id);
  }
 }
 assert.equal(new Set(visited).size,60);assert(scope.every(q=>E.studyErrors(s.questions[q.id])===1));
});
test('manual work is independent of study/errors, excludes successes, and restarts only its own round',()=>{
 const s=E.fresh(),a={mode:'focus',order:bank.slice(0,3).map(q=>q.id),seen:[]};
 s.questions[q.id]={...E.empty(),manual:true};
 assert.equal(E.pick(bank,s,a),q.id);const snapshot=structuredClone(s.questions[q.id]);
 E.record(s,q,q.correct,1000,'manual',100000,'focus');assert.equal(E.pick(bank,s,a),null);
 assert.equal(E.studyErrors(s.questions[q.id]),0);assert(!E.studyPassed(s.questions[q.id]));
 assert(s.questions[q.id].focusPassed);assert(s.questions[q.id].manual);
 E.resetRound(s,[q.id],'mistakes');assert.equal(E.pick(bank,s,a),null);
 E.resetRound(s,[q.id],'focus');assert.equal(E.pick(bank,s,a),q.id);assert.equal(s.questions[q.id].correct,1);
 const imported=E.validateProgress(JSON.parse(JSON.stringify(s)));assert.equal(imported.questions[q.id].focusPassed,false);
 s.questions[q.id]=snapshot;assert.equal(E.pick(bank,s,a),q.id);
 s.questions[q.id].manual=false;assert.equal(E.pick(bank,s,a),null);
});
test('18 correct mistake answers stay out while 2 failed questions remain across sessions',()=>{
 const s=E.fresh(),scope=bank.slice(0,20),a={mode:'mistakes',order:scope.map(q=>q.id),seen:[]};
 for(const [i,q] of scope.entries()){E.record(s,q,[],1000,'study',100000,'study');E.record(s,q,i<18?q.correct:[],1000,'review',200000,'mistakes');}
 assert.equal(E.pick(bank,s,a),scope[18].id);a.seen.push(scope[18].id);assert.equal(E.pick(bank,s,a),scope[19].id);a.seen.push(scope[19].id);assert.equal(E.pick(bank,s,a),null);
 const saved=E.validateProgress(JSON.parse(JSON.stringify(s)));assert.equal(scope.filter(q=>E.roundPending('mistakes',saved.questions[q.id])).length,2);
 E.resetRound(saved,[scope[0].id],'mistakes');assert.equal(scope.filter(q=>E.roundPending('mistakes',saved.questions[q.id])).length,3);
 assert.equal(saved.questions[scope[0].id].errors,s.questions[scope[0].id].errors);
});
test('answers shuffle by default, upgrade existing settings once, and differ on repeated displays',()=>{
 assert.equal(E.fresh().settings.answerOrder,'random');
 const legacy=E.fresh();delete legacy.answerShuffleVersion;legacy.settings.answerOrder='original';
 assert(E.upgradeAnswerOrder(legacy));assert.equal(legacy.settings.answerOrder,'random');
 legacy.settings.answerOrder='original';assert(!E.upgradeAnswerOrder(legacy));assert.equal(legacy.settings.answerOrder,'original');
 let previous=['1','2','3'];for(let i=0;i<30;i++){const next=E.shuffledAnswers(['1','2','3'],previous);assert.notDeepEqual(next,previous);assert.deepEqual([...next].sort(),['1','2','3']);previous=next;}
 assert.deepEqual(E.shuffledAnswers(['1']),['1']);
 const backup=E.fresh();delete backup.answerShuffleVersion;backup.settings.answerOrder='original';
 assert.equal(E.validateProgress(backup).settings.answerOrder,'random');
});
test('question search matches fragments, punctuation, case, ё/е and mixed PDF letters',()=>{
 const questions=[{id:'a',text:'Допускается ли пеpесечение ВЛ выше 1000 В?'},{id:'b',text:'Учёт средств: какие требования?'},{id:'c',text:'Периодичность проведения контрольных тренировок'}];
 assert.deepEqual(E.searchQuestions(questions,'ПЕРЕСЕЧЕНИЕ'),[questions[0]]);
 assert.deepEqual(E.searchQuestions(questions,'учет средств'),[questions[1]]);
 assert.deepEqual(E.searchQuestions(questions,'периодичность тренировок'),[questions[2]]);
 assert.deepEqual(E.searchQuestions(questions,'выше 1000'),[questions[0]]);
 assert.deepEqual(E.searchQuestions(questions,'не найдено'),[]);
 assert.deepEqual(E.searchQuestions(questions,' '),[]);
 const snapshot=JSON.stringify(bank);E.searchQuestions(bank,'напряжени');assert.equal(JSON.stringify(bank),snapshot);
});
