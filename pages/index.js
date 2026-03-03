// pages/index.js
import Link from 'next/link';
import Head from 'next/head';

export default function Home() {
  return (
    <>
      <Head>
        <title>Rina个人网站</title>
      </Head>
      <div style={{
        maxWidth: '600px',
        margin: '0 auto',
        padding: '3rem 2rem',
        textAlign: 'center',
      }}>
        <h1 style={{ fontSize: '1.75rem', marginBottom: '1.5rem', color: '#333' }}>
          Rina个人网站
        </h1>
        <p style={{ color: '#666', marginBottom: '2rem' }}>
          欢迎，从导航栏进入各功能页面。
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center' }}>
          <Link href="/answer-book" style={{ padding: '0.75rem 1.25rem', background: '#f0f0f0', borderRadius: '8px', textDecoration: 'none', color: '#333' }}>
            答案之书
          </Link>
          <Link href="/fortune" style={{ padding: '0.75rem 1.25rem', background: '#f0f0f0', borderRadius: '8px', textDecoration: 'none', color: '#333' }}>
            算命
          </Link>
          <Link href="/stock" style={{ padding: '0.75rem 1.25rem', background: '#f0f0f0', borderRadius: '8px', textDecoration: 'none', color: '#333' }}>
            炒股
          </Link>
          <Link href="/valentine" style={{ padding: '0.75rem 1.25rem', background: '#f0f0f0', borderRadius: '8px', textDecoration: 'none', color: '#333' }}>
            塔罗牌
          </Link>
        </div>
      </div>
    </>
  );
}
