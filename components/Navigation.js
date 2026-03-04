// components/Navigation.js
import Link from 'next/link';
import { useRouter } from 'next/router';
import styles from '../styles/Navigation.module.css';

export default function Navigation() {
  const router = useRouter();
  const navItems = [
    { href: '/answer-book', label: '答案之书' },
    { href: '/fortune', label: '算命' },
    { href: '/stock', label: '炒股' },
    { href: '/valentine', label: '塔罗牌' },
  ];

  return (
    <nav className={styles.nav}>
      <div className={styles.inner}>
        <Link href="/" className={styles.brand}>
          Rina个人网站
        </Link>

        <div className={styles.links}>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.link} ${router.pathname === item.href ? styles.linkActive : ''}`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
