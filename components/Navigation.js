// components/Navigation.js
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function Navigation() {
  const router = useRouter();

  return (
    <nav style={{
      background: 'white',
      padding: '1rem 2rem',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      marginBottom: '2rem'
    }}>
      <div style={{
        maxWidth: '1000px',
        margin: '0 auto',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        {/* 网站标题 */}
        <Link href="/" style={{
          textDecoration: 'none',
          color: '#007bff',
          fontWeight: 'bold',
          fontSize: '1.2rem'
        }}>
          Rina个人网站
        </Link>
        
        {/* 导航链接 */}
        <div style={{ display: 'flex', gap: '2rem' }}>
          <Link 
            href="/" 
            style={{
              textDecoration: 'none',
              color: router.pathname === '/' ? '#007bff' : '#333',
              fontWeight: router.pathname === '/' ? '600' : '400',
              padding: '0.5rem 1rem',
              borderRadius: '5px',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => e.target.style.background = '#f8f9fa'}
            onMouseOut={(e) => e.target.style.background = 'transparent'}
          >
            简历
          </Link>
          
          <Link 
            href="/answer-book" 
            style={{
              textDecoration: 'none',
              color: router.pathname === '/daily-quote' ? '#007bff' : '#333',
              fontWeight: router.pathname === '/daily-quote' ? '600' : '400',
              padding: '0.5rem 1rem',
              borderRadius: '5px',
              transition: 'all 0.3s ease'
            }}
          >
            答案之书
          </Link>
              
          <Link 
            href="/fortune" 
            style={{
              textDecoration: 'none',
              color: router.pathname === '/fortune' ? '#007bff' : '#333',
              fontWeight: router.pathname === '/fortune' ? '600' : '400',
              padding: '0.5rem 1rem',
              borderRadius: '5px',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => e.target.style.background = '#f8f9fa'}
            onMouseOut={(e) => e.target.style.background = 'transparent'}
          >
            算命
          </Link>
        </div>
      </div>
    </nav>
  );
}
