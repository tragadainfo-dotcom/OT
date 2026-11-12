(function(){
'use strict';
if(document.getElementById('ot-site-nav'))return;
var script=document.currentScript;
if(!script)return;
var base=new URL('.',script.src);
var sections=[
['1-pod-napryazheniem','Работа под напряжением','наведенное напряжение уравнивание потенциалов провод'],
['2-rabota-na-vysote','Работа на высоте','страховка лестницы падение'],
['3-tekhnicheskie-meropriyatiya','Технические мероприятия','отключение заземление проверка напряжения'],
['4-plakaty-bezopasnosti','Плакаты безопасности','стой не включать'],
['5-naryad-dopusk','Наряд-допуск','наряд ответственный производитель бригада'],
['6-pte-voprosy-otvety','Вопросы и ответы по ПТЭ и ПОТ','птэ пот трансформаторы аккумуляторы компенсация'],
['7-ohrana-truda-voprosy','Вопросы и ответы по охране труда','охрана труда допуск'],
['8-rza-voprosy','Допуск персонала и РЗА','релейная защита персонал'],
['9-rasporyazhenie','Распоряжение и журнал учёта работ','распоряжение журнал'],
['10-tekushchaya-ekspluatatsiya','Работы в порядке текущей эксплуатации','текущая эксплуатация перечень'],
['11-vtorichnye-tsepi','Работы во вторичных цепях и системах','вторичные цепи трансформаторы тока напряжения'],
['12-pozharnaya-bezopasnost','Пожарная безопасность','пожар огнетушитель тушение'],
['13-elektrozashchitnye-sredstva','Электрозащитные средства','перчатки штанги боты указатель испытания'],
['14-trebovaniya-v-gruppa','Требования к V группе по электробезопасности','пятая группа 5 стаж знания'],
['15-pervaya-pomoshch','Оказание первой помощи','слр реанимация обморожение перегрев электротравма вынос']
];
function icon(name){var paths={menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',home:'<path d="m3 10 9-7 9 7v10H3Z"/><path d="M9 20v-7h6v7"/>',search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>'};return '<svg viewBox="0 0 24 24" aria-hidden="true">'+paths[name]+'</svg>';}
var root=document.createElement('div');root.id='ot-site-nav';
root.innerHTML='<div class="ot-shade" hidden></div><div class="ot-menu" id="ot-nav-menu" role="dialog" aria-modal="true" aria-labelledby="ot-nav-title" hidden><div class="ot-heading"><h2 id="ot-nav-title">Все разделы</h2><button type="button" class="ot-close" aria-label="Закрыть меню">×</button></div><label for="ot-nav-query">Поиск по разделам и темам</label><input id="ot-nav-query" type="search" placeholder="Например: СЛР, наряд, заземление" autocomplete="off"><div class="ot-results"></div><div class="ot-status" role="status" aria-live="polite"></div></div><nav class="ot-bar" aria-label="Быстрая навигация"><button type="button" class="ot-sections" aria-expanded="false" aria-controls="ot-nav-menu">'+icon('menu')+'<span>Разделы</span></button><a class="ot-home">'+icon('home')+'<span>Домой</span></a><button type="button" class="ot-search" aria-expanded="false" aria-controls="ot-nav-menu">'+icon('search')+'<span>Поиск</span></button></nav>';
document.body.appendChild(root);
document.body.style.setProperty('--ot-nav-page-bottom',Math.max(84,parseFloat(getComputedStyle(document.body).paddingBottom)||0)+'px');
document.body.classList.add('ot-nav-enabled');
var menu=root.querySelector('.ot-menu'),shade=root.querySelector('.ot-shade'),query=root.querySelector('input'),list=root.querySelector('.ot-results'),sectionsButton=root.querySelector('.ot-sections'),searchButton=root.querySelector('.ot-search'),home=root.querySelector('.ot-home'),close=root.querySelector('.ot-close'),returnFocus=sectionsButton;
home.href=new URL('index.html',base).href;
function cleanPath(p){return p.replace(/index\.html$/,'').replace(/\/$/,'');}
if(cleanPath(location.pathname)===cleanPath(new URL(home.href).pathname))home.setAttribute('aria-current','page');
function normalize(t){return t.toLocaleLowerCase('ru').replace(/ё/g,'е').trim();}
function render(){list.replaceChildren();var terms=normalize(query.value).split(/\s+/).filter(Boolean),count=0;
sections.forEach(function(s,i){if(!terms.every(function(t){return normalize(s[1]+' '+s[2]).includes(t);}))return;count++;var a=document.createElement('a');a.className='ot-entry';a.href=new URL(s[0]+'/index.html',base).href;if(cleanPath(location.pathname)===cleanPath(new URL(a.href).pathname))a.setAttribute('aria-current','page');var num=document.createElement('span'),label=document.createElement('span');num.className='ot-num';num.textContent=String(i+1).padStart(2,'0');label.textContent=s[1];a.append(num,label);a.addEventListener('click',function(){setOpen(false,false);});list.appendChild(a);});
root.querySelector('.ot-status').textContent=count?'Разделов: '+count+' из '+sections.length:'Ничего не найдено. Попробуйте другое слово.';
}
var blocked=[],oldOverflow='';
function setOpen(open,focusSearch){
if(open===!menu.hidden){if(open&&focusSearch)query.focus();return;}
menu.hidden=!open;shade.hidden=!open;sectionsButton.setAttribute('aria-expanded',String(open));searchButton.setAttribute('aria-expanded',String(open&&focusSearch));
if(open){returnFocus=focusSearch?searchButton:sectionsButton;render();oldOverflow=document.body.style.overflow;document.body.style.overflow='hidden';blocked=Array.from(document.body.children).filter(function(el){return el!==root&&!el.inert;});blocked.forEach(function(el){el.inert=true;});(focusSearch?query:close).focus();}
else{document.body.style.overflow=oldOverflow;blocked.forEach(function(el){el.inert=false;});blocked=[];returnFocus.focus();}
}
sectionsButton.addEventListener('click',function(){if(menu.hidden){query.value='';setOpen(true,false);}else setOpen(false,false);});searchButton.addEventListener('click',function(){setOpen(true,true);});close.addEventListener('click',function(){setOpen(false,false);});shade.addEventListener('click',function(){setOpen(false,false);});query.addEventListener('input',render);
document.addEventListener('keydown',function(e){if(menu.hidden)return;if(e.key==='Escape'){e.preventDefault();setOpen(false,false);}if(e.key==='Tab'){var focusable=Array.from(menu.querySelectorAll('a[href],button,input')).filter(function(el){return !el.disabled;}),first=focusable[0],last=focusable[focusable.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});
window.addEventListener('pageshow',function(){if(!menu.hidden)setOpen(false,false);});
})();
