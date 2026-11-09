function el(k,inner){return '<g class="el" data-el="'+k+'">'+inner+'</g>';}

/* человек: ноги в (x,y), s - масштаб, p - снаряжение, hR/hL - абсолютные координаты рук */
function armPts(S,H){
  var vx=H[0]-S[0],vy=H[1]-S[1],len=Math.sqrt(vx*vx+vy*vy)||1,h=len<54?Math.sqrt(729-(len/2)*(len/2)):0;
  var nx=-vy/len,ny=vx/len; if(ny<0){nx=-nx;ny=-ny;}
  return [[S[0]+vx/2+nx*h,S[1]+vy/2+ny*h]];
}
function gloveSVG(H,E,kind,suit){
  var a=Math.atan2(H[1]-E[1],H[0]-E[0])*180/Math.PI;
  var g='<g transform="translate('+H[0].toFixed(1)+' '+H[1].toFixed(1)+') rotate('+a.toFixed(1)+')">';
  var hand='M-4 -6.5 L8 -6.5 Q15 -6.5 15 0 Q15 6.5 8 6.5 L-4 6.5 Z';
  var fing='<path d="M6 -3 L13 -3 M6 0 L14 0 M6 3 L13 3" stroke-width="1" fill="none"';
  if(suit){
    g+='<rect x="-10" y="-7" width="10" height="14" rx="2" fill="#3a4450" stroke="#1d242c" stroke-width="1.3"/><path d="'+hand+'" fill="#3a4450" stroke="#1d242c" stroke-width="1.3"/>'+fing+' stroke="#7d8896"/><ellipse cx="2" cy="-9" rx="5" ry="3" fill="#3a4450" stroke="#1d242c" stroke-width="1.2" transform="rotate(-30 2 -9)"/>';
  } else if(kind==='D'){
    g+='<rect x="-22" y="-8" width="19" height="16" rx="3" fill="#e9732a" stroke="#7a3208" stroke-width="1.4"/><rect x="-22" y="-8" width="4" height="16" rx="2" fill="#b5501a"/><path d="'+hand+'" fill="#f08a3c" stroke="#7a3208" stroke-width="1.4"/>'+fing+' stroke="#7a3208"/><ellipse cx="2" cy="-9" rx="5" ry="3" fill="#f08a3c" stroke="#7a3208" stroke-width="1.3" transform="rotate(-30 2 -9)"/>';
  } else if(kind==='DL'){
    g+='<rect x="-22" y="-8" width="17" height="16" rx="3" fill="#e9732a" stroke="#7a3208" stroke-width="1.4"/><rect x="-22" y="-8" width="4" height="16" rx="2" fill="#b5501a"/><rect x="-7" y="-8" width="5" height="16" rx="2" fill="#8d5f2a" stroke="#5a3a16" stroke-width="1"/><path d="M-4 -7.5 L8 -7.5 Q16 -7.5 16 0 Q16 7.5 8 7.5 L-4 7.5 Z" fill="#d9a35b" stroke="#6b4a1c" stroke-width="1.4"/>'+fing+' stroke="#6b4a1c"/><ellipse cx="2" cy="-10" rx="5.5" ry="3.2" fill="#d9a35b" stroke="#6b4a1c" stroke-width="1.3" transform="rotate(-30 2 -10)"/>';
  } else if(kind==='L'){
    g+='<rect x="-9" y="-7" width="8" height="14" rx="2" fill="#2f5fa8" stroke="#16294d" stroke-width="1.3"/><path d="M-4 -7.5 L8 -7.5 Q16 -7.5 16 0 Q16 7.5 8 7.5 L-4 7.5 Z" fill="#d9a35b" stroke="#6b4a1c" stroke-width="1.4"/>'+fing+' stroke="#6b4a1c"/><ellipse cx="2" cy="-10" rx="5.5" ry="3.2" fill="#d9a35b" stroke="#6b4a1c" stroke-width="1.3" transform="rotate(-30 2 -10)"/>';
  } else {
    g+='<rect x="-9" y="-7" width="8" height="14" rx="2" fill="#2f5fa8" stroke="#16294d" stroke-width="1.3"/><path d="'+hand+'" fill="#f1c7a0" stroke="#8a5a36" stroke-width="1.3"/>'+fing+' stroke="#8a5a36"/><ellipse cx="2" cy="-9" rx="5" ry="3" fill="#f1c7a0" stroke="#8a5a36" stroke-width="1.2" transform="rotate(-30 2 -9)"/>';
  }
  return g+'</g>';
}
function worker(o){
  var x=o.x,y=o.y,s=o.s||1,p=o.p||{};
  var suit=!!p.suit, C1=suit?'#b9c2cb':'#3566b5', C2=suit?'#98a3ae':'#27508f', OL=suit?'#4f5a66':'#16294d';
  function Lc(a){return [(a[0]-x)/s,(a[1]-y)/s];}
  var hr=Lc(o.hR||[x+26*s,y-34*s]), hl=Lc(o.hL||[x-26*s,y-34*s]);
  var SR=[16,-86],SL=[-16,-86], ER=armPts(SR,hr)[0], EL=armPts(SL,hl)[0];
  var gk=p.gD?(p.gL?'DL':'D'):(p.gL?'L':'N');
  var g='<g transform="translate('+x+' '+y+') scale('+s+')" stroke-linejoin="round" stroke-linecap="round">';
  // ноги
  g+='<path d="M-16 -58 L-16 -12 L-1.5 -12 L-1.5 -58 Z" fill="'+C2+'" stroke="'+OL+'" stroke-width="1.6"/><path d="M16 -58 L16 -12 L1.5 -12 L1.5 -58 Z" fill="'+C2+'" stroke="'+OL+'" stroke-width="1.6"/>';
  // обувь
  if(p.boots||suit){
    var bc=suit?'#3a4450':'#2c3138';
    [-1,1].forEach(function(k){var x0=k<0?-20:2;g+='<rect x="'+x0+'" y="-15" width="18" height="15" rx="3.5" fill="'+bc+'" stroke="#0d0f12" stroke-width="1.3"/><rect x="'+x0+'" y="-17" width="18" height="6" rx="2" fill="'+(suit?'#7d8896':'#ece4c8')+'" stroke="#5c5640" stroke-width="1"/><rect x="'+(x0-1)+'" y="-2.5" width="20" height="3" rx="1.5" fill="#0d0f12"/>';});
  } else {
    [-1,1].forEach(function(k){var x0=k<0?-20:2;g+='<rect x="'+x0+'" y="-14" width="18" height="14" rx="3.5" fill="#7a5632" stroke="#3d2a15" stroke-width="1.3"/><rect x="'+(x0-1)+'" y="-2.5" width="20" height="3" rx="1.5" fill="#2b1d0e"/>';});
  }
  // туловище
  g+='<path d="M-19 -91 Q-19 -97 -12 -97 L12 -97 Q19 -97 19 -91 L17 -56 L-17 -56 Z" fill="'+C1+'" stroke="'+OL+'" stroke-width="1.8"/>';
  if(!suit){ g+='<rect x="-10" y="-84" width="20" height="22" rx="2.5" fill="'+C2+'" stroke="'+OL+'" stroke-width="1.2"/><rect x="-6" y="-80" width="12" height="8" rx="1.5" fill="#3d73c5" stroke="'+OL+'" stroke-width="1"/><circle cx="-10" cy="-86" r="2" fill="#e8c24a"/><circle cx="10" cy="-86" r="2" fill="#e8c24a"/><rect x="-17" y="-60" width="34" height="5" fill="#4b3425" stroke="#2a1c12" stroke-width="1"/><rect x="-3" y="-60.5" width="6" height="6" fill="#d8b24a" stroke="#6a521a" stroke-width="1"/>'; }
  else { g+='<path d="M0 -97 L0 -56 M-17 -76 L17 -76" stroke="#7d8896" stroke-width="1" fill="none"/>'; }
  // руки
  function arm(S,E,H){
    var a='<polyline points="'+S+' '+E+' '+H+'" fill="none" stroke="'+OL+'" stroke-width="13.5"/><polyline points="'+S+' '+E+' '+H+'" fill="none" stroke="'+C1+'" stroke-width="10.5"/>';
    if(p.sleeves) a+='<polyline points="'+S+' '+E+' '+H+'" fill="none" stroke="#7a3208" stroke-width="18"/><polyline points="'+S+' '+E+' '+H+'" fill="none" stroke="#f2a33a" stroke-width="14.5"/><polyline points="'+S+' '+E+' '+H+'" fill="none" stroke="#ffd08a" stroke-width="3" opacity=".7"/>';
    if(p.shortS) a+='<polyline points="'+E+' '+H+'" fill="none" stroke="#f1c7a0" stroke-width="9"/>';
    return a;
  }
  g+=arm(SR,ER,hr)+arm(SL,EL,hl);
  g+='</g>';
  // перчатки (в абсолютных координатах)
  var gl='';
  var Eh=function(E){return [x+E[0]*s,y+E[1]*s]};
  gl+='<g transform="translate('+x+' '+y+') scale('+s+')">'+gloveSVG(hr,ER,suit?'':gk,suit)+gloveSVG(hl,EL,suit?'':gk,suit)+'</g>';
  // голова
  var h='<g transform="translate('+x+' '+y+') scale('+s+')" stroke-linejoin="round" stroke-linecap="round">';
  h+='<rect x="-4.5" y="-95" width="9" height="8" fill="#e6b88c" stroke="#8a5a36" stroke-width="1"/>';
  if(suit){
    h+='<path d="M-15 -103 Q-15 -134 0 -134 Q15 -134 15 -103 Q15 -90 0 -88 Q-15 -90 -15 -103 Z" fill="#b9c2cb" stroke="#4f5a66" stroke-width="1.8"/><rect x="-10" y="-112" width="20" height="17" rx="5" fill="#5c6670" stroke="#2c333b" stroke-width="1.2"/><path d="M-10 -108 L10 -108 M-10 -104 L10 -104 M-10 -100 L10 -100 M-5 -112 L-5 -95 M0 -112 L0 -95 M5 -112 L5 -95" stroke="#8d98a4" stroke-width=".8" fill="none"/>';
  } else {
    h+='<circle cx="-12.3" cy="-103" r="3" fill="#f1c7a0" stroke="#8a5a36" stroke-width="1"/><circle cx="12.3" cy="-103" r="3" fill="#f1c7a0" stroke="#8a5a36" stroke-width="1"/><circle cx="0" cy="-103" r="12.5" fill="#f1c7a0" stroke="#8a5a36" stroke-width="1.4"/>';
    var lk=o.look||[0,0];
    h+='<circle cx="'+(-4.6+lk[0])+'" cy="'+(-104+lk[1])+'" r="1.5" fill="#222"/><circle cx="'+(4.6+lk[0])+'" cy="'+(-104+lk[1])+'" r="1.5" fill="#222"/>'+(o.look?'<path d="M-7.5 -107 L-2.5 -108.5 M2.5 -108.5 L7.5 -107" stroke="#6b4a30" stroke-width="1.4" fill="none"/>':'<path d="M-7.5 -108 L-2.5 -109 M2.5 -109 L7.5 -108" stroke="#6b4a30" stroke-width="1.2" fill="none"/>')+'<path d="M0 -103 L-1.2 -99 L1 -99" stroke="#b98a62" stroke-width="1" fill="none"/>'+(o.look?'<path d="M-3 -95.5 L3.5 -96" stroke="#8a3b2e" stroke-width="1.5" fill="none"/>':'<path d="M-4.5 -95.5 Q0 -92.5 4.5 -95.5" stroke="#8a3b2e" stroke-width="1.4" fill="none"/>');
    if(p.helmet) h+='<path d="M-17 -111 Q-17 -135 0 -135 Q17 -135 17 -111 Z" fill="#f28a1f" stroke="#8a4208" stroke-width="1.6"/><path d="M-3 -135 L-3 -112 M3 -135 L3 -112" stroke="#ffb764" stroke-width="2"/><rect x="-20.5" y="-113" width="41" height="5" rx="2.5" fill="#d8700f" stroke="#8a4208" stroke-width="1.3"/><path d="M-12.5 -106 L-13 -97 M12.5 -106 L13 -97" stroke="#6b4a30" stroke-width="1" fill="none"/>';
    else h+='<path d="M-12.5 -108 Q-12 -116 0 -116 Q12 -116 12.5 -108 Q8 -112 0 -112 Q-8 -112 -12.5 -108 Z" fill="#4a3320" stroke="#2a1c12" stroke-width="1"/>';
    if(p.goggles) h+='<rect x="-13.5" y="-109" width="27" height="10" rx="4.5" fill="#d3ecff" fill-opacity=".55" stroke="#c4262e" stroke-width="2.2"/><path d="M-13.5 -104 L-16 -104 M13.5 -104 L16 -104" stroke="#c4262e" stroke-width="2"/><path d="M-9 -107 L-5 -107" stroke="#fff" stroke-width="1.4"/>';
    if(p.shield) h+='<path d="M-18 -112 L18 -112 L17.5 -84 Q0 -79 -17.5 -84 Z" fill="#bfe3ff" fill-opacity=".38" stroke="#6f9fc4" stroke-width="1.5"/><path d="M-12 -108 L-9 -90" stroke="#fff" stroke-width="2" opacity=".8"/>';
  }
  h+='</g>';
  var ppe=el('ppe',h);
  return g+el('glove',gl)+ppe;
}

/* ---------- сцена ---------- */