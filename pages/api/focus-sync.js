/**
 * Focus List Sync API — /api/focus-sync
 * GET  → 拉取任务
 * POST → 推送任务
 * DELETE → 清除
 *
 * 存储：Vercel Blob（持久化，免费 1GB）
 * Key：focus-sync:{apiKey}.json
 */

import { put, list, del, head } from '@vercel/blob';

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
      // 使用 head 检查文件是否存在，然后通过临时 URL 读取
      const blobInfo = await head(blobKey, { token: process.env.BLOB_READ_WRITE_TOKEN });
      if (!blobInfo) {
        return res.status(200).json({
          ok: true,
          tasks: [],
          customTags: [],
          lastModified: null,
          serverTime: Date.now(),
        });
      }
      // 通过 blob url 读取内容
      const resp = await fetch(blobInfo.url, {
        headers: { 'Authorization': `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` }
      });
      const data = await resp.json();
      return res.status(200).json({
        ok: true,
        tasks: data.tasks || [],
        customTags: data.customTags || [],
        lastModified: data.lastModified || null,
        serverTime: Date.now(),
      });
    } catch (e) {
      // 文件不存在时 head 会抛错，返回空数据
      return res.status(200).json({
        ok: true,
        tasks: [],
        customTags: [],
        lastModified: null,
        serverTime: Date.now(),
      });
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
      // 私有 store 不需要 access: 'public'
      await put(blobKey, JSON.stringify(data), {
        token: process.env.BLOB_READ_WRITE_TOKEN,
        allowOverwrite: true,
      });
      return res.status(200).json({ ok: true, serverTime: Date.now() });
    } catch (e) {
      return res.status(500).json({ ok: false, error: e.message });
    }
  }

  if (req.method === 'DELETE') {
    try {
      await del(blobKey, { token: process.env.BLOB_READ_WRITE_TOKEN });
      return res.status(200).json({ ok: true });
    } catch (e) {
      return res.status(500).json({ ok: false, error: e.message });
    }
  }

  return res.status(404).json({ ok: false, error: 'Not found' });
}