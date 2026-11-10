/**
 * Optional "smart chat" for the Uptown evacuation plan.
 * Runs on YOUR Google account as an Apps Script web app, so the AI key never reaches the phone.
 * Setup: script.google.com → New project → paste this file → Project Settings → Script properties:
 *   ANTHROPIC_API_KEY = your Claude API key
 * Deploy → New deployment → Web app → Execute as: Me, Who has access: Anyone → copy the /exec URL
 * Put that URL in config.json: {"aiEndpoint":"https://script.google.com/macros/s/…/exec"}
 * The model only translates the user's words into ONE of the page's own commands; the page executes it
 * against the real plan data and reports what actually happened.
 */
const MODEL = 'claude-haiku-5-5';
function doPost(e) {
  try {
    const req = JSON.parse(e.postData.contents);
    const key = PropertiesService.getScriptProperties().getProperty('ANTHROPIC_API_KEY');
    if (!key) return out({ reply: 'Smart chat is not configured (missing API key).' });
    const sys = 'You turn requests about an evacuation plan into ONE command for the page. Towers: T3 (floors B3..P5, L01..L22), T4 (B3..P5, L01..L16); GF = ground floor. ' +
      'Commands (English, exactly this style): "overall" | "show T3" | "open T4 L05" | "I am at <place> on T3 L03" | "I am at stair 2 on T4 L10" | "exits on T3 L07" | "assembly" | "route". ' +
      'Use only floors and places from the context. If unclear, ask ONE short question in the user\'s language and give no command. ' +
      'Reply as JSON only: {"reply":"<short answer in the user\'s language>","action":{"command":"<command or empty>"}}. Never invent exits, routes or places.';
    const body = { model: MODEL, max_tokens: 300, system: sys,
      messages: [{ role: 'user', content: 'Context: ' + JSON.stringify(req.context || {}) + '\nUser: ' + String(req.message || '').slice(0, 500) }] };
    const res = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', { method: 'post', contentType: 'application/json',
      headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01' }, payload: JSON.stringify(body), muteHttpExceptions: true });
    const j = JSON.parse(res.getContentText());
    const text = (j.content && j.content[0] && j.content[0].text) || '';
    const m = text.match(/\{[\s\S]*\}/);
    return out(m ? JSON.parse(m[0]) : { reply: text });
  } catch (err) { return out({ reply: 'Smart chat error: ' + err }); }
}
function out(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
