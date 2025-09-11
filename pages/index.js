// pages/index.js
export default function Home() {
  return (
    <div className="container">
      {/* 头部信息 */}
      <header className="header">
        <img src="/avatar.jpg" alt="头像" className="avatar" />
        <h1 className="name">陈文</h1>
        <p className="title">前端开发工程师</p>
        <div className="contact-info">
          <span className="contact-item">📧 example@email.com</span>
          <span className="contact-item">📱 +86 138-XXXX-XXXX</span>
          <span className="contact-item">📍 上海, 中国</span>
        </div>
      </header>

      {/* 关于我 */}
      <section className="section">
        <h2 className="section-title">关于我</h2>
        <div className="about-content">
          <p> passionate frontend developer with 5+ years of experience in building modern web applications. 
            Specialized in React ecosystem and passionate about creating intuitive user experiences. 
            Strong advocate for clean code and best practices.</p>
        </div>
      </section>

      {/* 技能 */}
      <section className="section">
        <h2 className="section-title">技能专长</h2>
        <div className="skills-grid">
          <div className="skill-category">
            <h4>前端技术</h4>
            <ul className="skill-list">
              <li className="skill-item">
                <span className="skill-name">JavaScript/TypeScript</span>
                <div className="skill-level" style={{width: '90%'}}></div>
              </li>
              <li className="skill-item">
                <span className="skill-name">React/Next.js</span>
                <div className="skill-level" style={{width: '95%'}}></div>
              </li>
              <li className="skill-item">
                <span className="skill-name">HTML/CSS</span>
                <div className="skill-level" style={{width: '85%'}}></div>
              </li>
            </ul>
          </div>

          <div className="skill-category">
            <h4>后端技术</h4>
            <ul className="skill-list">
              <li className="skill-item">
                <span className="skill-name">Node.js</span>
                <div className="skill-level" style={{width: '80%'}}></div>
              </li>
              <li className="skill-item">
                <span className="skill-name">Express</span>
                <div className="skill-level" style={{width: '75%'}}></div>
              </li>
              <li className="skill-item">
                <span className="skill-name">MongoDB</span>
                <div className="skill-level" style={{width: '70%'}}></div>
              </li>
            </ul>
          </div>

          <div className="skill-category">
            <h4>工具 & 其他</h4>
            <ul className="skill-list">
              <li className="skill-item">
                <span className="skill-name">Git</span>
                <div className="skill-level" style={{width: '85%'}}></div>
              </li>
              <li className="skill-item">
                <span className="skill-name">Webpack/Vite</span>
                <div className="skill-level" style={{width: '80%'}}></div>
              </li>
              <li className="skill-item">
                <span className="skill-name">UI/UX Design</span>
                <div className="skill-level" style={{width: '75%'}}></div>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* 工作经验 */}
      <section className="section">
        <h2 className="section-title">工作经验</h2>
        
        <div className="experience-item">
          <div className="experience-header">
            <h3 className="company">ABC科技有限公司</h3>
            <span className="period">2020年6月 - 至今</span>
          </div>
          <h4 className="position">高级前端开发工程师</h4>
          <ul className="responsibilities">
            <li>负责公司核心产品的前端架构设计和开发工作</li>
            <li>主导从Vue到React的技术栈迁移，提升性能30%</li>
            <li>建立前端代码规范和CI/CD流程，提高团队开发效率</li>
            <li> mentoring junior developers and conducting code reviews</li>
          </ul>
        </div>

        <div className="experience-item">
          <div className="experience-header">
            <h3 className="company">XYZ互联网公司</h3>
            <span className="period">2018年3月 - 2020年5月</span>
          </div>
          <h4 className="position">前端开发工程师</h4>
          <ul className="responsibilities">
            <li>参与电商平台的前端开发，实现响应式设计</li>
            <li>优化网站性能，减少加载时间40%</li>
            <li>与后端团队协作开发RESTful API接口</li>
            <li>Implement new features and fix bugs in existing codebase</li>
          </ul>
        </div>
      </section>

      {/* 教育背景 */}
      <section className="section">
        <h2 className="section-title">教育背景</h2>
        
        <div className="education-item">
          <div className="experience-header">
            <h3 className="company">上海交通大学</h3>
            <span className="period">2014年9月 - 2018年6月</span>
          </div>
          <h4 className="position">计算机科学与技术 - 学士学位</h4>
          <p>GPA: 3.8/4.0，获得校级优秀毕业生称号</p>
        </div>
      </section>

      {/* 项目经验 */}
      <section className="section">
        <h2 className="section-title">项目经验</h2>
        
        <div className="project-item">
          <h3 className="company">企业级管理系统</h3>
          <p>基于React + TypeScript + Ant Design构建的全栈项目，包含用户管理、权限控制、数据可视化等功能。</p>
          <div className="tech-stack">
            <span className="tech-tag">React</span>
            <span className="tech-tag">TypeScript</span>
            <span className="tech-tag">Node.js</span>
            <span className="tech-tag">MongoDB</span>
          </div>
        </div>

        <div className="project-item">
          <h3 className="company">电商平台重构</h3>
          <p>主导电商网站的前端重构，采用微前端架构，提升用户体验和开发效率。</p>
          <div className="tech-stack">
            <span className="tech-tag">Vue.js</span>
            <span className="tech-tag">Micro-frontend</span>
            <span className="tech-tag">Webpack</span>
            <span className="tech-tag">Docker</span>
          </div>
        </div>
      </section>
    </div>
  );
}
