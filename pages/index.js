// pages/index.js
import styles from '../styles/Home.module.css';

export default function Home() {
  return (
    <div className={styles.container}>
      {/* 头部信息 */}
      <header className={styles.header}>
        <img src="/avatar.jpg" alt="头像" className={styles.avatar} />
        <h1 className={styles.name}>陈文</h1>
        <p className={styles.title}>前端开发工程师 & 用户体验设计师</p>
        <div className={styles.contactInfo}>
          <span className={styles.contactItem}>📧 example@email.com</span>
          <span className={styles.contactItem}>📱 +86 138-XXXX-XXXX</span>
          <span className={styles.contactItem}>📍 上海, 中国</span>
        </div>
      </header>

      {/* 主要内容区域 */}
      <main className={styles.content}>
        {/* 关于我 */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>关于我</h2>
          <div className={styles.aboutContent}>
            <p>专注于创造优雅而高效的数字化体验。5年+前端开发经验，擅长将复杂的技术需求转化为直观的用户界面。</p>
            <p>坚信好的设计不仅是美观，更是功能与形式的完美结合。持续学习新技术，追求代码的简洁与可维护性。</p>
          </div>
        </section>

        {/* 技能 */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>技能专长</h2>
          <div className={styles.skillsGrid}>
            <div className={styles.skillCategory}>
              <h4>前端技术</h4>
              <ul className={styles.skillList}>
                <li className={styles.skillItem}>
                  <span className={styles.skillName}>JavaScript/TypeScript</span>
                  <div className={styles.skillLevel} style={{width: '95%'}}></div>
                </li>
                <li className={styles.skillItem}>
                  <span className={styles.skillName}>React/Next.js</span>
                  <div className={styles.skillLevel} style={{width: '98%'}}></div>
                </li>
                <li className={styles.skillItem}>
                  <span className={styles.skillName}>Vue/Nuxt.js</span>
                  <div className={styles.skillLevel} style={{width: '90%'}}></div>
                </li>
              </ul>
            </div>

            <div className={styles.skillCategory}>
              <h4>设计工具</h4>
              <ul className={styles.skillList}>
                <li className={styles.skillItem}>
                  <span className={styles.skillName}>Figma/Sketch</span>
                  <div className={styles.skillLevel} style={{width: '92%'}}></div>
                </li>
                <li className={styles.skillItem}>
                  <span className={styles.skillName}>UI/UX Design</span>
                  <div className={styles.skillLevel} style={{width: '88%'}}></div>
                </li>
                <li className={styles.skillItem}>
                  <span className={styles.skillName}>Motion Design</span>
                  <div className={styles.skillLevel} style={{width: '85%'}}></div>
                </li>
              </ul>
            </div>

            <div className={styles.skillCategory}>
              <h4>全栈开发</h4>
              <ul className={styles.skillList}>
                <li className={styles.skillItem}>
                  <span className={styles.skillName}>Node.js</span>
                  <div className={styles.skillLevel} style={{width: '87%'}}></div>
                </li>
                <li className={styles.skillItem}>
                  <span className={styles.skillName}>GraphQL</span>
                  <div className={styles.skillLevel} style={{width: '82%'}}></div>
                </li>
                <li className={styles.skillItem}>
                  <span className={styles.skillName}>DevOps</span>
                  <div className={styles.skillLevel} style={{width: '78%'}}></div>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* 工作经验 */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>工作经验</h2>
          
          <div className={styles.experienceItem}>
            <div className={styles.experienceHeader}>
              <h3 className={styles.company}>Apple Inc.</h3>
              <span className={styles.period}>2022年 - 至今</span>
            </div>
            <h4 className={styles.position}>Senior Frontend Developer</h4>
            <ul className={styles.responsibilities}>
              <li>负责 Apple Store 在线商城的前端架构优化，提升页面加载性能40%</li>
              <li>主导设计系统开发，确保跨平台用户体验的一致性</li>
              <li>与设计团队紧密合作，实现精致的交互动画和微交互效果</li>
              <li> mentoring junior developers and conducting code reviews</li>
            </ul>
          </div>

          <div className={styles.experienceItem}>
            <div className={styles.experienceHeader}>
              <h3 className={styles.company}>Google</h3>
              <span className={styles.period}>2020年 - 2022年</span>
            </div>
            <h4 className={styles.position}>Frontend Engineer</h4>
            <ul className={styles.responsibilities}>
              <li>参与 Google Workspace 产品的用户界面重构</li>
              <li>开发可复用的 React 组件库，提高团队开发效率</li>
              <li>优化前端构建流程，减少打包体积35%</li>
              <li>Implement accessibility best practices across products</li>
            </ul>
          </div>
        </section>

        {/* 教育背景 */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>教育背景</h2>
          
          <div className={styles.experienceItem}>
            <div className={styles.experienceHeader}>
              <h3 className={styles.company}>斯坦福大学</h3>
              <span className={styles.period}>2016年 - 2020年</span>
            </div>
            <h4 className={styles.position}>计算机科学 - 硕士学位</h4>
            <p>主修人机交互与前端工程，GPA: 3.9/4.0</p>
          </div>
        </section>
      </main>
    </div>
  );
}
