// pages/daily-quote.js
import { dailyQuotes } from '../data/quotes';
import { useState, useEffect } from 'react';

export default function DailyQuote() {
  const [currentQuote, setCurrentQuote] = useState(null);
  const [showAll, setShowAll] = useState(false);

  // 获取每日一句（基于日期）
  const getDailyQuote = () => {
    const today = new Date().toISOString().split('T')[0];
    const quoteForToday = dailyQuotes.find(q => q.date === today);
    
    // 如果没有今天的语录，随机选择一个
    return quoteForToday || dailyQuotes[Math.floor(Math.random() * dailyQuotes.length)];
  };

  useEffect(() => {
    setCurrentQuote(getDailyQuote());
  }, []);

  if (!currentQuote) {
    return (
      <div className="container">
        <h1 className="section-title">每日一句</h1>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p>加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <h1 className="section-title">每日一句</h1>
      
      {/* 今日语录 */}
      <div style={{
        textAlign: 'center',
        padding: '3rem 2rem',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        borderRadius: '12px',
        marginBottom: '2rem'
      }}>
        <blockquote style={{
          fontSize: '1.8rem',
          fontStyle: 'italic',
          lineHeight: '1.6',
          marginBottom: '1.5rem'
        }}>
          "{currentQuote.quote}"
        </blockquote>
        <p style={{
          fontSize: '1.1rem',
          opacity: 0.9
        }}>
          - {currentQuote.author}
        </p>
        <div style={{
          marginTop: '1rem',
          display: 'flex',
          justifyContent: 'center',
          gap: '1rem',
          fontSize: '0.9rem',
          opacity: 0.8
        }}>
          <span>#{currentQuote.category}</span>
          <span>•</span>
          <span>{currentQuote.date}</span>
        </div>
      </div>

      {/* 刷新按钮 */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <button
          onClick={() => setCurrentQuote(getDailyQuote())}
          style={{
            padding: '0.8rem 2rem',
            background: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '25px',
            cursor: 'pointer',
            fontSize: '1rem',
            transition: 'all 0.3s ease'
          }}
          onMouseOver={(e) => e.target.style.background = '#0056b3'}
          onMouseOut={(e) => e.target.style.background = '#007bff'}
        >
          换一句
        </button>
      </div>

      {/* 显示所有语录的切换按钮 */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <button
          onClick={() => setShowAll(!showAll)}
          style={{
            padding: '0.6rem 1.5rem',
            background: 'transparent',
            color: '#007bff',
            border: '2px solid #007bff',
            borderRadius: '25px',
            cursor: 'pointer',
            fontSize: '0.9rem'
          }}
        >
          {showAll ? '收起所有语录' : '查看所有语录'}
        </button>
      </div>

      {/* 所有语录列表 */}
      {showAll && (
        <div>
          <h2 style={{ textAlign: 'center', marginBottom: '2rem', color: '#2c3e50' }}>
            所有语录
          </h2>
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            {dailyQuotes.map((quote) => (
              <div
                key={quote.id}
                style={{
                  padding: '1.5rem',
                  background: '#f8f9fa',
                  borderRadius: '8px',
                  borderLeft: '4px solid #28a745'
                }}
              >
                <blockquote style={{
                  fontSize: '1.2rem',
                  fontStyle: 'italic',
                  marginBottom: '1rem',
                  lineHeight: '1.5'
                }}>
                  "{quote.quote}"
                </blockquote>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.9rem',
                  color: '#6c757d'
                }}>
                  <span>- {quote.author}</span>
                  <div>
                    <span style={{
                      background: '#007bff',
                      color: 'white',
                      padding: '0.2rem 0.8rem',
                      borderRadius: '12px',
                      fontSize: '0.8rem',
                      marginRight: '0.8rem'
                    }}>
                      #{quote.category}
                    </span>
                    <span>{quote.date}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
