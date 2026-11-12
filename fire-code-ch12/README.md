# UAE Fire & Life Safety Code — Chapter 12, Interactive 3D Book

Fire & Life Safety During Construction and Maintenance (code pages 940–972), English and Arabic.

## How to run (offline)
1. Unzip the folder anywhere.
2. Double-click `index.html` and choose **English** or **العربية**, or open `en.html` / `ar.html` directly.
3. Works in current Chrome, Edge, Safari and Firefox on desktop and phone. No internet, server, account or API key is needed; three.js and all fonts are bundled.

Optional, to open it on a phone on the same Wi-Fi: run `python3 -m http.server 8000` in this folder and open `http://<computer-ip>:8000/`.

## What is inside
- The full text of Chapter 12: intent, definitions 1.1–1.2, section 2, and sections 3.1–3.8 with Tables 12.1–12.8, Table 12.3.a and Figure 13.1. Requirement text is verbatim; every block shows its original code page (`p. 953`).
- Added explanations, “Did you know” / “Points to ponder” boxes, editor’s notes and practice questions are labelled separately from the code text.
- **Site checklist**: switch it on, tick each requirement your site meets (361 items), and copy a summary of met and open items per table into a report or message.
- **Eight 3D models**: fire triangle sorter (Table 12.2), site layout planner with pass/fail checks (Tables 12.3, 12.3.a, 12.7), hot work permit with pre-inspection and a 30-minute fire watch countdown (Table 12.4), storage yard (12.5), roofing operation (12.7 item 4), underground operations (12.7 item 7), riser system by building height (12.8 item 3) and Civil Defence access (12.8 items 1–2). Every model has an Enlarge button.
- 3D page turning by tap, drag, buttons or arrow keys; two pages on wide screens, one on phones; Arabic turns right-to-left.
- Search, contents, go to code page, zoom, full screen, bookmarks, last position saved, language switch that keeps your place.
- 36 practice questions with instant feedback plus two activities; progress is saved per part, with a reset.

## Editor’s notes (printed issues flagged, not corrected)
- Table 12.2 heading printed “IDENTIFICATION OF HZARDS”.
- Table 12.3.a gives values only at the listed wall lengths; the planner uses the next row up for lengths in between.
- Combustible storage outside: 6 m (Table 12.5 item 3.i) vs 9 m yard storage (Table 12.7 item 1.vi).
- Kettle attendant: within 30 m (Table 12.3 item 9.ii) vs within 7600 mm in sight (Table 12.7 item 4.1.vi); the model uses 7600 mm.
- The 11 m “35 Foot Rule” appears only in Table 12.7 item 4.5, as an exemption.
- The figure in Chapter 12 is numbered 13.1, and its riser label differs from the text of item 3.2.x.
- Table 12.8 item 3.3.ix refers to “Table 12.8.3.5.vii”, which does not exist.

## Limits
- The Arabic text is an unofficial translation. English is the language of the published code.
- The models are educational drawings, not approved engineering designs. Civil Defence approved drawings govern on site.
- Progress, checklist ticks, bookmarks and position are stored only in the browser where they were made.
- Copy to clipboard can be blocked in some embedded viewers; the summary is then selected so you can press Ctrl/Cmd + C.

## Files
- `index.html` language chooser · `en.html`, `ar.html` editions
- `content/en.js`, `content/ar.js` text, questions and model labels (identical structure)
- `assets/app.js` book engine · `assets/models.js` 3D models · `assets/app.css` styles
- `assets/img/` cover image and Figure 13.1 (cropped from the code page)
- `assets/fonts-*.css` embedded fonts (Source Sans 3, Barlow Condensed, Noto Naskh Arabic — SIL Open Font License, `assets/fonts/OFL.txt`) · `assets/lib/` three.js r128 (MIT)

---

# كود الإمارات للحماية من الحرائق — الفصل 12، كتاب 3D تفاعلي

السلامة من الحرائق أثناء الإنشاء والصيانة (صفحات الكود 940–972)، بالإنجليزية والعربية.

## طريقة التشغيل
1. فك ضغط المجلد في أي مكان.
2. افتح `index.html` واختر **English** أو **العربية**، أو افتح `en.html` / `ar.html` مباشرة.
3. يعمل على Chrome وEdge وSafari وFirefox الحديثة على الكمبيوتر والموبايل، بدون إنترنت أو سيرفر أو حساب.

## المحتوى
- النص الكامل للفصل 12 مع الجداول 12.1–12.8 والجدول 12.3.a والشكل 13.1، وكل فقرة عليها رقم صفحتها في الكود.
- الشرح الإضافي وأسئلة التدريب وملاحظات المحرر مميزة عن نص الكود.
- **قائمة فحص الموقع**: 361 متطلبًا تضع عليها علامة، ثم تنسخ ملخص المحقق والبنود المفتوحة لكل جدول.
- **8 مجسمات 3D** تفاعلية: مثلث الحريق، مخطِّط تنظيم الموقع، تصريح الأعمال الساخنة مع عداد مراقبة الحريق 30 دقيقة، ساحة التخزين، الأسطح، الأنفاق، الصاعد حسب ارتفاع المبنى، ووصول الدفاع المدني.
- بحث، محتويات، انتقال لصفحة الكود، إشارات مرجعية، حفظ آخر صفحة، وأسئلة بتصحيح فوري.

## ملاحظات
- الترجمة العربية غير رسمية؛ النص الإنجليزي هو لغة الكود المنشور.
- المجسمات رسوم تعليمية وليست تصميمات معتمدة؛ المخططات المعتمدة من الدفاع المدني هي المرجع في الموقع.
- التقدم والعلامات والإشارات محفوظة في المتصفح نفسه فقط.
