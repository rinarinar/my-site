// pages/_app.js
import '../styles/global.css'
import Head from 'next/head'
import Navigation from '../components/Navigation'

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <title>陈文的个人网站</title>
        <meta name="description" content="陈文的个人简历、每日一句和算命功能" />
      </Head>
      <Navigation />
      <Component {...pageProps} />
    </>
  )
}
