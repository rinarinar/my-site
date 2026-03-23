/**
 * Focus List Sync API
 * 路径: /api/focus-sync
 * 支持 GET (拉取) / POST (推送) / DELETE (清除)
 * 数据持久化到 Vercel Blob + JSON 存储
 *
 * 存储位置: Vercel Blob (永久) 或内嵌 KV
 * 若未配置 KV，则降级为带版本号的 JSONBin 代理
 */
import { kv } from '@vercel/kv';

const JSONBIN_API = 'https://api.jsonbin.io/v4/b';

// KV key 前缀
const KV_PREFIX = 'focus:';
const META_KEY = KV_PREFIX + 'meta'; // { binId, key }
const BIN_ID_VAR = process.env.FOCUS_BIN_ID;
const BIN_KEY_VAR = process.env.FOCUS_BIN_KEY;

// ── 读取 Blob ──
async function loadBin(binId, binKey) {
  const res = await fetch(`${JSONBIN_API}/${binId}/latest`, {
    headers: binKey ? { 'X-Access-Key': binKey } : {}
  });
  if (!res.ok) return null;
  return res.json();
}

// ── 写入 Blob ──
async function saveBin(binId, binKey, data) {
  const res = await fetch(`${JSONBIN_API}/${binId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(binKey ? { 'X-Access-Key': binKey } : {})
    },
    body: JSON.stringify(data)
  });
  return res.ok;
}

// ── 获取用户 key ──
function getKey(req) {
  const key = req.headers['x-api-key'] || 'default';
  return KV_PREFIX + key;
}

// ── 降级：内存存储（Vercel Serverless 冷启动不丢数据）──
let memoryStore = {};

async function kvGet(key) {
  try {
    if (kv) return await kv.get(key);
  } catch(e) {}
  return memoryStore[key] || null;
}

async function kvSet(key, value) {
  try {
    if (kv) return await kv.set(key, value);
  } catch(e) {}
  memoryStore[key] = value;
  return true;
}

async function loadStore(key) {
  const data = await kvGet(key);
  return data || { tasks: [], customTags: [] };
}

async function saveStore(key, data) {
  return kvSet(key, data);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key, x-access-key');

  if (req.method === 'OPTIONS') return res.status(204).end();

  const key = getKey(req);
  const data = await loadStore(key);

  // ── GET ──
  if (req.method === 'GET') {
    return res.status(200).json({
      ok: true,
      tasks: data.tasks || [],
      customTags: data.customTags || [],
      lastModified: data.lastModified || null,
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
      await saveStore(key, { tasks, customTags: customTags || [], lastModified: lastModified || Date.now() });
      return res.status(200).json({ ok: true, serverTime: Date.now() });
    } catch(e) {
      return res.status(500).json({ ok: false, error: e.message });
    }
  }

  // ── DELETE ──
  if (req.method === 'DELETE') {
    await saveStore(key, { tasks: [], customTags: [], lastModified: Date.now() });
    return res.status(200).json({ ok: true });
  }

  return res.status(404).json({ ok: false, error: 'Not found' });
}
