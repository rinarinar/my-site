// pages/index.js
import Link from 'next/link';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import styles from '../styles/Home.module.css';

const LifeProgress = dynamic(() => import('../components/LifeProgress'), { ssr: false });

export default function Home() {
  const modules = [
    { href: '/todo', title: '📋 Focus List', desc: '任务管理，实时多端同步。' },
    { href: '/answer-book', title: '答案之书', desc: '随机回答，给你一个轻松直觉指引。' },
    { href: '/fortune', title: '算命', desc: '快速占卜入口，探索当下趋势。' },
    { href: '/stock', title: '炒股', desc: '股票相关工具与信息页。' },
    { href: '/valentine', title: '塔罗牌', desc: '抽取三张塔罗牌并查看解析。' },
    { href: '/realtime', title: '实时交互', desc: '关键词搜图后拖拽到摄像头画面中实时融合。' },
  ];

  return (
    <>
      <Head>
        <title>Rina个人网站</title>
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=Noto+Sans+SC:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </Head>
      <main className={styles.homeSplit}>
        <aside className={styles.lifeCol}>
          <LifeProgress />
        </aside>
        <section className={styles.navCol}>
          <div className={styles.hero}>
            <h1 className={styles.title}>Rina个人网站</h1>
            <p className={styles.subtitle}>欢迎回来，选择下方功能开始体验。</p>

            <div className={styles.grid}>
              {modules.map((item) => (
                <Link key={item.href} href={item.href} className={styles.card}>
                  <div className={styles.cardTitle}>{item.title}</div>
                  <p className={styles.cardDesc}>{item.desc}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
