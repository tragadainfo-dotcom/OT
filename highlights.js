/* Сохраняемые выделения текста: выделили — подсветилось, нажали на подсвеченное — убралось.
   Данные хранятся в localStorage отдельно для каждой страницы. */
(function () {
  'use strict';
  var KEY = 'ot-highlights:v1:' + location.pathname.replace(/index\.html$/, '');
  var MAXLEN = 5000;
  /* где подсветка не нужна: управляющие элементы, вкладки, тесты и тренажёры */
  var EXCL = 'script,style,noscript,textarea,input,select,button,summary,a,label,svg,[contenteditable],' +
    '.q,#qs,#quiz,.quiz,.opt,.opts,.mrow,.tabs,.chips,nav,.bar,.btn,.chip,.tab,[role="tab"],.score,' +
    '.closeb,#floatClose,#pageVersion';
  var records = [];      /* {id, t, p, s} */
  var restored = {};     /* id -> true, если подсветка уже нарисована */
  var seq = 0;

  function load() {
    try {
      var d = JSON.parse(localStorage.getItem(KEY) || '[]');
      if (Array.isArray(d)) records = d.filter(function (r) { return r && typeof r.t === 'string' && r.t; });
    } catch (e) { records = []; }
    records.forEach(function (r) { r.id = 'h' + (++seq); });
  }
  function save() {
    try {
      var out = records.map(function (r) { return { t: r.t, p: r.p, s: r.s }; });
      if (out.length) localStorage.setItem(KEY, JSON.stringify(out)); else localStorage.removeItem(KEY);
    } catch (e) { /* хранилище недоступно: просто не сохраняем */ }
  }

  /* поток текста страницы: все разрешённые текстовые узлы по порядку */
  function stream() {
    var nodes = [], text = '', pos = 0;
    var w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
    var n;
    while ((n = w.nextNode())) {
      var el = n.parentElement;
      if (!el || el.closest(EXCL)) continue;
      var len = n.data.length;
      if (!len) continue;
      nodes.push({ n: n, a: pos, b: pos + len });
      text += n.data;
      pos += len;
    }
    return { nodes: nodes, text: text };
  }

  function wrap(st, a, b, id) {
    /* идём с конца, чтобы разбиение узлов не сбивало смещения */
    for (var i = st.nodes.length - 1; i >= 0; i--) {
      var it = st.nodes[i];
      if (it.b <= a || it.a >= b) continue;
      var ls = Math.max(a, it.a) - it.a, le = Math.min(b, it.b) - it.a;
      var node = it.n;
      if (!node.data.slice(ls, le).trim()) continue;
      if (le < node.data.length) node.splitText(le);
      var mid = ls > 0 ? node.splitText(ls) : node;
      var m = document.createElement('mark');
      m.className = 'ot-hl';
      m.setAttribute('data-hid', id);
      mid.parentNode.insertBefore(m, mid);
      m.appendChild(mid);
    }
  }

  function marksOf(id) {
    return [].slice.call(document.querySelectorAll('mark.ot-hl[data-hid="' + id + '"]'));
  }
  function unwrap(id) {
    marksOf(id).forEach(function (m) {
      var p = m.parentNode;
      if (!p) return;
      while (m.firstChild) p.insertBefore(m.firstChild, m);
      p.removeChild(m);
    });
    delete restored[id];
  }
  /* диапазон подсветки в потоке */
  function spanOf(st, id) {
    var a = Infinity, b = -1;
    st.nodes.forEach(function (it) {
      var p = it.n.parentElement;
      if (p && p.tagName === 'MARK' && p.getAttribute('data-hid') === id) {
        if (it.a < a) a = it.a;
        if (it.b > b) b = it.b;
      }
    });
    return b < 0 ? null : { a: a, b: b };
  }

  function findAt(text, r) {
    var i = text.indexOf(r.p + r.t + r.s);
    if (i >= 0) return i + r.p.length;
    i = text.indexOf(r.p + r.t);
    if (i >= 0) return i + r.p.length;
    i = text.indexOf(r.t + r.s);
    if (i >= 0) return i;
    i = text.indexOf(r.t);
    return i;
  }

  function restoreAll() {
    records.forEach(function (r) {
      if (restored[r.id]) return;
      var st = stream();
      var a = findAt(st.text, r);
      if (a < 0) return;
      wrap(st, a, a + r.t.length, r.id);
      restored[r.id] = true;
    });
  }

  /* выделение пользователя -> диапазон в потоке */
  function selectionSpan(st, range) {
    var a = Infinity, b = -1;
    st.nodes.forEach(function (it) {
      var n = it.n;
      if (!range.intersectsNode(n)) return;
      var ls = n === range.startContainer ? range.startOffset : 0;
      var le = n === range.endContainer ? range.endOffset : n.data.length;
      if (le <= ls) return;
      if (it.a + ls < a) a = it.a + ls;
      if (it.a + le > b) b = it.a + le;
    });
    if (b < 0) return null;
    var t = st.text;
    while (a < b && /\s/.test(t.charAt(a))) a++;
    while (b > a && /\s/.test(t.charAt(b - 1))) b--;
    return b > a ? { a: a, b: b } : null;
  }

  function process() {
    var sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;
    var range = sel.getRangeAt(0);
    var st = stream();
    var sp = selectionSpan(st, range);
    if (!sp) return;
    if (sp.b - sp.a > MAXLEN) return;
    var a = sp.a, b = sp.b;
    /* слияние с пересекающимися подсветками */
    var keep = [];
    records.forEach(function (r) {
      var s = restored[r.id] ? spanOf(st, r.id) : null;
      if (s && s.a < b && s.b > a) {
        if (s.a < a) a = s.a;
        if (s.b > b) b = s.b;
        unwrap(r.id);
      } else keep.push(r);
    });
    records = keep;
    st = stream();
    var id = 'h' + (++seq);
    var t = st.text;
    records.push({ id: id, t: t.slice(a, b), p: t.slice(Math.max(0, a - 24), a), s: t.slice(b, b + 24) });
    wrap(st, a, b, id);
    restored[id] = true;
    save();
    sel.removeAllRanges();
  }

  var timer = null, due = 0, down = false;
  function schedule(ms) {
    var t = Date.now() + ms;
    if (timer && due <= t) return; /* уже запланировано раньше */
    clearTimeout(timer);
    due = t;
    timer = setTimeout(function () { timer = null; if (!down) process(); }, ms);
  }

  function init() {
    load();
    restoreAll();
    window.addEventListener('load', restoreAll);
    document.addEventListener('mousedown', function () { down = true; });
    document.addEventListener('mouseup', function () { down = false; schedule(20); });
    document.addEventListener('touchstart', function () { down = true; }, { passive: true });
    document.addEventListener('touchend', function () { down = false; schedule(500); }, { passive: true });
    document.addEventListener('touchcancel', function () { down = false; }, { passive: true });
    /* выделение ручками на телефоне не даёт touchend: ждём, пока оно перестанет меняться */
    document.addEventListener('selectionchange', function () { schedule(900); });
    document.addEventListener('click', function (e) {
      var sel = window.getSelection();
      if (sel && !sel.isCollapsed) return;
      var m = e.target && e.target.closest ? e.target.closest('mark.ot-hl') : null;
      if (!m) return;
      var id = m.getAttribute('data-hid');
      unwrap(id);
      records = records.filter(function (r) { return r.id !== id; });
      save();
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
