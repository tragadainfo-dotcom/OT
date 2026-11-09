(function(){
var TOOLS=[['hand','Рука: отключить / включить'],['lock','Замок'],['nak','Изолирующая накладка'],['cover','Крышка на кнопки'],['ind','Указатель напряжения'],['clamp','Переносное заземление'],['tape','Ограждающая лента, ширма']];
var PTS=['dont_on','dont_open','dont_line','volt','stop','climbno','climb','work','earth'];
function pname(k){return PK[k].a+(PK[k].b?' '+PK[k].b:'')}
function tname(t){if(t.indexOf('p:')===0)return '«'+pname(t.slice(2))+'»';var r=TOOLS.filter(function(x){return x[0]===t})[0];return r?r[1].split(':')[0]:t}
var PTRAP={
 dont_on:'Плакат «Не включать! Работают люди» вешают на приводы и ключи управления аппаратов (п. 18.1), а не сюда.',
 dont_open:'«Не открывать! Работают люди» вешают только на задвижки пневмоприводов (п. 18.1). Здесь пневмопривода нет.',
 dont_line:'«Не включать! Работа на линии» вешают на привод разъединителя, которым отключена линия (п. 18.2). Здесь работа не на линии.',
 volt:'«Работа под напряжением. Повторно не включать!» нужен при работах под напряжением (п. 18.3). Здесь напряжение снимают.',
 stop:'«Стой! Напряжение» вешают на ограждение или шторку, граничащие с частями под напряжением (п. 23.2, 23.4, 29.1), а не сюда.',
 climbno:'«Не влезай! Убьет» вешают на конструкции ОРУ, граничащие с разрешённой для подъёма (п. 23.6). Здесь это не нужно.',
 climb:'«Влезать здесь!» вешают на разрешённые для подъёма лестницы и конструкции в ОРУ (п. 23.6). Здесь это не нужно.',
 work:'«Работать здесь» вешают на подготовленном рабочем месте: на оборудовании, где предстоит работа (п. 23.7).',
 earth:'«Заземлено» вешают после установки заземления, на приводы и ключи, указанные в п. 23.1, и на заземлённый участок.'};
var TTRAP={hand:'Здесь рукой ничего делать не нужно.',lock:'Здесь замок не нужен.',nak:'Накладки ставят между контактами аппарата (п. 17.5).',cover:'Крышка закрывает кнопки управления (п. 17.5).',
 ind:'Отсутствие напряжения проверяют на частях, которые будут заземляться (п. 16.1).',clamp:'Заземление присоединяют к заземляющему устройству и к токоведущим частям (п. 20.2). Здесь это не нужно.',tape:'Ограждают рабочее место и части, оставшиеся под напряжением (п. 23.2). Здесь лента не нужна.'};
function T(id,st,tool,t,ok,r,o){var x={id:id,st:st,tool:tool,t:[].concat(t),ok:ok,r:r};for(var k in (o||{}))x[k]=o[k];return x}
var P=function(k){return 'p:'+k};
var SC={};
/* ---------- щит ---------- */
SC.A={base:'A',gen:sceneA,name:'Щит до 1000 В',
 hs:[['qs',195,84,40,72],['lev',300,90,40,56],['fuse',405,84,40,64],['ctr',500,84,60,64],['key',660,85,40,42],['btn',648,164,88,44],['cs',584,100,32,32],['bus',150,256,440,24],['test',736,290,116,58],['earth',150,376,440,18],['gcl',247,285,40,86],['top',14,50,596,28]],
 lab:{qs:'рубильник',lev:'автомат',fuse:'предохранитель',ctr:'контактор',key:'ключ дистанционного управления',btn:'кнопки «Пуск» и «Стоп»',cs:'цепь катушки контактора',bus:'шины щита',test:'контрольную часть под напряжением (справа внизу)',earth:'заземляющее устройство (зелёная шина внизу)',gcl:'заземление на шинах',top:'верх щита, где подводится питание'},
 anchor:{qs:[215,160],lev:[320,160],fuse:[425,160],key:[770,86],btn:[790,148],gcl:[267,312],bus:[172,298],top:[66,80]},
 lockAt:{qs:[236,121],lev:[342,121]},rest:[660,325],pts:{test:[756,318],bus:[372,274]},
 trap:{'lock|fuse':['Предохранитель уже снят: именно снятие предохранителя отключает цепь. Замок не нужен.','17.5'],'hand|ctr':['Контактор отключают ключом дистанционного управления, а не руками на самом контакторе.','17.4'],'hand|bus':['Шины отключают аппаратами, которыми подаётся напряжение. Руками их не отключить.','17.1']},
 stages:[
  {n:'Отключить',todo:'Возьмите «Руку» и отключите все аппараты, которыми подаётся напряжение на шины: рубильник, автомат, предохранитель (его снимают), контактор (ключом).',gate:'Сначала отключения.',done:function(S){S.cls('g-dead')}},
  {n:'Не дать включить по ошибке',todo:'Заприте рукоятки замками, закройте кнопки крышкой, разомкните цепь катушки контактора, вставьте накладку между контактами контактора.',gate:'Сначала отключите все аппараты (п. 16.1).'},
  {n:'Запрещающие плакаты',todo:'Выберите плакат «Не включать! Работают люди» и повесьте на рукоятки, ключ, кнопки и на место снятого предохранителя.',gate:'Плакаты вывешивают после отключения и защиты от включения (п. 16.1).'},
  {n:'Проверить отсутствие напряжения',todo:'Возьмите указатель напряжения: сначала проверьте его на части, заведомо находящейся под напряжением, потом проверьте шины.',gate:'Проверять напряжение рано: сначала отключения, защита от включения и плакаты (п. 16.1).',done:function(S){S.cls('g-checked');setTimeout(function(){S.ind(S.cfg.rest,false)},900)}},
  {n:'Заземлить',todo:'Возьмите «Переносное заземление»: сначала присоедините к заземляющему устройству, затем к шинам.',gate:'Заземлять рано: сначала нужно проверить отсутствие напряжения (п. 16.1, 20.1).'},
  {n:'«Заземлено», ограждение, плакаты',todo:'Повесьте «Заземлено» на заземление и «Работать здесь» на шины, где будет работа. Поставьте ограждающую ленту у частей, оставшихся под напряжением (вверху), и повесьте на неё «Стой! Напряжение».',gate:'Это последний этап: сначала заземление (п. 16.1).'}],
 tasks:[
  T('a1',0,'hand','qs','Рубильник отключён: контакты разошлись.','17.5',{act:function(S){S.cls('g-qs')}}),
  T('a2',0,'hand','lev','Автомат отключён.','17.5',{act:function(S){S.cls('g-lev')}}),
  T('a3',0,'hand','fuse','Предохранитель снят: так отключают цепь с предохранителем.','17.5',{act:function(S){S.cls('g-fuse')}}),
  T('a4',0,'hand','key','Контактор отключён ключом: контакты разошлись.','17.4',{act:function(S){S.cls('g-key')}}),
  T('b1',1,'lock','qs','Рукоятка рубильника заперта.','17.5',{act:function(S,t){S.lock(t)}}),
  T('b2',1,'lock','lev','Рукоятка автомата заперта.','17.5',{act:function(S,t){S.lock(t)}}),
  T('b3',1,'hand','cs','Цепь включающей катушки разомкнута.','17.5',{act:function(S){S.cls('g-cs')}}),
  T('b4',1,'nak','ctr','Изолирующая накладка вставлена между контактами контактора.','17.5',{act:function(S){S.cls('g-nak')}}),
  T('b5',1,'cover','btn','Кнопки закрыты крышкой.','17.5',{act:function(S){S.cls('g-cover')}}),
  T('c1',2,P('dont_on'),'qs','Плакат на рубильнике.','18.1'),T('c2',2,P('dont_on'),'lev','Плакат на автомате.','18.1'),
  T('c3',2,P('dont_on'),'fuse','Плакат у места снятого предохранителя.','18.1'),T('c4',2,P('dont_on'),'key','Плакат на ключе управления.','18.1'),T('c5',2,P('dont_on'),'btn','Плакат на кнопках.','18.1'),
  T('d1',3,'ind','test','Указатель загорелся на части под напряжением: он исправен.','19.1',{act:function(S){S.ind(S.cfg.pts.test,true)}}),
  T('d2',3,'ind','bus','Указатель не горит: напряжения на шинах нет.','19.1',{need:'d1',needMsg:'Сначала проверьте исправность указателя на части, заведомо находящейся под напряжением (п. 19.1).',act:function(S){S.ind(S.cfg.pts.bus,false);S.cls('g-tick')}}),
  T('e1',4,'clamp','earth','Заземление присоединено к заземляющему устройству.','20.2',{act:function(S){S.cls('g-gc1')}}),
  T('e2',4,'clamp','bus','Заземление установлено на шины.','20.2',{need:'e1',needMsg:'Сначала заземление присоединяют к заземляющему устройству, и только потом ставят на токоведущие части (п. 20.2).',act:function(S){S.cls('g-gcab');S.cls('g-gc2')}}),
  T('f1',5,P('earth'),'gcl','Вывешен «Заземлено».','23.1'),
  T('f2',5,P('work'),'bus','«Работать здесь» вывешен на рабочем месте.','23.7'),
  T('f3',5,'tape','top','Части, оставшиеся под напряжением, закрыты ограждением.','23.2',{act:function(S){S.cls('g-tape')}}),
  T('f4',5,P('stop'),'top','На ограждении «Стой! Напряжение».','23.2',{need:'f3',needMsg:'Сначала поставьте ограждение: плакат вешают на него (п. 23.2).'})]};
/* ---------- ячейка ---------- */
SC.B={base:'B',gen:sceneB,name:'Ячейка 10 кВ',
 hs:[['dr1',380,82,120,56],['dr1',160,76,60,70],['drq',380,167,120,56],['qb',168,165,44,62],['dr2',380,264,120,56],['dr2',160,258,60,70],['drz',380,357,120,56],['drz',95,325,120,90],['spr',415,200,50,26],['ctrl',455,190,45,36],['test',738,318,110,40],['nb',700,20,155,296],['pa',153,418,24,24],['pb',178,418,24,24],['pc',203,418,24,24]],
 lab:{dr1:'шинный разъединитель QS1 (привод)',drq:'выключатель Q (привод)',qb:'выключатель Q',dr2:'линейный разъединитель QS2 (привод)',drz:'заземляющие ножи (привод)',spr:'пружину привода выключателя',ctrl:'цепи управления привода выключателя',test:'контрольную часть под напряжением в соседней ячейке',nb:'соседнюю ячейку, оставшуюся под напряжением',pa:'фазу A на кабеле',pb:'фазу B на кабеле',pc:'фазу C на кабеле'},
 anchor:{'dr1:dont_on':[552,84],'dr1:earth':[650,93],drq:[552,169],'dr2:dont_on':[552,266],'dr2:earth':[650,275],qb:[105,172],nb:[650,169]},
 lockAt:{dr1:[472,118],dr2:[472,300]},rest:[540,420],pts:{test:[725,330],pa:[165,430],pb:[190,430],pc:[215,430]},
 trap:{'lock|drq':['У привода выключателя отключают силовые цепи и цепи управления и приводят пружины в нерабочее положение. Замок ставят на ручные приводы разъединителей.','17.4'],'clamp|*':['В ячейке есть заземляющие ножи: их и включают. Переносное заземление ставят там, где ножей нет.','16.1'],'ind|qb':['Проверять нужно части, которые будут заземляться: фазы на кабеле.','16.1']},
 stages:[
  {n:'Отключить',todo:'Возьмите «Руку» и отключите выключатель, шинный и линейный разъединители. Должен появиться видимый разрыв.',gate:'Сначала отключения.',done:function(S){S.cls('g-dead')}},
  {n:'Не дать включить по ошибке',todo:'Заприте приводы разъединителей замками. У привода выключателя спустите пружину и отключите цепи управления.',gate:'Сначала отключите выключатель и разъединители (п. 16.1).'},
  {n:'Запрещающие плакаты',todo:'Повесьте «Не включать! Работают люди» на приводы шинного разъединителя, выключателя и линейного разъединителя.',gate:'Плакаты вывешивают после отключения и защиты от включения (п. 16.1).'},
  {n:'Проверить отсутствие напряжения',todo:'Возьмите указатель напряжения: проверьте его исправность на части под напряжением (соседняя ячейка), затем проверьте все три фазы A, B, C на кабеле.',gate:'Проверять напряжение рано: сначала отключения, защита от включения и плакаты (п. 16.1).',done:function(S){S.cls('g-checked');setTimeout(function(){S.ind(S.cfg.rest,false)},900)}},
  {n:'Заземлить',todo:'Включите заземляющие ножи (рукой, через привод).',gate:'Заземлять рано: сначала нужно проверить отсутствие напряжения (п. 16.1, 20.1).'},
  {n:'«Заземлено», ограждение, плакаты',todo:'«Заземлено» на приводы обоих разъединителей, «Работать здесь» на выключатель, лента на соседнюю ячейку и «Стой! Напряжение» на неё.',gate:'Это последний этап: сначала заземление (п. 16.1).'}],
 tasks:[
  T('a1',0,'hand',['drq','qb'],'Выключатель отключён: контакты разошлись.','17.2',{act:function(S){S.cls('g-q')}}),
  T('a2',0,'hand','dr1','Шинный разъединитель отключён: виден разрыв.','17.2',{act:function(S){S.cls('g-dr1')}}),
  T('a3',0,'hand','dr2','Линейный разъединитель отключён: виден разрыв.','17.2',{act:function(S){S.cls('g-dr2')}}),
  T('b1',1,'lock','dr1','Привод QS1 заперт механическим замком.','17.4',{act:function(S,t){S.lock(t)}}),
  T('b2',1,'lock','dr2','Привод QS2 заперт механическим замком.','17.4',{act:function(S,t){S.lock(t)}}),
  T('b3',1,'hand','spr','Пружина привода в нерабочем положении.','17.4',{act:function(S){S.cls('g-spring')}}),
  T('b4',1,'hand','ctrl','Цепи управления привода отключены.','17.4',{act:function(S){S.cls('g-ctrl')}}),
  T('c1',2,P('dont_on'),'dr1','Плакат на приводе QS1.','18.1'),T('c2',2,P('dont_on'),'drq','Плакат на приводе выключателя.','18.1'),T('c3',2,P('dont_on'),'dr2','Плакат на приводе QS2.','18.1'),
  T('d1',3,'ind','test','Указатель загорелся на части под напряжением: он исправен.','19.1',{act:function(S){S.ind(S.cfg.pts.test,true)}}),
  T('d2',3,'ind','pa','Фаза A: указатель не горит.','19.1',{need:'d1',needMsg:'Сначала проверьте исправность указателя на части, заведомо находящейся под напряжением (п. 19.1).',act:function(S){S.ind(S.cfg.pts.pa,false);S.cls('g-pa')}}),
  T('d3',3,'ind','pb','Фаза B: указатель не горит.','19.1',{need:'d1',needMsg:'Сначала проверьте исправность указателя на части, заведомо находящейся под напряжением (п. 19.1).',act:function(S){S.ind(S.cfg.pts.pb,false);S.cls('g-pb')}}),
  T('d4',3,'ind','pc','Фаза C: указатель не горит.','19.1',{need:'d1',needMsg:'Сначала проверьте исправность указателя на части, заведомо находящейся под напряжением (п. 19.1).',act:function(S){S.ind(S.cfg.pts.pc,false);S.cls('g-pc')}}),
  T('e1',4,'hand','drz','Заземляющие ножи включены: участок заземлён.','21.8',{act:function(S){S.cls('g-zn')}}),
  T('f1',5,P('earth'),'dr1','«Заземлено» на приводе QS1.','23.1'),T('f2',5,P('earth'),'dr2','«Заземлено» на приводе QS2.','23.1'),
  T('f3',5,P('work'),'qb','«Работать здесь» на выключателе.','23.7'),
  T('f4',5,'tape','nb','Соседняя ячейка закрыта ограждением.','23.2',{act:function(S){S.cls('g-tape')}}),
  T('f5',5,P('stop'),'nb','На ограждении «Стой! Напряжение».','23.2',{need:'f4',needMsg:'Сначала поставьте ограждение: плакат вешают на него (п. 23.2).'})]};
/* ---------- КРУ ---------- */
function kru(m){var postTasks=m===1?[T('c1',2,P('stop'),'shut','На шторке «Стой! Напряжение».','29.1'),T('c2',2,P('work'),'cart','На тележке «Работать здесь».','29.1')]
  :[T('c1',2,[P('dont_line'),P('dont_on')],'shut','На шторке вывешен плакат «Не включать!».','29.2')];
 var rule=m===1?'29.1':'29.2';
 return {base:'C',gen:sceneC,name:m===1?'Шкаф КРУ: работа на тележке':'Шкаф КРУ: работа вне шкафа',
 hs:[['cart',480,150,140,115],['shut',598,60,92,220]],
 lab:{cart:'тележку с выключателем',shut:'шторку отсека'},anchor:{shut:[644,150],cart:[125,195]},lockAt:{shut:[644,84]},rest:[0,0],pts:{},
 trap:{'lock|cart':['Замком запирают шторку отсека.',rule]},
 stages:[{n:'Выкатить тележку',todo:'Возьмите «Руку» и выкатите тележку в ремонтное положение.',gate:'Сначала выкатите тележку.'},
  {n:'Запереть шторку',todo:'Закройте шторку рукой и заприте её замком.',gate:'Сначала выкатите тележку (п. '+rule+').'},
  {n:'Плакаты',todo:m===1?'Повесьте «Стой! Напряжение» на шторку и «Работать здесь» на тележку.':'Работа вне шкафа, на линии: повесьте на шторку «Не включать! Работа на линии».',gate:'Плакаты вывешивают после того, как тележка выкачена и шторка заперта (п. '+rule+').'}],
 tasks:[T('a1',0,'hand','cart','Тележка выкачена в ремонтное положение.',rule,{act:function(S){S.cls('g-cart');S.moveHs('cart',50,150)}}),
  T('b1',1,'hand','shut','Шторка закрыта.',rule,{act:function(S){S.cls('g-shut')}}),
  T('b2',1,'lock','shut','Шторка заперта на замок.',rule,{need:'b1',needMsg:'Сначала закройте шторку.',act:function(S,t){setTimeout(function(){S.lock(t)},700)}})].concat(postTasks)}}
SC.C1=kru(1);SC.C2=kru(2);

var wrap=$('#gScene'),cur,key,svg,hsg,tool=null,stage,done,errors,hints,doneCount,total;
var S={};
function msg(k,t,x){var m=$('#gMsg');m.className='gmsg '+k;m.innerHTML='<b>'+esc(t)+'</b>'+esc(x)}
function anchorOf(t,kind){return cur.anchor[t+':'+kind]||cur.anchor[t]}
S.cls=function(c){svg.classList.add(c)};
S.poster=function(t,kind){var a=anchorOf(t,kind);hsg.insertAdjacentHTML('beforebegin',HANG(a[0],a[1],kind,'pg',0))};
S.lock=function(t){var a=cur.lockAt[t];hsg.insertAdjacentHTML('beforebegin',LK(a[0],a[1],0).replace('lk lk2','lk lg'))};
S.ind=function(p,lamp){var e=svg.querySelector('.ind');if(e)e.style.transform='translate('+p[0]+'px,'+p[1]+'px)';svg.classList[lamp?'add':'remove']('g-lamp')};
S.moveHs=function(t,x,y){var r=svg.querySelector('.hs[data-t="'+t+'"]');r.setAttribute('x',x);r.setAttribute('y',y)};
Object.defineProperty(S,'cfg',{get:function(){return cur}});
function head(){
  var done_=stage>=cur.stages.length;
  $('#gStageT').textContent=done_?'Все этапы пройдены':'Этап '+(stage+1)+' из '+cur.stages.length+': '+cur.stages[stage].n;
  $('#gStageC').textContent='Действий: '+doneCount+' из '+total+' · ошибок: '+errors+' · подсказок: '+hints;
  $('#gBar').style.width=(doneCount/total*100)+'%';
  $('#gTodo').textContent=done_?'':cur.stages[stage].todo;
}
function start(k){
  key=k;cur=SC[k];GAME=true;var s=cur.gen();GAME=false;
  s=s.replace(/(id="|#)(hA|hB|cpC)\b/g,'$1$2g').replace(/svA/g,'gA').replace(/svB/g,'gB').replace(/svC/g,'gC');
  wrap.innerHTML=s;svg=wrap.querySelector('svg');
  var h='<g class="hsg">';cur.hs.forEach(function(r){h+='<rect class="hs" data-t="'+r[0]+'" x="'+r[1]+'" y="'+r[2]+'" width="'+r[3]+'" height="'+r[4]+'" rx="6" tabindex="0" role="button" aria-label="'+esc(cur.lab[r[0]]||'')+'"/>'});
  svg.insertAdjacentHTML('beforeend',h+'</g>');hsg=svg.querySelector('.hsg');
  cur.tasks.forEach(function(x){x.done=false});
  stage=0;done={};errors=0;hints=0;doneCount=0;total=cur.tasks.length;
  $('#gRes').innerHTML='';
  document.querySelectorAll('#gSeg button').forEach(function(b){b.setAttribute('aria-pressed',b.getAttribute('data-s')===k?'true':'false')});
  msg('info','Начинаем','Выберите инструмент внизу и нажмите на нужное место на схеме. '+(tool?'':'Для начала возьмите «Руку».'));
  head();
}
function wrong(why,rule){
  errors++;wrap.classList.remove('shake');void wrap.offsetWidth;wrap.classList.add('shake');
  msg('bad','Ошибка',why+(rule?' (п. '+rule+')':''));head();
}
function toolMatch(task,t){return [].concat(task.tool).indexOf(t)>=0}
function click(t){
  if(stage>=cur.stages.length)return;
  if(!tool){msg('info','Нужен инструмент','Сначала выберите инструмент или плакат внизу.');return}
  var cands=cur.tasks.filter(function(x){return x.t.indexOf(t)>=0&&toolMatch(x,tool)});
  if(!cands.length){
    var tr=cur.trap[tool+'|'+t]||cur.trap[tool+'|*'];
    if(tr)return wrong(tr[0],tr[1]);
    if(tool.indexOf('p:')===0)return wrong(PTRAP[tool.slice(2)]);
    return wrong(TTRAP[tool]);
  }
  var task=cands.filter(function(x){return !x.done})[0];
  if(!task){msg('info','Уже сделано','Здесь это уже выполнено.');return}
  if(task.st>stage)return wrong(cur.stages[stage].gate?'Рано. '+cur.stages[task.st].n+' — позже. '+cur.stages[task.st].gate:'Рано.');
  if(task.need&&!done[task.need])return wrong(task.needMsg);
  task.done=true;done[task.id]=true;doneCount++;
  if(tool.indexOf('p:')===0)S.poster(t,tool.slice(2));
  if(task.act)task.act(S,t,tool);
  msg('ok','Верно',task.ok+' (п. '+task.r+')');
  var rest=cur.tasks.filter(function(x){return x.st===stage&&!x.done});
  if(!rest.length){
    var st=cur.stages[stage];if(st.done)st.done(S);
    stage++;
    if(stage<cur.stages.length)msg('ok','Этап «'+st.n+'» пройден ✓','Дальше: '+cur.stages[stage].n+'. '+cur.stages[stage].todo);
    else finish();
  }
  head();
}
function finish(){
  var r=errors===0?'Без ошибок. Так и надо делать на настоящем рабочем месте.':errors<=3?'Хорошо, но есть над чем поработать: пройдите ещё раз без ошибок.':'Порядок и места плакатов пока не закрепились. Перечитайте теорию и пройдите ещё раз.';
  msg('ok','Рабочее место подготовлено ✓','Все технические мероприятия выполнены в правильном порядке.');
  $('#gRes').innerHTML='<div class="res '+(errors===0?'ok':errors<=3?'mid':'bad')+'">Итог: ошибок — '+errors+', подсказок — '+hints+'. '+esc(r)+'</div>';
}
function hint(){
  if(stage>=cur.stages.length)return;
  var c=cur.tasks.filter(function(x){return x.st===stage&&!x.done&&(!x.need||done[x.need])})[0];if(!c)return;
  hints++;var tl=[].concat(c.tool)[0];
  msg('info','Подсказка','Возьмите '+tname(tl)+' и нажмите на: '+cur.lab[c.t[0]]+'.');
  c.t.forEach(function(t){svg.querySelectorAll('.hs[data-t="'+t+'"]').forEach(function(r){r.classList.add('hint');setTimeout(function(){r.classList.remove('hint')},3200)})});
  head();
}
function pick(t){tool=(tool===t)?null:t;
  document.querySelectorAll('#gTools .tool').forEach(function(b){b.setAttribute('aria-pressed',b.getAttribute('data-tool')===tool?'true':'false')});
  wrap.classList.toggle('toolsel',!!tool);
  if(tool)msg('info','В руках: '+tname(tool).replace(/[«»]/g,''),'Нажмите на нужное место на схеме. Повторное нажатие на инструмент убирает его.');
}
var th='<h4>Инструменты</h4><div class="tools">';TOOLS.forEach(function(x){th+='<button type="button" class="tool" data-tool="'+x[0]+'" aria-pressed="false">'+esc(x[1])+'</button>'});
th+='</div><h4>Плакаты</h4><div class="tools">';
PTS.forEach(function(k){var z=PBsize(k);th+='<button type="button" class="tool pt" data-tool="p:'+k+'" aria-pressed="false" aria-label="Плакат «'+esc(pname(k))+'»"><svg viewBox="'+(-z[0]/2-3)+' -3 '+(z[0]+6)+' '+(z[1]+6)+'">'+PB(k)+'</svg><span>'+esc(pname(k))+'</span></button>'});
$('#gTools').innerHTML=th+'</div>';
$('#gTools').addEventListener('click',function(e){var b=e.target.closest('.tool');if(b)pick(b.getAttribute('data-tool'))});
wrap.addEventListener('click',function(e){var r=e.target.closest('.hs');if(r)click(r.getAttribute('data-t'))});
wrap.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){var r=e.target.closest&&e.target.closest('.hs');if(r){e.preventDefault();click(r.getAttribute('data-t'))}}});
$('#gHint').addEventListener('click',hint);
$('#gReset').addEventListener('click',function(){start(key)});
document.querySelectorAll('#gSeg button').forEach(function(b){b.addEventListener('click',function(){start(b.getAttribute('data-s'))})});
var inited=false,bt=$('#tabT'),bp=$('#tabP');
function mode(m){var p=m==='p';$('#theory').hidden=p;$('#practice').hidden=!p;bt.setAttribute('aria-selected',p?'false':'true');bp.setAttribute('aria-selected',p?'true':'false');
  if(p&&!inited){inited=true;start('A')}window.scrollTo(0,0)}
bt.addEventListener('click',function(){mode('t')});bp.addEventListener('click',function(){mode('p')});
document.querySelectorAll('[data-go="p"]').forEach(function(a){a.addEventListener('click',function(){mode('p')})});
window.__gstart=start;
})();
