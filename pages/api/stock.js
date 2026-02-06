// Next.js API：获取 A 股日线（开盘、收盘等），数据源为东方财富公开接口
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: '仅支持 GET' });
  }
  const { symbol = '', start = '', end = '' } = req.query;
  const code = String(symbol).trim().replace(/^sh\.|^sz\./i, '');
  if (!/^\d{6}$/.test(code)) {
    return res.status(400).json({ error: '请传入 6 位 A 股代码，如 000001 或 600519' });
  }
  // 东方财富 secid：沪 1.xxxxxx，深 0.xxxxxx
  const secid = code.startsWith('6') ? `1.${code}` : `0.${code}`;
  const beg = start && /^\d{8}$/.test(start) ? start : '0';
  const endParam = end && /^\d{8}$/.test(end) ? end : '20500000';
  const url = `https://push2his.eastmoney.com/api/qt/stock/kline/get?secid=${secid}&fields1=f1,f2,f3,f4,f5,f6&fields2=f51,f52,f53,f54,f55,f56,f57,f58&klt=101&fqt=1&beg=${beg}&end=${endParam}`;
  try {
    const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const data = await r.json();
    const klines = data?.data?.klines || [];
    const list = klines.map((s) => {
      const [date, open, close, high, low, volume] = String(s).split(',');
      return { date, open, close, high, low, volume };
    });
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');
    return res.status(200).json({ symbol: code, data: list });
  } catch (e) {
    return res.status(502).json({ error: '获取行情失败', detail: e.message });
  }
}
