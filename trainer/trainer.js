(async function(){
'use strict';
const E=TrainerEngine,S=TrainerStorage,$=s=>document.querySelector(s);
let state,bank,byId,timer,busy=false,lastMode='study',lastDay=0,pausedAt=0,catalogueMode='study';
const labels={mistakes:'Работа над ошибками',study:'Изучение',reinforce:'Закрепление',automatic:'Автоматизм'};
const levels={new:'Новый',learning:'Изучается',hard:'Сложный',mastered:'Освоен'};
const dayNames=['Знакомство','Запоминание','Закрепление','Автоматизм'];
function say(message){$('#notice').textContent=message;}
function cancelTimer(){clearTimeout(timer);timer=null;}
async function persist(){try{await S.save(state);return true;}catch(error){say('Не удалось сохранить прогресс. Экспортируйте резервную копию. '+error.message);return false;}}
function view(id){cancelTimer();document.body.classList.toggle('is-practicing',id==='practice');for(const el of document.querySelectorAll('#app>section'))el.hidden=el.id!==id;window.scrollTo(0,0);}
function refreshHome(){
 const s=E.summary(bank,state);$('.bank-total').textContent=s.total;$('#known').textContent=s.mastered;$('#mastery').max=s.total;$('#mastery').value=s.mastered;
 $('#overview-note').textContent=`Изучено ${s.seen} · Сложных ${s.hard} · Пора повторить ${s.due}`;
 $('#resume').hidden=!state.active;
 $('#mistakes-count').textContent='Вопросов с ошибками: '+bank.filter(q=>E.studyErrors(state.questions[q.id])>0).length;
 $('#days').replaceChildren();dayNames.forEach((name,i)=>{
  const day=i+1,done=state.days[day].filter(id=>byId.has(id)).length;
  const b=document.createElement('button');b.className='day';b.type='button';
  const title=document.createElement('span');title.textContent='День '+day;
  const strong=document.createElement('b');strong.textContent=name;
  const count=document.createElement('span');count.textContent=`${done} / ${bank.length}`;
  b.append(title,strong,count);b.addEventListener('click',()=>start(day===1?'study':day===4?'automatic':'reinforce',day));$('#days').append(b);
 });
 $('#plan-remaining').textContent=`Осталось изучить: ${s.total-s.seen}. Требуют закрепления: ${s.seen-s.mastered}. Этап выполнен после охвата всего банка; освоение оценивается отдельно.`;
}
function home(){view('home');refreshHome();}
function showStudy(mode='study'){
 catalogueMode=mode;const mistakes=mode==='mistakes';
 view('study');
 $('#catalogue-title').textContent=mistakes?'Работа над ошибками':'Изучение по темам и НТД';
 $('#catalogue-description').textContent=mistakes?'Только вопросы, в которых вы ошибались при изучении. Они остаются здесь после верного ответа — повторяйте столько, сколько нужно. Ранее сохранённые ошибки также включены: в старой версии режим ошибки не записывался.':'Выберите тему или нормативный документ. Верно отвеченные вопросы не повторяются до нажатия «Изучить заново».';
 $('#study-all').textContent=mistakes?'Повторить все ошибки':'Изучать весь банк';
 $('#study-all').disabled=mistakes&&!bank.some(q=>E.studyErrors(state.questions[q.id])>0);
 $('#study-all-restart').hidden=mistakes;$('#study-groups').replaceChildren();
 function groupButton(label,ids,theme=false){
  if(mistakes)ids=ids.filter(id=>E.studyErrors(state.questions[id])>0);
  const b=document.createElement('button');b.className=theme?'study-theme':'study-document';b.type='button';
  const name=document.createElement('b');name.textContent=theme?'Вся тема':label;
  const note=document.createElement('span');const done=ids.filter(id=>E.studyPassed(state.questions[id])).length;
  const reviewed=ids.filter(id=>(state.questions[id]?.mistakeReviews||0)>0).length;
  note.textContent=mistakes?(ids.length?'Вопросов с ошибками: '+ids.length+' · Повторяли: '+reviewed:'Ошибок в этой группе пока нет'):`Верно ${done} из ${ids.length} · Осталось ${ids.length-done}`;
  b.append(name,note);b.disabled=mistakes&&!ids.length;b.onclick=()=>start(mode,0,ids,label);
  const wrapper=document.createElement('div');wrapper.className='study-group';wrapper.append(b);
  if(!mistakes&&done){const reset=document.createElement('button');reset.className='study-group-restart';reset.textContent='Изучить заново';reset.onclick=()=>start('study',0,ids,label,true);wrapper.append(reset);}
  return wrapper;
 }
 for(const topic of E.studyGroups(bank)){
  const panel=document.createElement('section');panel.className='panel study-topic';
  const heading=document.createElement('h3');heading.textContent=topic.label;panel.append(heading);
  panel.append(groupButton(topic.label,topic.ids,true));
  const list=document.createElement('div');list.className='study-documents';
  for(const doc of topic.documents)list.append(groupButton(doc.label,doc.ids));
  panel.append(list);$('#study-groups').append(panel);
 }
}
async function start(mode,day=0,filterIds=null,studyLabel="",restart=false){
 if(busy)return;
 if(restart&&!confirm('Изучить выбранную группу заново? Верно отвеченные вопросы снова появятся в изучении. Общая статистика и другие режимы сохранятся.'))return;
 if(!restart&&state.active&&!confirm('Начать новое занятие? Все ответы сохранятся, но текущая очередь будет заменена.'))return;
 busy=true;const backup=structuredClone(state);say('');lastMode=mode;lastDay=day;
 let order=filterIds?filterIds.filter(id=>byId.has(id)):bank.map(q=>q.id);if(state.settings.questionOrder==='random')order=E.shuffle(order);
 if(mode==='mistakes')order=order.filter(id=>E.studyErrors(state.questions[id])>0);
 if(restart)E.resetStudy(state,order);
 const limit=Math.min(state.settings.sessionSize,mode==='study'?order.filter(id=>!E.studyPassed(state.questions[id])).length:order.length);
 state.active={id:crypto.randomUUID(),mode,day,order,studyLabel,limit,seen:[],history:[],current:null};
 const saved=await persist();if(!saved)state=backup;busy=false;if(saved)await advance();
}
function sessionLimit(a){return a.limit??Math.min(state.settings.sessionSize,a.mode==='study'?a.seen.length+a.order.filter(id=>!a.seen.includes(id)&&!E.studyPassed(state.questions[id])).length:a.order.length);}
function setCurrent(id){state.questions[id]||=E.empty();state.questions[id].presentations++;const q=byId.get(id);let optionIds=q.options.map(o=>o.id);if(state.settings.answerOrder==='random')optionIds=E.shuffle(optionIds);state.active.current={id,optionIds,shownAt:Date.now(),elapsed:0,selected:[],answered:false,right:false};}
async function advance(){
 if(busy||!state.active)return;
 busy=true;cancelTimer();const a=state.active;
 if(a.seen.length>=sessionLimit(a)){busy=false;finish();return;}
 const id=E.pick(bank,state,a);
 if(!id){busy=false;finish();return;}
 const backup=structuredClone(state);setCurrent(id);if(!await persist())state=backup;busy=false;renderQuestion(true);
}
function renderQuestion(focus=false){
 const a=state.active,c=a?.current;if(!c||!byId.has(c.id)){home();return;}
 view('practice');const q=byId.get(c.id),sessionSize=sessionLimit(a);
 $('#mode-name').textContent=a.day?`День ${a.day} · ${dayNames[a.day-1]}`:labels[a.mode];
 $('#position').textContent=`${a.seen.length+(c.answered?0:1)} / ${sessionSize}`;
 $('#session-progress').max=sessionSize;$('#session-progress').value=a.seen.length;
 $('#topic').textContent=a.studyLabel||q.topic;$('#question-level').textContent=levels[E.level(state.questions[q.id])];
 $('#question').textContent=q.text;
 $('#multi-note').textContent=q.correct.length>1?`Выберите несколько вариантов (${q.correct.length}), затем подтвердите.`:'Выберите один ответ.';
 $('#options').replaceChildren();
 c.optionIds.forEach((id,displayIndex)=>{
  const option=q.options.find(o=>o.id===id);if(!option)return;
  const b=document.createElement('button');b.type='button';b.className='answer';b.dataset.answerId=id;b.setAttribute('aria-pressed',String(c.selected.includes(id)));b.disabled=c.answered||busy;
  const letter=document.createElement('span');letter.className='letter';letter.textContent=String(displayIndex+1);
  const text=document.createElement('span');text.className='answer-text';text.textContent=option.text;
  const mark=document.createElement('span');mark.className='mark';
  if(c.answered){if(q.correct.includes(id)){b.classList.add('correct');mark.textContent='✓ Верно';}else if(c.selected.includes(id)){b.classList.add('wrong');mark.textContent='✕ Ошибка';}}
  b.append(letter,text,mark);b.addEventListener('click',async()=>{
   if(busy||c.answered)return;
   if(q.correct.length===1){c.selected=[id];await answer();}
   else{c.selected=c.selected.includes(id)?c.selected.filter(x=>x!==id):[...c.selected,id];renderQuestion();await persist();}
  });$('#options').append(b);
 });
 $('#confirm-answer').hidden=q.correct.length===1||c.answered;$('#confirm-answer').disabled=!c.selected.length||busy;
 $('#next').hidden=!c.answered;$('#previous').disabled=!a.history.length||busy;
 const stat=state.questions[q.id];$('#hard').setAttribute('aria-pressed',String(!!stat?.manual));$('#hard').textContent=stat?.manual?'★ Сложный':'☆ Сложный';
 $('#feedback').className=c.answered?(c.right?'right':'wrong'):'';
 $('#feedback').textContent=c.answered?(c.right?'✓ Верно. Ответ сохранён.':'✕ Не совсем. Запомните все варианты с отметкой «✓ Верно».'):'';
 const source=q.sources[0];$('#source').href=`sources/${source.file}#page=${source.page}`;$('#source').textContent=`PDF ${source.file} · вопрос № ${source.number} · стр. ${source.page} →`;
 if(focus&&!c.answered)$('#question').focus({preventScroll:true});
}
function schedule(){
 const c=state.active?.current;if(!c?.answered||document.hidden)return;
 const delay=c.right?state.settings.successPause:state.settings.errorPause*1000;
 if(delay>0)timer=setTimeout(advance,delay);
}
async function answer(){
 if(busy||!state.active?.current||state.active.current.answered)return;
 busy=true;cancelTimer();say('');
 const a=state.active,c=a.current,q=byId.get(c.id),backup=structuredClone(state);
 const snapshot={question:structuredClone(c),stat:state.questions[q.id]?structuredClone(state.questions[q.id]):null,sequence:state.sequence,dayBefore:a.day?[...state.days[a.day]]:null};
 c.right=E.record(state,q,c.selected,c.elapsed+Math.max(0,Date.now()-c.shownAt),a.id,Date.now(),a.day===3?'consolidate':a.mode);c.answered=true;
 a.history.push(snapshot);if(a.history.length>30)a.history.shift();a.seen.push(q.id);
 if(a.day&&!state.days[a.day].includes(q.id))state.days[a.day].push(q.id);
 const saved=await persist();
 if(!saved)state=backup;
 busy=false;renderQuestion();if(saved)schedule();
}
function finish(){
 const a=state.active;view('finished');
 const remaining=a.order.filter(id=>!E.studyPassed(state.questions[id])).length;
 $('#again').textContent=a.mode==='mistakes'?'Повторить ошибки ещё раз':'Продолжить подготовку';
 $('#again').hidden=(a.mode==='study'&&!remaining)||(a.mode==='mistakes'&&!a.order.length);$('#study-restart').hidden=a.mode!=='study';
 $('#session-result').textContent=a.mode==='mistakes'?`Ответов в занятии: ${a.seen.length}. В выбранной группе ${a.order.length} вопросов с ошибками из изучения. Они остаются доступными для повторения.`:a.mode==='study'?`Ответов в занятии: ${a.seen.length}. ${remaining?'Осталось в группе: '+remaining+'. Верно отвеченные вопросы больше не появятся.':'Все вопросы группы изучены. Они появятся снова только после «Изучить заново». '}`:`Ответов в занятии: ${a.seen.length}. Прогресс сохранён. Всего изучено: ${E.summary(bank,state).seen} из ${bank.length}.`;
 // Keep the last answer available for undo via Resume, even after completion.
}
async function undo(){
 if(busy||!state.active?.history.length)return;
 busy=true;cancelTimer();const backup=structuredClone(state),a=state.active,h=a.history.pop();
 if(h.stat)state.questions[h.question.id]=h.stat;else delete state.questions[h.question.id];state.sequence=h.sequence;
 if(a.day)state.days[a.day]=h.dayBefore;
 a.seen.pop();a.current={...h.question,selected:[],answered:false,right:false,elapsed:0,shownAt:Date.now()};
 if(!await persist())state=backup;
 busy=false;renderQuestion(true);say('Последний ответ отменён и убран из статистики. Выберите заново.');
}
function statistics(){
 view('stats');const s=E.summary(bank,state),entries=[['Всего вопросов',s.total],['Впервые пройдено',s.seen],['Освоено',s.mastered],['Сложных',s.hard],['Вопросов с ошибками',s.errors],['Верных ответов',s.percent+'%'],['Пора повторить',s.due],['Ответов за всё время',s.attempts]];
 for(let d=1;d<=4;d++)entries.push([`День ${d} · охват банка`,`${state.days[d].filter(id=>byId.has(id)).length} / ${bank.length}`]);
 $('#metrics').replaceChildren();entries.forEach(([name,value])=>{const div=document.createElement('div'),dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=name;dd.textContent=value;div.append(dt,dd);$('#metrics').append(div);});
}
function exportProgress(){
 const blob=new Blob([JSON.stringify({...state,active:null,exportedAt:new Date().toISOString()},null,2)],{type:'application/json'});
 const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`ot-progress-${new Date().toISOString().slice(0,10)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
async function bind(){
 document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>['study','mistakes'].includes(b.dataset.mode)?showStudy(b.dataset.mode):start(b.dataset.mode)));
 $('#study-all').onclick=()=>start(catalogueMode);
 $('#study-all-restart').onclick=()=>start('study',0,null,'',true);
 $('#study-restart').onclick=()=>start('study',0,[...state.active.order],state.active.studyLabel||'',true);
 $('#resume').onclick=async()=>{if(!state.active.current)await advance();else{state.active.current.shownAt=Date.now();renderQuestion();}};
 $('#confirm-answer').onclick=answer;$('#next').onclick=advance;$('#previous').onclick=undo;
 $('#hard').onclick=async()=>{if(busy)return;const q=state.active.current.id;state.questions[q]||=E.empty();const s=state.questions[q];s.manual=!s.manual;if(s.manual){s.mastered=false;s.dueStep=state.sequence+state.settings.gap;s.dueAt=Date.now()+5*60000;}await persist();renderQuestion();};
 $('#exit').onclick=async()=>{if(busy)return;cancelTimer();const c=state.active?.current;if(c&&!c.answered){c.elapsed+=Math.max(0,Date.now()-c.shownAt);c.shownAt=Date.now();}await persist();home();};
 $('#again').onclick=async()=>{lastMode=state.active.mode;lastDay=state.active.day;const ids=[...state.active.order],label=state.active.studyLabel||'';state.active=null;await start(lastMode,lastDay,ids,label);};$('#to-home').onclick=home;
 $('#stats-open').onclick=statistics;document.querySelectorAll('.home-button').forEach(b=>b.onclick=home);
 $('#settings-open').onclick=()=>{view('settings');for(const [name,value] of Object.entries(state.settings))if($('#settings-form').elements[name])$('#settings-form').elements[name].value=value;};
 $('#settings-form').onsubmit=async event=>{
  event.preventDefault();if(!event.target.reportValidity())return;
  const settings={...state.settings};for(const [key,value] of new FormData(event.target))settings[key]=['questionOrder','answerOrder'].includes(key)?value:Number(value);
  state.settings=settings;if(await persist()){home();say('Настройки сохранены. Порядок вопросов и вариантов применяется к новому занятию.');}
 };
 $('#export').onclick=exportProgress;
 $('#import').onchange=async event=>{
  const file=event.target.files[0];if(!file)return;
  try{
   if(file.size>10*1024*1024)throw Error('Файл больше 10 МБ');
   const imported=E.validateProgress(JSON.parse(await file.text()));
   if(confirm('Заменить текущий прогресс данными из файла? Перед заменой рекомендуем скачать свою копию.')){
    const backup=state;state=imported;if(await persist()){statistics();say('Прогресс восстановлен. Записи отсутствующих в текущем банке вопросов также сохранены.');}else state=backup;
   }
  }catch(error){say('Импорт не выполнен: '+error.message);}finally{event.target.value='';}
 };
 $('#reset').onclick=async()=>{
  if(!confirm('Удалить весь прогресс, историю ответов и результаты четырёх этапов? Отменить это действие нельзя.'))return;
  const backup=state;state={...E.fresh(),settings:{...state.settings}};if(await persist()){statistics();say('Результаты сброшены.');}else state=backup;
 };
 document.addEventListener('visibilitychange',()=>{
  const c=state.active?.current;if(document.hidden){cancelTimer();pausedAt=Date.now();if(c&&!c.answered){c.elapsed+=Math.max(0,pausedAt-c.shownAt);c.shownAt=pausedAt;}persist();}
  else{if(c&&!c.answered)c.shownAt=Date.now();pausedAt=0;/* no surprise automatic navigation after a background pause */}
 });
 window.addEventListener('pagehide',cancelTimer);
}
try{
 // A second tab must not overwrite the first tab's progress.
 if(navigator.locks){let acquired;const ready=new Promise(resolve=>acquired=resolve);navigator.locks.request('ot-trainer-writer',{ifAvailable:true},lock=>{acquired(!!lock);return lock?new Promise(()=>{}):undefined;});if(!await ready)throw Error('Тренажёр уже открыт в другой вкладке. Закройте её и обновите эту страницу.');}
 await S.open();
 const [saved,response]=await Promise.all([S.load(),fetch('questions.json')]);
 if(!response.ok)throw Error('Банк вопросов недоступен');
 const data=await response.json();bank=data.questions;byId=new Map(bank.map(q=>[q.id,q]));
 if(data.schemaVersion!==1||!bank.length)throw Error('Неподдерживаемая база вопросов');
 if(saved&&saved.schemaVersion!==1)throw Error('Эта версия сайта не поддерживает сохранённый прогресс. Данные оставлены без изменений.');
 state=saved||E.fresh();state.settings={...E.defaults,...state.settings};state.bankVersion=data.version;
 if(state.active){state.active.order=state.active.order.filter(id=>byId.has(id));if(state.active.current&&(!byId.has(state.active.current.id)||(state.active.mode==='study'&&!state.active.current.answered&&E.studyPassed(state.questions[state.active.current.id]))))state.active.current=null;}
 await bind();$('#loading').hidden=true;$('#app').hidden=false;home();
 if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js',{scope:'./'}).then(async registration=>{
  await navigator.serviceWorker.ready;
  const worker=registration.active||navigator.serviceWorker.controller;
  if(worker)worker.postMessage('CACHE_SHARED');
 }).catch(()=>say('Офлайн-копия недоступна. Тренажёр работает при подключении к сети; прогресс сохраняется локально.'));
 if(!navigator.onLine)say('Вы офлайн. Вопросы и прогресс доступны на устройстве.');
}catch(error){$('#loading').textContent='Не удалось открыть тренажёр. '+error.message;say('Сохранённые данные не удалены. Попробуйте обновить страницу.');}
})();
