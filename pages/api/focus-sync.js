/**
 * Focus List Sync API
 * 路径: /api/focus-sync
 * 前端直接 POST GET 到 https://api.jsonbin.io/v4/b/{BIN_ID}
 * 服务端只做简单代理转发（CORS 限制）
 */

// 固定 BIN ID：公共读取，限制写入
// 用户需要去 jsonbin.io 免费注册后创建自己的 bin，填入 BIN_ID
const BIN_ID = process.env.FOCUS_SYNC_BIN_ID || '';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-access-key, x-bin-private');

  if (req.method === 'OPTIONS') return res.status(204).end();

  // 前端直接访问 JSONBin，这里做 CORS 代理转发
  const jsonbinUrl = BIN_ID ? `https://api.jsonbin.io/v4/b/${BIN_ID}/latest` : null;

  try {
    if (req.method === 'GET') {
      if (!jsonbinUrl) {
        return res.status(200).json({ ok: true, tasks: [], customTags: [], lastModified: null, serverTime: Date.now() });
      }
      const apiKey = req.headers['x-access-key'] || '';
      const headers = { 'X-Access-Key': apiKey, 'Content-Type': 'application/json' };
      const remote = await fetch(jsonbinUrl, { headers });
      const data = await remote.json();
      return res.status(200).json({ ok: true, tasks: data.record?.tasks || data.tasks || [], customTags: data.record?.customTags || data.customTags || [], lastModified: data.record?.lastModified || null, serverTime: Date.now() });
    }

    if (req.method === 'POST') {
      if (!BIN_ID) {
        return res.status(200).json({ ok: true, serverTime: Date.now() });
      }
      const apiKey = req.headers['x-access-key'] || '';
      const body = req.body;
      const remote = await fetch(`https://api.jsonbin.io/v4/b/${BIN_ID}`, {
        method: 'PUT',
        headers: { 'X-Access-Key': apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      return res.status(remote.ok ? 200 : 502).json({ ok: remote.ok, serverTime: Date.now() });
    }

    if (req.method === 'DELETE') {
      if (!BIN_ID) return res.status(200).json({ ok: true });
      const apiKey = req.headers['x-access-key'] || '';
      await fetch(`https://api.jsonbin.io/v4/b/${BIN_ID}`, {
        method: 'PUT',
        headers: { 'X-Access-Key': apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks: [], customTags: [], lastModified: Date.now() }),
      });
      return res.status(200).json({ ok: true });
    }
  } catch(e) {
    return res.status(500).json({ ok: false, error: e.message });
  }

  return res.status(404).json({ ok: false, error: 'Not found' });
}
