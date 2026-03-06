import { useEffect, useMemo, useRef, useState } from 'react';
import Head from 'next/head';
import styles from '../styles/Realtime.module.css';

function buildMockSearchResults(keyword) {
  const q = encodeURIComponent(keyword.trim());
  // 使用免 key 的图片源，按 sig 生成 3 张不同结果
  return [1, 2, 3].map((sig) => ({
    id: `${q}-${sig}`,
    url: `https://source.unsplash.com/640x480/?${q}&sig=${sig}`,
  }));
}

export default function RealtimePage() {
  const [keyword, setKeyword] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [overlays, setOverlays] = useState([]);
  const [error, setError] = useState('');
  const [cameraReady, setCameraReady] = useState(false);
  const videoRef = useRef(null);
  const cameraAreaRef = useRef(null);

  const hasResults = useMemo(() => searchResults.length > 0, [searchResults]);

  useEffect(() => {
    let stream;
    async function initCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' },
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setCameraReady(true);
        }
      } catch (err) {
        setError('无法打开摄像头，请检查浏览器权限。');
      }
    }

    if (typeof window !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
      initCamera();
    } else {
      setError('当前浏览器不支持摄像头功能。');
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const onSearch = (e) => {
    e.preventDefault();
    const trimmed = keyword.trim();
    if (!trimmed) {
      setSearchResults([]);
      return;
    }
    setSearchResults(buildMockSearchResults(trimmed));
  };

  const onDragStart = (e, imageUrl) => {
    e.dataTransfer.setData('text/plain', imageUrl);
  };

  const onDropToCamera = (e) => {
    e.preventDefault();
    const imageUrl = e.dataTransfer.getData('text/plain');
    if (!imageUrl || !cameraAreaRef.current) return;

    const rect = cameraAreaRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setOverlays((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        src: imageUrl,
        x: Math.max(0, x - 60),
        y: Math.max(0, y - 60),
        width: 120,
        height: 120,
      },
    ]);
  };

  return (
    <>
      <Head>
        <title>实时交互 | Rina个人网站</title>
      </Head>
      <main className={styles.page}>
        <section className={styles.leftPanel}>
          <h1 className={styles.title}>实时交互</h1>
          <p className={styles.desc}>输入你想找的图片关键词，然后拖拽到右侧实时画面中。</p>
          <form className={styles.form} onSubmit={onSearch}>
            <input
              className={styles.input}
              type="text"
              placeholder="例如：眼镜、帽子、花朵"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
            <button className={styles.button} type="submit">
              搜索
            </button>
          </form>

          <div className={styles.results}>
            {!hasResults && <p className={styles.hint}>输入关键词后会返回 3 张图片。</p>}
            {searchResults.map((item) => (
              <img
                key={item.id}
                src={item.url}
                alt="搜索结果"
                className={styles.resultImage}
                draggable
                onDragStart={(e) => onDragStart(e, item.url)}
              />
            ))}
          </div>
        </section>

        <section className={styles.rightPanel}>
          <div
            ref={cameraAreaRef}
            className={styles.cameraArea}
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDropToCamera}
          >
            <video ref={videoRef} className={styles.video} muted playsInline />
            {!cameraReady && <div className={styles.cameraMask}>正在打开摄像头...</div>}
            {error && <div className={styles.cameraMask}>{error}</div>}
            {overlays.map((item) => (
              <img
                key={item.id}
                src={item.src}
                alt="overlay"
                className={styles.overlay}
                style={{
                  left: `${item.x}px`,
                  top: `${item.y}px`,
                  width: `${item.width}px`,
                  height: `${item.height}px`,
                }}
              />
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
