// pages/daily-quote.js → 重命名为 answer-book.js 或者保留原名
import { answerBook } from '../data/answers';
import { useState } from 'react';
import styles from '../styles/AnswerBook.module.css';

export default function AnswerBook() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [hasAsked, setHasAsked] = useState(false);

  const getRandomAnswer = () => {
    const randomIndex = Math.floor(Math.random() * answerBook.length);
    return answerBook[randomIndex];
  };

  const handleAsk = () => {
    if (!question.trim()) return;

    setIsThinking(true);
    setAnswer('');
    setHasAsked(true);

    // 模拟思考过程
    setTimeout(() => {
      const newAnswer = getRandomAnswer();
      setAnswer(newAnswer);
      setIsThinking(false);
    }, 1500);
  };

  const handleReset = () => {
    setQuestion('');
    setAnswer('');
    setHasAsked(false);
    setIsThinking(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleAsk();
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>答案之书</h1>
        <p className={styles.subtitle}>在心中默念你的问题，然后点击获取答案</p>
      </div>

      <input
        type="text"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="输入你的问题..."
        className={styles.questionInput}
        disabled={isThinking}
      />

      <div className={styles.book}>
        {isThinking ? (
          <p className={styles.thinking}>思考中...</p>
        ) : answer ? (
          <p className={`${styles.answer} ${styles.show}`}>"{answer}"</p>
        ) : (
          <p className={styles.answer}>等待你的问题...</p>
        )}
      </div>

      <div style={{ textAlign: 'center' }}>
        <button
          onClick={handleAsk}
          disabled={!question.trim() || isThinking}
          className={styles.askButton}
        >
          {isThinking ? '思考中...' : '获取答案'}
        </button>
        
        {hasAsked && (
          <button onClick={handleReset} className={styles.resetButton}>
            重新提问
          </button>
        )}
      </div>

      <div style={{ 
        marginTop: '3rem', 
        textAlign: 'center', 
        color: '#86868b',
        fontSize: '0.9rem'
      }}>
        <p>💡 提示：保持开放的心态，答案可能会给你意想不到的启示</p>
      </div>
    </div>
  );
}
