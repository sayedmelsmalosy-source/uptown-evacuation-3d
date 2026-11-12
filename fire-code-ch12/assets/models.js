/* Pop-up 3D models for the book. One shared WebGL renderer is moved into whichever model stage is visible. */
(function () {
'use strict';
const T = window.THREE, Bk = window.Book;
if (!T || !Bk) return;
const U = Bk.U, MD = Bk.B.models, inl = Bk.inl, esc = Bk.esc;
let renderer = null, glOK = true;
const MOB = matchMedia('(pointer:coarse)').matches || Math.min(screen.width, screen.height) < 820;
try { renderer = new T.WebGLRenderer({ antialias: !MOB, alpha: true, powerPreference: 'low-power' }); renderer.shadowMap.enabled = !MOB; renderer.shadowMap.type = T.PCFSoftShadowMap; } catch (e) { glOK = false; }
const $ = (s, r) => (r || document).querySelector(s), $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const C = { steel: 0x9aa3a8, steelD: 0x6f777c, timber: 0xb07a43, conc: 0xbdb8ad, concD: 0x8f8b82, sand: 0xd6c49a, hazard: 0xf2b705, black: 0x262626, red: 0xc8102e, green: 0x2e9e4f, white: 0xf4f4f0, blue: 0x1e2bb8, skin: 0xc99a72, hv: 0xff7a00, glass: 0x9fc3d6, brown: 0x7a5a3a, navy: 0x14206e, teal: 0x1b8a7a };
const mc = {};
function M(c, o) { const k = c + '|' + (o == null ? 1 : o); return mc[k] || (mc[k] = new T.MeshStandardMaterial({ color: c, roughness: .75, metalness: .05, transparent: o != null && o < 1, opacity: o == null ? 1 : o })); }
function add(g, m) { m.castShadow = true; m.receiveShadow = true; g.add(m); return m; }
function box(g, w, h, d, c, x, y, z, o) { const m = new T.Mesh(new T.BoxGeometry(w, h, d), M(c, o)); m.position.set(x, y, z); return add(g, m); }
function cyl(g, r, h, c, x, y, z, o, seg) { const m = new T.Mesh(new T.CylinderGeometry(r, r, h, seg || 18), M(c, o)); m.position.set(x, y, z); return add(g, m); }
const UP = new T.Vector3(0, 1, 0);
function rod(g, a, b, r, c) { const A = new T.Vector3(...a), B = new T.Vector3(...b); const m = new T.Mesh(new T.CylinderGeometry(r, r, A.distanceTo(B), 8), M(c)); m.position.copy(A).add(B).multiplyScalar(.5); m.quaternion.setFromUnitVectors(UP, B.clone().sub(A).normalize()); return add(g, m); }
function ground(g, w, d, c) { const m = new T.Mesh(new T.BoxGeometry(w, .1, d), M(c || C.sand)); m.position.y = -.05; m.receiveShadow = true; g.add(m); return m; }
function person(g, x, z, c, ry, helmet) { const p = new T.Group();
  const part = (geo, col, y) => { const m = new T.Mesh(geo, M(col)); m.position.y = y; add(p, m); };
  part(new T.CylinderGeometry(.2, .2, 1.05, 12), c || C.hv, 1); part(new T.BoxGeometry(.34, .5, .22), 0x3b4a5a, .25); part(new T.SphereGeometry(.13, 14, 10), C.skin, 1.68); part(new T.SphereGeometry(.15, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), helmet || C.white, 1.74);
  p.position.set(x, 0, z); p.rotation.y = ry || 0; g.add(p); return p; }
function textSprite(txt, bg, fg, w) { const cv = document.createElement('canvas'); const s = 4; cv.width = 256 * s; cv.height = 96 * s; const c = cv.getContext('2d'); c.scale(s, s); c.fillStyle = bg || '#14206e'; const r = 18; c.beginPath(); c.moveTo(r, 0); c.arcTo(256, 0, 256, 96, r); c.arcTo(256, 96, 0, 96, r); c.arcTo(0, 96, 0, 0, r); c.arcTo(0, 0, 256, 0, r); c.fill(); c.fillStyle = fg || '#fff'; c.font = '700 54px "Barlow Condensed","Arial Narrow",sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(txt, 128, 50); const tx = new T.CanvasTexture(cv); const sp = new T.Sprite(new T.SpriteMaterial({ map: tx, depthTest: false })); sp.scale.set(w || 1.6, (w || 1.6) * 96 / 256, 1); sp.renderOrder = 20; return sp; }
function crane(g, x, z, h) { const m = new T.Group(); for (let y = 0; y < h; y += 1.5) { [[-.4, -.4], [.4, -.4], [.4, .4], [-.4, .4]].forEach(([a, b]) => rod(m, [a, y, b], [a, y + 1.5, b], .05, C.hazard)); rod(m, [-.4, y, -.4], [.4, y + 1.5, -.4], .03, C.hazard); rod(m, [.4, y, .4], [-.4, y + 1.5, .4], .03, C.hazard); }
  box(m, 14, .5, .6, C.hazard, 3, h + .3, 0); box(m, 2, 1.2, 1, C.concD, -3.2, h - .3, 0); box(m, 1.2, 1, 1.2, C.white, 0, h + 1, 0); rod(m, [8, h, 0], [8, h - 6, 0], .02, C.black); box(m, .4, .4, .3, C.black, 8, h - 6.2, 0); box(m, 1.2, .2, 1.2, C.concD, 0, .1, 0); m.position.set(x, 0, z); g.add(m); return m; }
function slab(g, w, d, y, x, z) { box(g, w, .3, d, C.conc, x, y, z); }
function frameBuilding(g, x, z, w, d, floors, fh) { for (let f = 0; f < floors; f++) { slab(g, w, d, (f + 1) * fh, x, z); for (let i = 0; i <= 2; i++) for (let j = 0; j <= 1; j++) box(g, .4, fh, .4, C.concD, x - w / 2 + .3 + i * (w - .6) / 2, f * fh + fh / 2, z - d / 2 + .3 + j * (d - .6)); } }
function cabin(g, x, z, w, c) { box(g, w || 3, 2.6, 2.4, c || 0xe8e4da, x, 1.4, z); box(g, (w || 3) + .2, .12, 2.6, C.steelD, x, 2.76, z); box(g, .9, 1.9, .04, C.steelD, x - (w || 3) / 2 + .8, 1.1, z + 1.21); }

/* ---------- extra helpers ---------- */
function lineMat(c) { return new T.LineBasicMaterial({ color: c || 0x8a1a16, depthTest: false, transparent: true }); }
function dim(g, a, b, txt, col, lift) {
  const A = new T.Vector3(...a), B2 = new T.Vector3(...b), m = lineMat(col);
  const l = new T.Line(new T.BufferGeometry().setFromPoints([A, B2]), m); l.renderOrder = 15; g.add(l);
  const d = B2.clone().sub(A).normalize(), p = new T.Vector3().crossVectors(d, Math.abs(d.y) > .9 ? new T.Vector3(1, 0, 0) : UP).normalize().multiplyScalar(.25);
  [A, B2].forEach(P => { const t = new T.Line(new T.BufferGeometry().setFromPoints([P.clone().add(p), P.clone().sub(p)]), m); t.renderOrder = 15; g.add(t); });
  const s = textSprite(txt, col ? '#' + col.toString(16).padStart(6, '0') : '#8a1a16', '#fff', 2); s.position.copy(A).add(B2).multiplyScalar(.5); s.position.y += lift == null ? .6 : lift; g.add(s);
  return { line: l, mat: m, sprite: s };
}
function ring(g, r, x, z, col, op) { const pts = []; for (let i = 0; i <= 96; i++) { const t = i / 96 * Math.PI * 2; pts.push(new T.Vector3(x + Math.cos(t) * r, .04, z + Math.sin(t) * r)); }
  const l = new T.Line(new T.BufferGeometry().setFromPoints(pts), lineMat(col)); l.renderOrder = 14; g.add(l);
  const disc = new T.Mesh(new T.RingGeometry(Math.max(.01, r - .08), r, 64), new T.MeshBasicMaterial({ color: col || 0x8a1a16, transparent: true, opacity: op == null ? .35 : op, depthWrite: false, side: T.DoubleSide })); disc.rotation.x = -Math.PI / 2; disc.position.set(x, .03, z); g.add(disc); return l; }
function ext(g, x, y, z, s) { s = s || 1; const e = new T.Group(); const b = new T.Mesh(new T.CylinderGeometry(.11 * s, .11 * s, .55 * s, 16), M(C.red)); b.position.y = .28 * s; add(e, b); const t = new T.Mesh(new T.CylinderGeometry(.03 * s, .05 * s, .1 * s, 10), M(C.black)); t.position.y = .6 * s; add(e, t); e.position.set(x, y, z); g.add(e); return e; }
function drum(g, x, z, c) { return cyl(g, .29, .88, c || 0x2f6fb0, x, .44, z); }
function gascyl(g, x, z, c, y) { const t = new T.Group(); const b = new T.Mesh(new T.CylinderGeometry(.12, .12, 1.3, 16), M(c || C.black)); b.position.y = .65; add(t, b); const cap = new T.Mesh(new T.SphereGeometry(.12, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), M(c || C.black)); cap.position.y = 1.3; add(t, cap); t.position.set(x, y || 0, z); g.add(t); return t; }
function tower(g, x, z, w, d, h, fh) { const grp = new T.Group(); const n = Math.max(1, Math.round(h / fh)); for (let f = 0; f < n; f++) { box(grp, w, .3, d, C.conc, x, (f + 1) * fh, z); [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([a, b]) => box(grp, .45, fh, .45, C.concD, x + a * (w / 2 - .3), f * fh + fh / 2, z + b * (d / 2 - .3))); } g.add(grp); return grp; }
function flame(g, x, y, z, s) { const f = new T.Mesh(new T.ConeGeometry(.12 * (s || 1), .4 * (s || 1), 12), new T.MeshBasicMaterial({ color: 0xff7a1a })); f.position.set(x, y, z); g.add(f); return f; }
function sparks(g, x, y, z) { const geo = new T.BufferGeometry(); const a = []; for (let i = 0; i < 140; i++) { const t = Math.random() * Math.PI * 2, r = Math.random() * .9; a.push(x + Math.cos(t) * r, y + Math.random() * .5, z + Math.sin(t) * r); } geo.setAttribute('position', new T.Float32BufferAttribute(a, 3)); const p = new T.Points(geo, new T.PointsMaterial({ color: 0xffb300, size: .07 })); g.add(p); return p; }

/* ---------- Chapter 12 scenes ---------- */
const DEF = {};
DEF['m-triangle'] = { cam: [14, 10, 16], tgt: [0, 2, 0], build(g, H) {
  ground(g, 40, 30, 0xcdbf9f);
  tower(g, -4, -5, 10, 6, 9.6, 3.2);
  for (let i = 0; i < 6; i++) box(g, .9, 9.4, .05, 0x8fa3ad, -8.2 + i * 1, 4.8, -1.95, .7); H('facade', [-6, 6, -1.6]);
  const p = person(g, 6, 4, C.hv, -1); const ember = new T.Mesh(new T.SphereGeometry(.05, 8, 6), new T.MeshBasicMaterial({ color: 0xff5a1a })); ember.position.set(5.75, 1.55, 4.15); g.add(ember); H('smoke', [6, 2.3, 4]);
  box(g, 1.4, .8, .7, C.steelD, 1, .4, 3); person(g, 1, 2.2, 0x3b4a5a, 0); sparks(g, 1, .9, 3); H('weld', [1, 1.6, 3.4]);
  gascyl(g, 2.4, 1.8, 0x1e7a46); gascyl(g, 2.75, 1.8, 0x1e7a46); H('o2', [2.6, 1.9, 1.8]);
  box(g, 1.2, 1.4, .4, 0x8a9399, -1, .7, 5); for (let i = 0; i < 6; i++) rod(g, [-1 + i * .08, 1, 5.2], [3 + i * .3, .05, 7 - i * .2], .03, i % 2 ? 0x111111 : 0xc8102e); H('cable', [-1, 1.8, 5.2]);
  cyl(g, .05, 3, C.steelD, 7, 1.5, -1); box(g, .7, .45, .25, 0x333333, 7, 3.1, -.85); for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) box(g, 1.1, .18, 1.1, C.timber, 7.6 + j * 1.2, .09 + i * .2, -1.8); H('lamp', [7, 3.6, -.8]);
  for (let i = 0; i < 4; i++) box(g, 1.2, .14, 1.2, C.timber, 10, .07 + i * .16, 3); box(g, 1.1, .9, 1.1, 0xc9a66b, 10, 1.1, 3); H('pallet', [10, 2, 3]);
  for (let i = 0; i < 8; i++) box(g, 2.6, .06, 1.2, i % 2 ? 0xd9d9d9 : 0xb8c2c8, 4, .03 + i * .07, -4); H('panels', [4, .9, -4]);
  [0, .65, 1.3].forEach(dx => drum(g, 10 + dx, -3.5, 0xb3261e)); H('fuel', [10.6, 1.4, -3.5]);
  const tri = new T.Group(); const v = [[0, 3, 0], [-2.6, -1.5, 0], [2.6, -1.5, 0]]; const cols = [0xff7a1a, 0x8a5a2b, 0x2f8fd8];
  for (let i = 0; i < 3; i++) { const a = v[i], b = v[(i + 1) % 3]; const r = rod(tri, a, b, .12, cols[i]); r.material = new T.MeshBasicMaterial({ color: cols[i] }); }
  tri.position.set(0, 9.5, 2); tri.scale.setScalar(.9); g.add(tri);
  const L = MD['m-triangle'].groups; [[L[0], '#ff7a1a', [0, 12.8, 2]], [L[1], '#8a5a2b', [-3.4, 7.6, 2]], [L[2], '#2f8fd8', [3.4, 7.6, 2]]].forEach(([t, c, pos]) => { const s = textSprite(t, c, '#fff', 2.4); s.position.set(...pos); g.add(s); });
}, ui: 'classify' };

DEF['m-layout'] = { cam: [6, 26, 30], tgt: [8, 0, 0], build(g, H, S) {
  ground(g, 70, 46, 0xd2c4a2);
  tower(g, -8, 0, 16, 18, 12.8, 3.2); // building face at x = 0
  S.cabin = new T.Group(); g.add(S.cabin); S.car = new T.Group(); g.add(S.car); S.yard = new T.Group(); g.add(S.yard); S.dims = new T.Group(); g.add(S.dims);
  // guard + fence + smoking area (fixed)
  for (let i = 0; i < 16; i++) rod(g, [-16 + i * 3.4, 0, 22], [-16 + i * 3.4, 2, 22], .05, C.steelD); box(g, 52, 1.8, .03, 0x9aa3a8, 9.5, 1, 22, .5);
  cabin(g, 30, 19.5, 2.2, 0xd8e3ee); person(g, 31.6, 20.6, 0x14206e, Math.PI); H('guard', [30, 3.4, 19.5]);
  box(g, 3, .05, 3, 0x7c8a6a, 34, .03, -14); cyl(g, .25, .6, 0xc8a24a, 34, .3, -14); H('smoke', [34, 1.4, -14]);
  H('cabin', [12, 3.8, -8]); H('car', [8, 2, 10]); H('yard', [12, 1.6, 14]);
}, ui: 'layout' };

DEF['m-hotwork'] = { cam: [7, 6.5, 9], tgt: [0, 1, 0], build(g, H, S) {
  ground(g, 30, 24, 0x8f8b82);
  box(g, 14, .3, 10, C.conc, 0, -.15, 0);
  box(g, .2, 3, 6, 0xd8d2c6, -3.2, 1.5, -1); // partition
  S.behind = []; for (let i = 0; i < 3; i++) S.behind.push(box(g, .9, .9, .9, C.timber, -4.2, .45 + (i === 2 ? .9 : 0), -2 + (i % 2) * 1.1));
  S.blanket = box(g, 1.2, 1.9, 2.4, 0x9b2d1f, -4.2, .95, -1.45, .8); S.blanket.visible = false;
  box(g, 1.6, .9, .8, C.steelD, 0, .45, 0); person(g, 0, -.9, 0x3b4a5a, 0); S.sparks = sparks(g, 0, .95, .1); S.sparks.visible = false;
  S.comb = new T.Group(); for (let i = 0; i < 3; i++) box(S.comb, 1, .5, 1, 0xc9a66b, 0, .25 + i * .5, 0); S.comb.position.set(2.2, 0, .6); g.add(S.comb);
  S.hole = box(g, 1.4, .02, 1.4, 0x111111, 1.4, .02, -2.4); S.cover = box(g, 1.6, .06, 1.6, 0x6f777c, 1.4, .05, -2.4); S.cover.visible = false;
  S.ext = ext(g, 1.8, 0, 1.6); S.ext.visible = false; S.watch = person(g, 2.6, 2.2, C.hv, Math.PI + .5); S.watch.visible = false;
  S.board = new T.Group(); box(S.board, .9, 1.1, .05, C.white, 0, 1.4, 0); cyl(S.board, .03, 1, C.steelD, 0, .5, 0); S.board.position.set(-1.8, 0, 2.6); g.add(S.board);
  S.tagNo = textSprite('NOT ISSUED', '#b3261e', '#fff', 1.6); S.tagNo.position.set(-1.8, 2.3, 2.6); g.add(S.tagNo); S.tagOk = textSprite('ISSUED', '#1e7a46', '#fff', 1.4); S.tagOk.position.set(-1.8, 2.3, 2.6); S.tagOk.visible = false; g.add(S.tagOk);
  H('tag', [-1.8, 1.4, 2.7]); H('comb', [2.2, 1.9, .6]); H('open', [1.4, .3, -2.4]); H('ext', [1.8, .9, 1.6]); H('watch', [2.6, 2.1, 2.2]);
}, ui: 'permit' };

DEF['m-storage'] = { cam: [22, 22, 26], tgt: [8, 0, 0], build(g, H) {
  ground(g, 64, 44, 0xd2c4a2);
  tower(g, -8, 0, 16, 16, 9.6, 3.2);
  dim(g, [0, .1, 9], [15, .1, 9], '15 m');
  for (let i = 0; i < 3; i++) drum(g, 4 + i * .65, 8, 0x2f6fb0); H('q', [4.6, 1.5, 8]);
  // flammable store + rings 3 m and 15 m around it
  box(g, 3, 2.6, 2.4, 0xdedad0, 20, 1.3, -4); box(g, 1, 2, .05, C.steelD, 20, 1, -2.78); ring(g, 3, 20, -4, 0x1e7a46, .3); ring(g, 15, 20, -4, 0x1e7a46, .18);
  ext(g, 20, 0, 5); H('ext', [20, 1.1, 5]); dim(g, [20, .1, -4], [20, .1, 5], '3–15 m', 0x1e7a46);
  const tk = new T.Mesh(new T.CylinderGeometry(.8, .8, 3, 24), M(C.white)); tk.rotation.z = Math.PI / 2; tk.position.set(30, 1.2, -8); add(g, tk); H('tank', [30, 2.4, -8]); dim(g, [0, .1, -8], [28.5, .1, -8], '≥ 15 m');
  // gas cage
  const cg = new T.Group(); for (let i = 0; i < 5; i++) gascyl(cg, -1 + i * .5, 0, i < 2 ? 0x1e7a46 : 0x8d1c1c); const mesh = new T.Mesh(new T.BoxGeometry(3, 2, 1.4, 10, 6, 4), new T.MeshStandardMaterial({ color: 0x8c959a, wireframe: true })); mesh.position.y = 1; cg.add(mesh); cg.position.set(26, 0, 10); g.add(cg); ring(g, 3, 26, 10, 0x8a1a16, .3); H('cage', [26, 2.4, 10]);
  // platform edge drop
  box(g, 6, 1.2, 4, C.conc, 8, .6, -16); gascyl(g, 6.2, -15, 0x8d1c1c, 1.2); dim(g, [10.8, 0, -14], [10.8, 1.2, -14], '0.61 m max', 0x8a1a16, .2); H('edge', [8, 2.6, -15]);
  // heater and LPG
  box(g, .6, .9, .6, 0x444444, 34, .45, 2); gascyl(g, 35.8, 2, 0x8d1c1c); dim(g, [34, .1, 3], [35.8, .1, 3], '1.8 m'); H('heater', [34.8, 2, 2]);
  for (let i = 0; i < 4; i++) box(g, 4, .2, 1.2, C.timber, 8, .1 + i * .22, 16); dim(g, [0, .1, 14.5], [6, .1, 14.5], '6 m'); H('mat', [8, 1.4, 16]);
}, ui: 'tour' };

DEF['m-roof'] = { cam: [20, 18, 22], tgt: [4, 4, 0], build(g, H) {
  ground(g, 50, 40, 0xd2c4a2);
  box(g, 14, 12, 12, 0xd7d0c2, -7, 6, 0); box(g, 14.4, .4, 12.4, 0x55524e, -7, 12.2, 0);
  box(g, .1, 2.2, 1.4, 0x4a6b3a, 0.02, 1.1, 4); const ex = textSprite('EXIT', '#1e7a46', '#fff', 1); ex.position.set(.3, 2.6, 4); g.add(ex); H('exit', [.3, 1.6, 4.6]);
  const k = new T.Group(); box(k, 1.6, 1, 1, 0x333333, 0, .7, 0); box(k, 1.7, .06, 1.1, 0x666666, 0, 1.23, 0); [[-.7, -.4], [.7, -.4], [-.7, .4], [.7, .4]].forEach(([a, b]) => cyl(k, .05, .4, 0x222222, a, .2, b)); k.position.set(6.1, 0, -1); g.add(k); H('kettle', [6.1, 2, -1]);
  dim(g, [0, .1, -3], [6.1, .1, -3], '6.1 m'); dim(g, [.3, .1, 4], [5.6, .1, 0], '≥ 3000 mm', 0x8a1a16, .3);
  ring(g, 7.6, 6.1, -1, 0x1e7a46, .18); person(g, 11, -4, C.hv, -2); H('att', [11, 2.2, -4]);
  ring(g, 1.5, 6.1, -1, 0x8a1a16, .4); ext(g, 9.8, 0, 2); H('ext1', [9.8, 1, 2]); dim(g, [6.1, .1, -1], [9.8, .1, 2], '1.5–7.6 m', 0x1e7a46, .3);
  const roofY = 12.4; person(g, -5, -2, 0x3b4a5a, .4).position.y = roofY; rod(g, [-4.6, roofY + .4, -1.5], [-4.1, roofY + .1, -1], .03, 0x333333); flame(g, -4, roofY + .05, -.9, .6); H('torch', [-4.6, roofY + 2.2, -2]);
  gascyl(g, -8.2, -2, 0x8d1c1c, roofY); dim(g, [-4.1, roofY + .1, -2.6], [-8.2, roofY + .1, -2.6], '≥ 3000 mm', 0x8a1a16, .4); H('fuel', [-8.2, roofY + 1.9, -2]);
  ext(g, -9, roofY, 2.5); H('ext2', [-9, roofY + 1, 2.5]); ring(g, 6.1, -4.1, -1, 0x1e7a46, .25).position.y = roofY;
}, ui: 'tour' };

DEF['m-tunnel'] = { cam: [30, 20, 34], tgt: [12, 0, -4], build(g, H) {
  ground(g, 120, 60, 0xb9a882);
  box(g, 10, 8, 4, C.concD, 0, 4, 0); const hole = box(g, 6, 5, 4.2, 0x1a1a1a, 0, 2.5, 0);
  const tube = new T.Mesh(new T.CylinderGeometry(3, 3, 90, 32, 1, true, 0, Math.PI), new T.MeshStandardMaterial({ color: 0x77736c, side: T.DoubleSide, roughness: .9 })); tube.rotation.z = Math.PI / 2; tube.rotation.y = Math.PI / 2; tube.position.set(0, 0, -47); g.add(tube);
  box(g, 1.2, .3, 88, 0x333333, 1.6, .4, -46); H('belt', [1.6, 1.4, -40]);
  for (let z = -10; z > -92; z -= 25) { ext(g, -2.2, 0, z); } H('ext', [-2.2, 1.2, -35]);
  for (let z = -6; z > -92; z -= 20) cyl(g, .12, 1.2, 0xc8102e, -2.6, .6, z); H('hose', [-2.6, 1.6, -26]);
  box(g, .4, .6, .2, 0xf2b705, 2.6, 1.6, -15); box(g, .4, .6, .2, 0xf2b705, 2.6, 1.6, -60); H('comms', [2.6, 2.4, -15]);
  cabin(g, 6, 7, 2.6, 0xdbe6f5); dim(g, [3, .1, 2.2], [6, .1, 6], '≤ 7600 mm', 0x1e7a46, .3); H('check', [6, 3.4, 7]);
  dim(g, [-6, .1, 2.2], [-6, .1, 32.2], '30 m — no Class I', 0x8a1a16); drum(g, -9, 36, 0xb3261e); H('noI', [-7, 1.4, 20]);
  for (let z = 0; z > -92; z -= 30) box(g, .2, .2, .2, 0x2e9e4f, 2.8, .2, z); H('ground', [2.8, .9, -30]);
  const lb = textSprite('91 m', '#8a1a16', '#fff', 1.6); lb.position.set(-2.2, 3.2, -22); g.add(lb);
}, ui: 'tour' };

DEF['m-riser'] = { cam: [26, 18, 30], tgt: [0, 10, 0], build(g, H, S) {
  ground(g, 60, 44, 0xd2c4a2);
  S.bld = new T.Group(); g.add(S.bld); S.riser = new T.Group(); g.add(S.riser);
  box(g, 7, 2.4, 4, 0x9fb7c4, 12, 1.2, 6, .55); box(g, 4, 2.6, 4, 0xd7d0c2, 17.5, 1.3, 6); cyl(g, .45, 1.2, C.red, 17, .9, 6.6); H('tank', [12, 3.2, 6]); H('pump', [17.5, 3.3, 6]);
  box(g, .5, .7, .3, C.red, 8.3, 1, 5.2); H('inlet', [8.3, 1.8, 5.2]);
  S.lbl = textSprite('', '#8a1a16', '#fff', 3); g.add(S.lbl);
  H('outlet', [3.8, 4.6, 2.5]); H('ext', [3.4, 4.1, 3.6]);
}, ui: 'riser' };

DEF['m-access'] = { cam: [10, 40, 46], tgt: [6, 0, 0], build(g, H) {
  ground(g, 110, 80, 0xd2c4a2);
  tower(g, -6, -4, 22, 16, 16, 3.2);
  box(g, 6.1, .06, 70, 0x4d4f52, 12, .03, 4); dim(g, [9, .2, 30], [15, .2, 30], '6.1 m'); H('road', [12, 1.4, 26]);
  box(g, 40, .06, 6.1, 0x4d4f52, -11, .03, 18.6); dim(g, [-27, .2, 15.6], [-27, .2, 21.6], '6.1 m', null, .4);
  cyl(g, 9, .06, 0x4d4f52, -31, .03, 18.6, null, 40); H('turn', [-31, 1.4, 18.6]); dim(g, [-31, .2, 25], [8.9, .2, 25], '> 45 m dead end → turnaround', 0x8a1a16, .4);
  dim(g, [12, .3, -12], [12, .3, -12 + 46 > 34 ? 34 : -12 + 46], '≤ 46 m reach', 0x1e7a46, 1);
  cabin(g, 22, 22, 3, 0xf3e3df); H('post', [22, 3.4, 22]);
  [[-17.6, 4], [5.6, -12]].forEach(([x, z]) => { for (let i = 0; i < 6; i++) box(g, 1.2, .2, 1.4, C.steelD, x, i * 1.5 + .2, z + i * .4); }); H('stairs', [5.6, 9, -10]);
  box(g, 6, .05, 6, 0x2e9e4f, 34, .03, -14, .6); const ap = textSprite('ASSEMBLY', '#1e7a46', '#fff', 2.4); ap.position.set(34, 2, -14); g.add(ap); H('ap', [34, 1, -14]);
  box(g, .8, 1.6, .6, C.red, 20, .8, 26); const ph = textSprite('997', '#b3261e', '#fff', 1.2); ph.position.set(20, 2.4, 26); g.add(ph); H('phone', [20, 1.2, 26.4]);
}, ui: 'tour' };

/* ---------- runtime ---------- */
let active = null, scale = 1;
const cache = {};
function prepare(stage) {
  const id = stage.dataset.model, m = MD[id]; if (!m) return;
  stage.innerHTML = `<div class="mt"><b>${inl(m.title)}</b><span class="src">${esc(m.src)}</span></div><div class="mtools"><button type="button" class="mini" data-big>${U.expand}</button></div><div class="labels"></div><div class="mbar"></div><div class="load"><button type="button" class="mini prim" data-go>${U.tap_model}</button></div>`;
  if (!glOK) { $('.load', stage).innerHTML = `<span class="msg">${U.webgl_off}</span>`; return; }
  $('[data-go]', stage).onclick = () => activate(stage);
  $('[data-big]', stage).onclick = () => enlarge(stage);
}
function refresh(faces) {
  if (!glOK) return;
  const st = faces.map(f => f.querySelector('.mstage')).filter(Boolean);
  if (active && !st.includes(active.stage) && !active.modal) deactivate();
  if (!active && st.length) setTimeout(() => { if (!active && st[0].isConnected) activate(st[0]); }, 650);
}
function setScale(s) { scale = s; if (active) size(); }
function deactivate() { if (!active) return; const a = active; active = null; a.stage.classList.remove('popped'); const l = $('.load', a.stage); if (l) l.hidden = false; if (renderer.domElement.parentNode) renderer.domElement.remove(); $$('.hs', a.stage).forEach(n => n.remove()); }
function getScene(id) {
  if (cache[id]) return cache[id];
  const d = DEF[id]; const scene = new T.Scene(); scene.add(new T.HemisphereLight(0xffffff, 0x8a7f6a, .8)); const sun = new T.DirectionalLight(0xffffff, .8); sun.position.set(14, 24, 12); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024); Object.assign(sun.shadow.camera, { left: -25, right: 25, top: 25, bottom: -25, near: 1, far: 70 }); scene.add(sun);
  const root = new T.Group(); scene.add(root); const hs = []; const S = { steps: {}, add(n, o) { (this.steps[n] = this.steps[n] || []).push(o); } };
  d.build(root, (key, pos) => hs.push({ key, pos: new T.Vector3(...pos) }), S);
  const camera = new T.PerspectiveCamera(40, 1, .1, 400); camera.position.set(...d.cam);
  return (cache[id] = { id, d, scene, root, hs, S, camera, tgt: new T.Vector3(...d.tgt) });
}
function activate(stage) {
  if (active && active.stage === stage) return; deactivate();
  const sc = getScene(stage.dataset.model);
  const ctl = new T.OrbitControls(sc.camera, renderer.domElement); ctl.enableDamping = true; ctl.maxPolarAngle = Math.PI * .49; ctl.target.copy(sc.tgt); ctl.minDistance = 3; ctl.maxDistance = 70; ctl.update();
  if (sc.ctl) sc.ctl.dispose(); sc.ctl = ctl;
  active = { stage, sc, ctl, t0: performance.now(), modal: !!stage.closest('.modal') };
  $('.load', stage).hidden = true; stage.insertBefore(renderer.domElement, stage.firstChild);
  stage.classList.add('popped');
  sc.root.scale.setScalar(.001); active.pop = 0;
  buildHotspots(); size(); setupUI();
  if (!loopOn) { loopOn = true; requestAnimationFrame(loop); }
}
function size() { if (!active) return; const s = active.stage; const w = s.clientWidth, h = s.clientHeight; if (!w || !h) return; renderer.setPixelRatio(Math.min(MOB ? 1.5 : 2.5, (window.devicePixelRatio || 1) * (active.modal ? 1 : Math.max(1, scale)))); renderer.setSize(w, h, false); renderer.domElement.style.width = w + 'px'; renderer.domElement.style.height = h + 'px'; active.sc.camera.aspect = w / h; active.sc.camera.updateProjectionMatrix(); }
let loopOn = false; const v = new T.Vector3();
function loop(t) {
  if (!active) { loopOn = false; return; }
  requestAnimationFrame(loop);
  const a = active, sc = a.sc;
  if (!a.stage.isConnected) { deactivate(); return; }
  if (a.pop < 1) { a.pop = Math.min(1, (t - a.t0) / 750); const e = a.pop, k = 1 + 2.2 * Math.pow(e - 1, 3) + 1.2 * Math.pow(e - 1, 2); sc.root.scale.setScalar(Math.max(.001, k)); }
  if (a.camTo) { const c = a.camTo; c.t = Math.min(1, c.t + .025); const e = c.t * c.t * (3 - 2 * c.t); sc.camera.position.lerpVectors(c.p0, c.p1, e); a.ctl.target.lerpVectors(c.t0, c.t1, e); if (c.t >= 1) a.camTo = null; }
  a.ctl.update(); if (a.tick) a.tick(t);
  renderer.render(sc.scene, sc.camera);
  const w = a.stage.clientWidth, h = a.stage.clientHeight;
  a.hsEls && a.hsEls.forEach(({ el, pos }) => { v.copy(pos).multiplyScalar(sc.root.scale.x); v.project(sc.camera); const vis = v.z < 1 && Math.abs(v.x) < 1.1 && Math.abs(v.y) < 1.1; el.style.display = vis ? '' : 'none'; el.style.transform = `translate(${(v.x * .5 + .5) * w - 12}px,${(-v.y * .5 + .5) * h - 12}px)`; });
}
function buildHotspots() {
  const a = active, lab = $('.labels', a.stage); lab.innerHTML = ''; const m = MD[a.sc.id];
  a.hsEls = a.sc.hs.map((h, i) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'hs'; b.style.position = 'absolute'; b.style.left = '0'; b.style.top = '0'; b.textContent = hsText(a.sc.id, h.key, i); const info = m.hot && m.hot[h.key]; b.title = info ? info[0] : ''; b.setAttribute('aria-label', b.title); b.onclick = e => { e.stopPropagation(); onHot(h.key, b); }; lab.appendChild(b); return { el: b, pos: h.pos, key: h.key }; });
}
function hsText(id, key, i) { if (id === 'm-inspect') return ({ tower: 12, mobile: 12, fork: 12, hoistm: 6, rig: 6, exc: 12, scaf: 6, comp: 12, op: 12 })[key]; return i + 1; }
function info(title, body, extra) { const a = active; $$('.info', a.stage).forEach(n => n.remove()); const d = document.createElement('div'); d.className = 'info'; d.innerHTML = `<button type="button" class="mini x">${U.close}</button><h5>${inl(title)}</h5><div>${inl(body)}</div>`; if (extra) d.appendChild(extra); $('.x', d).onclick = () => d.remove(); a.stage.appendChild(d); return d; }
function bar(html) { const b = $('.mbar', active.stage); b.innerHTML = html; return b; }
function onHot(key, btn) { const a = active; if (a.onHot) a.onHot(key, btn); else { const h = MD[a.sc.id].hot[key]; info(h[0], h[1]); } }
function done(id) { Bk.mark(id, { done: true }); }
function camTo(p, t) { const a = active; a.camTo = { t: 0, p0: a.sc.camera.position.clone(), p1: new T.Vector3(...p), t0: a.ctl.target.clone(), t1: new T.Vector3(...t) }; }

function setupUI() {
  const a = active, id = a.sc.id, m = MD[id], ui = a.sc.d.ui; a.onHot = null; a.tick = null;
  const hint = `<span class="msg">${U.rotate_hint}</span>`;
  if (ui === 'game') {
    const keys = a.sc.hs.map(h => h.key); let queue = null, found = new Set();
    a.onHot = (key, btn) => { if (!queue) { const h = m.hot[key]; info(h[0], h[1]); return; }
      const want = queue[0]; if (key === want) { found.add(key); btn.classList.add('found'); btn.classList.remove('hl'); queue.shift(); if (!queue.length) { bar(`<span class="msg">✓ ${U.game_done} (${found.size}/${keys.length})</span><button type="button" class="mini" data-s>${U.replay}</button>`).querySelector('[data-s]').onclick = startGame; done(id); queue = null; return; } prompt(); }
      else { const h = m.hot[key]; bar(`<span class="msg">✗ ${U.tap_wrong}: <b>${inl(h[0])}</b> — ${U.find} <b>${inl(m.hot[want][0])}</b></span>`); } };
    const prompt = () => bar(`<span class="msg">${U.find} <b>${inl(m.hot[queue[0]][0])}</b> <span class="ltr">(${found.size + 1}/${keys.length})</span></span>`);
    const startGame = () => { queue = keys.slice().sort(() => Math.random() - .5); found = new Set(); $$('.hs', a.stage).forEach(b => b.classList.remove('found')); $$('.info', a.stage).forEach(n => n.remove()); prompt(); };
    bar(hint + `<button type="button" class="mini prim" data-s>${U.start_game}</button>`).querySelector('[data-s]').onclick = startGame;
  }
  if (ui === 'steps') {
    const steps = m.steps, S = a.sc.S; let cur = 0, playing = false, tm = null;
    const show = n => { cur = n; Object.keys(S.steps).forEach(k => S.steps[k].forEach(o => o.visible = +k <= n + 1 && n >= 0)); const c = S.cams[Math.min(S.cams.length - 1, n + 1)]; camTo(c.slice(0, 3), c.slice(3)); render(); if (n === steps.length - 1) done(id); };
    const render = () => { const st = steps[cur]; const b = bar(`<button type="button" class="mini prim" data-p>${playing ? U.pause : U.play}</button><button type="button" class="mini" data-r>${U.replay}</button><div class="steps">${steps.map((s, i) => `<button type="button" class="${i === cur ? 'on' : ''}" data-i="${i}" aria-label="${U.step} ${i + 1}">${i + 1}</button>`).join('')}</div>`);
      $$('.info', a.stage).forEach(n => n.remove()); info(`${U.step} ${cur + 1}: ${st[0]}`, st[1]);
      b.querySelector('[data-p]').onclick = () => { playing = !playing; if (playing) { if (cur >= steps.length - 1) show(0); tick(); } else clearTimeout(tm); render(); };
      b.querySelector('[data-r]').onclick = () => { clearTimeout(tm); playing = true; show(0); tick(); };
      $$('[data-i]', b).forEach(x => x.onclick = () => { clearTimeout(tm); playing = false; show(+x.dataset.i); }); };
    const tick = () => { clearTimeout(tm); tm = setTimeout(() => { if (!playing || active !== a) return; if (cur < steps.length - 1) { show(cur + 1); tick(); } else { playing = false; render(); } }, 3200); };
    Object.values(S.steps).forEach(l => l.forEach(o => o.visible = false));
    show(0);
  }
  if (ui === 'classify') {
    const P = Bk.prog(id), ans = Object.assign({}, P.ans || {}); const keys = a.sc.hs.map(h => h.key);
    const status = () => bar(hint + `<span class="msg ltr">✓ ${Object.keys(ans).filter(k => ans[k]).length}/${keys.length}</span>`);
    a.hsEls.forEach(h => { if (ans[h.key]) h.el.classList.add('found'); });
    a.onHot = (key, btn) => { const h = m.hot[key]; const box2 = document.createElement('div'); box2.className = 'row'; box2.style.marginTop = '6px';
      m.groups.forEach((gname, gi) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'mini'; b.textContent = gname; b.onclick = () => { const ok = gi === h[2]; $$('button', box2).forEach(x => x.setAttribute('aria-disabled', 'true')); b.classList.add(ok ? 'prim' : ''); const fb = document.createElement('div'); fb.className = 'fb ' + (ok ? 'ok' : 'bad'); fb.innerHTML = `<b>${ok ? U.correct : U.wrong}.</b> ${inl(h[1])}`; d.appendChild(fb); if (ok) { ans[key] = true; btn.classList.add('found'); } Bk.mark(id, { ans, done: keys.every(k => ans[k]) }); status(); }; box2.appendChild(b); });
      const d = info(h[0], '', box2); };
    status();
  }
  if (ui === 'staff') {
    const S = a.sc.S; let modeI = 0, n = 600; const cols = [0x2e9e4f, 0x1e2bb8, 0xf4f4f0];
    const calc = (mi, x) => { // returns [inspector, officer, senior, note]
      if (mi === 0) { if (x < 50) return [1, 0, 0, U.partial]; if (x <= 150) return [1, 0, 0]; if (x <= 500) return [1, 1, 0]; if (x <= 1000) return [1, 1, 1]; if (x <= 1250) return [2, 1, 1]; if (x <= 1500) return [2, 2, 1]; return [2, 2, 2, x > 2000 ? m.over4 : null]; }
      if (x <= 150) return [0, 1, 0, m.part + ' · ' + m.any]; if (x <= 500) return [0, 1, 0]; if (x <= 1000) return [0, 0, 1]; return [0, 1, 1, x > 2000 ? m.over2 : null]; };
    const draw = () => { const r = calc(modeI, n); while (S.group.children.length) S.group.remove(S.group.children[0]); let x = -(r[0] + r[1] + r[2] - 1) * .7; [0, 1, 2].forEach(role => { for (let i = 0; i < r[role]; i++) { const p = person(S.group, x, 0, role === 2 ? 0x14206e : role === 1 ? 0x3b6fb0 : C.hv, 0, cols[role]); p.position.y = .2; p.scale.setScalar(1.25); x += 1.4; } });
      const out = `<div class="staffout">${m.roles.map((rn, i) => `<span><i style="background:#${cols[i].toString(16).padStart(6, '0')};border:1px solid #888"></i>${inl(rn)}: <b class="ltr">${r[i]}</b></span>`).join('')}</div>${r[3] ? `<span class="msg">${inl(r[3])}</span>` : ''}`;
      $('[data-o]', a.stage).innerHTML = out; $('output', a.stage).textContent = n > 2000 ? '2000+' : n; done(id); };
    const b = bar(`<div class="row">${m.modes.map((mm, i) => `<button type="button" class="mini ${i === modeI ? 'prim' : ''}" data-m="${i}">${inl(mm)}</button>`).join('')}</div><label class="slide"><span>${U.calc_workers}</span><input type="range" min="1" max="2600" step="1" value="${n}" aria-label="${U.calc_workers}"><output>${n}</output></label><div data-o style="width:100%;display:flex;flex-direction:column;gap:4px"></div>`);
    $('input', b).oninput = e => { n = +e.target.value; draw(); };
    $$('[data-m]', b).forEach(x => x.onclick = () => { modeI = +x.dataset.m; $$('[data-m]', b).forEach(y => y.classList.toggle('prim', y === x)); draw(); });
    draw();
  }
  if (ui === 'tour') {
    const seen = new Set((Bk.prog(id).seen) || []); const keys = a.sc.hs.map(h => h.key);
    a.hsEls.forEach(h => { if (seen.has(h.key)) h.el.classList.add('found'); });
    const st = () => bar(hint + `<span class="msg ltr">${seen.size}/${keys.length}</span>`);
    a.onHot = (key, btn) => { const h = m.hot[key]; info(h[0], h[1]); seen.add(key); btn.classList.add('found'); Bk.mark(id, { seen: [...seen], done: seen.size === keys.length }); st(); };
    st();
  }
  if (ui === 'neighbor') {
    const S = a.sc.S; let hgt = 1;
    const draw = () => { S.barrier.scale.y = Math.max(.01, hgt); S.barrier.position.y = S.wallTop + hgt / 2; const ok = hgt >= 2; $('[data-f]', a.stage).className = 'fb ' + (ok ? 'ok' : 'bad'); $('[data-f]', a.stage).innerHTML = (ok ? '✓ ' : '✗ ') + inl(ok ? m.ok : m.low); $('output', a.stage).textContent = hgt.toFixed(2) + ' m'; if (ok) done(id); };
    const b = bar(`<label class="slide"><span>${inl(m.slider)}</span><input type="range" min="0" max="3" step="0.25" value="${hgt}" aria-label="${esc(m.slider)}"><output></output></label><div data-f class="fb"></div>`);
    $('input', b).oninput = e => { hgt = +e.target.value; draw(); };
    draw();
  }

  if (ui === 'layout') {
    const S = a.sc.S; const rows = [[6, 9], [9, 11], [12, 12], [15, 14], [18, 15], [1e9, 18]]; const need = l => rows.find(r => l <= r[0])[1];
    let L = 12, D = 10, V = 4, Y = 7;
    const clear = grp => { while (grp.children.length) grp.remove(grp.children[0]); };
    const draw = () => { [S.cabin, S.car, S.yard, S.dims].forEach(clear);
      const n = Math.max(1, Math.round(L / 6)), cw = L / n; for (let i = 0; i < n; i++) { const z = -8 - L / 2 + cw * (i + .5); box(S.cabin, 2.6, 2.6, cw - .08, 0xe8e4da, D + 1.3, 1.4, z); box(S.cabin, 2.8, .12, cw, C.steelD, D + 1.3, 2.76, z); }
      const rq = need(L), okC = D >= rq, okV = V >= 6.1, okY = Y >= 9, G = 0x1e7a46, Rr = 0xb3261e;
      dim(S.dims, [0, .1, -8 - L / 2 - 1.2], [D, .1, -8 - L / 2 - 1.2], D + ' m', okC ? G : Rr); dim(S.dims, [D + 3.2, .1, -8 - L / 2], [D + 3.2, .1, -8 + L / 2], 'L = ' + L + ' m', 0x444444, .4);
      const car = new T.Group(); box(car, 4.2, 1.2, 1.9, 0xf4f4f0, 0, .9, 0); box(car, 2.2, .8, 1.8, 0x9fc3d6, -.3, 1.8, 0); car.position.set(V + 2.1, 0, 10); S.car.add(car); dim(S.dims, [0, .1, 8.4], [V, .1, 8.4], V + ' m', okV ? G : Rr);
      for (let i = 0; i < 4; i++) box(S.yard, 3.5, .22, 1.4, C.timber, Y + 1.75, .11 + i * .24, 14); dim(S.dims, [0, .1, 12.6], [Y, .1, 12.6], Y + ' m', okY ? G : Rr);
      const ln = (ok, t) => `<div class="fb ${ok ? 'ok' : 'bad'}">${ok ? '✓' : '✗'} ${t}</div>`;
      $('[data-o]', a.stage).innerHTML = ln(okC, `${inl(m.dist)}: <b class="ltr">${D} m</b> · ${m.need} <b class="ltr">${rq} m</b> (L ${L} m, T12.3.a)`) + ln(okV, `${inl(m.veh)}: <b class="ltr">${V} m</b> · ${m.need} <b class="ltr">6.1 m</b>`) + ln(okY, `${inl(m.yard)}: <b class="ltr">${Y} m</b> · ${m.need} <b class="ltr">9 m</b>`);
      if (okC && okV && okY) done(id); };
    const sl = (k, lab, min, max, st, v) => `<label class="slide"><span>${inl(lab)}</span><input data-k="${k}" type="range" min="${min}" max="${max}" step="${st}" value="${v}"><output class="ltr">${v} m</output></label>`;
    const b = bar(`<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:4px;width:100%">${sl('L', m.wall, 3, 24, 1, L)}${sl('D', m.dist, 2, 24, .5, D)}${sl('V', m.veh, 0, 12, .5, V)}${sl('Y', m.yard, 0, 16, .5, Y)}</div><div data-o style="display:flex;flex-direction:column;gap:3px;width:100%"></div>`);
    $$('input[data-k]', b).forEach(x => x.oninput = () => { const v = +x.value; ({ L: () => L = v, D: () => D = v, V: () => V = v, Y: () => Y = v })[x.dataset.k](); x.nextElementSibling.textContent = v + ' m'; draw(); });
    draw();
  }
  if (ui === 'permit') {
    const S = a.sc.S; const st = [false, false, false, false, false]; let phase = 0, tmr = null;
    const apply = () => { S.comb.position.x = st[0] ? 8 : 2.2; S.cover.visible = st[1]; S.blanket.visible = st[2]; S.ext.visible = st[3]; S.watch.visible = st[4]; S.tagOk.visible = phase >= 1; S.tagNo.visible = phase < 1; S.sparks.visible = phase === 1; };
    const render = msg => { const all = st.every(Boolean);
      const b = bar(`<div class="ckl2">${m.checks.map((c, i) => `<label><input type="checkbox" data-i="${i}" ${st[i] ? 'checked' : ''} ${phase ? 'disabled' : ''}> ${inl(c)}</label>`).join('')}</div><div style="display:flex;flex-direction:column;gap:5px">${phase === 0 ? `<button type="button" class="mini prim" data-a>${inl(m.issue)}</button>` : phase === 1 ? `<button type="button" class="mini prim" data-a>${inl(m.start)}</button>` : ''}${msg ? `<span class="fb ${/✓/.test(msg) ? 'ok' : 'bad'}">${msg}</span>` : ''}${phase === 2 ? `<span class="msg">${inl(m.watch)}: <span class="timer" data-t>30 ${m.mins}</span></span>` : ''}${phase === 0 && all ? '' : ''}</div>`);
      $$('input[data-i]', b).forEach(x => x.onchange = () => { st[+x.dataset.i] = x.checked; apply(); render(); });
      const btn = $('[data-a]', b); if (btn) btn.onclick = () => { if (phase === 0) { if (!st.every(Boolean)) { render('✗ ' + inl(m.blocked)); return; } phase = 1; apply(); render('✓ ' + inl(m.issued)); }
        else if (phase === 1) { phase = 2; apply(); render(); let left = 30; clearInterval(tmr); tmr = setInterval(() => { if (active !== a) { clearInterval(tmr); return; } left--; const t = $('[data-t]', a.stage); if (t) t.textContent = left + ' ' + m.mins; if (left <= 0) { clearInterval(tmr); phase = 3; apply(); render('✓ ' + inl(m.clear)); done(id); } }, 1000); } }; };
    apply(); render();
  }
  if (ui === 'riser') {
    const S = a.sc.S; let Hm = 8; const fh = 3.2;
    const draw = () => { while (S.bld.children.length) S.bld.remove(S.bld.children[0]); while (S.riser.children.length) S.riser.remove(S.riser.children[0]);
      const n = Math.max(1, Math.round(Hm / fh)); const top = n * fh; tower(S.bld, -2, 0, 10, 8, top, fh);
      const state = Hm < 10.7 ? 0 : Hm <= 23 ? 1 : 2; const col = state === 2 ? 0x6e1414 : 0xd8342c; const r = state === 2 ? .16 : .11;
      const rTop = Math.max(fh, top - fh + 1.2); const pipe = rod(S.riser, [3.4, .2, 2.5], [3.4, rTop, 2.5], r, col); if (state === 0) { pipe.material = M(col, .35); }
      rod(S.riser, [3.4, .3, 2.5], [8.3, .3, 5.2], r, col); rod(S.riser, [3.4, .3, 2.5], [15.5, .3, 6], r, col);
      for (let f = 0; f < n; f++) { const y = f * fh + 1.2; if (y <= rTop) box(S.riser, .4, .4, .3, col, 3.75, y, 2.5); ext(S.riser, 3.4, f * fh + (f ? .15 : 0), 3.6, .9); }
      S.lbl.position.set(3.4, top + 2.4, 2.5); const tag = state === 0 ? '≤ 10.7 m' : state === 1 ? 'TEMP · 500 gpm · 60 min' : 'PERMANENT'; S.lbl.material.map.dispose(); const sp = textSprite(tag, state === 2 ? '#6e1414' : '#d8342c', '#fff', 3.4); S.lbl.material = sp.material; S.lbl.scale.copy(sp.scale);
      $('[data-o]', a.stage).innerHTML = `<span class="fb ${state === 2 ? 'ok' : state === 1 ? 'ok' : 'bad'}">${inl([m.s0, m.s1, m.s2][state])}</span><span class="msg">${inl(m.tip)} · ${inl(m.illus)}</span>`;
      const dd = Math.max(15, top * 1.05); camTo([5 + dd * .75, top * .5 + dd * .45, 3 + dd * .85], [4, top * .42, 2]);
      $('output', a.stage).textContent = Hm.toFixed(1) + ' m'; if (state === 2) done(id); };
    const b = bar(`<label class="slide"><span>${inl(m.slider)}</span><input type="range" min="3" max="40" step="0.5" value="${Hm}"><output class="ltr"></output></label><div data-o style="display:flex;flex-direction:column;gap:3px;width:100%"></div>`);
    $('input', b).oninput = e => { Hm = +e.target.value; draw(); };
    draw();
  }
}
function enlarge(stage) {
  if (!glOK) return;
  const md = document.createElement('div'); md.className = 'modal'; const box2 = document.createElement('div'); box2.className = 'mbox'; const st = document.createElement('div'); st.className = 'mstage'; st.dataset.model = stage.dataset.model; box2.appendChild(st); md.appendChild(box2); document.body.appendChild(md);
  prepare(st); const bb = $('[data-big]', st); bb.textContent = U.shrink;
  const close = () => { deactivate(); md.remove(); if (stage.isConnected) activate(stage); document.removeEventListener('keydown', esc2); };
  const esc2 = e => { if (e.key === 'Escape') close(); };
  bb.onclick = close; md.onclick = e => { if (e.target === md) close(); }; document.addEventListener('keydown', esc2);
  activate(st); active.modal = true; size();
  new ResizeObserver(() => size()).observe(st);
}
window.addEventListener('resize', () => size());
window.Models = { prepare, refresh, setScale, get _active() { return active && active.sc.id; } };
})();
