/**
 * Focus List Sync API
 * 路径: /api/focus-sync
 * 支持 GET (拉取) / POST (推送) / DELETE (清除)
 * 数据按 API Key 隔离存储在 data/focus-sync.json 中
 */
import fs from 'fs';
import path from 'path';

const DATA_DIR = '/tmp/focus-sync-data';
const DATA_FILE = path.join(DATA_DIR, 'focus-sync.json');

// ── 确保数据目录存在 ──
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

// ── 加载数据 ──
function loadStore() {
  ensureDataDir();
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    }
  } catch(e) {}
  return {};
}

// ── 保存数据 ──
function saveStore(store) {
  ensureDataDir();
  fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2));
}

// ── 获取 Key ──
function getKey(req) {
  return req.headers['x-api-key'] || 'default';
}

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key, x-device-id');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const key = getKey(req);
  const store = loadStore();

  // ── GET /api/focus-sync ── 拉取任务
  if (req.method === 'GET') {
    const entry = store[key] || {};
    return res.status(200).json({
      ok: true,
      tasks: entry.tasks || [],
      customTags: entry.customTags || [],
      lastModified: entry.lastModified || null,
      serverTime: Date.now(),
    });
  }

  // ── POST /api/focus-sync ── 推送任务
  if (req.method === 'POST') {
    try {
      const { tasks, customTags, lastModified } = req.body;
      if (!Array.isArray(tasks)) {
        return res.status(400).json({ ok: false, error: 'tasks must be array' });
      }
      store[key] = {
        tasks,
        customTags: customTags || [],
        lastModified: lastModified || Date.now(),
      };
      saveStore(store);
      return res.status(200).json({ ok: true, serverTime: Date.now() });
    } catch(e) {
      return res.status(400).json({ ok: false, error: e.message });
    }
  }

  // ── DELETE /api/focus-sync ── 清除数据
  if (req.method === 'DELETE') {
    delete store[key];
    saveStore(store);
    return res.status(200).json({ ok: true });
  }

  return res.status(404).json({ ok: false, error: 'Not found' });
}
