/* Pure scheduling and progress rules, shared by the browser and node tests. */
(function(root){
'use strict';
const defaults={questionOrder:'random',answerOrder:'original',gap:7,successGap:18,errorPause:0,successPause:900,sessionSize:20};
function fresh(){return {schemaVersion:1,questions:{},settings:{...defaults},sequence:0,days:{1:[],2:[],3:[],4:[]},active:null};}
function empty(){return {presentations:0,shows:0,correct:0,errors:0,streak:0,lastAt:0,lastMs:0,totalMs:0,fastStreak:0,manual:false,mastered:false,sessions:[],delayedSuccess:0,dueAt:0,dueStep:0};}
function speedLimit(q){const length=q.text.length+q.options.reduce((s,o)=>s+o.text.length,0);return Math.min(45000,Math.max(6000,3000+length*22+q.correct.length*700));}
function level(s){if(!s||!s.shows)return s?.manual?'hard':'new';if(s.manual||s.errors>0&&s.streak<3)return 'hard';return s.mastered?'mastered':'learning';}
function isDue(s,state,now){return !!s?.shows&&(s.dueStep<=state.sequence||s.dueAt<=now);}
function record(state,q,selected,elapsed,sessionId,now,mode){
 const old=state.questions[q.id]||empty(),s={...old,sessions:[...old.sessions]};
 const right=q.correct.length===selected.length&&q.correct.every(id=>selected.includes(id));
 s.shows++;s.lastMs=Math.max(0,elapsed);s.totalMs+=s.lastMs;s.lastAt=now;
 state.sequence++;
 if(right){
  s.correct++;s.streak++;s.fastStreak=s.lastMs<=speedLimit(q)?s.fastStreak+1:0;
  if(!s.sessions.includes(sessionId))s.sessions.push(sessionId);
  // A genuine delayed recall must be at least 30 minutes after the prior attempt.
  if(old.lastAt&&now-old.lastAt>=30*60*1000)s.delayedSuccess++;
  s.mastered=!s.manual&&s.streak>=3&&s.sessions.length>=2&&s.delayedSuccess>0&&(mode!=='automatic'||s.fastStreak>=3);
  const gap=Math.min(250,Number(state.settings.successGap)*(mode==='consolidate'?1.5:1)*Math.pow(2,Math.min(4,s.streak-1)));
  s.dueStep=state.sequence+gap;s.dueAt=now+Math.min(7*86400000,15*60000*Math.pow(2,Math.min(10,s.streak-1)));
 }else{
  s.errors++;s.streak=0;s.fastStreak=0;s.mastered=false;s.dueStep=state.sequence+Number(state.settings.gap);s.dueAt=now+5*60000;
 }
 s.sessions=s.sessions.slice(-16);state.questions[q.id]=s;return right;
}
function shuffle(list,random=Math.random){const a=[...list];for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function pick(bank,state,session,now=Date.now()){
 const byId=new Map(bank.map(q=>[q.id,q]));
 const ordered=session.order.filter(id=>byId.has(id));
 if(session.mode==='study'||session.day===1){
  return ordered.find(id=>!state.questions[id]?.shows&&!session.seen.includes(id))||ordered.find(id=>!session.seen.includes(id))||null;
 }
 const recent=session.seen.slice(-Math.min(Number(state.settings.gap),Math.max(0,bank.length-1)));
 let pool=ordered.filter(id=>!recent.includes(id));
 if(!pool.length)pool=ordered;
 // Day 3 mixes in the whole bank even when there is a large backlog of errors.
 if(session.day===3&&session.seen.length%3===2){const uncovered=pool.find(id=>!state.days[3].includes(id));if(uncovered)return uncovered;}
 // Every fourth attempt gives an unseen question a turn, even with many overdue errors.
 if(session.seen.length%4===3){const unseen=pool.find(id=>!state.questions[id]?.shows);if(unseen)return unseen;}
 function score(id){
  const s=state.questions[id],q=byId.get(id);
  if(!s?.shows)return 30;
  if(isDue(s,state,now))return 100+(s.errors?15:0)+(s.manual?15:0);
  // Pending repeats wait for their interval while there are other useful questions.
  if(s.errors&&s.streak<3||s.manual)return 5;
  if(session.mode==='automatic'&&s.lastMs>speedLimit(q))return 20;
  return s.mastered?1:10;
 }
 return pool.reduce((best,id)=>best===null||score(id)>score(best)?id:best,null);
}
function summary(bank,state,now=Date.now()){
 const result={total:bank.length,seen:0,mastered:0,hard:0,errors:0,due:0,correct:0,attempts:0};
 bank.forEach(q=>{const s=state.questions[q.id];if(!s)return;result.seen+=(s.presentations||s.shows)>0;result.mastered+=level(s)==='mastered';result.hard+=level(s)==='hard';result.errors+=s.errors>0;result.due+=isDue(s,state,now);result.correct+=s.correct;result.attempts+=s.shows;});
 result.percent=result.attempts?Math.round(100*result.correct/result.attempts):0;return result;
}
function validateProgress(data){
 if(!data||data.schemaVersion!==1||!data.questions||typeof data.questions!=='object'||Array.isArray(data.questions))throw Error('Неподдерживаемый формат прогресса');
 if(Object.keys(data.questions).length>20000)throw Error('Слишком большой файл');
 const clean=fresh();
 if(!Number.isSafeInteger(data.sequence)||data.sequence<0)throw Error('Повреждён счётчик ответов');
 clean.sequence=data.sequence;
 for(const [id,value] of Object.entries(data.questions)){
  if(!/^q-\d+$/.test(id)||!value||typeof value!=='object')throw Error('Повреждена запись вопроса');
  const s=empty();
  for(const key of ['shows','correct','errors','streak','lastAt','lastMs','totalMs','fastStreak','delayedSuccess','dueAt','dueStep']){
   if(!Number.isFinite(value[key])||value[key]<0||value[key]>Number.MAX_SAFE_INTEGER)throw Error('Повреждено поле '+key);
   s[key]=value[key];
  }
  if(s.correct+s.errors!==s.shows||s.streak>s.correct||s.fastStreak>s.streak)throw Error('Несогласованная статистика');
  if(typeof value.manual!=='boolean'||typeof value.mastered!=='boolean'||!Array.isArray(value.sessions)||value.sessions.some(x=>typeof x!=='string'||x.length>100))throw Error('Повреждена история');
  if(value.presentations!==undefined&&(!Number.isSafeInteger(value.presentations)||value.presentations<0))throw Error('Повреждено число показов');s.presentations=value.presentations??s.shows;
  s.manual=value.manual;s.mastered=value.mastered;s.sessions=value.sessions.slice(-16);clean.questions[id]=s;
 }
 const settings=data.settings||{};
 for(const k of ['questionOrder','answerOrder']){if(settings[k]!==undefined&&!['random','original'].includes(settings[k]))throw Error('Повреждены настройки');if(settings[k])clean.settings[k]=settings[k];}
 for(const [k,min,max] of [['gap',1,30],['successGap',2,250],['errorPause',0,30],['successPause',300,3000],['sessionSize',5,100]]){
  if(settings[k]!==undefined){if(!Number.isFinite(settings[k])||settings[k]<min||settings[k]>max)throw Error('Неверная настройка '+k);clean.settings[k]=settings[k];}
 }
 for(let day=1;day<=4;day++){const ids=data.days?.[day]||[];if(!Array.isArray(ids)||ids.some(id=>!/^q-\d+$/.test(id)))throw Error('Повреждены этапы');clean.days[day]=[...new Set(ids)];}
 return clean;
}
const api={defaults,fresh,empty,speedLimit,level,isDue,record,shuffle,pick,summary,validateProgress};
if(typeof module==='object'&&module.exports)module.exports=api;else root.TrainerEngine=api;
})(typeof globalThis==='object'?globalThis:this);
