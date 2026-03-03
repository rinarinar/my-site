// pages/valentine.js — 塔罗牌：抽3张，78张牌面与 tarotwhisper.org 一一对应
import Head from 'next/head';
import { useState, useRef, useEffect, useCallback } from 'react';
import styles from '../styles/Valentine.module.css';

// 78张塔罗牌与 https://tarotwhisper.org/tarot-card-meanings 顺序一一对应（大阿尔卡纳 0–21，权杖/圣杯/宝剑/星币）
const TAROT_CARDS = [
  { nameZh: '愚人', nameEn: 'The Fool', slug: 'the-fool' },
  { nameZh: '魔术师', nameEn: 'The Magician', slug: 'the-magician' },
  { nameZh: '女祭司', nameEn: 'The High Priestess', slug: 'the-high-priestess' },
  { nameZh: '女皇', nameEn: 'The Empress', slug: 'the-empress' },
  { nameZh: '皇帝', nameEn: 'The Emperor', slug: 'the-emperor' },
  { nameZh: '教皇', nameEn: 'The Hierophant', slug: 'the-hierophant' },
  { nameZh: '恋人', nameEn: 'The Lovers', slug: 'the-lovers' },
  { nameZh: '战车', nameEn: 'The Chariot', slug: 'the-chariot' },
  { nameZh: '力量', nameEn: 'Strength', slug: 'strength' },
  { nameZh: '隐士', nameEn: 'The Hermit', slug: 'the-hermit' },
  { nameZh: '命运之轮', nameEn: 'Wheel of Fortune', slug: 'wheel-of-fortune' },
  { nameZh: '正义', nameEn: 'Justice', slug: 'justice' },
  { nameZh: '吊人', nameEn: 'The Hanged Man', slug: 'the-hanged-man' },
  { nameZh: '死神', nameEn: 'Death', slug: 'death' },
  { nameZh: '节制', nameEn: 'Temperance', slug: 'temperance' },
  { nameZh: '恶魔', nameEn: 'The Devil', slug: 'the-devil' },
  { nameZh: '塔', nameEn: 'The Tower', slug: 'the-tower' },
  { nameZh: '星星', nameEn: 'The Star', slug: 'the-star' },
  { nameZh: '月亮', nameEn: 'The Moon', slug: 'the-moon' },
  { nameZh: '太阳', nameEn: 'The Sun', slug: 'the-sun' },
  { nameZh: '审判', nameEn: 'Judgement', slug: 'judgement' },
  { nameZh: '世界', nameEn: 'The World', slug: 'the-world' },
  { nameZh: '权杖王牌', nameEn: 'Ace of Wands', slug: 'ace-of-wands' },
  { nameZh: '权杖二', nameEn: 'Two of Wands', slug: 'two-of-wands' },
  { nameZh: '权杖三', nameEn: 'Three of Wands', slug: 'three-of-wands' },
  { nameZh: '权杖四', nameEn: 'Four of Wands', slug: 'four-of-wands' },
  { nameZh: '权杖五', nameEn: 'Five of Wands', slug: 'five-of-wands' },
  { nameZh: '权杖六', nameEn: 'Six of Wands', slug: 'six-of-wands' },
  { nameZh: '权杖七', nameEn: 'Seven of Wands', slug: 'seven-of-wands' },
  { nameZh: '权杖八', nameEn: 'Eight of Wands', slug: 'eight-of-wands' },
  { nameZh: '权杖九', nameEn: 'Nine of Wands', slug: 'nine-of-wands' },
  { nameZh: '权杖十', nameEn: 'Ten of Wands', slug: 'ten-of-wands' },
  { nameZh: '权杖侍者', nameEn: 'Page of Wands', slug: 'page-of-wands' },
  { nameZh: '权杖骑士', nameEn: 'Knight of Wands', slug: 'knight-of-wands' },
  { nameZh: '权杖皇后', nameEn: 'Queen of Wands', slug: 'queen-of-wands' },
  { nameZh: '权杖国王', nameEn: 'King of Wands', slug: 'king-of-wands' },
  { nameZh: '圣杯王牌', nameEn: 'Ace of Cups', slug: 'ace-of-cups' },
  { nameZh: '圣杯二', nameEn: 'Two of Cups', slug: 'two-of-cups' },
  { nameZh: '圣杯三', nameEn: 'Three of Cups', slug: 'three-of-cups' },
  { nameZh: '圣杯四', nameEn: 'Four of Cups', slug: 'four-of-cups' },
  { nameZh: '圣杯五', nameEn: 'Five of Cups', slug: 'five-of-cups' },
  { nameZh: '圣杯六', nameEn: 'Six of Cups', slug: 'six-of-cups' },
  { nameZh: '圣杯七', nameEn: 'Seven of Cups', slug: 'seven-of-cups' },
  { nameZh: '圣杯八', nameEn: 'Eight of Cups', slug: 'eight-of-cups' },
  { nameZh: '圣杯九', nameEn: 'Nine of Cups', slug: 'nine-of-cups' },
  { nameZh: '圣杯十', nameEn: 'Ten of Cups', slug: 'ten-of-cups' },
  { nameZh: '圣杯侍者', nameEn: 'Page of Cups', slug: 'page-of-cups' },
  { nameZh: '圣杯骑士', nameEn: 'Knight of Cups', slug: 'knight-of-cups' },
  { nameZh: '圣杯皇后', nameEn: 'Queen of Cups', slug: 'queen-of-cups' },
  { nameZh: '圣杯国王', nameEn: 'King of Cups', slug: 'king-of-cups' },
  { nameZh: '宝剑王牌', nameEn: 'Ace of Swords', slug: 'ace-of-swords' },
  { nameZh: '宝剑二', nameEn: 'Two of Swords', slug: 'two-of-swords' },
  { nameZh: '宝剑三', nameEn: 'Three of Swords', slug: 'three-of-swords' },
  { nameZh: '宝剑四', nameEn: 'Four of Swords', slug: 'four-of-swords' },
  { nameZh: '宝剑五', nameEn: 'Five of Swords', slug: 'five-of-swords' },
  { nameZh: '宝剑六', nameEn: 'Six of Swords', slug: 'six-of-swords' },
  { nameZh: '宝剑七', nameEn: 'Seven of Swords', slug: 'seven-of-swords' },
  { nameZh: '宝剑八', nameEn: 'Eight of Swords', slug: 'eight-of-swords' },
  { nameZh: '宝剑九', nameEn: 'Nine of Swords', slug: 'nine-of-swords' },
  { nameZh: '宝剑十', nameEn: 'Ten of Swords', slug: 'ten-of-swords' },
  { nameZh: '宝剑侍者', nameEn: 'Page of Swords', slug: 'page-of-swords' },
  { nameZh: '宝剑骑士', nameEn: 'Knight of Swords', slug: 'knight-of-swords' },
  { nameZh: '宝剑皇后', nameEn: 'Queen of Swords', slug: 'queen-of-swords' },
  { nameZh: '宝剑国王', nameEn: 'King of Swords', slug: 'king-of-swords' },
  { nameZh: '星币王牌', nameEn: 'Ace of Pentacles', slug: 'ace-of-pentacles' },
  { nameZh: '星币二', nameEn: 'Two of Pentacles', slug: 'two-of-pentacles' },
  { nameZh: '星币三', nameEn: 'Three of Pentacles', slug: 'three-of-pentacles' },
  { nameZh: '星币四', nameEn: 'Four of Pentacles', slug: 'four-of-pentacles' },
  { nameZh: '星币五', nameEn: 'Five of Pentacles', slug: 'five-of-pentacles' },
  { nameZh: '星币六', nameEn: 'Six of Pentacles', slug: 'six-of-pentacles' },
  { nameZh: '星币七', nameEn: 'Seven of Pentacles', slug: 'seven-of-pentacles' },
  { nameZh: '星币八', nameEn: 'Eight of Pentacles', slug: 'eight-of-pentacles' },
  { nameZh: '星币九', nameEn: 'Nine of Pentacles', slug: 'nine-of-pentacles' },
  { nameZh: '星币十', nameEn: 'Ten of Pentacles', slug: 'ten-of-pentacles' },
  { nameZh: '星币侍者', nameEn: 'Page of Pentacles', slug: 'page-of-pentacles' },
  { nameZh: '星币骑士', nameEn: 'Knight of Pentacles', slug: 'knight-of-pentacles' },
  { nameZh: '星币皇后', nameEn: 'Queen of Pentacles', slug: 'queen-of-pentacles' },
  { nameZh: '星币国王', nameEn: 'King of Pentacles', slug: 'king-of-pentacles' },
];

const TAROT_CARD_COUNT = TAROT_CARDS.length;
const DRAW_COUNT = 3;
const CONFIRM_HOLD_MS = 2000; // 固定在同一张牌 2s 确认抽牌
const REVEAL_DURATION_MS = 3800;
const HAND_SAMPLE_MS = 50;
const TOAST_DURATION_MS = 1600;
// 选牌：手指匀速或快速滑动=快速选牌，手指慢=正常速度选牌；保持镜像（手指往右→选牌往右）
const LERP_BASE = 0.12;   // 慢速时正常速度跟牌
const LERP_VELOCITY_FACTOR = 40; // 匀速/快速时快速跟牌
const LERP_ALPHA_MAX = 0.65;
const SNAP_VELOCITY_THRESHOLD = 0.012; // 超过此速度即快速跟到目标

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

  // 保持镜像：现实中手指往右 → 选牌往右（tipX 增大 → index 增大，最右=77）
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
                  {TAROT_CARDS.map((card, i) => (
                    <div
                      key={i}
                      className={`${styles.spreadCard} ${highlightedCardIndex === i ? styles.cardLifted : ''} ${drawnCards.includes(i) ? styles.cardPulledOut : ''}`}
                      style={{ '--spread-i': i }}
                    >
                      <div className={styles.cardInner}>
                        <div className={styles.cardBack} />
                        <div className={styles.cardFace}>
                          <span className={styles.cardNameZh}>{card.nameZh}</span>
                          <span className={styles.cardNameEn}>{card.nameEn}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {phase === 'cards' && (
                <>
                  <p className={styles.instruction}>
                    {handReady ? `请选第 ${drawStep + 1} 张牌（共3张），指向一张固定2秒即确认` : '正在加载手势识别…'}
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
                    {drawnCards[slot] !== null && (() => {
                      const card = TAROT_CARDS[drawnCards[slot]];
                      return card ? (
                        <div className={`${styles.drawnCard} ${animatingSlot === slot ? styles.drawnCardFlyIn : ''} ${phase === 'result' ? styles.drawnCardRevealed : ''}`}>
                          <div className={styles.cardInner}>
                            <div className={styles.cardBack} />
                            <div className={styles.cardFace}>
                              <span className={styles.cardNameZh}>{card.nameZh}</span>
                              <span className={styles.cardNameEn}>{card.nameEn}</span>
                            </div>
                          </div>
                        </div>
                      ) : null;
                    })()}
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
