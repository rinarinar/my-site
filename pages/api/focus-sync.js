/**
 * Focus List Sync API — /api/focus-sync
 * GET  → 拉取任务
 * POST → 推送任务
 * DELETE → 清除
 *
 * 存储：/tmp/focus-sync.json（Vercel Serverless 可写目录）
 * 注意：/tmp 在冷启动后可能被清空，但对 To-Do 场景够用
 * 如需持久化，可换 Vercel Blob / PlanetScale 等
 */

import fs from 'fs';
import path from 'path';

const DATA_FILE = '/tmp/focus-sync.json';

function loadStore() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    }
  } catch (e) {}
  return {};
}

function saveStore(store) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(store));
  } catch (e) {}
}

function getKey(req) {
  return req.headers['x-api-key'] || 'default';
}

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');

  if (req.method === 'OPTIONS') return res.status(204).end();

  const key = getKey(req);
  const store = loadStore();

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
    } catch (e) {
      return res.status(500).json({ ok: false, error: e.message });
    }
  }

  if (req.method === 'DELETE') {
    delete store[key];
    saveStore(store);
    return res.status(200).json({ ok: true });
  }

  return res.status(404).json({ ok: false, error: 'Not found' });
}
