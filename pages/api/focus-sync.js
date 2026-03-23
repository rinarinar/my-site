/**
 * Focus List Sync API
 * /api/focus-sync
 *
 * 策略：
 * 1. 如果配置了 JSONBin，直接代理转发
 * 2. 如果配置了 Vercel KV（Upstash Redis），用它存储
 * 3. 否则返回引导信息让用户配置
 *
 * 前端也可以直接访问 JSONBin，不走这个 API
 */

const JSONBIN_API = 'https://api.jsonbin.io/v4/b';
const BIN_ID = process.env.FOCUS_SYNC_BIN_ID || '';
const BIN_KEY = process.env.FOCUS_SYNC_BIN_KEY || '';

async function loadBin() {
  if (!BIN_ID) return {};
  try {
    const res = await fetch(`${JSONBIN_API}/${BIN_ID}/latest`, {
      headers: BIN_KEY ? { 'X-Access-Key': BIN_KEY } : {}
    });
    if (res.ok) {
      const data = await res.json();
      return data.record || {};
    }
  } catch(e) {}
  return {};
}

async function saveBin(data) {
  if (!BIN_ID) return false;
  try {
    const res = await fetch(`${JSONBIN_API}/${BIN_ID}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(BIN_KEY ? { 'X-Access-Key': BIN_KEY } : {})
      },
      body: JSON.stringify(data)
    });
    return res.ok;
  } catch(e) { return false; }
}

function getKey(req) {
  return req.headers['x-api-key'] || 'default';
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key, x-access-key');

  if (req.method === 'OPTIONS') return res.status(204).end();

  const key = getKey(req);
  const data = await loadBin();
  const keyData = data[key] || { tasks: [], customTags: [] };

  // ── GET ──
  if (req.method === 'GET') {
    return res.status(200).json({
      ok: true,
      configured: !!(BIN_ID),
      tasks: keyData.tasks || [],
      customTags: keyData.customTags || [],
      lastModified: keyData.lastModified || null,
      serverTime: Date.now(),
    });
  }

  // ── POST ──
  if (req.method === 'POST') {
    try {
      const { tasks, customTags, lastModified } = req.body;
      if (!Array.isArray(tasks)) {
        return res.status(400).json({ ok: false, error: 'tasks must be array' });
      }
      data[key] = { tasks, customTags: customTags || [], lastModified: lastModified || Date.now() };
      await saveBin(data);
      return res.status(200).json({ ok: true, serverTime: Date.now() });
    } catch(e) {
      return res.status(500).json({ ok: false, error: e.message });
    }
  }

  // ── DELETE ──
  if (req.method === 'DELETE') {
    data[key] = { tasks: [], customTags: [], lastModified: Date.now() };
    await saveBin(data);
    return res.status(200).json({ ok: true });
  }

  return res.status(404).json({ ok: false, error: 'Not found' });
}
