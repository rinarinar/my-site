// pages/valentine.js — 塔罗牌：牌桌 + 点击开始 → 78张横铺展开 → 手指滑选（快滑/慢滑）+ 2.5s确认
import Head from 'next/head';
import { useState, useRef, useEffect, useCallback } from 'react';
import styles from '../styles/Valentine.module.css';

const TAROT_CARD_COUNT = 78;
const CONFIRM_HOLD_MS = 2500; // 固定 2.5s 确认抽牌
const REVEAL_DURATION_MS = 3800;
const HAND_SAMPLE_MS = 60;
const VELOCITY_FAST_PER_MS = 0.0012; // 超过此速度视为快速滑动
const SLOW_STEP_MS = 140; // 慢速时每 140ms 最多移动 1 张

function Valentine() {
  const [phase, setPhase] = useState('intro'); // 'intro' | 'spread' | 'cards' | 'reveal' | 'result'
  const [chosenCardIndex, setChosenCardIndex] = useState(null);
  const [cameraAllowed, setCameraAllowed] = useState(false);
  const [handReady, setHandReady] = useState(false);
  const [highlightedCardIndex, setHighlightedCardIndex] = useState(null);
  const [triggered, setTriggered] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const handLandmarkerRef = useRef(null);
  const tickRef = useRef(null);
  const triggeredRef = useRef(false);
  const lastCardIndexRef = useRef(null);
  const stableSinceRef = useRef(0);
  const lastTipXRef = useRef(0.5);
  const lastTipTimeRef = useRef(0);
  const slowStepLastTimeRef = useRef(0);

  const startDraw = useCallback((cardIndex) => {
    if (phase !== 'cards' || triggeredRef.current) return;
    triggeredRef.current = true;
    setTriggered(true);
    const chosen = Math.max(0, Math.min(TAROT_CARD_COUNT - 1, cardIndex));
    setChosenCardIndex(chosen);
    setHighlightedCardIndex(null);
    setPhase('reveal');
    setTimeout(() => setPhase('result'), REVEAL_DURATION_MS);
  }, [phase, triggered]);

  const handleStart = () => {
    if (phase !== 'intro') return;
    setPhase('spread');
    setTimeout(() => setPhase('cards'), 2600); // 展开动画约 2.6s
  };

  const handleAgain = () => {
    setPhase('intro');
    setChosenCardIndex(null);
    triggeredRef.current = false;
    setTriggered(false);
    lastCardIndexRef.current = null;
    stableSinceRef.current = 0;
    setHighlightedCardIndex(null);
  };

  // 摄像头：spread 或 cards 阶段开（便于 cards 时已就绪）
  useEffect(() => {
    if (phase !== 'spread' && phase !== 'cards') return;
    let cancelled = false;
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        setCameraAllowed(true);
      } catch (_) {
        if (!cancelled) setCameraAllowed(false);
      }
    };
    startCamera();
    return () => {
      cancelled = true;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      setCameraAllowed(false);
    };
  }, [phase]);

  useEffect(() => {
    if ((phase !== 'spread' && phase !== 'cards') || !cameraAllowed || !videoRef.current || !streamRef.current) return;
    videoRef.current.srcObject = streamRef.current;
  }, [phase, cameraAllowed]);

  // MediaPipe 手部识别（仅 cards）
  useEffect(() => {
    if (phase !== 'cards' || !cameraAllowed) return;
    let cancelled = false;
    const initHand = async () => {
      try {
        const { HandLandmarker, FilesetResolver } = await import('@mediapipe/tasks-vision');
        if (cancelled) return;
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm'
        );
        if (cancelled) return;
        const handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
          },
          numHands: 1,
          runningMode: 'VIDEO',
        });
        if (cancelled) return;
        handLandmarkerRef.current = handLandmarker;
        setHandReady(true);
      } catch (e) {
        if (!cancelled) setHandReady(false);
      }
    };
    initHand();
    return () => {
      cancelled = true;
      handLandmarkerRef.current = null;
      setHandReady(false);
    };
  }, [phase, cameraAllowed]);

  // 指尖 x → 牌索引 0..77；镜像下 1-x
  const getTargetCardIndex = (tipX) => {
    const i = Math.floor((1 - tipX) * TAROT_CARD_COUNT);
    return Math.max(0, Math.min(TAROT_CARD_COUNT - 1, i));
  };

  // 手指检测：快滑则紧跟，慢滑则一张张；同一张 2.5s 确认
  useEffect(() => {
    if (phase !== 'cards' || !cameraAllowed || !videoRef.current || !handReady || triggeredRef.current) return;
    const video = videoRef.current;
    const landmarker = handLandmarkerRef.current;
    if (!landmarker) return;

    let lastSampleTime = 0;
    const detect = (timestamp) => {
      if (triggeredRef.current) return;
      if (!video.videoWidth) {
        tickRef.current = requestAnimationFrame(detect);
        return;
      }
      const now = Date.now();
      if (now - lastSampleTime < HAND_SAMPLE_MS) {
        tickRef.current = requestAnimationFrame(detect);
        return;
      }
      lastSampleTime = now;

      try {
        const result = landmarker.detectForVideo(video, Math.round(timestamp));
        const landmarks = result?.landmarks?.[0];
        if (landmarks && landmarks.length >= 9) {
          const tipX = landmarks[8].x;
          const targetIndex = getTargetCardIndex(tipX);
          const deltaMs = now - lastTipTimeRef.current;
          const velocity = deltaMs > 0 ? Math.abs(tipX - lastTipXRef.current) / deltaMs : 0;
          lastTipXRef.current = tipX;
          lastTipTimeRef.current = now;

          let nextHighlight = lastCardIndexRef.current;
          if (lastCardIndexRef.current === null) nextHighlight = targetIndex;
          else if (velocity >= VELOCITY_FAST_PER_MS) {
            nextHighlight = targetIndex;
          } else {
            if (now - slowStepLastTimeRef.current >= SLOW_STEP_MS) {
              slowStepLastTimeRef.current = now;
              const diff = targetIndex - lastCardIndexRef.current;
              if (diff > 0) nextHighlight = Math.min(targetIndex, lastCardIndexRef.current + 1);
              else if (diff < 0) nextHighlight = Math.max(targetIndex, lastCardIndexRef.current - 1);
            } else {
              nextHighlight = lastCardIndexRef.current;
            }
          }

          if (nextHighlight !== lastCardIndexRef.current) {
            lastCardIndexRef.current = nextHighlight;
            stableSinceRef.current = now;
            setHighlightedCardIndex(nextHighlight);
          } else if (now - stableSinceRef.current >= CONFIRM_HOLD_MS) {
            startDraw(nextHighlight);
            return;
          }
        } else {
          lastCardIndexRef.current = null;
          setHighlightedCardIndex(null);
        }
      } catch (_) {}

      tickRef.current = requestAnimationFrame(detect);
    };

    const start = () => {
      if (video.videoWidth) tickRef.current = requestAnimationFrame(detect);
      else video.addEventListener('loadeddata', () => { tickRef.current = requestAnimationFrame(detect); }, { once: true });
    };
    const t = setTimeout(start, 400);
    return () => {
      clearTimeout(t);
      if (tickRef.current) cancelAnimationFrame(tickRef.current);
    };
  }, [phase, cameraAllowed, handReady, startDraw]);

  return (
    <>
      <Head>
        <title>塔罗牌 | Rina个人网站</title>
        <meta name="description" content="塔罗牌：牌桌抽牌，手指滑动选牌，保持2.5秒确认" />
        <link href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@600&display=swap" rel="stylesheet" />
      </Head>

      <div className={styles.wrap}>
        {/* 默认：牌桌 + 中央纸条「点击开始抽牌」 */}
        {phase === 'intro' && (
          <button type="button" className={styles.introNote} onClick={handleStart} aria-label="点击开始抽牌">
            <span className={styles.introNoteText}>点击开始抽牌</span>
          </button>
        )}

        {/* 展开动画：78张牌横着铺开 */}
        {(phase === 'spread' || phase === 'cards') && (
          <div className={styles.stepCards}>
            <div className={styles.cameraArea}>
              {cameraAllowed && (
                <video ref={videoRef} autoPlay muted playsInline className={styles.videoMirrorMatch} />
              )}
              {!cameraAllowed && <span className={styles.cameraPlaceholder}>开启摄像头以手势选牌</span>}
            </div>

            <div className={`${styles.spreadRowWrapper} ${phase === 'spread' ? styles.spreadAnimating : ''}`}>
              <div className={styles.spreadRow}>
                {Array.from({ length: TAROT_CARD_COUNT }, (_, i) => (
                  <div
                    key={i}
                    className={`${styles.spreadCard} ${highlightedCardIndex === i ? styles.cardLifted : ''} ${phase === 'reveal' && chosenCardIndex === i ? styles.cardRevealing : ''} ${phase === 'reveal' && chosenCardIndex !== i ? styles.cardFaded : ''}`}
                    style={{ '--spread-i': i }}
                  >
                    <div className={styles.cardInner}>
                      <div className={styles.cardBack} />
                      <div className={styles.cardFace}>
                        <span className={styles.cardSymbol}>✦</span>
                        <span className={styles.cardLabel}>塔罗</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {phase === 'cards' && (
              <>
                <p className={styles.instruction}>
                  {handReady ? '手指快速滑动可快速扫过牌面，慢速移动则一张张选；指向一张并保持 2.5 秒即确认抽取' : '正在加载手势识别…'}
                </p>
                <button type="button" className={styles.btnWand} onClick={() => startDraw(Math.floor(Math.random() * TAROT_CARD_COUNT))}>
                  或点击随机抽一张
                </button>
              </>
            )}
          </div>
        )}

        {(phase === 'reveal') && (
          <div className={styles.stepCards}>
            <div className={styles.spreadRowWrapper}>
              <div className={styles.spreadRow}>
                {Array.from({ length: TAROT_CARD_COUNT }, (_, i) => (
                  <div
                    key={i}
                    className={`${styles.spreadCard} ${chosenCardIndex === i ? styles.cardRevealing : ''} ${chosenCardIndex !== i ? styles.cardFaded : ''}`}
                    style={{ '--spread-i': i }}
                  >
                    <div className={styles.cardInner}>
                      <div className={styles.cardBack} />
                      <div className={styles.cardFace}>
                        <span className={styles.cardSymbol}>✦</span>
                        <span className={styles.cardLabel}>塔罗</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className={styles.revealBeam} aria-hidden="true" />
            <div className={styles.heartsFloating} aria-hidden="true">
              {[...Array(12)].map((_, i) => (
                <span key={i} className={styles.floatHeart} style={{ '--i': i }}>✦</span>
              ))}
            </div>
          </div>
        )}

        {phase === 'result' && (
          <div className={styles.stepResult}>
            <div className={styles.resultCard}>
              <p className={styles.resultText}>你抽到了这张牌</p>
              <p className={styles.resultSub}>塔罗 · 命运之选</p>
            </div>
            <button type="button" className={styles.btnAgain} onClick={handleAgain}>
              再抽一次
            </button>
          </div>
        )}
      </div>
    </>
  );
}

export default Valentine;
