function harness(x,y,s){
  var o='stroke="#1c2530" stroke-width="6.5" fill="none"', i='stroke="#ffc400" stroke-width="4.2" fill="none"';
  function band(d){return '<path d="'+d+'" '+o+'/><path d="'+d+'" '+i+'/>';}
  return '<g transform="translate('+x+' '+y+') scale('+s+')" stroke-linecap="round" stroke-linejoin="round">'+
   band('M-12 -96 L-8 -60')+band('M12 -96 L8 -60')+band('M-11 -83 L11 -83')+band('M-17 -62 L17 -62')+band('M-16 -60 Q-9 -45 -2 -58')+band('M16 -60 Q9 -45 2 -58')+
   '<rect x="-3.5" y="-86" width="7" height="6" rx="1.5" fill="#c9d1d8" stroke="#333" stroke-width="1.2"/>'+
   '<circle cx="12" cy="-101" r="4" fill="#c9d1d8" stroke="#333" stroke-width="1.6"/></g>';
}
function hr(x,y,s){return [x+12*s,y-101*s]}
function ring(x,y){return '<circle cx="'+x+'" cy="'+y+'" r="4.6" fill="#c9d1d8" stroke="#333" stroke-width="1.8"/>'}
function lanyard(p0,p1,sag,len){
  var c=[(p0[0]+p1[0])/2,(p0[1]+p1[1])/2+sag], d='M'+p0[0]+' '+p0[1]+' Q'+c[0]+' '+c[1]+' '+p1[0]+' '+p1[1];
  var m=[(p0[0]+p1[0])/2,(p0[1]+p1[1])/2+sag/2], ang=Math.atan2(p1[1]-p0[1],p1[0]-p0[0])*180/Math.PI, L=len||34;
  return '<path d="'+d+'" fill="none" stroke="#1c2530" stroke-width="5" stroke-linecap="round"/><path d="'+d+'" fill="none" stroke="#ff9f1c" stroke-width="2.6" stroke-linecap="round"/>'+
   '<g transform="translate('+m[0]+' '+m[1]+') rotate('+ang+')"><rect x="'+(-L/2)+'" y="-8" width="'+L+'" height="16" rx="5" fill="#e85d04" stroke="#1c2530" stroke-width="2"/><path d="M'+(-L/2+8)+' -8 v16 M'+(-L/2+16)+' -8 v16 M'+(L/2-16)+' -8 v16 M'+(L/2-8)+' -8 v16" stroke="#7a2e00" stroke-width="1.5"/></g>'+ring(p0[0],p0[1])+ring(p1[0],p1[1]);
}
function anchorOnSlab(x,y){return '<rect x="'+(x-12)+'" y="'+(y-6)+'" width="24" height="7" rx="2" fill="#6b7580" stroke="#333" stroke-width="1.6"/><path d="M'+(x-6)+' '+(y-6)+' Q'+x+' '+(y-24)+' '+(x+6)+' '+(y-6)+'" fill="none" stroke="#333" stroke-width="5"/><path d="M'+(x-6)+' '+(y-6)+' Q'+x+' '+(y-24)+' '+(x+6)+' '+(y-6)+'" fill="none" stroke="#e0e6eb" stroke-width="2.4"/>';}
function tx(t,x,y,o){o=o||{};return '<text x="'+x+'" y="'+y+'" text-anchor="'+(o.a||'start')+'" style="font-weight:'+(o.w||700)+';font-size:'+(o.s||13)+'px;fill:'+(o.c||'#1c2530')+'">'+t+'</text>';}
function frame(id,title,sub,body){
  return '<defs><linearGradient id="sky'+id+'" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cfe8fb"/><stop offset="1" stop-color="#f6fbff"/></linearGradient></defs>'+
   '<rect x="0" y="0" width="640" height="400" fill="url(#sky'+id+')"/>'+
   '<text x="320" y="28" text-anchor="middle" style="font-family:var(--head);font-weight:600;font-size:16px;fill:#e8741a;letter-spacing:.5px">ТЕХНИКА БЕЗОПАСНОСТИ · РАБОТА НА ВЫСОТЕ</text>'+
   '<text x="320" y="48" text-anchor="middle" style="font-size:14px;font-weight:700;fill:#1c2530">'+title+'</text>'+
   (sub?'<text x="320" y="64" text-anchor="middle" style="font-size:12.5px;fill:#3b4856">'+sub+'</text>':'')+
   body+'<rect x="3" y="3" width="634" height="394" rx="10" fill="none" stroke="#f08a24" stroke-width="6"/>';
}
function ground(){return '<rect x="0" y="340" width="640" height="60" fill="#8b6b4a"/><rect x="0" y="340" width="640" height="9" fill="#6aa84f"/><text x="16" y="388" style="fill:#fff;font-weight:700;font-size:13px">ЗЕМЛЯ</text>';}
function wp(x,y,s,ghost){var w=worker({x:x,y:y,s:s,p:{helmet:1,boots:1}})+harness(x,y,s);return ghost?'<g opacity=".5">'+w+'</g>':w;}
function sceneA(){
  var sy=206, wx=290, s=.95, b=hr(wx,sy,s), an=[110,sy-14];
  var body=ground()+
   '<rect x="40" y="'+(sy+12)+'" width="390" height="'+(340-sy-12)+'" fill="#c9ced4" stroke="#5f6a74" stroke-width="2"/><path d="M60 '+(sy+100)+' h350 M60 '+(sy+125)+' h350" stroke="#aeb5bc" stroke-width="1.2"/>'+
   '<rect x="40" y="'+sy+'" width="400" height="12" fill="#7b858e" stroke="#333" stroke-width="2"/>'+
   '<rect x="440" y="130" width="150" height="210" fill="#c4262e" opacity=".12"/><rect x="440" y="130" width="150" height="210" fill="none" stroke="#c4262e" stroke-width="2.5" stroke-dasharray="8 6"/>'+
   tx('зона падения',515,160,{a:'middle',c:'#c4262e'})+tx('(ограждения нет)',515,177,{a:'middle',c:'#c4262e',w:500,s:12})+
   anchorOnSlab(110,sy)+
   '<line x1="326" y1="96" x2="326" y2="'+(sy+70)+'" stroke="#1f7a3f" stroke-width="2.5" stroke-dasharray="6 5"/>'+tx('предел стропа',334,92,{c:'#1f7a3f',s:12})+
   '<line x1="326" y1="'+(sy+50)+'" x2="437" y2="'+(sy+50)+'" stroke="#1c2530" stroke-width="1.6"/><path d="M332 '+(sy+44)+' L326 '+(sy+50)+' L332 '+(sy+56)+' M431 '+(sy+44)+' L437 '+(sy+50)+' L431 '+(sy+56)+'" fill="none" stroke="#1c2530" stroke-width="1.6"/>'+tx('до края не дотянуться',382,sy+42,{a:'middle',s:12})+
   lanyard(b,an,16,30)+wp(wx,sy,s)+
   tx('анкер',110,sy-34,{a:'middle'})+tx('короткий строп',190,125,{a:'middle',s:12});
  return frame('A','Удерживающая система','Не допускает падения: строп короткий, до края не достать (п. 118, 130)',body);
}
function sceneB(){
  var sy=206, wx=230, s=.95, b=hr(wx,sy,s), an=[330,92];
  var gx=404, gy=292, gb=hr(gx,gy,s);
  var body=ground()+
   '<rect x="40" y="'+(sy+12)+'" width="320" height="'+(340-sy-12)+'" fill="#c9ced4" stroke="#5f6a74" stroke-width="2"/><path d="M60 '+(sy+100)+' h280 M60 '+(sy+125)+' h280" stroke="#aeb5bc" stroke-width="1.2"/>'+
   '<rect x="40" y="'+sy+'" width="330" height="12" fill="#7b858e" stroke="#333" stroke-width="2"/>'+
   '<rect x="325" y="98" width="10" height="'+(sy-98)+'" fill="#8d97a1" stroke="#333" stroke-width="1.6"/>'+
   '<circle cx="'+an[0]+'" cy="'+an[1]+'" r="8" fill="#6b7580" stroke="#333" stroke-width="2"/>'+
   lanyard(gb,an,0,56)+wp(gx,gy,s,true)+
   lanyard(b,an,14,34)+wp(wx,sy,s)+
   '<line x1="480" y1="'+gy+'" x2="480" y2="340" stroke="#1c2530" stroke-width="1.8"/><path d="M474 '+(gy+8)+' L480 '+gy+' L486 '+(gy+8)+' M474 332 L480 340 L486 332" fill="none" stroke="#1c2530" stroke-width="1.8"/>'+
   '<line x1="450" y1="'+gy+'" x2="490" y2="'+gy+'" stroke="#1c2530" stroke-width="1.2" stroke-dasharray="3 3"/>'+
   tx('под работником',494,300,{s:12})+tx('должно хватать',494,316,{s:12})+tx('места до земли',494,332,{s:12})+
   tx('анкер выше',342,80,{s:12.5})+tx('амортизатор',284,90,{a:'middle',s:12,c:'#b34700'})+
   tx('упавший (условно)',452,250,{s:12,c:'#c4262e'});
  return frame('B','Страховочная система','Останавливает падение: анкер выше, амортизатор, запас места под работником (п. 132, 133)',body);
}
function sceneC(){
  var wx=262, wy=250, s=.95, b=hr(wx,wy,s);
  var body=ground()+
   '<rect x="300" y="78" width="30" height="262" fill="#8d97a1" stroke="#333" stroke-width="2"/><path d="M300 110 L330 150 M330 110 L300 150 M300 170 L330 210 M330 170 L300 210 M300 230 L330 270 M330 230 L300 270" stroke="#5f6a74" stroke-width="2"/>'+
   '<rect x="215" y="'+wy+'" width="85" height="9" fill="#7b858e" stroke="#333" stroke-width="1.8"/>'+
   '<circle cx="315" cy="70" r="8" fill="#6b7580" stroke="#333" stroke-width="2"/>'+
   lanyard(b,[315,70],-12,32)+wp(wx,wy,s)+
   '<path d="M'+(wx+14)+' '+(wy-60*s)+' L335 '+(wy-60*s)+'" stroke="#1c2530" stroke-width="7" stroke-linecap="round"/><path d="M'+(wx+14)+' '+(wy-60*s)+' L335 '+(wy-60*s)+'" stroke="#ffc400" stroke-width="4.5" stroke-linecap="round"/>'+
   '<path d="M335 '+(wy-60*s-4)+' q10 4 0 8" fill="none" stroke="#1c2530" stroke-width="2.5"/>'+
   tx('строп позиционирования',370,wy-60*s-6,{s:12.5})+tx('огибает конструкцию:',370,wy-60*s+10,{s:12.5})+tx('руки свободны',370,wy-60*s+26,{s:12.5})+
   tx('страховочная система',370,118,{s:12.5,c:'#b34700'})+tx('обязательна (п. 131)',370,134,{s:12.5,c:'#b34700'})+
   '<path d="M366 124 L328 90" stroke="#b34700" stroke-width="1.6"/>';
  return frame('C','Система позиционирования','Удерживает в рабочем положении в подпоре; страховочная система обязательна (п. 131)',body);
}
