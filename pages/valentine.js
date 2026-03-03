// pages/valentine.js — 塔罗牌：抽3张，每张在同一张牌上固定2s确认 → 弹出「第x张牌」→ 牌飞入下方居中
import Head from 'next/head';
import { useState, useRef, useEffect, useCallback } from 'react';
import styles from '../styles/Valentine.module.css';

const TAROT_CARD_COUNT = 78;
const DRAW_COUNT = 3;
const CONFIRM_HOLD_MS = 2000; // 固定在同一张牌 2s 确认抽牌
const REVEAL_DURATION_MS = 3800;
const HAND_SAMPLE_MS = 50;
const TOAST_DURATION_MS = 1600;
// 选牌跟随：匀速=快速滑过，快速突然移动=大幅度滑过，慢速=慢速选牌；画面最左/最右=最左/最右牌
const LERP_BASE = 0.04;   // 慢速移动时慢速跟牌
const LERP_VELOCITY_FACTOR = 35; // 匀速/快速移动时快速跟牌
const LERP_ALPHA_MAX = 0.6;
const SNAP_VELOCITY_THRESHOLD = 0.018; // 超过此速度视为突然快速移动，直接大幅度跟到目标

function Valentine() {
  const [phase, setPhase] = useState('intro');
  const [cameraAllowed, setCameraAllowed] = useState(false);
  const [handReady, setHandReady] = useState(false);
  const [highlightedCardIndex, setHighlightedCardIndex] = useState(null);
  const [drawStep, setDrawStep] = useState(0); // 0,1,2 当前抽第几张
  const [drawnCards, setDrawnCards] = useState([null, null, null]); // 3张牌的索引
  const [toastMessage, setToastMessage] = useState(null); // "第1张牌" 等
  const [animatingSlot, setAnimatingSlot] = useState(null); // 正在播放飞入动画的槽位 0|1|2

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const handLandmarkerRef = useRef(null);
  const tickRef = useRef(null);
  const currentSelectionRef = useRef(39); // 当前选牌位置（连续值 0..77），用于平滑跟随
  const stableSinceRef = useRef(0);
  const lastTipXRef = useRef(0.5);
  const lastTipTimeRef = useRef(0);
  const triggeredForStepRef = useRef(false);

  const startDraw = useCallback((cardIndex) => {
    if (phase !== 'cards' || drawStep >= DRAW_COUNT || triggeredForStepRef.current) return;
    const chosen = Math.max(0, Math.min(TAROT_CARD_COUNT - 1, cardIndex));
    triggeredForStepRef.current = true;
    setAnimatingSlot(drawStep);
    setDrawnCards((prev) => {
      const next = [...prev];
      next[drawStep] = chosen;
      return next;
    });
    setToastMessage(`第${drawStep + 1}张牌`);
    setHighlightedCardIndex(null);
    currentSelectionRef.current = 39;

    setTimeout(() => setToastMessage(null), TOAST_DURATION_MS);
    setTimeout(() => {
      setDrawStep((s) => {
        const next = s + 1;
        if (next >= DRAW_COUNT) setPhase('result');
        return next;
      });
      triggeredForStepRef.current = false;
      setAnimatingSlot(null);
    }, TOAST_DURATION_MS + 600);
  }, [phase, drawStep]);

  const handleStart = () => {
    if (phase !== 'intro') return;
    setPhase('spread');
    setDrawStep(0);
    setDrawnCards([null, null, null]);
    setToastMessage(null);
    setAnimatingSlot(null);
    triggeredForStepRef.current = false;
    setTimeout(() => setPhase('cards'), 2600);
  };

  const handleAgain = () => {
    setPhase('intro');
    setDrawStep(0);
    setDrawnCards([null, null, null]);
    setToastMessage(null);
    setAnimatingSlot(null);
    currentSelectionRef.current = 39;
    setHighlightedCardIndex(null);
    triggeredForStepRef.current = false;
  };

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

  // 画面最左(tipX≈0)→最左牌(index 0)，画面最右(tipX≈1)→最右牌(index 77)
  const getTargetContinuous = (tipX) => {
    const c = tipX * (TAROT_CARD_COUNT - 1);
    return Math.max(0, Math.min(TAROT_CARD_COUNT - 1, c));
  };

  useEffect(() => {
    if (phase !== 'cards' || !cameraAllowed || !videoRef.current || !handReady || drawStep >= DRAW_COUNT || triggeredForStepRef.current) return;
    const video = videoRef.current;
    const landmarker = handLandmarkerRef.current;
    if (!landmarker) return;

    let lastSampleTime = 0;
    const detect = (timestamp) => {
      if (triggeredForStepRef.current || drawStep >= DRAW_COUNT) return;
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
          const targetContinuous = getTargetContinuous(tipX);
          const deltaMs = Math.max(1, now - lastTipTimeRef.current);
          const velocity = Math.abs(tipX - lastTipXRef.current) / deltaMs;
          lastTipXRef.current = tipX;
          lastTipTimeRef.current = now;

          // 慢速=慢跟、匀速=快跟、快速突然移动=大幅度滑到目标
          const alpha = velocity >= SNAP_VELOCITY_THRESHOLD
            ? 1
            : Math.min(LERP_ALPHA_MAX, LERP_BASE + velocity * LERP_VELOCITY_FACTOR);
          const current = currentSelectionRef.current;
          currentSelectionRef.current = current + (targetContinuous - current) * alpha;
          currentSelectionRef.current = Math.max(0, Math.min(TAROT_CARD_COUNT - 1, currentSelectionRef.current));

          const rounded = Math.round(currentSelectionRef.current);
          const roundedClamped = Math.max(0, Math.min(TAROT_CARD_COUNT - 1, rounded));
          setHighlightedCardIndex(roundedClamped);

          if (roundedClamped !== Math.round(current)) {
            stableSinceRef.current = now;
          } else if (now - stableSinceRef.current >= CONFIRM_HOLD_MS) {
            startDraw(roundedClamped);
            return;
          }
        } else {
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
  }, [phase, cameraAllowed, handReady, drawStep, startDraw]);

  return (
    <>
      <Head>
        <title>塔罗牌 | Rina个人网站</title>
        <meta name="description" content="塔罗牌：抽3张牌，手指滑动选牌，固定2秒确认抽取" />
        <link href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@600&display=swap" rel="stylesheet" />
      </Head>

      <div className={styles.wrap}>
        {phase === 'intro' && (
          <button type="button" className={styles.introNote} onClick={handleStart} aria-label="点击开始抽牌">
            <span className={styles.introNoteText}>点击开始抽牌</span>
          </button>
        )}

        {(phase === 'spread' || phase === 'cards' || phase === 'result') && (
          <div className={styles.stepCards}>
            <div className={styles.cameraArea}>
              {cameraAllowed && (
                <video ref={videoRef} autoPlay muted playsInline className={styles.videoMirrorMatch} />
              )}
              {!cameraAllowed && <span className={styles.cameraPlaceholder}>开启摄像头以手势选牌</span>}
            </div>

            <div className={styles.spreadSection}>
              <div className={`${styles.spreadRowWrapper} ${phase === 'spread' ? styles.spreadAnimating : ''}`}>
                <div className={styles.spreadRow}>
                  {Array.from({ length: TAROT_CARD_COUNT }, (_, i) => (
                    <div
                      key={i}
                      className={`${styles.spreadCard} ${highlightedCardIndex === i ? styles.cardLifted : ''} ${drawnCards.includes(i) ? styles.cardPulledOut : ''}`}
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
                    {handReady ? `请选第 ${drawStep + 1} 张牌（共3张），指向一张点一下即确认` : '正在加载手势识别…'}
                  </p>
                  <button type="button" className={styles.btnWand} onClick={() => startDraw(Math.floor(Math.random() * TAROT_CARD_COUNT))}>
                    或点击随机抽当前张
                  </button>
                </>
              )}
            </div>

            {/* 底部：抽出的3张牌居中 */}
            <div className={styles.drawnSection}>
              <div className={styles.drawnRow}>
                {[0, 1, 2].map((slot) => (
                  <div key={slot} className={styles.drawnSlot}>
                    {drawnCards[slot] !== null && (
                      <div className={`${styles.drawnCard} ${animatingSlot === slot ? styles.drawnCardFlyIn : ''} ${phase === 'result' ? styles.drawnCardRevealed : ''}`}>
                        <div className={styles.cardInner}>
                          <div className={styles.cardBack} />
                          <div className={styles.cardFace}>
                            <span className={styles.cardSymbol}>✦</span>
                            <span className={styles.cardLabel}>塔罗</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {toastMessage && (
          <div className={styles.toast} role="status">
            {toastMessage}
          </div>
        )}

        {phase === 'result' && (
          <div className={styles.resultActions}>
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
