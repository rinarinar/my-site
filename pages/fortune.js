// pages/fortune.js
import styles from '../styles/Fortune.module.css';

export default function Fortune() {
  return (
    <div className="container">
      <h1 className="section-title">八字算命</h1>
      <div style={{ 
        textAlign: 'center', 
        padding: '3rem 2rem',
        background: '#f8f9fa',
        borderRadius: '12px'
      }}>
        <p style={{ fontSize: '1.2rem', marginBottom: '2rem' }}>
          算命功能开发中，敬请期待...
        </p>
        <div style={{
          padding: '2rem',
          background: 'white',
          borderRadius: '8px',
          border: '2px dashed #007bff'
        }}>
          <p>将包含：八字分析、运势预测、星座解读等功能</p>
        </div>
      </div>
    </div>
  );
}
