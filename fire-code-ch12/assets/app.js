/* Interactive 3D book engine. Requires window.BOOK (content/<lang>.js). Models live in models.js (window.Models). */
(function () {
'use strict';
const B = window.BOOK, U = B.ui, RTL = B.dir === 'rtl';
let PW = 600, PH = 820;                   // logical page size (px); scaled to fit — phones use a smaller page
const SIZES = { spread: [600, 820], single: [430, 680] };
const $ = (s, r) => (r || document).querySelector(s), $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const store = {
  get(k, d) { try { const v = localStorage.getItem((B.store || 'dmbook') + ':' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem((B.store || 'dmbook') + ':' + k, JSON.stringify(v)); } catch (e) {} }
};
const LANGS = [['en', 'EN', 'English'], ['ur', 'اردو', 'اردو'], ['ar', 'عربي', 'العربية']].filter(l => !B.langs || B.langs.includes(l[0]));

/* ---------- inline markup: [[gloss|text]]  **bold**  {{ltr}} ---------- */
function inl(s) {
  return esc(s)
    .replace(/\[\[([a-z0-9-]+)\|([^\]]+)\]\]/g, (m, id, t) => `<button type="button" class="gl" data-g="${id}">${t}</button>`)
    .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
    .replace(/\{\{([^}]+)\}\}/g, '<bdi class="n">$1</bdi>')
    .replace(KV, m => `<b class="kv">${m}</b>`);
}
const KV = /(?<![\w.])(\d[\d,]*(?:\.\d+)?(?:\s?½)?\s?(?:mm|m|L\/min|L|gal(?:lons)?|gpm|minutes|min|hours|psi|kg|lb|pound|dB|feet|ft\.?|tons|Btu\/hr|days|in\.|م|مم|ملم|لتر\/دقيقة|لتر|جالونًا|قدمًا|رطلًا|أرطال|أقدام|يومًا|أيام|أشهر|جالون|دقيقة|دقائق|ساعة|كجم|ديسيبل|طنًا|طن|قدم|رطل|بوصة)(?![\w\u0600-\u06FF]))/g;
const plain = s => String(s).replace(/\[\[[a-z0-9-]+\|([^\]]+)\]\]/g, '$1').replace(/\*\*|\{\{|\}\}/g, '');
const srcTag = p => `<span class="src">${U.page_ref} ${p}</span>`;

/* ---------- block renderers (return HTML string) ---------- */
function renderBlock(b, ctx) {
  const t = b[0];
  switch (t) {
    case 'h': return `<h2 class="b-h" id="a-${b[1]}" data-anchor="${b[1]}">${srcTag(b[3])}${inl(b[2])}</h2>`;
    case 'h3': return `<h3 class="b-h3">${inl(b[1])}</h3>`;
    case 'p': return `<p class="b-p">${inl(b[1])}</p>`;
    case 'sig': return `<p class="b-sig">${inl(b[1])}</p>`;
    case 'ol': return `<ol class="b-ol"${b[3] ? ` start="${b[3]}"` : ''}>${b[1].map(x => `<li>${inl(x)}</li>`).join('')}</ol>`;
    case 'ul': return `<ul class="b-ul">${b[1].map(x => `<li>${inl(x)}</li>`).join('')}</ul>`;
    case 'cl': return `<div class="b-cl"><span class="no">${b[1]}</span><div>${inl(b[2])}</div></div>`;
    case 'def': return `<dl class="b-def"><dt>${inl(b[1])}</dt><dd>${inl(b[2])}</dd></dl>`;
    case 'ex': return `<div class="b-ex"><span class="tag add">${U.added}</span><b>${inl(b[1])}.</b> ${inl(b[2])}</div>`;
    case 'note': return `<div class="b-note"><span class="tag ed">${U.ed_note}</span>${inl(b[1])}</div>`;
    case 'tbl': { const d = b[1];
      return `<div class="tblw"><table class="b-t"><caption>${inl(d.cap)}</caption><thead><tr>${d.head.map(h => `<th>${inl(h)}</th>`).join('')}</tr></thead><tbody>${d.rows.map(r => `<tr>${r.map(c => `<td>${inl(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>${d.foot ? `<div class="foot">${inl(d.foot)}</div>` : ''}</div>`; }
    case 'quiz': return `<div class="card" data-quiz="${b[1]}"></div>`;
    case 'act': return `<div class="card act-${(B.acts[b[1]] || {}).type}" data-act="${b[1]}"></div>`;
    case 'model': { return `<div class="mstage${['m-layout', 'm-hotwork', 'm-riser'].includes(b[1]) ? ' tall' : ''}" data-model="${b[1]}"></div>`; }
    case 'form': return renderForm(B.forms[b[1]]);
    case 'formsec': { const f = B.forms[b[1]]; return renderForm({ cap: b[2] === 0 ? f.cap : '', sections: [f.sections[b[2]]] }); }
    case 'formula': { const f = B.formula, fr = a => `<div class="frac"><span class="lhs">${inl(a[0])} =</span><span class="num">${inl(a[1])}</span><span class="den">${inl(a[2])}</span></div>`;
      return `<div class="formula">${fr(f.freq)}${fr(f.sev)}</div>`; }
    case 'tblh': return `<div class="b-tblh" id="a-${b[1]}" data-anchor="${b[1]}"><span class="tno">${U.table} ${b[2]}</span><span class="ttl">${inl(b[3])}</span></div>`;
    case 'item': return `<div class="b-item"><span class="ino">${b[1]}</span><span>${inl(b[2])}</span></div>`;
    case 'sub': return `<div class="b-sub">${inl(b[1])}</div>`;
    case 'rq': { const parts = b[2].split('|'); return `<div class="b-rq"><label class="ck"><input type="checkbox" data-ck="__BID__" aria-label="${esc(U.checklist)}: ${esc(b[1])}"></label><span class="rl">${b[1]}</span><div class="rt">${inl(parts[0])}${parts.length > 1 ? `<ul class="rsub">${parts.slice(1).map(x => `<li>${inl(x)}</li>`).join('')}</ul>` : ''}</div></div>`; }
    case 'box': return `<aside class="b-box ${b[1]}"><b>${b[1] === 'know' ? U.know : U.ponder}</b><div>${inl(b[2])}</div></aside>`;
    case 'fig': return `<figure class="b-fig"><img src="${b[1]}" alt="${esc(b[2])}" width="1040" height="1190" decoding="async"><figcaption>${inl(b[2])} · <span class="muted2">${U.figure_note}</span></figcaption></figure>`;
    case 'toc': return renderToc(0, B.toc.length);
    case 'tocpart': return renderToc(b[2], b[3]);
    case 'ch': return ''; // handled as a full page
  }
  return '';
}
function renderForm(f) {
  let h = `<div class="form">${f.cap ? `<b>${inl(f.cap)}</b>` : ''}`;
  f.sections.forEach(s => {
    if (s.t === 'fields') h += `<div class="flds">${s.items.map(x => `<span class="fld">${inl(x)}:</span>`).join('')}</div>`;
    if (s.t === 'yn') h += `<table><tr><th>${inl(s.cap)}</th>${s.cols.map(c => `<th>${inl(c)}</th>`).join('')}</tr>${s.items.map(x => `<tr><td>${inl(x)}</td>${s.cols.map(() => '<td>( )</td>').join('')}</tr>`).join('')}</table>`;
    if (s.t === 'two') h += `<h5>${inl(s.cap)}</h5><table><tr><th>${inl(s.a[0])}</th><th>${inl(s.b[0])}</th></tr>${s.a.slice(1).map((x, i) => `<tr><td><span class="box"></span>${inl(x)}</td><td>${s.b[i + 1] ? `<span class="box"></span>${inl(s.b[i + 1])}` : ''}</td></tr>`).join('')}</table>`;
    if (s.t === 'checks') h += `<h5>${inl(s.cap)}</h5>${s.rows.map(r => `<div>${inl(r[0])}: ${r.slice(1).map(x => `<span class="box"></span>${inl(x)}`).join(' ')}</div>`).join('')}`;
    if (s.t === 'grid') h += `<table><tr>${s.head.map(x => `<th>${inl(x)}</th>`).join('')}</tr>${Array.from({ length: s.n }, (_, i) => `<tr><td>${i + 1}</td>${s.head.slice(1).map(() => '<td></td>').join('')}</tr>`).join('')}</table>`;
    if (s.t === 'grid2') h += `<table><tr>${s.head.map(x => `<th>${inl(x)}</th>`).join('')}</tr>${s.items.map(x => `<tr><td>${inl(x)}</td><td></td><td></td></tr>`).join('')}</table>`;
    if (s.t === 'lines') h += s.items.map(x => `<div class="fld">${inl(x)}:</div>`).join('');
  });
  return h + '</div>';
}
const published = new Set(B.chapters.map(c => c.num));
function renderToc(a, z) {
  return `<div class="toc-l">${a === 0 ? `<b class="b-h3">${U.toc}</b>` : ''}${B.toc.slice(a, z).map(r => {
    const on = published.has(r[0]);
    const inner = `<span class="pn">${r[0]}</span><span>${inl(r[1])}</span><span class="st ${on ? 'on' : 'off'}">${on ? U.published : U.coming}</span><span class="pn">${r[2]}</span>`;
    return on ? `<a href="#c${r[0]}-start" data-goch="${r[0]}">${inner}</a>` : `<span class="row">${inner}</span>`;
  }).join('')}</div>`;
}

/* ---------- pagination ---------- */
let pages = []; // {html, anchors:[], srcs:Set, chap, text}
let CK = []; // checklist index: {id, table, item, sub, label, text, page}
const anchorTitle = {}, anchorChap = {};
function paginate() {
  pages = []; CK = []; let curT = '', curI = '', curS = '';
  const meas = el('div', 'face paper' + (mode === 'single' ? ' sm' : '')); meas.style.cssText = `position:absolute;left:-99999px;top:0;width:${PW}px;height:${PH}px;visibility:hidden`;
  meas.innerHTML = `<div class="pg"><div class="pg-body"></div></div>`; document.body.appendChild(meas);
  const body = $('.pg-body', meas);
  const fits = () => { if (body.scrollHeight > body.clientHeight + 1) return false; const l = body.lastElementChild; if (!l) return true; return l.getBoundingClientRect().bottom - body.getBoundingClientRect().top <= body.clientHeight - 4; };
  B.chapters.forEach(ch => {
    let cur = null, lastSrc = null;
    const flush = () => { if (cur && cur.parts.length) { cur.html = cur.parts.join(''); pages.push(cur); } cur = null; body.innerHTML = ''; };
    const start = () => { cur = { parts: [], anchors: [], srcs: new Set(), chap: ch, text: '', bids: [] }; body.innerHTML = ''; lastSrc = null; };
    const pushHTML = (html, b) => {
      body.insertAdjacentHTML('beforeend', html);
      if (!fits() && cur.parts.length) { body.lastElementChild.remove(); flush(); start(); body.insertAdjacentHTML('beforeend', html); }
      cur.parts.push(html);
      if (b) { const s = srcOf(b); if (s) cur.srcs.add(s); cur.text += ' ' + textOf(b); if (b[0] === 'h') { cur.anchors.push(b[1]); anchorTitle[b[1]] = plain(b[2]); anchorChap[b[1]] = ch.num; } if (b[0] === 'tblh') { cur.anchors.push(b[1]); anchorTitle[b[1]] = U.table + ' ' + b[2]; anchorChap[b[1]] = ch.num; } }
    };
    if (ch.num > 0) { // chapter opener page
      const s = ch.pages[0];
      pages.push({ html: `<div class="chopen"><div class="big">${String(ch.num).padStart(2, '0')}</div><h2>${inl(ch.title)}</h2><div class="pp">${U.chapter} ${ch.num} · ${U.orig} ${ch.pages[0]}${ch.pages[1] !== ch.pages[0] ? '–' + ch.pages[1] : ''}</div><div class="art"></div></div>`, anchors: ['c' + ch.num + '-start'], srcs: new Set([s]), chap: ch, text: ch.title, opener: true });
      anchorTitle['c' + ch.num + '-start'] = ch.title; anchorChap['c' + ch.num + '-start'] = ch.num;
    }
    start();
    const blocks = []; ch.blocks.forEach(b => { if (b[0] === 'form') B.forms[b[1]].sections.forEach((sec, i) => blocks.push(['formsec', b[1], i, sec.p || b[2]])); else if (b[0] === 'toc') for (let i = 0; i < B.toc.length; i += 6) blocks.push(['tocpart', b[1], i, Math.min(B.toc.length, i + 6)]); else blocks.push(b); });
    let bi = -1; const ci = B.chapters.indexOf(ch);
    blocks.forEach(b => {
      if (b[0] !== 'formsec' || b[2] === 0) bi++;
      if (b[0] === 'ch') return;
      const bid = 'b' + ci + '-' + bi; const markB = () => { if (cur && !cur.bids.includes(bid)) cur.bids.push(bid); };
      const s = srcOf(b);
      if (b[0] === 'tblh') { curT = b[2]; curI = ''; curS = ''; } if (b[0] === 'item') { curI = b[1] + ' ' + plain(b[2]); curS = ''; } if (b[0] === 'sub') curS = plain(b[1]); if (b[0] === 'h') { curT = ''; }
      if (b[0] === 'rq') CK.push({ id: bid, table: curT, item: curI, sub: curS, label: b[1], text: plain(b[2].split('|')[0]), src: b[3] });
      let html = renderBlock(b).replace('__BID__', bid); const showSrc = s && s !== lastSrc && b[0] !== 'h';
      if (showSrc) html = addSrc(html, s, b[0]);
      if (s) lastSrc = s;
      if (b[0] === 'ol' || b[0] === 'ul') {
        body.insertAdjacentHTML('beforeend', html); const whole = fits(); body.lastElementChild.remove();
        if (whole) { pushHTML(html, b); markB(); return; }
        const tag = b[0], st0 = b[3] || 1, items = b[1]; let i = 0;
        const part = (i0, j0) => { const pb = [tag, items.slice(i0, j0), s, tag === 'ol' ? st0 + i0 : undefined]; let hh = renderBlock(pb); if (i0 === 0 && showSrc) hh = addSrc(hh, s, tag); return [hh, pb]; };
        const tryFit = hh => { body.insertAdjacentHTML('beforeend', hh); const f = fits(); body.lastElementChild.remove(); return f; };
        while (i < items.length) {
          let j = i; while (j < items.length && tryFit(part(i, j + 1)[0])) j++;
          if (j === i) { if (cur.parts.length) { flush(); start(); continue; } j = i + 1; }
          const [hh, pb] = part(i, j); body.insertAdjacentHTML('beforeend', hh); cur.parts.push(hh); if (s) cur.srcs.add(s); cur.text += ' ' + textOf(pb);
          markB(); i = j; if (i < items.length) { flush(); start(); }
        }
        return;
      }
      if (b[0] === 'h' && cur.parts.length) { // keep heading with next block: if heading lands in bottom 18% move it
        body.insertAdjacentHTML('beforeend', html);
        const lc = body.lastElementChild.getBoundingClientRect(), br = body.getBoundingClientRect(); const tooLow = (lc.bottom - br.top) > br.height * 0.84; body.lastElementChild.remove();
        if (tooLow) { flush(); start(); }
      }
      pushHTML(html, b); markB();
    });
    flush();
  });
  meas.remove();
  pages.forEach((p, i) => { p.i = i; if (!p.anchors.length) p.anchor = (pages[i - 1] && (pages[i - 1].anchor)) || ('c' + p.chap.num + '-start'); else p.anchor = p.anchors[0]; });
  pages.forEach(p => { p.srcList = Array.from(p.srcs).sort((a, b) => a - b); });
}
function addSrc(html, s, t) {
  if (t === 'ol' || t === 'ul') return html.replace(/<li>/, `<li>${srcTag(s)}`);
  if (t === 'def') return html.replace('<dt>', `<dt>${srcTag(s)}`);
  if (t === 'cl') return html.replace('</span><div>', `</span><div>${srcTag(s)}`);
  if (t === 'rq') return html.replace('<div class="rt">', `<div class="rt">${srcTag(s)}`);
  if (t === 'item') return html.replace('</span><span>', `</span><span>${srcTag(s)}`);
  if (t === 'box') return html.replace('</b><div>', `</b><div>${srcTag(s)}`);
  return html.replace(/^(<[a-z0-9]+[^>]*>)/, `$1${srcTag(s)}`);
}
function srcOf(b) { const t = b[0]; if (t === 'h') return b[3]; if (t === 'h3' || t === 'p' || t === 'ol' || t === 'ul' || t === 'sig' || t === 'tbl' || t === 'form') return b[2]; if (t === 'cl' || t === 'def' || t === 'formsec' || t === 'item' || t === 'rq' || t === 'box' || t === 'fig') return b[3]; if (t === 'tblh') return b[4]; if (t === 'formula' || t === 'toc' || t === 'tocpart') return b[1]; return null; }
function textOf(b) {
  const t = b[0]; let s = '';
  if (t === 'h' || t === 'sig') s = b[t === 'h' ? 2 : 1]; else if (t === 'h3' || t === 'p' || t === 'note') s = b[1]; else if (t === 'ol' || t === 'ul') s = b[1].join(' '); else if (t === 'cl') s = b[1] + ' ' + b[2]; else if (t === 'def') s = b[1] + ' ' + b[2]; else if (t === 'ex') s = b[1] + ' ' + b[2]; else if (t === 'tblh') s = U.table + ' ' + b[2] + ' ' + b[3]; else if (t === 'item') s = b[1] + ' ' + b[2]; else if (t === 'sub') s = b[1]; else if (t === 'rq') s = b[1] + ' ' + b[2].split('|').join(' '); else if (t === 'box') s = b[2]; else if (t === 'fig') s = b[2];
  else if (t === 'tbl') s = [b[1].cap].concat(b[1].head, ...b[1].rows, b[1].foot || '').join(' ');
  return plain(s);
}

/* ---------- faces & leaves ---------- */
const desk = $('#desk'), sizer = $('#sizer'), wrap = $('#bookwrap'), tilt = $('#tilt'), book = $('#book');
if (RTL) book.classList.add('rtl');
let mode = 'spread', faces = [], leaves = [], k = 0, zoom = 1, animating = false;
function facesFor(m) {
  const f = [{ kind: 'cover' }];
  if (m === 'spread') f.push({ kind: 'inside' });
  pages.forEach((p, i) => f.push({ kind: 'page', i }));
  if (m === 'spread') { if (f.length % 2) f.push({ kind: 'inside' }); f.push({ kind: 'inside' }); }
  f.push({ kind: 'back' });
  return f;
}
const wantMode = () => (desk.clientWidth < 820 || desk.clientWidth < desk.clientHeight * 0.9) ? 'single' : 'spread';
function build() {
  const curB = leaves.length ? curBlock() : null;
  const m = wantMode(); const repag = m !== mode || !pages.length; mode = m; [PW, PH] = SIZES[mode];
  if (repag) paginate();
  const cur = curB ? pageOf(curB) : null;
  faces = facesFor(mode);
  book.querySelectorAll('.leaf,.zone,.edge').forEach(n => n.remove());
  leaves = [];
  const n = mode === 'spread' ? faces.length / 2 : faces.length;
  book.style.width = (mode === 'spread' ? 2 * PW : PW) + 'px'; book.style.height = PH + 'px';
  for (let i = 0; i < n; i++) {
    const L = el('div', 'leaf'); L.style.width = PW + 'px'; L.style.height = PH + 'px'; L.style.left = (mode === 'spread' ? PW : 0) + 'px';
    const fr = el('div', 'face front'), bk = el('div', 'face back'); if (mode === 'single') { fr.classList.add('sm'); bk.classList.add('sm'); }
    L.append(fr, bk, el('div', 'turnshade')); book.appendChild(L);
    leaves.push({ el: L, f: fr, b: bk, fi: mode === 'spread' ? 2 * i : i, bi: mode === 'spread' ? 2 * i + 1 : -1, mounted: false });
  }
  const zn = el('div', 'zone next'), zp = el('div', 'zone prev'); book.append(zn, zp);
  const eL = el('div', 'edge l'), eR = el('div', 'edge r'); book.append(eL, eR);
  zp.style.left = '0'; zn.style.right = '0';
  bindZone(zn, +1); bindZone(zp, -1);
  if (cur != null && cur >= 0) k = kForPage(cur); else k = Math.min(k, leaves.length);
  layout(true); fit();
}
function faceHTML(fi) {
  const f = faces[fi]; if (!f) return { cls: 'paper', html: '' };
  if (f.kind === 'cover') return { cls: 'cover', html: `<div class="cov${B.coverImg ? ' img' : ''}">${B.coverImg ? `<div class="cimg" style="background-image:url('${B.coverImg}')"></div>` : ''}<div class="tape"></div><div class="cbody"><span class="kick">${inl(B.subtitle)}</span><h1>${inl(B.title)}</h1><p>${inl(B.coverLine || '')}</p></div><div class="ed"><span>${inl(B.edition)}</span><div class="lgs">${LANGS.map(l => `<span lang="${l[0]}">${l[2]}</span>`).join('')}</div></div><div class="hint">${U.cover_hint}</div></div>` };
  if (f.kind === 'back') return { cls: 'coverback', html: `<div class="cov backc"><div><p>${inl(B.edition)}</p><p style="margin-top:10px;font-size:13px;opacity:.75">${inl(U.disclaimer)}</p></div></div>` };
  if (f.kind === 'inside') return { cls: 'paper', html: '<div class="inside"></div>' };
  const p = pages[f.i];
  if (p.opener) return { cls: 'paper', html: p.html };
  const bm = bookmarks().includes(p.anchor) && p.anchors.includes(p.anchor);
  return { cls: 'paper', html: `<div class="pg"><div class="pg-run"><b>${U.chapter} ${p.chap.num || ''} · ${inl(p.chap.title)}</b><span class="ltr">${p.srcList.length ? U.orig + ' ' + (p.srcList[0] === p.srcList[p.srcList.length - 1] ? p.srcList[0] : p.srcList[0] + '–' + p.srcList[p.srcList.length - 1]) : ''}</span></div><div class="pg-body">${p.html}</div><div class="pg-foot"><span>${bm ? '<span class="bm">◆</span> ' : ''}</span><span class="ltr">${f.i + 1}</span></div></div>` };
}
function mountFace(node, fi) {
  const r = faceHTML(fi); node.className = node.className.replace(/\b(paper|cover|coverback)\b/g, '').trim() + ' ' + r.cls;
  node.innerHTML = `<div class="pgc">${r.html}</div>`; hydrate(node);
}
function layout(instant) {
  const n = leaves.length;
  leaves.forEach((L, i) => {
    const flipped = i < k;
    if (instant) L.el.style.transition = 'none';
    L.el.classList.toggle('flipped', flipped);
    L.el.style.zIndex = flipped ? i + 1 : n - i;
    L.f.style.pointerEvents = flipped ? 'none' : ''; L.b.style.pointerEvents = flipped ? '' : 'none';
    const near = Math.abs(i - k) <= 2 || (i === k - 1);
    if (near && !L.mounted) { mountFace(L.f, L.fi); if (L.bi >= 0) mountFace(L.b, L.bi); else { L.b.className = 'face back paper'; L.b.innerHTML = ''; } L.mounted = true; }
    if (!near && L.mounted) { L.f.innerHTML = ''; L.b.innerHTML = ''; L.mounted = false; }
    if (instant) { void L.el.offsetWidth; L.el.style.transition = ''; }
  });
  // closed-book centering and page edges
  let shift = 0;
  if (mode === 'spread') { if (k === 0) shift = -PW / 2; else if (k === n) shift = PW / 2; }
  book.style.transform = `${RTL ? 'scaleX(-1) ' : ''}translateX(${shift}px)`;
  const eL = $('.edge.l', book), eR = $('.edge.r', book);
  const wl = mode === 'spread' && k > 0 ? Math.min(14, 2 + k * 0.3) : 0, wr = k < n ? Math.min(14, 2 + (n - k) * 0.3) : 0;
  eL.style.cssText = `left:${-wl}px;width:${wl}px`; eR.style.cssText = `left:${mode === 'spread' ? 2 * PW : PW}px;width:${wr}px`;
  const zp = $('.zone.prev', book), zn = $('.zone.next', book), zw = PW * 0.13;
  zp.style.cssText = `left:0;width:${mode === 'spread' && k === n ? PW * 0.5 : zw}px`; zn.style.cssText = `right:0;left:auto;width:${k === 0 ? PW * 0.5 : zw}px`;
  zp.hidden = k === 0; zn.hidden = k === n;
  updateInfo(); savePos(); window.Models && Models.refresh(visibleFaces());
}
function visibleFaces() {
  const out = []; const n = leaves.length;
  if (mode === 'spread') { if (k > 0) out.push(leaves[k - 1].b); if (k < n) out.push(leaves[k].f); }
  else if (k < n) out.push(leaves[k].f);
  return out;
}
function kForPage(pi) { if (mode === 'spread') { const fi = pi + 2; return fi % 2 === 0 ? fi / 2 : (fi + 1) / 2; } return pi + 1; }
function currentPage() {
  if (!leaves.length) return null; const n = leaves.length;
  if (mode === 'spread') { const fi = k < n ? leaves[k].fi : -1; const f = faces[fi]; if (f && f.kind === 'page') return f.i; const fb = k > 0 ? faces[leaves[k - 1].bi] : null; return fb && fb.kind === 'page' ? fb.i : null; }
  const f = k < n ? faces[leaves[k].fi] : null; return f && f.kind === 'page' ? f.i : null;
}
function visiblePages() { return visibleFaces().map(n => { const L = leaves.find(l => l.f === n || l.b === n); const fi = L.f === n ? L.fi : L.bi; const f = faces[fi]; return f && f.kind === 'page' ? f.i : null; }).filter(x => x != null).sort((a, b) => a - b); }

/* ---------- flipping ---------- */
function flip(dir) {
  if (animating) return;
  const n = leaves.length, target = k + dir;
  if (target < 0 || target > n) return;
  const L = leaves[dir > 0 ? k : k - 1];
  animating = true; L.el.classList.add('turning'); L.el.style.zIndex = n + 5;
  // mount neighbours before turning
  const prevK = k; k = target; preMount();
  requestAnimationFrame(() => { L.el.classList.toggle('flipped', dir > 0); });
  const done = e => { if (e && e.target !== L.el) return; L.el.removeEventListener('transitionend', done); L.el.classList.remove('turning'); animating = false; layout(false); };
  L.el.addEventListener('transitionend', done); setTimeout(() => { if (animating) done(); }, 1100);
}
function preMount() { leaves.forEach((L, i) => { if (Math.abs(i - k) <= 2 && !L.mounted) { mountFace(L.f, L.fi); if (L.bi >= 0) mountFace(L.b, L.bi); L.mounted = true; } }); }
function goPage(pi, hl) {
  if (pi == null || pi < 0 || pi >= pages.length) return;
  const t = kForPage(pi);
  if (t === k) { if (hl) highlight(hl); return; }
  const dir = t > k ? 1 : -1;
  if (Math.abs(t - k) > 1) { k = t - dir; layout(true); }
  flip(dir);
  if (hl) setTimeout(() => highlight(hl), 900);
}
function goAnchor(a) { const p = pageOf(a); if (p >= 0) goPage(p); return p >= 0; }

let drag = null;
function bindZone(z, dir) {
  z.addEventListener('pointerdown', e => {
    if (animating) return; const n = leaves.length; const idx = dir > 0 ? k : k - 1; if (idx < 0 || idx >= n) return;
    e.preventDefault(); z.setPointerCapture(e.pointerId);
    drag = { dir, idx, x0: e.clientX, moved: false, L: leaves[idx] };
    const old = k; k = dir > 0 ? k + 1 : k - 1; preMount(); k = old;
    drag.L.el.classList.add('drag', 'turning'); drag.L.el.style.zIndex = n + 5;
  });
  z.addEventListener('pointermove', e => {
    if (!drag) return; const r = book.getBoundingClientRect(); const w = r.width / (mode === 'spread' ? 2 : 1);
    let dx = (e.clientX - drag.x0) * (RTL ? -1 : 1);
    if (Math.abs(dx) > 4) drag.moved = true;
    let prog = drag.dir > 0 ? Math.min(1, Math.max(0, -dx / (w * (mode === 'spread' ? 1.6 : 1)))) : Math.min(1, Math.max(0, dx / (w * (mode === 'spread' ? 1.6 : 1))));
    drag.prog = prog; const ang = drag.dir > 0 ? -180 * prog : -180 + 180 * prog;
    drag.L.el.style.transform = `rotateY(${ang}deg)`;
  });
  const end = e => {
    if (!drag) return; const d = drag; drag = null; d.L.el.classList.remove('drag'); d.L.el.style.transform = '';
    if (!d.moved || (d.prog || 0) > 0.3) { d.L.el.classList.remove('turning'); flip(d.dir); }
    else { d.L.el.classList.remove('turning'); layout(false); }
  };
  z.addEventListener('pointerup', end); z.addEventListener('pointercancel', end);
}

/* ---------- scale & zoom ---------- */
function fit() {
  const bw = (mode === 'spread' ? 2 * PW : PW) + 40, bh = PH + 50;
  const s = Math.min((desk.clientWidth - 16) / bw, (desk.clientHeight - 16) / bh) * zoom;
  const W = bw * s, H = bh * s;
  sizer.style.width = Math.max(W, desk.clientWidth) + 'px'; sizer.style.height = Math.max(H, desk.clientHeight - 1) + 'px';
  wrap.style.transform = `translate(${Math.max(0, (desk.clientWidth - W) / 2) + 20 * s}px,${Math.max(0, (desk.clientHeight - H) / 2) + 18 * s}px) scale(${s})`;
  tilt.style.transform = mode === 'spread' && zoom <= 1 ? 'rotateX(9deg)' : 'none';
  wrap.dataset.scale = s; window.Models && Models.setScale(s);
}
function setZoom(z) { zoom = Math.max(1, Math.min(2.4, z)); fit(); $('#zo').disabled = zoom <= 1; $('#zi').disabled = zoom >= 2.4; }

/* ---------- info bar, position, bookmarks ---------- */
function updateInfo() {
  const vp = visiblePages(); const info = $('#pinfo');
  if (!vp.length) { info.textContent = k === 0 ? B.title : ''; return; }
  const srcs = [...new Set(vp.flatMap(i => pages[i].srcList))].sort((a, b) => a - b);
  info.innerHTML = `${U.digital} <bdi class="n">${vp.map(i => i + 1).join('–')}</bdi> ${U.of} <bdi class="n">${pages.length}</bdi>${srcs.length ? ` · ${U.orig} <bdi class="n">${srcs[0]}${srcs.length > 1 ? '–' + srcs[srcs.length - 1] : ''}</bdi>` : ''}`;
  $('#prev').disabled = k === 0; $('#next').disabled = k === leaves.length;
  const a = curAnchor(); $('#bmbtn').setAttribute('aria-pressed', bookmarks().includes(a) ? 'true' : 'false');
  const cb = curBlock(); $$('.langs a').forEach(x => { x.href = x.dataset.base + (cb ? '#' + cb : ''); });
}
function curAnchor() { const vp = visiblePages(); return vp.length ? pages[vp[0]].anchor : null; }
function curBlock() { const vp = visiblePages(); if (!vp.length) return null; const p = pages[vp[0]]; return (p.bids && p.bids[0]) || p.anchor; }
function pageOf(id) { let i = pages.findIndex(p => p.anchors.includes(id)); if (i < 0) i = pages.findIndex(p => p.bids && p.bids.includes(id)); return i; }
function savePos() { const a = curBlock(); if (a) store.set('pos', a); }
const bookmarks = () => store.get('bm', []);
function toggleBm() { const a = curAnchor(); if (!a) return; let l = bookmarks(); l = l.includes(a) ? l.filter(x => x !== a) : l.concat(a); store.set('bm', l); leaves.forEach(L => L.mounted = false); layout(true); toast(l.includes(a) ? '◆ ' + (anchorTitle[a] || '') : U.remove_bm); }

/* ---------- highlight search hits on visible pages ---------- */
function highlight(q) {
  const re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
  visibleFaces().forEach(f => { const w = document.createTreeWalker($('.pg-body', f) || f, NodeFilter.SHOW_TEXT); const hits = []; let n; while ((n = w.nextNode())) if (re.test(n.nodeValue)) hits.push(n); re.lastIndex = 0;
    hits.forEach(t => { const span = document.createElement('span'); span.innerHTML = esc(t.nodeValue).replace(new RegExp(esc(q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), m => `<mark>${m}</mark>`); t.replaceWith(span); }); });
}

/* ---------- drawers ---------- */
function drawer(title, body) {
  closeDrawer(); const s = el('div', 'scrim'); const d = el('aside', 'drawer'); d.setAttribute('role', 'dialog'); d.setAttribute('aria-label', title);
  d.innerHTML = `<header><h2>${title}</h2><button class="btn" type="button" data-x>${U.close}</button></header><div class="dbody"></div>`;
  $('.dbody', d).append(body); document.body.append(s, d); s.onclick = closeDrawer; $('[data-x]', d).onclick = closeDrawer; setTimeout(() => (d.querySelector('input') || $('[data-x]', d)).focus(), 30);
}
function closeDrawer() { $$('.drawer,.scrim').forEach(n => n.remove()); }
function tocPanel() {
  const box = el('div', 'dl');
  B.chapters.forEach(ch => {
    const a = el('a', '', `<b>${ch.num ? ch.num + '. ' : ''}${inl(ch.title)}</b><span class="pn ltr">${U.orig} ${ch.pages[0]}–${ch.pages[1]}</span>`); a.href = '#'; a.onclick = e => { e.preventDefault(); closeDrawer(); const p = pages.findIndex(p => p.chap === ch); goPage(p); }; box.append(a);
    ch.blocks.filter(b => b[0] === 'h').forEach(b => { const s = el('a', 'sub', `<span>${inl(b[2])}</span><span class="pn ltr">${U.page_ref} ${b[3]}</span>`); s.href = '#' + b[1]; s.onclick = e => { e.preventDefault(); closeDrawer(); goAnchor(b[1]); }; box.append(s); });
  });
  const later = el('div', 'dl'); later.innerHTML = `<p class="muted">${U.coming}:</p>` + B.toc.filter(r => !published.has(r[0])).map(r => `<span class="it later"><span>${r[0]}. ${inl(r[1])}</span><span class="pn ltr">${U.page_ref} ${r[2]}</span></span>`).join('');
  const w = el('div'); w.append(box, later); drawer(U.toc, w);
}
function searchPanel() {
  const w = el('div'); w.innerHTML = `<input type="search" id="q" placeholder="${U.search_ph}" autocomplete="off"><div class="muted" id="qn"></div><div id="qr"></div>`;
  drawer(U.search, w); const inp = $('#q'), out = $('#qr');
  const run = () => { const q = inp.value.trim(); out.innerHTML = ''; if (q.length < 2) { $('#qn').textContent = ''; return; }
    const ql = q.toLocaleLowerCase(B.lang); let n = 0;
    pages.forEach((p, i) => { const t = p.text, tl = t.toLocaleLowerCase(B.lang); let at = tl.indexOf(ql); if (at < 0) return; n++;
      const s = Math.max(0, at - 50), snip = esc(t.slice(s, at)) + '<mark>' + esc(t.slice(at, at + q.length)) + '</mark>' + esc(t.slice(at + q.length, at + q.length + 70));
      const r = el('div', 'res', `<small>${U.chapter} ${p.chap.num} · ${U.digital} <bdi class="n">${i + 1}</bdi> · ${U.orig} <bdi class="n">${p.srcList.join(', ')}</bdi></small><span>…${snip}…</span>`); r.tabIndex = 0;
      r.onclick = r.onkeydown = e => { if (e.type === 'keydown' && e.key !== 'Enter') return; closeDrawer(); goPage(i, q); }; out.append(r); });
    $('#qn').textContent = n ? n + ' ' + U.results : U.no_results; };
  inp.addEventListener('input', run);
}
function bmPanel() {
  const w = el('div', 'dl'); const l = bookmarks();
  w.innerHTML = l.length ? '' : `<p class="muted">${U.no_bm}</p>`;
  l.forEach(a => { const it = el('button', 'it', `<span>◆ ${esc(anchorTitle[a] || a)}</span><span class="pn">${U.chapter} ${anchorChap[a] ?? ''}</span>`); it.type = 'button'; it.onclick = () => { closeDrawer(); goAnchor(a); }; w.append(it); });
  drawer(U.bookmarks, w);
}
function progPanel() {
  const P = store.get('progress', {}); const w = el('div');
  w.innerHTML = `<p class="muted">${U.progress_note}</p>`;
  B.chapters.forEach(ch => {
    const ids = ch.blocks.filter(b => ['quiz', 'act', 'model'].includes(b[0])).map(b => b[1]);
    const done = ids.filter(id => P[id] && P[id].done).length;
    const box = el('div', '', `<b>${ch.num}. ${inl(ch.title)}</b><div class="row"><div class="pbar" style="flex:1"><i style="width:${ids.length ? Math.round(100 * done / ids.length) : 0}%"></i></div><span class="muted ltr">${done}/${ids.length}</span></div>`);
    const rs = el('button', 'btn', U.reset); rs.type = 'button'; rs.onclick = () => { const Q = store.get('progress', {}); ids.forEach(id => delete Q[id]); store.set('progress', Q); toast(U.reset_done); leaves.forEach(L => L.mounted = false); layout(true); progPanel(); };
    box.append(rs); box.style.cssText = 'display:flex;flex-direction:column;gap:6px;padding:8px 0;border-bottom:1px solid var(--ui-line)'; w.append(box);
  });
  const all = el('button', 'btn', U.reset_all); all.type = 'button'; all.onclick = () => { store.set('progress', {}); toast(U.reset_done); leaves.forEach(L => L.mounted = false); layout(true); progPanel(); }; w.append(all);
  drawer(U.progress_title, w);
}
function ckPanel() {
  const T = store.get('ck', {}); const w = el('div'); w.innerHTML = `<p class="muted">${U.checklist_note}</p>`;
  const groups = []; CK.forEach(c => { let g = groups.find(x => x.t === c.table); if (!g) groups.push(g = { t: c.table, items: [] }); g.items.push(c); });
  const all = CK.length, met = CK.filter(c => T[c.id]).length;
  w.append(el('div', '', `<div class="row"><b>${U.checklist_title}</b><span class="muted ltr" style="margin-inline-start:auto">${met}/${all} ${U.met}</span></div><div class="pbar"><i style="width:${all ? Math.round(100 * met / all) : 0}%"></i></div>`));
  groups.forEach(g => { const m = g.items.filter(c => T[c.id]).length; const box = el('details', 'ckg'); box.innerHTML = `<summary><b>${g.t ? U.table + ' ' + g.t : '—'}</b><span class="muted ltr">${m}/${g.items.length}</span><span class="pbar" style="flex:1"><i style="width:${Math.round(100 * m / g.items.length)}%"></i></span></summary>`;
    const ul = el('div', 'dl'); g.items.filter(c => !T[c.id]).forEach(c => { const it = el('button', 'it', `<span>${esc(c.item)}${c.sub ? ' · ' + esc(c.sub) : ''} — <b>${esc(c.label)}</b> ${esc(c.text.slice(0, 90))}${c.text.length > 90 ? '…' : ''}</span><span class="pn ltr">${U.page_ref} ${c.src}</span>`); it.type = 'button'; it.onclick = () => { closeDrawer(); goPage(pageOf(c.id)); }; ul.append(it); });
    box.append(ul); w.append(box); });
  const sum = () => { const lines = [B.subtitle + ' — ' + U.checklist_title, `${met}/${all} ${U.met}`, '']; groups.forEach(g => { const m = g.items.filter(c => T[c.id]).length; lines.push(`${U.table} ${g.t}: ${m}/${g.items.length} ${U.met}`); g.items.filter(c => !T[c.id]).forEach(c => lines.push(`  - [${U.open_items}] ${c.item}${c.sub ? ' / ' + c.sub : ''} ${c.label}: ${c.text}`)); }); return lines.join('\n'); };
  const ta = el('textarea', 'cksum'); ta.readOnly = true; ta.value = sum(); ta.rows = 5;
  const cp = el('button', 'btn prim', U.copy_sum); cp.type = 'button'; cp.onclick = () => { const done = () => toast(U.copied); try { navigator.clipboard.writeText(ta.value).then(done, () => { ta.select(); toast(U.copy_fail); }); } catch (e) { ta.select(); toast(U.copy_fail); } };
  const cl = el('button', 'btn', U.clear_ticks); cl.type = 'button'; cl.onclick = () => { store.set('ck', {}); leaves.forEach(L => L.mounted = false); layout(true); toast(U.ticks_cleared); ckPanel(); };
  const off = el('button', 'btn', U.checklist_off || 'Off'); off.type = 'button'; off.onclick = () => { setCk(false); closeDrawer(); };
  const row = el('div', 'row'); row.append(cp, cl, off); w.append(row, ta);
  drawer(U.checklist_title, w);
}
function setCk(on) { document.body.classList.toggle('ck-on', on); store.set('ckmode', on); const b = $('#ckb'); if (b) { b.setAttribute('aria-pressed', on ? 'true' : 'false'); } }
function toast(msg, act, fn) { $$('.toast').forEach(n => n.remove()); const t = el('div', 'toast', `<span>${msg}</span>`); if (act) { const b = el('button', '', act); b.type = 'button'; b.onclick = () => { fn(); t.remove(); }; t.append(b); } document.body.append(t); setTimeout(() => t.remove(), act ? 7000 : 2600); }

/* ---------- glossary popover ---------- */
function showGloss(btn) {
  $$('.pop').forEach(n => n.remove()); const g = B.gloss[btn.dataset.g]; if (!g) return;
  const p = el('div', 'pop'); p.setAttribute('role', 'dialog');
  p.innerHTML = `<h5>${inl(g[0])}</h5><span class="tag ${g[2] === 'book' ? 'ed' : 'add'}">${g[2] === 'book' ? U.gloss_book : U.gloss_added}</span><div>${inl(g[1])}</div>`;
  document.body.append(p); const r = btn.getBoundingClientRect(); const pr = p.getBoundingClientRect();
  p.style.left = Math.max(8, Math.min(innerWidth - pr.width - 8, r.left + r.width / 2 - pr.width / 2)) + 'px';
  p.style.top = (r.bottom + pr.height + 12 < innerHeight ? r.bottom + 8 : Math.max(8, r.top - pr.height - 8)) + 'px';
  setTimeout(() => document.addEventListener('pointerdown', function h(e) { if (!p.contains(e.target)) { p.remove(); document.removeEventListener('pointerdown', h); } }), 0);
}

/* ---------- progress ---------- */
function mark(id, data) { const P = store.get('progress', {}); P[id] = Object.assign(P[id] || {}, data); store.set('progress', P); }
const prog = id => store.get('progress', {})[id] || {};

/* ---------- quizzes ---------- */
const qState = {};
function hydrateQuiz(card) {
  const id = card.dataset.quiz, Q = B.quizzes[id]; if (!Q) return;
  const st = qState[id] || (qState[id] = { i: 0, score: 0, answered: false });
  const pr = prog(id);
  const q = Q[st.i];
  card.innerHTML = `<h4><span class="tag gen">${U.added_q}</span><span class="prog ltr">${st.i + 1}/${Q.length}${pr.done ? ' · ✓ ' + U.done : ''}</span></h4><div class="q">${inl(q.q)}</div><div class="opts">${q.o.map((o, j) => `<button type="button" class="opt" data-j="${j}">${inl(o)}</button>`).join('')}</div><div class="fbw"></div><div class="row"></div>`;
  const row = $('.row', card);
  $$('.opt', card).forEach(b => b.onclick = () => {
    if (st.answered) return; st.answered = true; const j = +b.dataset.j, ok = j === q.a; if (ok) st.score++;
    $$('.opt', card).forEach(x => { x.setAttribute('aria-disabled', 'true'); if (+x.dataset.j === q.a) x.classList.add('ok'); });
    if (!ok) b.classList.add('bad');
    $('.fbw', card).innerHTML = `<div class="fb ${ok ? 'ok' : 'bad'}"><b>${ok ? U.correct : U.wrong}.</b> ${inl(q.e)} ${srcTag(q.p)}</div>`;
    const last = st.i === Q.length - 1;
    const nx = el('button', 'mini prim', last ? U.retry : U.next_q); nx.type = 'button';
    if (last) { mark(id, { done: true, score: st.score, total: Q.length }); row.append(el('span', 'prog', `${U.score}: <bdi class="n">${st.score}/${Q.length}</bdi>`)); }
    nx.onclick = () => { if (last) { qState[id] = { i: 0, score: 0, answered: false }; } else { st.i++; st.answered = false; } hydrateQuiz(card); };
    row.prepend(nx);
  });
}

/* ---------- activities ---------- */
const shuffle = a => { const r = a.slice(); for (let i = r.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [r[i], r[j]] = [r[j], r[i]]; } return r; };
const aState = {};
function hydrateAct(card) {
  const id = card.dataset.act, A = B.acts[id]; if (!A) return;
  const head = `<h4><span class="tag gen">${U.added_q}</span><b>${inl(A.title)}</b><span class="prog">${prog(id).done ? '✓ ' + U.done : ''}</span></h4><div class="muted" style="color:var(--muted)">${inl(A.intro)} ${srcTag(A.p)}</div>`;
  if (A.type === 'sort') {
    const st = aState[id] || (aState[id] = { order: shuffle(A.items.map((_, i) => i)), placed: {}, sel: null });
    const left = st.order.filter(i => st.placed[i] == null);
    card.innerHTML = head + `<div class="muted" style="color:var(--muted)">${U.sort_hint}</div><div class="chips">${left.map(i => `<button type="button" class="chip${st.sel === i ? ' sel' : ''}" data-i="${i}">${inl(A.items[i][0])}</button>`).join('')}</div><div class="bins">${A.bins.map((b, bi) => `<div class="bin" data-b="${bi}" role="button" tabindex="0"><b>${inl(b)}</b>${Object.keys(st.placed).filter(i => st.placed[i] === bi).map(i => `<span class="chip ${A.items[i][1] === bi ? 'ok' : 'bad'}">${inl(A.items[i][0])} <bdi class="n">${A.items[i][2]}</bdi></span>`).join('')}</div>`).join('')}</div><div class="row"><button type="button" class="mini" data-r>${U.reset}</button><span class="prog ltr">${Object.keys(st.placed).filter(i => A.items[i][1] === st.placed[i]).length}/${A.items.length}</span></div>`;
    $$('.chip[data-i]', card).forEach(c => c.onclick = () => { st.sel = +c.dataset.i; hydrateAct(card); });
    $$('.bin', card).forEach(b => b.onclick = b.onkeydown = e => { if (e.type === 'keydown' && e.key !== 'Enter') return; if (st.sel == null) return; st.placed[st.sel] = +b.dataset.b; st.sel = null; if (Object.keys(st.placed).length === A.items.length) { const ok = Object.keys(st.placed).filter(i => A.items[i][1] === st.placed[i]).length; mark(id, { done: true, score: ok, total: A.items.length }); } hydrateAct(card); });
    $('[data-r]', card).onclick = () => { delete aState[id]; hydrateAct(card); };
  }
  if (A.type === 'order') {
    const st = aState[id] || (aState[id] = { pool: shuffle(A.items.map((_, i) => i)), seq: [] });
    const checked = st.seq.length === A.items.length;
    card.innerHTML = head + `<div class="muted" style="color:var(--muted)">${U.order_hint}</div><ol class="ordl">${st.seq.map((i, n) => `<li><i>${n + 1}</i><span class="chip ${checked ? (i === n ? 'ok' : 'bad') : ''}">${inl(A.items[i])}</span></li>`).join('')}</ol><div class="chips">${st.pool.filter(i => !st.seq.includes(i)).map(i => `<button type="button" class="chip" data-i="${i}">${inl(A.items[i])}</button>`).join('')}</div><div class="row"><button type="button" class="mini" data-u ${st.seq.length ? '' : 'aria-disabled="true"'}>${U.undo}</button><button type="button" class="mini" data-r>${U.reset}</button>${checked ? `<span class="fb ${st.seq.every((i, n) => i === n) ? 'ok' : 'bad'}">${st.seq.every((i, n) => i === n) ? U.correct : U.wrong + ' — ' + A.items.map((x, n) => (n + 1) + '. ' + plain(x)).join(' → ')}</span>` : ''}</div>`;
    $$('.chip[data-i]', card).forEach(c => c.onclick = () => { st.seq.push(+c.dataset.i); if (st.seq.length === A.items.length) mark(id, { done: true, score: st.seq.every((i, n) => i === n) ? 1 : 0, total: 1 }); hydrateAct(card); });
    $('[data-u]', card).onclick = () => { st.seq.pop(); hydrateAct(card); };
    $('[data-r]', card).onclick = () => { delete aState[id]; hydrateAct(card); };
  }
  if (A.type === 'calc') {
    const st = aState[id] || (aState[id] = { v: A.sample.slice() });
    card.innerHTML = head + `<div class="calc">${A.fields.map((f, i) => `<label for="${id}-${i}">${inl(f)}</label><input id="${id}-${i}" type="number" min="0" step="any" value="${st.v[i]}">`).join('')}${A.out.map((o, i) => `<span>${inl(o)}</span><output id="${id}-o${i}"></output>`).join('')}</div>`;
    const calc = () => { $$('input', card).forEach((x, i) => st.v[i] = parseFloat(x.value)); const [inj, lost, hrs] = st.v; const f = x => isFinite(x) ? x.toLocaleString(B.lang === 'en' ? 'en' : 'en', { maximumFractionDigits: 2 }) : '—';
      $(`#${id}-o0`, card).textContent = hrs > 0 ? f(inj * 100000 / hrs) : '—'; $(`#${id}-o1`, card).textContent = hrs > 0 ? f(lost * 100000 / hrs) : '—'; if (hrs > 0) mark(id, { done: true }); };
    $$('input', card).forEach(x => x.oninput = calc); calc();
  }
}

function hydrate(root) {
  $$('[data-quiz]', root).forEach(hydrateQuiz);
  $$('[data-act]', root).forEach(hydrateAct);
  $$('[data-ck]', root).forEach(c => { const T = store.get('ck', {}); c.checked = !!T[c.dataset.ck]; c.onchange = () => { const T2 = store.get('ck', {}); if (c.checked) T2[c.dataset.ck] = 1; else delete T2[c.dataset.ck]; store.set('ck', T2); }; });
  $$('.gl', root).forEach(b => b.onclick = e => { e.stopPropagation(); showGloss(b); });
  $$('[data-goch]', root).forEach(a => a.onclick = e => { e.preventDefault(); const n = +a.dataset.goch; goPage(pages.findIndex(p => p.chap.num === n)); });
  $$('.mstage', root).forEach(m => window.Models ? Models.prepare(m) : (m.innerHTML = `<div class="load"><span class="msg">${U.webgl_off}</span></div>`));
}

/* ---------- toolbar ---------- */
function initUI() {
  document.title = B.title + ' — ' + B.name;
  $('#btitle').textContent = B.title; $('#bsub').textContent = B.edition;
  $$('[data-t]').forEach(n => { const k2 = n.dataset.t; const lbl = n.querySelector('.lbl'); (lbl || n).textContent = U[k2]; n.title = U[k2]; n.setAttribute('aria-label', U[k2]); });
  $('#goin').placeholder = U.goto_ph;
  const langs = $('.langs'); LANGS.forEach(l => { const a = el('a', '', l[1]); a.lang = l[0]; a.dataset.base = l[0] + '.html'; a.href = l[0] + '.html'; a.title = l[2]; if (l[0] === B.lang) a.setAttribute('aria-current', 'true'); langs.append(a); });
  const ckb = $('#ckb'); if (ckb) { ckb.onclick = () => { if (!document.body.classList.contains('ck-on')) setCk(true); ckPanel(); }; setCk(!!store.get('ckmode', false)); }
  const ckl = $('#ckl'); if (ckl) ckl.onclick = ckPanel;
  $('#prev').onclick = () => flip(-1); $('#next').onclick = () => flip(1);
  $('#tocb').onclick = tocPanel; $('#srch').onclick = searchPanel; $('#bml').onclick = bmPanel; $('#progb').onclick = progPanel; $('#bmbtn').onclick = toggleBm;
  $('#zi').onclick = () => setZoom(zoom + 0.35); $('#zo').onclick = () => setZoom(zoom - 0.35);
  const fsb = $('#fs');
  if (!document.fullscreenEnabled && !document.webkitFullscreenEnabled) fsb.hidden = true;
  fsb.onclick = () => { const d = document; if (d.fullscreenElement || d.webkitFullscreenElement) { (d.exitFullscreen || d.webkitExitFullscreen).call(d); return; } const r = document.documentElement; const p = (r.requestFullscreen || r.webkitRequestFullscreen).call(r); if (p && p.catch) p.catch(() => toast(U.fs_fail)); };
  document.addEventListener('fullscreenchange', () => { const on = !!document.fullscreenElement; fsb.setAttribute('aria-pressed', on); $('.lbl', fsb).textContent = on ? U.exit_fullscreen : U.fullscreen; });
  $('#gof').onsubmit = e => { e.preventDefault(); const n = parseInt($('#goin').value, 10); if (!n) return;
    let p = pages.findIndex(x => x.srcList.includes(n)); if (p < 0) p = pages.findIndex(x => x.srcList.length && x.srcList[0] > n);
    if (p < 0 || n > Math.max(...pages.flatMap(x => x.srcList))) { toast(U.no_results); return; } goPage(p); $('#goin').value = ''; };
  document.addEventListener('keydown', e => {
    if (e.target.closest('input,textarea,.drawer')) { if (e.key === 'Escape') closeDrawer(); return; }
    const nx = RTL ? 'ArrowLeft' : 'ArrowRight', pv = RTL ? 'ArrowRight' : 'ArrowLeft';
    if (e.key === nx || e.key === 'PageDown') { flip(1); e.preventDefault(); } else if (e.key === pv || e.key === 'PageUp') { flip(-1); e.preventDefault(); } else if (e.key === 'Escape') closeDrawer();
  });
  let rt; new ResizeObserver(() => { clearTimeout(rt); rt = setTimeout(() => { if (wantMode() !== mode) build(); else fit(); }, 120); }).observe(desk);
}

/* ---------- start ---------- */
async function start() {
  if (document.readyState === 'loading') await new Promise(r => document.addEventListener('DOMContentLoaded', r));
  initUI();
  try { const fam = ['Source Sans 3', 'Barlow Condensed'].concat(B.lang === 'ar' ? ['Noto Naskh Arabic'] : B.lang === 'ur' ? ['Noto Nastaliq Urdu'] : []);
    const want = [...document.fonts].filter(f => fam.includes(f.family.replace(/["']/g, '')));
    await Promise.race([Promise.all(want.map(f => f.load().catch(() => {}))), new Promise(r => setTimeout(r, 4000))]); await document.fonts.ready; } catch (e) {}
  mode = wantMode(); build();
  const h = location.hash.slice(1); const saved = store.get('pos', null);
  if (h && pageOf(h) >= 0) { k = kForPage(pageOf(h)); layout(true); }
  else if (saved && pageOf(saved) >= 0) { k = kForPage(pageOf(saved)); layout(true); toast(U.resumed, U.start_over, () => { k = 0; layout(true); }); }
  window.addEventListener('hashchange', () => { const a = location.hash.slice(1); if (a) goAnchor(a); });
  document.documentElement.classList.add('ready');
}
window.Book = { U, B, mark, prog, toast, inl, esc, srcTag, get mode() { return mode; }, };
start();
})();
