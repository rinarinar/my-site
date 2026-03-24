/**
 * Focus List Sync API — /api/focus-sync
 * GET  → 拉取任务
 * POST → 推送任务
 * DELETE → 清除
 *
 * 存储：Vercel Blob（持久化，免费 1GB）
 * Key：focus-sync:{apiKey}.json
 */

import { put, list, del } from '@vercel/blob';

function getBlobKey(apiKey) {
  return `focus-sync:${apiKey}.json`;
}

function getKey(req) {
  return req.headers['x-api-key'] || 'default';
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');

  if (req.method === 'OPTIONS') return res.status(204).end();

  const apiKey = getKey(req);
  const blobKey = getBlobKey(apiKey);

  if (req.method === 'GET') {
    try {
      const { blobs } = await list({ prefix: blobKey });
      if (blobs.length === 0) {
        return res.status(200).json({
          ok: true,
          tasks: [],
          customTags: [],
          lastModified: null,
          serverTime: Date.now(),
        });
      }
      const resp = await fetch(blobs[0].url);
      const data = await resp.json();
      return res.status(200).json({
        ok: true,
        tasks: data.tasks || [],
        customTags: data.customTags || [],
        lastModified: data.lastModified || null,
        serverTime: Date.now(),
      });
    } catch (e) {
      return res.status(500).json({ ok: false, error: e.message });
    }
  }

  if (req.method === 'POST') {
    try {
      const { tasks, customTags, lastModified } = req.body;
      if (!Array.isArray(tasks)) {
        return res.status(400).json({ ok: false, error: 'tasks must be array' });
      }
      const data = {
        tasks,
        customTags: customTags || [],
        lastModified: lastModified || Date.now(),
      };
      await put(blobKey, JSON.stringify(data), { access: 'public', allowOverwrite: true });
      return res.status(200).json({ ok: true, serverTime: Date.now() });
    } catch (e) {
      return res.status(500).json({ ok: false, error: e.message });
    }
  }

  if (req.method === 'DELETE') {
    try {
      await del(blobKey);
      return res.status(200).json({ ok: true });
    } catch (e) {
      return res.status(500).json({ ok: false, error: e.message });
    }
  }

  return res.status(404).json({ ok: false, error: 'Not found' });
}