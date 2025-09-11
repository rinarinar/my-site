// pages/daily-quote.js
export default function DailyQuote() {
  return (
    <div className="container">
      <h1 className="section-title">每日一句</h1>
      <div style={{textAlign: 'center', padding: '2rem'}}>
        <blockquote style={{fontSize: '1.5rem', fontStyle: 'italic'}}>
          "代码就像幽默，如果你需要解释它，那就不够好。"
        </blockquote>
        <p style={{marginTop: '1rem', color: '#666'}}>- Cory House</p>
      </div>
    </div>
  );
}
