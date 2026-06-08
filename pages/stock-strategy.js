import Head from 'next/head';

export default function StockStrategyRedirect() {
  return (
    <>
      <Head>
        <title>A 股十年动量策略追踪</title>
        <meta httpEquiv="refresh" content="0; url=/stock-strategy/index.html" />
      </Head>
      <main style={{ padding: '2rem', fontFamily: 'Inter, sans-serif' }}>
        <p>
          正在打开
          <a href="/stock-strategy/index.html">A 股十年动量策略追踪</a>
        </p>
      </main>
    </>
  );
}
