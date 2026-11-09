function T(x,y,s,o){o=o||{};return '<text x="'+x+'" y="'+y+'"'+(o.a?' text-anchor="'+o.a+'"':'')+' font-size="'+(o.sz||12)+'"'+(o.w?' font-weight="'+o.w+'"':'')+(o.f?' style="fill:'+o.f+'"':'')+(o.c?' class="'+o.c+'"':'')+'>'+esc(s)+'</text>'}
function W(x1,y1,x2,y2,c){return '<line class="wr '+c+'" x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'"/><line class="fl '+c+'" x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'"/>'}
var GAME=false;
var PK={dont_on:{k:'ban1',a:'Не включать!',b:'работают люди'},dont_open:{k:'ban1',a:'Не открывать!',b:'работают люди'},dont_line:{k:'ban2',a:'Не включать!',b:'работа на линии'},
 volt:{k:'ban1',a:'Работа под напряжением',b:'повторно не включать!',w:112,h:60},stop:{k:'warn',a:'Стой!',b:'напряжение'},climbno:{k:'warn',a:'Не влезай!',b:'убьет'},
 climb:{k:'must',a:'Влезать',b:'здесь'},work:{k:'must',a:'Работать',b:'здесь'},earth:{k:'ind',a:'Заземлено',b:''}};
var PMAP={'не включать!|работают люди':'dont_on','не включать!|работа на линии':'dont_line','не открывать!|работают люди':'dont_open','стой!|напряжение!':'stop','заземлено|':'earth','работать здесь|':'work'};
/* рисунок плаката по образцу: центр x=0, верх y=0 */
function PB(kind,w,h){
  var p=PK[kind],w=w||p.w||(p.k==='warn'?104:92),h=h||p.h||(p.b?54:36),x0=-w/2,R='#d3202a',B='#1b75c8',s='',k=p.k,A=p.a.toUpperCase(),Bt=p.b;
  var sw=Math.max(2.2,h*.06),cx=0,aw=w-14,c1='#1c2530',c2='#1c2530';
  if(k==='ban1'){s+='<rect x="'+x0+'" y="0" width="'+w+'" height="'+h+'" rx="2.5" fill="#fff" stroke="'+R+'" stroke-width="'+sw+'"/>';c1=c2=R}
  if(k==='ban2'){s+='<rect x="'+x0+'" y="0" width="'+w+'" height="'+h+'" rx="2.5" fill="'+R+'" stroke="'+R+'" stroke-width="'+sw+'"/>';c1=c2='#fff'}
  if(k==='warn'){s+='<rect x="'+x0+'" y="0" width="'+w+'" height="'+h+'" rx="2.5" fill="#fff" stroke="'+R+'" stroke-width="'+sw+'"/>';var bh=h*.62,bw=bh*.55,bx=x0+w*.1,by=h*.19;
    s+='<polygon fill="'+R+'" points="'+[[.55,0],[.1,.58],[.42,.58],[.25,1],[.9,.38],[.58,.38],[.78,0]].map(function(q){return (bx+q[0]*bw).toFixed(1)+','+(by+q[1]*bh).toFixed(1)}).join(' ')+'"/>';cx=w*.13;aw=w*.62}
  if(k==='must'){s+='<rect x="'+x0+'" y="0" width="'+w+'" height="'+h+'" rx="2.5" fill="'+B+'"/><rect x="'+(x0+h*.11)+'" y="'+(h*.11)+'" width="'+(w-h*.22)+'" height="'+(h*.78)+'" fill="#fff"/>';aw=w-h*.3}
  if(k==='ind'){s+='<rect x="'+x0+'" y="0" width="'+w+'" height="'+h+'" rx="2.5" fill="'+B+'"/><rect x="'+(x0+3)+'" y="3" width="'+(w-6)+'" height="'+(h-6)+'" fill="none" stroke="#fff" stroke-width="1.6"/>';c1='#fff'}
  var f1=Math.min(h*(Bt?.3:.38),aw/(A.length*.74)),f2=Bt?Math.min(h*.24,aw/(Bt.length*.6)):0,y1=Bt?h*.45:h*.64,y2=h*.8;
  s+='<text x="'+cx+'" y="'+y1+'" text-anchor="middle" font-weight="800" style="font-size:'+f1.toFixed(1)+'px;fill:'+c1+'">'+esc(A)+'</text>';
  if(Bt)s+='<text x="'+cx+'" y="'+y2+'" text-anchor="middle" font-weight="600" style="font-size:'+f2.toFixed(1)+'px;fill:'+c2+'">'+esc(Bt)+'</text>';
  return s;
}
function PBsize(kind){var p=PK[kind];return [p.w||(p.k==='warn'?104:92),p.h||(p.b?54:36)]}
function HANG(x,y,kind,cls,d){
  var z=PBsize(kind);
  return '<g transform="translate('+x+','+y+')"><g class="pl '+cls+'" style="--d:'+d+'s;transform-origin:0 0"><line x1="0" y1="-10" x2="0" y2="0" stroke="#6b7782" stroke-width="1.5"/><circle cx="0" cy="-10" r="2.6" fill="#6b7782"/>'+PB(kind,z[0],z[1])+'</g></g>';
}
function PL(x,y,l1,l2,k,cls,d,w){if(GAME)return '';var kind=PMAP[l1.toLowerCase()+'|'+(l2||'').toLowerCase()];if(!kind)throw new Error('no poster '+l1);return HANG(x,y,kind,cls,d)}
function LK(x,y,d,extra){if(GAME)return '';return '<g transform="translate('+x+','+y+')"><g class="lk lk2" style="--d:'+d+'s;transform-origin:0 6px"><path class="sh" d="M-5 0 v-5 a5 5 0 0 1 10 0 v5" fill="none" stroke="#44515c" stroke-width="2.6"/><rect x="-8.5" y="0" width="17" height="13" rx="2.5" fill="#e0a800" stroke="#7a5b00" stroke-width="1.5"/><circle cx="0" cy="6.5" r="2" fill="#7a5b00"/></g></g>'}
function SP(x,y,cls,r){r=r||1;return '<g transform="translate('+x+','+y+') scale('+r+')"><polygon class="spark '+cls+'" style="transform-origin:0 0" points="0,-13 4,-4 14,-5 7,2 12,12 1,7 -8,14 -6,3 -15,-3 -4,-5" fill="#ffd43b" stroke="#e08a00" stroke-width="1.5"/></g>'}
function IND(glove){return '<g class="ind"><g transform="rotate(51)"><rect x="4" y="-5.5" width="70" height="11" rx="5.5" fill="#2c3a46"/><rect x="22" y="-4.5" width="14" height="9" rx="2" fill="#aebdca"/><circle cx="29" cy="0" r="3" fill="#59656f"/><circle class="ilon" cx="29" cy="0" r="6.5" fill="#ffd43b" stroke="#e08a00" stroke-width="1.5"/><rect x="46" y="-6.5" width="30" height="13" rx="5" fill="#0e8a9e"/>'+(glove?'<ellipse cx="86" cy="0" rx="14" ry="10" fill="#e0a000" stroke="#8a5a00" stroke-width="1.5"/><path d="M80 -9 q3 -9 10 -4" fill="none" stroke="#8a5a00" stroke-width="1.5"/>':'')+'</g><circle cx="0" cy="0" r="3.2" fill="#d5dbe0" stroke="#59656f"/></g>'}
function PATT(id){return '<pattern id="'+id+'" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="5" height="10" fill="#d3202a"/><rect x="5" width="5" height="10" fill="#fff"/></pattern>'}

/* ---------- Сцена A: щит до 1000 В ---------- */
function sceneA(){
  var X=[215,320,425,530],s='<svg id="svA" class="sc poster" viewBox="0 0 860 440" role="img" aria-label="Щит до 1000 В: рубильник, автомат, предохранитель и контактор с дистанционным управлением. Нажимайте кнопку под рисунком, и мероприятия выполняются по порядку.">';
  s+='<defs>'+PATT('hA')+'</defs>';
  s+='<rect x="130" y="44" width="480" height="300" rx="10" fill="#e9eef3" stroke="#8a98a5" stroke-width="3"/>';
  s+=T(14,24,'Щит до 1000 В',{w:700,sz:14});
  X.forEach(function(x,i){s+=W(x,20,x,i==0?86:i==1?92:i==2?88:88,'live');s+=T(x,14,'Ввод '+(i+1),{a:'middle',sz:11})});
  /* шины */
  s+='<rect class="bus" x="150" y="262" width="440" height="12" rx="3"/>';
  /* 1 рубильник */
  s+=W(215,150,215,262,'dn')+'<rect x="208" y="84" width="14" height="8" rx="2" fill="#44515c"/>'
   +'<g class="qs mv"><line x1="215" y1="150" x2="215" y2="92" stroke="#44515c" stroke-width="6" stroke-linecap="round"/><rect x="206" y="112" width="18" height="13" rx="3" fill="#b3261e"/></g><circle cx="215" cy="150" r="6" fill="#44515c"/>'+SP(215,90,'sp1');
  /* 2 автомат */
  s+=W(320,142,320,262,'dn')+'<rect x="306" y="92" width="28" height="50" rx="5" fill="#cfd8df" stroke="#44515c" stroke-width="2"/><rect x="314" y="100" width="12" height="30" rx="3" fill="#8a98a5"/>'
   +'<g class="lev mv"><line x1="320" y1="115" x2="320" y2="97" stroke="#d9480f" stroke-width="7" stroke-linecap="round"/></g><circle cx="320" cy="115" r="4" fill="#44515c"/>'+SP(320,100,'sp2',.8);
  /* 3 предохранитель */
  s+=W(425,140,425,262,'dn')+'<rect x="417" y="84" width="16" height="7" rx="2" fill="#44515c"/><rect x="417" y="137" width="16" height="7" rx="2" fill="#44515c"/>'
   +'<g class="fuse"><rect x="414" y="93" width="22" height="44" rx="5" fill="#f4e2b0" stroke="#8a6d1a" stroke-width="2"/><rect x="414" y="93" width="22" height="8" rx="3" fill="#b9a06a"/><rect x="414" y="129" width="22" height="8" rx="3" fill="#b9a06a"/></g>'+SP(425,114,'sp3',.9);
  /* 4 контактор */
  s+=W(530,144,530,262,'dn')+'<rect x="506" y="88" width="48" height="56" rx="6" fill="#cfd8df" stroke="#44515c" stroke-width="2"/><path d="M512 133 l5 -6 l5 12 l5 -12 l5 12 l5 -6" fill="none" stroke="#59656f" stroke-width="2"/>'
   +W(530,88,530,104,'live')+W(530,122,530,144,'dn')+'<rect class="br mv" x="523" y="102" width="14" height="22" rx="2" fill="#44515c"/><rect class="nak" x="514" y="111" width="32" height="6" rx="2" fill="#0e8a9e"/>'+SP(530,114,'sp4',.9);
  /* пульт управления */
  s+='<rect x="640" y="44" width="210" height="206" rx="10" fill="#e9eef3" stroke="#8a98a5" stroke-width="3"/>'+T(745,64,'Дистанционное управление',{a:'middle',sz:11.5,w:600});
  s+='<line x1="554" y1="116" x2="590" y2="116" stroke="#59656f" stroke-width="2" stroke-dasharray="5 4"/><line x1="606" y1="116" x2="640" y2="116" stroke="#59656f" stroke-width="2" stroke-dasharray="5 4"/>'
   +'<circle cx="590" cy="116" r="3.5" fill="#44515c"/><circle cx="606" cy="116" r="3.5" fill="#44515c"/><line class="cs mv" x1="590" y1="116" x2="606" y2="116" stroke="#44515c" stroke-width="3" stroke-linecap="round"/>'+SP(598,114,'sp5',.6)
   +T(598,102,'цепь катушки',{a:'middle',sz:10});
  s+='<circle cx="680" cy="105" r="17" fill="#59656f"/><g class="key mv"><rect x="677.5" y="90" width="5" height="30" rx="2" fill="#f0c64a"/><circle cx="680" cy="94" r="5" fill="#f0c64a"/></g>'+T(680,137,'Ключ',{a:'middle',sz:11});
  s+='<circle cx="668" cy="185" r="13" fill="#2e9e5b"/><circle cx="714" cy="185" r="13" fill="#c4262e"/>'+T(668,218,'Пуск',{a:'middle',sz:11})+T(714,218,'Стоп',{a:'middle',sz:11});
  s+='<g class="bcover"><rect x="648" y="164" width="88" height="44" rx="6" fill="#c9d4dc" stroke="#44515c" stroke-width="2"/>'+T(692,191,'закрыто',{a:'middle',sz:11})+'</g>';
  /* подписи */
  [['Рубильник',215],['Автомат',320],['Предохранитель',425],['Контактор',530]].forEach(function(a){s+=T(a[1],246,a[0],{a:'middle',sz:12,w:600,c:'halo'})});
  /* земля */
  s+='<rect x="150" y="380" width="440" height="10" rx="3" fill="#2f6f45"/>'+T(160,408,'Заземляющее устройство (земля)',{sz:12.5,w:600});
  s+='<g stroke="#2f6f45" stroke-width="3"><line x1="600" y1="385" x2="624" y2="385"/><line x1="605" y1="391" x2="619" y2="391"/><line x1="609" y1="397" x2="615" y2="397"/></g>';
  /* переносное заземление */
  s+='<line class="gcab" x1="267" y1="374" x2="267" y2="280" stroke="#2e9e5b" stroke-width="5" stroke-linecap="round"/>'
   +'<g transform="translate(267,377)"><g class="gc1 pop" style="transform-origin:0 0"><rect x="-9" y="-8" width="18" height="12" rx="3" fill="#44515c"/><circle cx="-22" cy="-6" r="9" fill="#0e6fb0"/><text x="-22" y="-2" text-anchor="middle" font-size="12" font-weight="700" style="fill:#fff">1</text></g></g>'
   +'<g transform="translate(267,272)"><g class="gc2 pop" style="transform-origin:0 0"><rect x="-10" y="-9" width="20" height="14" rx="3" fill="#44515c"/><circle cx="-24" cy="12" r="9" fill="#0e6fb0"/><text x="-24" y="16" text-anchor="middle" font-size="12" font-weight="700" style="fill:#fff">2</text></g></g>';
  /* указатель */
  s+='<rect x="736" y="290" width="116" height="58" rx="8" fill="#fde8dc" stroke="#d9480f" stroke-width="2"/><circle cx="756" cy="318" r="6" fill="#d9480f"/>'+T(768,314,'заведомо под',{sz:10.5})+T(768,327,'напряжением',{sz:10.5});
  s+='<text class="tick" x="372" y="256" text-anchor="middle" font-size="22" font-weight="700" style="fill:#1f7a3f">✓</text>';
  s+=IND(false);
  s+=T(300,300,'Шины щита',{sz:12.5,w:600,c:'halo'});
  s+='<g class="sT sT0"><text x="378" y="300" font-size="12.5" font-weight="600" style="fill:#d9480f" class="halo">— под напряжением</text></g><g class="sT sT1"><text x="378" y="300" font-size="12.5" font-weight="600" style="fill:#8a5a00" class="halo">— отключены, но ещё не проверены</text></g><g class="sT sT2"><text x="378" y="300" font-size="12.5" font-weight="600" style="fill:#1f7a3f" class="halo">— напряжения нет (проверено)</text></g>';
  /* ширма */
  s+='<g class="shield"><rect x="14" y="56" width="586" height="12" rx="3" fill="url(#hA)" stroke="#1c2530" stroke-width="1.5"/></g>';
  /* плакаты */
  s+=PL(X[0],160,'Не включать!','Работают люди','ban','pl3',0)+PL(X[1],160,'Не включать!','Работают люди','ban','pl3',.18)+PL(X[2],160,'Не включать!','Работают люди','ban','pl3',.36)+PL(X[3],160,'Не включать!','Работают люди','ban','pl3',.54)
   +PL(770,86,'Не включать!','Работают люди','ban','pl3',.72)+PL(790,148,'Не включать!','Работают люди','ban','pl3',.9);
  s+=PL(267,312,'Заземлено','','earth','pl6',0,86)+PL(172,298,'Работать здесь','','do','pl6',.25,88)+PL(66,80,'Стой!','Напряжение!','stop','pl6',.9,96);
  /* замки */
  s+=LK(236,121,0)+LK(342,121,.2);
  s+='</svg>';return s;
}

/* ---------- Сцена B: ячейка 10 кВ ---------- */
function sceneB(){
  var CY=[110,195,292,385],s='<svg id="svB" class="sc poster" viewBox="0 0 900 500" role="img" aria-label="Ячейка 10 кВ: шины, шинный разъединитель, выключатель, линейный разъединитель, заземляющие ножи и приводы. Нажимайте кнопку под рисунком.">';
  s+='<defs>'+PATT('hB')+'</defs>';
  s+='<rect x="30" y="20" width="310" height="440" rx="10" fill="#e9eef3" stroke="#8a98a5" stroke-width="3"/>'+T(185,13,'Ячейка 10 кВ',{a:'middle',sz:13.5,w:700});
  s+='<rect class="bus" x="60" y="48" width="260" height="12" rx="3"/>'+T(185,42,'Сборные шины — остаются под напряжением',{a:'middle',sz:11});
  /* QS1 */
  s+=W(190,60,190,82,'live')+'<rect x="183" y="76" width="14" height="8" rx="2" fill="#44515c"/>'+W(190,140,190,165,'dn')
   +'<g class="q1b mv"><line x1="190" y1="140" x2="190" y2="82" stroke="#44515c" stroke-width="6" stroke-linecap="round"/><rect x="182" y="104" width="16" height="12" rx="3" fill="#b3261e"/></g><circle cx="190" cy="140" r="6" fill="#44515c"/>'+SP(190,84,'s1');
  /* Q */
  s+='<rect x="168" y="165" width="44" height="62" rx="6" fill="#cfd8df" stroke="#44515c" stroke-width="2"/>'+W(190,165,190,182,'dn')+W(190,208,190,262,'dn')+'<rect class="qrod mv" x="187.5" y="182" width="5" height="28" rx="2" fill="#44515c"/>'+SP(190,200,'sq',.9);
  /* QS2 */
  s+='<rect x="183" y="256" width="14" height="8" rx="2" fill="#44515c"/>'+W(190,322,190,358,'dn')
   +'<g class="q2b mv"><line x1="190" y1="322" x2="190" y2="264" stroke="#44515c" stroke-width="6" stroke-linecap="round"/><rect x="182" y="286" width="16" height="12" rx="3" fill="#b3261e"/></g><circle cx="190" cy="322" r="6" fill="#44515c"/>'+SP(190,266,'s2');
  /* ЗН */
  s+=W(165,358,215,358,'dn')+'<circle cx="110" cy="425" r="6" fill="#2f6f45"/><g stroke="#2f6f45" stroke-width="3"><line x1="96" y1="437" x2="124" y2="437"/><line x1="101" y1="443" x2="119" y2="443"/><line x1="106" y1="449" x2="114" y2="449"/></g><line x1="110" y1="431" x2="110" y2="437" stroke="#2f6f45" stroke-width="3"/>'
   +'<g class="zn mv"><line x1="110" y1="425" x2="165" y2="358" stroke="#2f6f45" stroke-width="6" stroke-linecap="round"/></g>'+SP(165,358,'sz',.9);
  s+=T(226,395,'ЗН: заземляющие ножи',{sz:10.5,w:600});
  /* кабель */
  [165,190,215].forEach(function(x,i){s+=W(x,358,x,462,'dn')+'<circle cx="'+x+'" cy="430" r="9" fill="#fff" stroke="#44515c" stroke-width="2"/>'+T(x,434,'ABC'[i],{a:'middle',sz:11,w:700})+'<text class="tk tk'+'ABC'[i]+'" x="'+x+'" y="416" text-anchor="middle" font-size="18" font-weight="700" style="fill:#1f7a3f">✓</text>'});
  s+=T(214,112,'Шинный разъединитель',{sz:11.5,w:600})+T(224,198,'Выключатель',{sz:11.5,w:600})+T(214,294,'Линейный разъединитель',{sz:11.5,w:600});
  /* видимый разрыв */
  s+='<g class="vis"><ellipse cx="180" cy="86" rx="30" ry="13" fill="none" stroke="#0e6fb0" stroke-width="2" stroke-dasharray="4 3"/>'+T(150,66,'видимый разрыв',{a:'end',sz:11,w:600,f:'#0e6fb0'})+'<ellipse cx="180" cy="268" rx="30" ry="13" fill="none" stroke="#0e6fb0" stroke-width="2" stroke-dasharray="4 3"/>'+T(150,250,'видимый разрыв',{a:'end',sz:11,w:600,f:'#0e6fb0'})+'</g>';
  /* приводы */
  var N=[['Привод QS1','lv1'],['Привод Q','lvq'],['Привод QS2','lv2'],['Привод ЗН','lvz']];
  N.forEach(function(n,i){var cy=CY[i];s+='<rect x="380" y="'+(cy-28)+'" width="120" height="56" rx="8" fill="#e9eef3" stroke="#8a98a5" stroke-width="2"/>'+T(388,cy-12,n[0],{sz:11.5,w:600})
    +'<circle cx="'+(i==1?396:410)+'" cy="'+(cy+18)+'" r="4" fill="#44515c"/><g class="'+n[1]+' mv"><line x1="'+(i==1?396:410)+'" y1="'+(cy+18)+'" x2="'+(i==1?396:410)+'" y2="'+(cy-2)+'" stroke="#d9480f" stroke-width="7" stroke-linecap="round"/></g>';});
  /* пружина и цепи управления у привода Q */
  s+='<path class="sprOn" d="M426 211 l6 -6 l6 12 l6 -12 l6 12 l6 -6" fill="none" stroke="#59656f" stroke-width="2.5"/><path class="sprOff" d="M428 211 l4 -3 l4 6 l4 -6 l4 6 l4 -3" fill="none" stroke="#59656f" stroke-width="2.5"/>'+T(442,226,'пружина',{a:'middle',sz:9.5})+'<circle class="lamp" cx="478" cy="210" r="6"/>'+T(478,194,'цепи упр.',{a:'middle',sz:9.5});
  /* соседняя ячейка */
  s+='<rect x="725" y="20" width="130" height="440" rx="10" fill="#e9eef3" stroke="#8a98a5" stroke-width="3"/>'+T(790,42,'Соседняя ячейка',{a:'middle',sz:12,w:700})+T(790,58,'под напряжением',{a:'middle',sz:11})
   +'<rect class="bus" x="745" y="70" width="95" height="12" rx="3"/>'+W(770,82,770,230,'live')+W(750,82,750,330,'live')+'<circle cx="750" cy="330" r="7" fill="#d9480f"/>'+T(764,334,'заведомо под',{sz:10.5})+T(764,347,'напряжением',{sz:10.5});
  s+=IND(true);
  s+=T(40,488,'Кабельная линия',{sz:12.5,w:600});
  s+='<g class="sT sT0"><text x="170" y="488" font-size="12.5" font-weight="600" style="fill:#d9480f">— под напряжением</text></g><g class="sT sT1"><text x="170" y="488" font-size="12.5" font-weight="600" style="fill:#8a5a00">— отключена, ещё не проверена</text></g><g class="sT sT2"><text x="170" y="488" font-size="12.5" font-weight="600" style="fill:#1f7a3f">— напряжения нет на A, B, C</text></g>';
    s+='<g class="shield"><rect x="702" y="20" width="12" height="440" rx="3" fill="url(#hB)" stroke="#1c2530" stroke-width="1.5"/></g>';
  /* статус */
s+='<g class="znt"><text x="232" y="411" font-size="11.5" font-weight="700" style="fill:#1f7a3f">ножи включены ✓</text></g>';
  /* плакаты и замки */
  s+=PL(552,CY[0]-26,'Не включать!','Работают люди','ban','pl3',0)+PL(552,CY[1]-26,'Не включать!','Работают люди','ban','pl3',.25)+PL(552,CY[2]-26,'Не включать!','Работают люди','ban','pl3',.5);
  s+=PL(650,CY[0]-17,'Заземлено','','earth','pl6',0,90)+PL(650,CY[2]-17,'Заземлено','','earth','pl6',.2,90)+PL(650,CY[1]-26,'Стой!','Напряжение!','stop','pl6',.9,96)+PL(105,172,'Работать здесь','','do','pl6',.5,100);
  s+=LK(472,CY[0]+8,0)+LK(472,CY[2]+8,.25);
  s+='</svg>';return s;
}

/* ---------- Сцена C: КРУ, выкатная тележка ---------- */
function sceneC(){
  var s='<svg id="svC" class="sc poster" data-m="1" viewBox="0 0 760 350" role="img" aria-label="Шкаф КРУ с выкатной тележкой: тележка выкатывается в ремонтное положение, шторка запирается на замок, вывешиваются плакаты.">';
  s+='<defs><clipPath id="cpC"><rect x="330" y="60" width="360" height="220"/></clipPath></defs>';
  s+='<line x1="10" y1="300" x2="750" y2="300" stroke="#8a98a5" stroke-width="3"/>';
  s+='<rect x="300" y="20" width="420" height="280" rx="8" fill="#dfe6ec" stroke="#8a98a5" stroke-width="3"/><rect x="330" y="60" width="360" height="220" fill="#aab8c3"/>';
  s+=T(510,45,'Шкаф КРУ',{a:'middle',sz:13.5,w:700});
  /* шины/контакты под напряжением */
  s+='<rect x="640" y="75" width="40" height="190" rx="4" fill="#d9480f"/>'+[167,195,223].map(function(y){return '<rect x="622" y="'+y+'" width="20" height="10" rx="3" fill="#7a2b08"/>'}).join('')+T(715,318,'под напряжением',{a:'end',sz:11,w:600,f:'#d9480f'});
  /* тележка */
  s+='<g class="cart mv"><rect x="350" y="150" width="140" height="115" rx="8" fill="#6c7c8a" stroke="#44515c" stroke-width="2"/>'+[375,420,465].map(function(x){return '<rect x="'+(x-9)+'" y="165" width="18" height="60" rx="8" fill="#cfd8df" stroke="#44515c" stroke-width="2"/>'}).join('')+[100,170,240].map(function(y,i){return ''}).join('')
   +[[172],[200],[228]].map(function(a){return '<rect x="490" y="'+(a[0]-5)+'" width="22" height="10" rx="3" fill="#44515c"/>'}).join('')
   +'<circle cx="378" cy="275" r="11" fill="#2c3a46"/><circle cx="462" cy="275" r="11" fill="#2c3a46"/>'
   +'<g class="plx pl3x"></g></g>';
  s+='<line x1="330" y1="286" x2="690" y2="286" stroke="#59656f" stroke-width="3"/>';
  /* шторка */
  s+='<g clip-path="url(#cpC)"><g class="shut mv"><rect x="598" y="60" width="92" height="220" fill="#8a98a5" stroke="#44515c" stroke-width="2"/>'+[90,120,150,180,210,240].map(function(y){return '<line x1="598" y1="'+y+'" x2="690" y2="'+y+'" stroke="#6b7782" stroke-width="2"/>'}).join('')+'</g></g>';
  s+=LK(644,84,0);
  s+=T(540,325,'рабочее положение',{a:'middle',sz:12,w:600,c:'lab0'})+T(125,325,'ремонтное положение',{a:'middle',sz:12,w:600,f:'#0e6fb0',c:'lab1'});
  /* плакаты */
  s+='<g class="plw">'+PL(644,150,'Стой!','Напряжение!','stop','pl3',0,92)+PL(125,195,'Работать здесь','','do','pl3',.4,104)+'</g>'
   +'<g class="plx">'+PL(644,150,'Не включать!','Работа на линии','ban','pl3',0,92)+'</g>';
  s+='</svg>';return s;
}
