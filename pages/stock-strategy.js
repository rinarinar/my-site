import Head from 'next/head';
import { useEffect, useMemo, useState } from 'react';
import styles from '../styles/StockStrategy.module.css';

const fmtPct = (value, digits = 2) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';
  return `${(Number(value) * 100).toFixed(digits)}%`;
};

const fmtNumber = (value, digits = 2) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';
  return Number(value).toFixed(digits);
};

const valueClass = (value) => {
  if (value === null || value === undefined) return '';
  return Number(value) >= 0 ? styles.up : styles.down;
};

function DataTable({ headers, rows, compact = false }) {
  return (
    <div className={styles.tableWrap}>
      <table className={`${styles.table} ${compact ? styles.compactTable : ''}`}>
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>{rows}</tbody>
      </table>
    </div>
  );
}

function StatusTag({ active, label }) {
  return <span className={`${styles.tag} ${active ? styles.tagOk : styles.tagMuted}`}>{label}</span>;
}

function LineChart({ series, percent = false, fixedMax }) {
  const [hoverIndex, setHoverIndex] = useState(null);
  const width = 900;
  const height = 330;
  const pad = { left: 54, right: 18, top: 18, bottom: 36 };

  const chart = useMemo(() => {
    const all = series.flatMap((item) => item.points);
    if (!all.length) return null;
    const minY = Math.min(...all.map((point) => point.value));
    const maxY = fixedMax ?? Math.max(...all.map((point) => point.value));
    const yPad = (maxY - minY || 1) * 0.08;
    const y0 = minY - yPad;
    const y1 = fixedMax !== undefined ? fixedMax : maxY + yPad;
    const dates = series[0].points.map((point) => point.date);
    const x = (index) => pad.left + (index / Math.max(dates.length - 1, 1)) * (width - pad.left - pad.right);
    const y = (value) => pad.top + ((y1 - value) / (y1 - y0)) * (height - pad.top - pad.bottom);
    const grid = Array.from({ length: 5 }, (_, index) => {
      const value = y0 + ((y1 - y0) * index) / 4;
      return { value, y: y(value) };
    });
    return { dates, grid, x, y };
  }, [series, fixedMax]);

  if (!chart) return <div className={styles.empty}>暂无图表数据</div>;

  const handleMove = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const px = ((event.clientX - rect.left) / rect.width) * width;
    const nextIndex = Math.max(
      0,
      Math.min(
        chart.dates.length - 1,
        Math.round(((px - pad.left) / (width - pad.left - pad.right)) * (chart.dates.length - 1))
      )
    );
    setHoverIndex(nextIndex);
  };

  const labels = [
    { index: 0, anchor: 'start' },
    { index: Math.floor((chart.dates.length - 1) / 2), anchor: 'middle' },
    { index: chart.dates.length - 1, anchor: 'end' },
  ];

  return (
    <div className={styles.chartBox}>
      <svg
        className={styles.chart}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        onMouseMove={handleMove}
        onMouseLeave={() => setHoverIndex(null)}
      >
        {chart.grid.map((line) => (
          <g key={line.value}>
            <line x1={pad.left} y1={line.y} x2={width - pad.right} y2={line.y} className={styles.gridLine} />
            <text x={pad.left - 10} y={line.y + 4} textAnchor="end" className={styles.axisText}>
              {percent ? fmtPct(line.value, 0) : fmtNumber(line.value, 1)}
            </text>
          </g>
        ))}
        {series.map((item) => {
          const d = item.points
            .map((point, index) => `${index === 0 ? 'M' : 'L'} ${chart.x(index).toFixed(2)} ${chart.y(point.value).toFixed(2)}`)
            .join(' ');
          return <path key={item.name} d={d} fill="none" stroke={item.color} strokeWidth="2.5" strokeLinecap="round" />;
        })}
        {hoverIndex !== null && (
          <line x1={chart.x(hoverIndex)} y1={pad.top} x2={chart.x(hoverIndex)} y2={height - pad.bottom} className={styles.hoverLine} />
        )}
        {labels.map((label) => (
          <text key={`${label.index}-${label.anchor}`} x={chart.x(label.index)} y={height - 8} textAnchor={label.anchor} className={styles.axisText}>
            {chart.dates[label.index]}
          </text>
        ))}
        <line x1={pad.left} y1={pad.top} x2={pad.left} y2={height - pad.bottom} className={styles.axisLine} />
        <line x1={pad.left} y1={height - pad.bottom} x2={width - pad.right} y2={height - pad.bottom} className={styles.axisLine} />
      </svg>
      {hoverIndex !== null && (
        <div className={styles.tooltip} style={{ left: `${(chart.x(hoverIndex) / width) * 100}%` }}>
          <strong>{chart.dates[hoverIndex]}</strong>
          {series.map((item) => (
            <span key={item.name}>
              {item.name}: {percent ? fmtPct(item.points[hoverIndex].value) : fmtNumber(item.points[hoverIndex].value, 3)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function chartPoints(points) {
  return (points || []).map((point) => ({ date: point.date, value: Number(point.value) }));
}

export default function StockStrategy() {
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    async function loadSnapshot() {
      setLoading(true);
      setError('');
      try {
        const response = await fetch(`/stock-strategy/data/strategy_snapshot.json?ts=${Date.now()}`, {
          cache: 'no-store',
        });
        if (!response.ok) throw new Error('策略快照读取失败');
        const json = await response.json();
        if (alive) setSnapshot(json);
      } catch (err) {
        if (alive) setError(err.message);
      } finally {
        if (alive) setLoading(false);
      }
    }
    loadSnapshot();
    return () => {
      alive = false;
    };
  }, []);

  if (loading) {
    return (
      <main className={styles.container}>
        <div className={styles.loading}>正在读取策略快照...</div>
      </main>
    );
  }

  if (error || !snapshot) {
    return (
      <main className={styles.container}>
        <div className={styles.error}>{error || '没有可用策略数据'}</div>
      </main>
    );
  }

  const metrics = snapshot.metrics;
  const position = snapshot.strategy.current_position;
  const policy = snapshot.investment_policy;
  const playbook = snapshot.current_playbook;
  const signalRows = snapshot.tables.current_signal || [];
  const recentRebalances = (snapshot.tables.recent_rebalances || []).slice().reverse();
  const yearlyRows = (snapshot.tables.yearly_returns || []).slice().reverse();

  return (
    <>
      <Head>
        <title>A 股策略追踪 - Rina个人网站</title>
        <meta name="description" content="A 股研究驱动核心-卫星策略追踪" />
      </Head>

      <main className={styles.container}>
        <header className={styles.pageHeader}>
          <div>
            <h1 className={styles.title}>A 股策略追踪</h1>
            <p className={styles.subtitle}>研究驱动核心-卫星 / 宽基底座十年审计</p>
          </div>
          <div className={styles.freshness}>最新完整交易日：{snapshot.meta.latest_data_date}</div>
        </header>

        <section className={styles.kpiGrid}>
          <div className={styles.kpi}>
            <span>当前持仓</span>
            <strong>{position.name}</strong>
            <small>信号选择：{position.current_signal_choice}</small>
          </div>
          <div className={styles.kpi}>
            <span>策略累计收益</span>
            <strong>{fmtPct(metrics.strategy.total_return)}</strong>
            <small>年化 {fmtPct(metrics.strategy.annual_return)}</small>
          </div>
          <div className={styles.kpi}>
            <span>沪深300累计收益</span>
            <strong>{fmtPct(metrics.benchmark.total_return)}</strong>
            <small>年化 {fmtPct(metrics.benchmark.annual_return)}</small>
          </div>
          <div className={styles.kpi}>
            <span>最大回撤</span>
            <strong>{fmtPct(metrics.strategy.max_drawdown)}</strong>
            <small>基准 {fmtPct(metrics.benchmark.max_drawdown)}</small>
          </div>
          <div className={styles.kpi}>
            <span>超额累计收益</span>
            <strong>{fmtPct(metrics.excess_total_return)}</strong>
            <small>{metrics.switch_count} 次实际切换</small>
          </div>
        </section>

        <section className={styles.workspace}>
          <div className={styles.mainColumn}>
            <section className={styles.module}>
              <div className={styles.moduleHead}>
                <div>
                  <h2>净值曲线</h2>
                  <p>策略与沪深300基准，起点归一为 1.00。</p>
                </div>
                <div className={styles.legend}>
                  <span><i style={{ background: '#c43b2f' }} />策略</span>
                  <span><i style={{ background: '#2851a3' }} />沪深300</span>
                </div>
              </div>
              <LineChart
                series={[
                  { name: '策略', color: '#c43b2f', points: chartPoints(snapshot.series.equity.strategy) },
                  { name: '沪深300', color: '#2851a3', points: chartPoints(snapshot.series.equity.benchmark) },
                ]}
              />
            </section>

            <section className={styles.module}>
              <div className={styles.moduleHead}>
                <div>
                  <h2>回撤</h2>
                  <p>从历史高点回落的幅度，越接近 0 代表恢复越充分。</p>
                </div>
                <div className={styles.legend}>
                  <span><i style={{ background: '#087f5b' }} />策略</span>
                  <span><i style={{ background: '#9b6a12' }} />沪深300</span>
                </div>
              </div>
              <LineChart
                percent
                fixedMax={0}
                series={[
                  { name: '策略', color: '#087f5b', points: chartPoints(snapshot.series.drawdown.strategy) },
                  { name: '沪深300', color: '#9b6a12', points: chartPoints(snapshot.series.drawdown.benchmark) },
                ]}
              />
            </section>
          </div>

          <aside className={styles.sideColumn}>
            <section className={styles.module}>
              <div className={styles.moduleHead}>
                <div>
                  <h2>当前信号</h2>
                  <p>按最新完整交易日计算。</p>
                </div>
              </div>
              <DataTable
                compact
                headers={['指数', '评分', '12M', '状态']}
                rows={signalRows.map((row) => (
                  <tr key={row.code}>
                    <td>{row.name}</td>
                    <td className={valueClass(row.score)}>{fmtPct(row.score)}</td>
                    <td className={valueClass(row.momentum_12m)}>{fmtPct(row.momentum_12m)}</td>
                    <td><StatusTag active={row.eligible} label={row.eligible ? '可选' : '过滤'} /></td>
                  </tr>
                ))}
              />
            </section>

            <section className={styles.module}>
              <div className={styles.moduleHead}>
                <div>
                  <h2>策略规则</h2>
                  <p>低频、可复现，以风控优先。</p>
                </div>
              </div>
              <div className={styles.ruleList}>
                <div><span>评分</span><p>{snapshot.strategy.rules.score}</p></div>
                <div><span>可买条件</span><p>{snapshot.strategy.rules.eligibility}</p></div>
                <div><span>调仓</span><p>{snapshot.strategy.rules.rebalance}</p></div>
                <div><span>防守资产</span><p>{snapshot.strategy.rules.defensive_asset}</p></div>
                <div><span>切换成本</span><p>{fmtPct(snapshot.strategy.rules.switch_cost)}</p></div>
              </div>
            </section>
          </aside>
        </section>

        <section className={styles.twoColumn}>
          <section className={styles.module}>
            <div className={styles.moduleHead}>
              <div>
                <h2>完整投资逻辑</h2>
                <p>固定流程，动态仓位，先风控再收益。</p>
              </div>
            </div>
            <p className={styles.bodyCopy}>{policy.thesis}</p>
            <div className={styles.ruleList}>
              <div><span>固定路线</span><p>{policy.route.fixed}</p></div>
              <div><span>动态选择</span><p>{policy.route.dynamic}</p></div>
              <div><span>频率</span><p>{policy.route.frequency_choice}</p></div>
            </div>
          </section>

          <section className={styles.module}>
            <div className={styles.moduleHead}>
              <div>
                <h2>当前执行层</h2>
                <p>把回测信号转成基金、股票和现金的组合语言。</p>
              </div>
            </div>
            <div className={styles.stanceGrid}>
              <div>
                <span>市场状态</span>
                <strong>{playbook.regime}</strong>
              </div>
              <div>
                <span>权益预算</span>
                <strong>{playbook.equity_budget}</strong>
              </div>
            </div>
            <p className={styles.bodyCopy}>{playbook.stance}</p>
            <p className={styles.note}>{playbook.historical_audit_note}</p>
          </section>
        </section>

        <section className={styles.module}>
          <div className={styles.moduleHead}>
            <div>
              <h2>目标配置</h2>
              <p>权重随市场状态变化，路线保持固定。</p>
            </div>
          </div>
          <DataTable
            headers={['资产', '目标', '当前落地', '调整规则']}
            rows={playbook.target_allocations.map((row) => (
              <tr key={row.bucket}>
                <td>{row.bucket}</td>
                <td>{row.target}</td>
                <td className={styles.textCell}>{row.implementation}</td>
                <td className={styles.textCell}>{row.adjustment_rule}</td>
              </tr>
            ))}
          />
        </section>

        <section className={styles.twoColumn}>
          <section className={styles.module}>
            <div className={styles.moduleHead}>
              <div>
                <h2>基金观察池</h2>
                <p>优先选择低费率、高流动性、风格明确的工具。</p>
              </div>
            </div>
            <DataTable
              headers={['代码', '基金/ETF', '职责', '使用条件']}
              rows={playbook.fund_watchlist.map((row) => (
                <tr key={row.code}>
                  <td>{row.code}</td>
                  <td>{row.name}</td>
                  <td>{row.role}</td>
                  <td className={styles.textCell}>{row.use_when}</td>
                </tr>
              ))}
            />
          </section>

          <section className={styles.module}>
            <div className={styles.moduleHead}>
              <div>
                <h2>股票观察池</h2>
                <p>不是买入清单，只有通过周度复核才进入持仓。</p>
              </div>
            </div>
            <DataTable
              headers={['代码', '股票', '行业', '需要验证的证据']}
              rows={playbook.stock_watchlist.map((row) => (
                <tr key={row.code}>
                  <td>{row.code}</td>
                  <td>{row.name}</td>
                  <td>{row.industry}</td>
                  <td className={styles.textCell}>{row.evidence_needed}</td>
                </tr>
              ))}
            />
          </section>
        </section>

        <section className={styles.twoColumn}>
          <section className={styles.module}>
            <div className={styles.moduleHead}>
              <div>
                <h2>每周研究与风控</h2>
                <p>近期选择随市场证据变化，不靠固定口号。</p>
              </div>
            </div>
            <ul className={styles.textList}>
              {policy.weekly_research.map((item) => <li key={item}>{item}</li>)}
              {playbook.weekly_decision_rules.map((item) => <li key={item}>{item}</li>)}
              {policy.risk_controls.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </section>

          <section className={styles.module}>
            <div className={styles.moduleHead}>
              <div>
                <h2>年度收益</h2>
                <p>红色为正收益，绿色为负收益。</p>
              </div>
            </div>
            <DataTable
              compact
              headers={['年份', '策略', '沪深300', '超额']}
              rows={yearlyRows.map((row) => (
                <tr key={row.year}>
                  <td>{row.year}</td>
                  <td className={valueClass(row.strategy_return)}>{fmtPct(row.strategy_return)}</td>
                  <td className={valueClass(row.benchmark_return)}>{fmtPct(row.benchmark_return)}</td>
                  <td className={valueClass(row.excess_return)}>{fmtPct(row.excess_return)}</td>
                </tr>
              ))}
            />
          </section>
        </section>

        <section className={styles.module}>
          <div className={styles.moduleHead}>
            <div>
              <h2>最近调仓</h2>
              <p>展示最近 24 次月频信号。</p>
            </div>
          </div>
          <DataTable
            compact
            headers={['生效日', '持仓', '动作', '评分']}
            rows={recentRebalances.map((row) => (
              <tr key={`${row.effective_date}-${row.to}`}>
                <td>{row.effective_date}</td>
                <td>{row.to}</td>
                <td><StatusTag active={row.changed} label={row.changed ? '切换' : '持有'} /></td>
                <td className={valueClass(row.selected_score)}>{fmtPct(row.selected_score)}</td>
              </tr>
            ))}
          />
        </section>

        <p className={styles.disclaimer}>
          数据源：{snapshot.meta.data_source}。生成时间：{snapshot.meta.generated_at}。
          本页面仅用于策略研究与表现追踪，不构成投资建议。{snapshot.meta.assumptions.join(' ')}
        </p>
      </main>
    </>
  );
}
