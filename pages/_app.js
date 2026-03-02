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
        <title>Rina个人网站</title>
        <meta name="description" content="答案之书、算命、炒股、冰雪魔法" />
      </Head>
      <Navigation />
      <Component {...pageProps} />
    </>
  )
}
