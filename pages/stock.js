// 炒股页面 - 含「开盘与收盘价」模块
import { useState } from 'react';
import styles from '../styles/Stock.module.css';

export default function Stock() {
  const [symbol, setSymbol] = useState('000001');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchPrices = async () => {
    setError('');
    setList([]);
    setLoading(true);
    try {
      const params = new URLSearchParams({ symbol: symbol.trim() });
      if (start.trim()) params.set('start', start.replace(/-/g, ''));
      if (end.trim()) params.set('end', end.replace(/-/g, ''));
      const res = await fetch(`/api/stock?${params}`);
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || '请求失败');
        return;
      }
      setList(json.data || []);
    } catch (e) {
      setError('网络错误：' + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.sectionTitle}>炒股</h1>
      <p className={styles.subtitle}>五年十倍 · 查 A 股开盘、收盘价</p>

      <section className={styles.module}>
        <h2 className={styles.moduleTitle}>开盘与收盘价</h2>
        <div className={styles.formRow}>
          <label className={styles.label}>
            <span>股票代码</span>
            <input
              className={styles.input}
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              placeholder="000001 / 600519"
              maxLength={6}
            />
          </label>
          <label className={styles.label}>
            <span>开始日期（可选）</span>
            <input
              type="date"
              className={styles.input}
              value={start}
              onChange={(e) => setStart(e.target.value)}
            />
          </label>
          <label className={styles.label}>
            <span>结束日期（可选）</span>
            <input
              type="date"
              className={styles.input}
              value={end}
              onChange={(e) => setEnd(e.target.value)}
            />
          </label>
          <button className={styles.btn} onClick={fetchPrices} disabled={loading}>
            {loading ? '查询中...' : '查询'}
          </button>
        </div>
        {error && <div className={styles.error}>{error}</div>}
        {loading && <div className={styles.loading}>加载中...</div>}
        {!loading && list.length > 0 && (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>日期</th>
                  <th>开盘</th>
                  <th>收盘</th>
                  <th>最高</th>
                  <th>最低</th>
                  <th>成交量</th>
                </tr>
              </thead>
              <tbody>
                {list.map((row, i) => (
                  <tr key={i}>
                    <td>{row.date}</td>
                    <td>{row.open}</td>
                    <td>{row.close}</td>
                    <td>{row.high}</td>
                    <td>{row.low}</td>
                    <td>{row.volume}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && list.length === 0 && !error && (
          <p className={styles.tip}>输入股票代码后点击「查询」获取近期日线（开盘、收盘、最高、最低、成交量）</p>
        )}
        <p className={styles.tip}>示例：000001 平安银行 · 600519 贵州茅台 · 000858 五粮液</p>
      </section>
    </div>
  );
}
