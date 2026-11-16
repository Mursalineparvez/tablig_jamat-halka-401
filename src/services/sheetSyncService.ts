import {
  KargoojariEntry,
  MosqueRecord,
  TakazaEntry,
} from '../types/directory';

const SHEET_URL_STORAGE_KEY = 'jatrabari_sheet_sync_url_v1';
const LOCAL_PIN_HASH_KEY = 'jatrabari_local_admin_pin_hash_v1';
const SESSION_PIN_KEY = 'jatrabari_editor_session_pin_v1';

export const GOOGLE_APPS_SCRIPT_CODE = `// যাত্রাবাড়ী মারকাজ — ৪০১ নং হালকা (Google Sheet লাইভ সিঙ্ক ও পিন লগইন)
// ১. একটি নতুন Google Sheet খুলুন -> Extensions -> Apps Script-এ যান
// ২. এই সম্পূর্ণ কোডটি পেস্ট করে Save করুন
// ৩. Deploy -> New deployment -> Web app সিলেক্ট করুন
//    Execute as: Me | Who has access: Anyone -> Deploy করুন
// ৪. পাওয়া Web app URL-টি অ্যাপের সেটিংসে পেস্ট করুন (ডিফল্ট পিন: 401401 — যা Sheet-এর config ট্যাব থেকে যেকোনো সময় বদলাতে পারবেন)

const DEFAULT_PIN = '401401';

function getOrCreateSheet(ss, name, headers) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  }
  return sheet;
}

function ensureConfigPin(ss) {
  const sheet = getOrCreateSheet(ss, 'config', ['key', 'value']);
  sheet.getRange('A:B').setNumberFormat('@');
  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]).trim() === 'admin_pin') {
      const pin = String(values[i][1] || '').trim();
      return pin || DEFAULT_PIN;
    }
  }
  sheet.appendRow(['admin_pin', DEFAULT_PIN]);
  sheet.getRange(sheet.getLastRow(), 2).setNumberFormat('@');
  return DEFAULT_PIN;
}

function setConfigPin(ss, newPin) {
  const sheet = getOrCreateSheet(ss, 'config', ['key', 'value']);
  sheet.getRange('A:B').setNumberFormat('@');
  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]).trim() === 'admin_pin') {
      const cell = sheet.getRange(i + 1, 2);
      cell.setNumberFormat('@');
      cell.setValue(String(newPin).trim());
      return;
    }
  }
  sheet.appendRow(['admin_pin', String(newPin).trim()]);
  sheet.getRange(sheet.getLastRow(), 2).setNumberFormat('@');
}

function readRecords(ss, sheetName) {
  const sheet = getOrCreateSheet(ss, sheetName, ['id', 'label', 'json', 'updatedAt']);
  const values = sheet.getDataRange().getValues();
  const list = [];
  for (let i = 1; i < values.length; i++) {
    const raw = values[i][2];
    if (!raw) continue;
    try {
      list.push(JSON.parse(String(raw)));
    } catch (err) {
      // skip malformed row
    }
  }
  return list;
}

function upsertRecord(ss, sheetName, id, label, record) {
  const sheet = getOrCreateSheet(ss, sheetName, ['id', 'label', 'json', 'updatedAt']);
  const strId = String(id);
  const payload = JSON.stringify(record);
  const now = new Date().toISOString();
  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]) === strId) {
      sheet.getRange(i + 1, 1, 1, 4).setValues([[strId, String(label || ''), payload, now]]);
      return;
    }
  }
  sheet.appendRow([strId, String(label || ''), payload, now]);
}

function deleteRecord(ss, sheetName, id) {
  const sheet = getOrCreateSheet(ss, sheetName, ['id', 'label', 'json', 'updatedAt']);
  const strId = String(id);
  const values = sheet.getDataRange().getValues();
  for (let i = values.length - 1; i >= 1; i--) {
    if (String(values[i][0]) === strId) {
      sheet.deleteRow(i + 1);
    }
  }
}

function replaceAllRecords(ss, sheetName, items, getId, getLabel) {
  const sheet = getOrCreateSheet(ss, sheetName, ['id', 'label', 'json', 'updatedAt']);
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.deleteRows(2, lastRow - 1);
  }
  if (!items || !items.length) return;
  const now = new Date().toISOString();
  const rows = items.map(function (item) {
    return [String(getId(item)), String(getLabel(item) || ''), JSON.stringify(item), now];
  });
  sheet.getRange(2, 1, rows.length, 4).setValues(rows);
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}

function doGet(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureConfigPin(ss);
  const mosques = readRecords(ss, 'mosques').sort(function (a, b) {
    return (a.id || 0) - (b.id || 0);
  });
  const takazas = readRecords(ss, 'takazas').sort(function (a, b) {
    return String(b.createdAt || '').localeCompare(String(a.createdAt || ''));
  });
  const kargoojaris = readRecords(ss, 'kargoojaris').sort(function (a, b) {
    if (b.date !== a.date) return String(b.date || '').localeCompare(String(a.date || ''));
    return String(b.createdAt || '').localeCompare(String(a.createdAt || ''));
  });
  return jsonResponse({
    ok: true,
    mosques: mosques,
    takazas: takazas,
    kargoojaris: kargoojaris,
    serverTime: new Date().toISOString(),
  });
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const expectedPin = ensureConfigPin(ss);
    const incomingPin = String(body.pin || '').trim();

    if (!incomingPin || incomingPin !== expectedPin) {
      return jsonResponse({ ok: false, error: 'INVALID_PIN' });
    }

    const action = body.action;
    if (action === 'verify_pin') {
      return jsonResponse({ ok: true });
    }
    if (action === 'change_pin') {
      const nextPin = String(body.newPin || '').trim();
      if (nextPin.length < 4) {
        return jsonResponse({ ok: false, error: 'PIN_TOO_SHORT' });
      }
      setConfigPin(ss, nextPin);
      return jsonResponse({ ok: true });
    }
    if (action === 'save_all') {
      replaceAllRecords(
        ss,
        'mosques',
        body.mosques || [],
        function (m) { return m.id; },
        function (m) { return m.name; }
      );
      replaceAllRecords(
        ss,
        'takazas',
        body.takazas || [],
        function (t) { return t.id; },
        function (t) { return t.title; }
      );
      replaceAllRecords(
        ss,
        'kargoojaris',
        body.kargoojaris || [],
        function (k) { return k.id; },
        function (k) { return k.date; }
      );
      return jsonResponse({ ok: true });
    }
    if (action === 'upsert_mosque' && body.mosque) {
      upsertRecord(ss, 'mosques', body.mosque.id, body.mosque.name, body.mosque);
      return jsonResponse({ ok: true });
    }
    if (action === 'delete_mosque' && body.mosqueId !== undefined) {
      deleteRecord(ss, 'mosques', body.mosqueId);
      return jsonResponse({ ok: true });
    }
    if (action === 'upsert_takaza' && body.takaza) {
      upsertRecord(ss, 'takazas', body.takaza.id, body.takaza.title, body.takaza);
      return jsonResponse({ ok: true });
    }
    if (action === 'delete_takaza' && body.takazaId) {
      deleteRecord(ss, 'takazas', body.takazaId);
      return jsonResponse({ ok: true });
    }
    if (action === 'upsert_kargoojari' && body.entry) {
      upsertRecord(ss, 'kargoojaris', body.entry.id, body.entry.date, body.entry);
      return jsonResponse({ ok: true });
    }
    if (action === 'delete_kargoojari' && body.kargoojariId) {
      deleteRecord(ss, 'kargoojaris', body.kargoojariId);
      return jsonResponse({ ok: true });
    }
    return jsonResponse({ ok: false, error: 'UNKNOWN_ACTION' });
  } catch (err) {
    return jsonResponse({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}
`;

export function getEnvSheetSyncUrl(): string {
  return String(import.meta.env.VITE_SHEET_SYNC_URL ?? '').trim();
}

export function getSheetSyncUrl(): string {
  const envUrl = getEnvSheetSyncUrl();
  if (envUrl) return envUrl;
  try {
    return (localStorage.getItem(SHEET_URL_STORAGE_KEY) ?? '').trim();
  } catch {
    return '';
  }
}

export function saveSheetSyncUrl(url: string): void {
  const clean = url.trim();
  try {
    if (clean) {
      localStorage.setItem(SHEET_URL_STORAGE_KEY, clean);
    } else {
      localStorage.removeItem(SHEET_URL_STORAGE_KEY);
    }
  } catch {
    // Ignore storage errors
  }
}

export function getStoredSessionPin(): string {
  try {
    return (
      localStorage.getItem(SESSION_PIN_KEY) ??
      sessionStorage.getItem(SESSION_PIN_KEY) ??
      ''
    ).trim();
  } catch {
    return '';
  }
}

export function saveSessionPin(pin: string): void {
  const clean = pin.trim();
  try {
    if (clean) {
      localStorage.setItem(SESSION_PIN_KEY, clean);
      sessionStorage.setItem(SESSION_PIN_KEY, clean);
    } else {
      localStorage.removeItem(SESSION_PIN_KEY);
      sessionStorage.removeItem(SESSION_PIN_KEY);
    }
  } catch {
    // Ignore storage errors
  }
}

async function sha256Hex(text: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const data = new TextEncoder().encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }
  return String(hash);
}

export function hasLocalPin(): boolean {
  try {
    return Boolean(localStorage.getItem(LOCAL_PIN_HASH_KEY));
  } catch {
    return false;
  }
}

export async function setLocalPin(pin: string): Promise<void> {
  const clean = pin.trim();
  const hashed = await sha256Hex(`halqa401:${clean}`);
  try {
    localStorage.setItem(LOCAL_PIN_HASH_KEY, hashed);
  } catch {
    // Ignore storage errors
  }
}

export async function verifyLocalPin(pin: string): Promise<boolean> {
  const clean = pin.trim();
  try {
    const stored = localStorage.getItem(LOCAL_PIN_HASH_KEY);
    if (!stored) return false;
    const hashed = await sha256Hex(`halqa401:${clean}`);
    return stored === hashed;
  } catch {
    return false;
  }
}

export interface SheetSnapshotResponse {
  ok: boolean;
  mosques: MosqueRecord[];
  takazas: TakazaEntry[];
  kargoojaris: KargoojariEntry[];
  serverTime?: string;
}

export async function fetchAllFromSheet(
  url: string
): Promise<SheetSnapshotResponse> {
  const cleanUrl = url.trim();
  const sep = cleanUrl.includes('?') ? '&' : '?';
  const res = await fetch(`${cleanUrl}${sep}action=get_all&t=${Date.now()}`, {
    method: 'GET',
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  const data = (await res.json()) as Partial<SheetSnapshotResponse>;
  if (!data || data.ok !== true) {
    throw new Error('অবৈধ রেসপন্স পাওয়া গেছে।');
  }
  return {
    ok: true,
    mosques: Array.isArray(data.mosques) ? data.mosques : [],
    takazas: Array.isArray(data.takazas) ? data.takazas : [],
    kargoojaris: Array.isArray(data.kargoojaris) ? data.kargoojaris : [],
    serverTime: data.serverTime,
  };
}

async function postToSheet(
  url: string,
  payload: Record<string, unknown>
): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch(url.trim(), {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  const data = (await res.json()) as { ok?: boolean; error?: string };
  return {
    ok: Boolean(data?.ok),
    error: data?.error,
  };
}

export async function verifyPinWithSheet(
  url: string,
  pin: string
): Promise<{ ok: boolean; error?: string }> {
  return postToSheet(url, { action: 'verify_pin', pin: pin.trim() });
}

export async function changePinWithSheet(
  url: string,
  pin: string,
  newPin: string
): Promise<{ ok: boolean; error?: string }> {
  return postToSheet(url, {
    action: 'change_pin',
    pin: pin.trim(),
    newPin: newPin.trim(),
  });
}

export async function pushAllToSheet(
  url: string,
  pin: string,
  data: {
    mosques: MosqueRecord[];
    takazas: TakazaEntry[];
    kargoojaris: KargoojariEntry[];
  }
): Promise<{ ok: boolean; error?: string }> {
  return postToSheet(url, {
    action: 'save_all',
    pin: pin.trim(),
    mosques: data.mosques,
    takazas: data.takazas,
    kargoojaris: data.kargoojaris,
  });
}

export async function upsertMosqueToSheet(
  url: string,
  pin: string,
  mosque: MosqueRecord
): Promise<{ ok: boolean; error?: string }> {
  return postToSheet(url, { action: 'upsert_mosque', pin: pin.trim(), mosque });
}

export async function deleteMosqueFromSheet(
  url: string,
  pin: string,
  mosqueId: number
): Promise<{ ok: boolean; error?: string }> {
  return postToSheet(url, {
    action: 'delete_mosque',
    pin: pin.trim(),
    mosqueId,
  });
}

export async function upsertTakazaToSheet(
  url: string,
  pin: string,
  takaza: TakazaEntry
): Promise<{ ok: boolean; error?: string }> {
  return postToSheet(url, { action: 'upsert_takaza', pin: pin.trim(), takaza });
}

export async function deleteTakazaFromSheet(
  url: string,
  pin: string,
  takazaId: string
): Promise<{ ok: boolean; error?: string }> {
  return postToSheet(url, {
    action: 'delete_takaza',
    pin: pin.trim(),
    takazaId,
  });
}

export async function upsertKargoojariToSheet(
  url: string,
  pin: string,
  entry: KargoojariEntry
): Promise<{ ok: boolean; error?: string }> {
  return postToSheet(url, {
    action: 'upsert_kargoojari',
    pin: pin.trim(),
    entry,
  });
}

export async function deleteKargoojariFromSheet(
  url: string,
  pin: string,
  kargoojariId: string
): Promise<{ ok: boolean; error?: string }> {
  return postToSheet(url, {
    action: 'delete_kargoojari',
    pin: pin.trim(),
    kargoojariId,
  });
}
