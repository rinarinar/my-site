// pages/valentine.js — 塔罗牌：弧形牌面 → 手指指向抬牌 → 固定3s确认 → 揭晓
import Head from 'next/head';
import { useState, useRef, useEffect, useCallback } from 'react';
import styles from '../styles/Valentine.module.css';

const TAROT_CARD_COUNT = 7;
const CONFIRM_HOLD_MS = 3000; // 手指固定 3s 确认抽牌
const REVEAL_DURATION_MS = 3800;
const HAND_SAMPLE_MS = 80;

function Valentine() {
  const [phase, setPhase] = useState('cards'); // 'cards' | 'reveal' | 'result'
  const [chosenCardIndex, setChosenCardIndex] = useState(null);
  const [cameraAllowed, setCameraAllowed] = useState(false);
  const [handReady, setHandReady] = useState(false);
  const [highlightedCardIndex, setHighlightedCardIndex] = useState(null); // 当前指向的牌（抬起）
  const [triggered, setTriggered] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const handLandmarkerRef = useRef(null);
  const tickRef = useRef(null);
  const triggeredRef = useRef(false);
  const lastCardIndexRef = useRef(null);
  const stableSinceRef = useRef(0);

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

  const handleAgain = () => {
    setPhase('cards');
    setChosenCardIndex(null);
    triggeredRef.current = false;
    setTriggered(false);
    lastCardIndexRef.current = null;
    stableSinceRef.current = 0;
    setHighlightedCardIndex(null);
  };

  // 摄像头：进入 cards 即开
  useEffect(() => {
    if (phase !== 'cards') return;
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
    if (phase !== 'cards' || !cameraAllowed || !videoRef.current || !streamRef.current) return;
    videoRef.current.srcObject = streamRef.current;
  }, [phase, cameraAllowed]);

  // MediaPipe 手部识别
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

  // 根据食指指尖 x（0~1）映射到牌索引 0..6。视频已镜像，raw 中 tip.x 小=画面右=牌6，故用 1-x
  const getCardIndexFromTipX = (x) => {
    const i = Math.floor((1 - x) * TAROT_CARD_COUNT);
    return Math.max(0, Math.min(TAROT_CARD_COUNT - 1, i));
  };

  // 检测手指指向哪张牌，更新抬起状态；同一张牌固定 3s 则确认抽牌
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
          const cardIndex = getCardIndexFromTipX(tipX);
          const prev = lastCardIndexRef.current;
          if (prev !== cardIndex) {
            lastCardIndexRef.current = cardIndex;
            stableSinceRef.current = now;
            setHighlightedCardIndex(cardIndex);
          } else if (now - stableSinceRef.current >= CONFIRM_HOLD_MS) {
            startDraw(cardIndex);
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
    const t = setTimeout(start, 500);
    return () => {
      clearTimeout(t);
      if (tickRef.current) cancelAnimationFrame(tickRef.current);
    };
  }, [phase, cameraAllowed, handReady, startDraw]);

  return (
    <>
      <Head>
        <title>塔罗牌 | Rina个人网站</title>
        <meta name="description" content="塔罗牌：手指指向一张牌并保持3秒确认抽取" />
      </Head>

      <div className={styles.wrap}>
        {/* 弧形牌面 + 摄像头 / 揭晓 */}
        {(phase === 'cards' || phase === 'reveal') && (
          <div className={styles.stepCards}>
            <div className={styles.cardsArc}>
              {Array.from({ length: TAROT_CARD_COUNT }, (_, i) => (
                <div
                  key={i}
                  className={`${styles.arcCard} ${highlightedCardIndex === i ? styles.cardLifted : ''} ${phase === 'reveal' && chosenCardIndex === i ? styles.cardRevealing : ''} ${phase === 'reveal' && chosenCardIndex !== i ? styles.cardFaded : ''}`}
                  style={{ '--arc-i': i }}
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

            {phase === 'cards' && (
              <>
                <div className={styles.cameraArea}>
                  {cameraAllowed && (
                    <video ref={videoRef} autoPlay muted playsInline className={styles.videoMirrorMatch} />
                  )}
                  {!cameraAllowed && <span className={styles.cameraPlaceholder}>开启摄像头以手势选牌</span>}
                </div>
                <p className={styles.instruction}>
                  {handReady ? '用手指指向一张牌，被指中的牌会微微抬起；保持 3 秒即确认抽取' : '正在加载手势识别…'}
                </p>
                <button type="button" className={styles.btnWand} onClick={() => startDraw(Math.floor(Math.random() * TAROT_CARD_COUNT))}>
                  或点击随机抽一张
                </button>
              </>
            )}

            {phase === 'reveal' && (
              <>
                <div className={styles.revealBeam} aria-hidden="true" />
                <div className={styles.heartsFloating} aria-hidden="true">
                  {[...Array(12)].map((_, i) => (
                    <span key={i} className={styles.floatHeart} style={{ '--i': i }}>✦</span>
                  ))}
                </div>
              </>
            )}
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
