export default function HeroBackground() {
  // Bottle shifted left so ~60% is visible (left edge off-screen)
  // BX=-30 means left edge at -102, right edge at +114 — nicely cropped
  const BX = -30  // bottle center X (left half hidden off-screen)
  const BY = 660  // bottle center Y (mid-body)
  // Wave origin: behind the bottle (its center), waves burst out from behind
  const OX = -30  // wave origin X — same as bottle center (behind it)
  const OY = 660  // wave origin Y

  return (
    <div className="absolute inset-0 bg-black pointer-events-none">
      <div className="absolute inset-0 pointer-events-none">
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 1200 800"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            {/* Neon pulse dots on threads */}
            <radialGradient id="neonPulse1" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(255,255,255,1)" />
              <stop offset="30%" stopColor="rgba(251,146,60,1)" />
              <stop offset="70%" stopColor="rgba(249,115,22,0.8)" />
              <stop offset="100%" stopColor="rgba(249,115,22,0)" />
            </radialGradient>
            <radialGradient id="neonPulse2" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.9)" />
              <stop offset="25%" stopColor="rgba(251,146,60,0.9)" />
              <stop offset="60%" stopColor="rgba(234,88,12,0.7)" />
              <stop offset="100%" stopColor="rgba(234,88,12,0)" />
            </radialGradient>
            <radialGradient id="neonPulse3" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(255,255,255,1)" />
              <stop offset="35%" stopColor="rgba(251,146,60,1)" />
              <stop offset="75%" stopColor="rgba(234,88,12,0.6)" />
              <stop offset="100%" stopColor="rgba(234,88,12,0)" />
            </radialGradient>

            {/* Background text glow */}
            <radialGradient id="heroTextBg" cx="30%" cy="50%" r="70%">
              <stop offset="0%" stopColor="rgba(249,115,22,0.15)" />
              <stop offset="40%" stopColor="rgba(251,146,60,0.08)" />
              <stop offset="80%" stopColor="rgba(234,88,12,0.05)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0)" />
            </radialGradient>
            <filter id="heroTextBlur" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="12" result="blur" />
              <feTurbulence baseFrequency="0.7" numOctaves="4" result="noise" />
              <feColorMatrix in="noise" type="saturate" values="0" result="monoNoise" />
              <feComponentTransfer in="monoNoise" result="alphaAdjustedNoise">
                <feFuncA type="discrete" tableValues="0.03 0.06 0.09 0.12" />
              </feComponentTransfer>
              <feComposite in="blur" in2="alphaAdjustedNoise" operator="multiply" result="noisyBlur" />
              <feMerge><feMergeNode in="noisyBlur" /></feMerge>
            </filter>

            {/* Thread gradients — fade from bottle origin */}
            <linearGradient id="threadFade1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(249,115,22,0.9)" />
              <stop offset="50%" stopColor="rgba(251,146,60,0.6)" />
              <stop offset="100%" stopColor="rgba(249,115,22,0)" />
            </linearGradient>
            <linearGradient id="threadFade2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(251,146,60,0.8)" />
              <stop offset="55%" stopColor="rgba(249,115,22,0.5)" />
              <stop offset="100%" stopColor="rgba(234,88,12,0)" />
            </linearGradient>
            <linearGradient id="threadFade3" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(234,88,12,0.85)" />
              <stop offset="60%" stopColor="rgba(251,146,60,0.4)" />
              <stop offset="100%" stopColor="rgba(249,115,22,0)" />
            </linearGradient>

            <filter id="neonGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Bottle glow filters */}
            <filter id="bottleGlow" x="-60%" y="-40%" width="220%" height="180%">
              <feGaussianBlur stdDeviation="4" result="blur1" />
              <feGaussianBlur stdDeviation="10" result="blur2" />
              <feMerge>
                <feMergeNode in="blur2" />
                <feMergeNode in="blur1" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="bottleGlowStrong" x="-80%" y="-60%" width="260%" height="220%">
              <feGaussianBlur stdDeviation="8" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="haloFilter" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="22" />
            </filter>

            {/* Bottle body gradient — left edge darker, right highlight */}
            <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(249,115,22,0.05)" />
              <stop offset="18%" stopColor="rgba(249,115,22,0.12)" />
              <stop offset="45%" stopColor="rgba(249,115,22,0.08)" />
              <stop offset="72%" stopColor="rgba(255,180,80,0.18)" />
              <stop offset="100%" stopColor="rgba(249,115,22,0.06)" />
            </linearGradient>
            {/* Bottle stroke — neon orange edge glow */}
            <linearGradient id="strokeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(249,115,22,0.4)" />
              <stop offset="30%" stopColor="rgba(251,146,60,0.9)" />
              <stop offset="55%" stopColor="rgba(255,200,100,1)" />
              <stop offset="75%" stopColor="rgba(251,146,60,0.85)" />
              <stop offset="100%" stopColor="rgba(249,115,22,0.35)" />
            </linearGradient>
            <linearGradient id="strokeGradV" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(255,200,100,0.8)" />
              <stop offset="50%" stopColor="rgba(251,146,60,0.6)" />
              <stop offset="100%" stopColor="rgba(249,115,22,0.3)" />
            </linearGradient>
            <radialGradient id="bottleHalo" cx="50%" cy="55%" r="50%">
              <stop offset="0%" stopColor="rgba(249,115,22,0.5)" />
              <stop offset="50%" stopColor="rgba(249,115,22,0.2)" />
              <stop offset="100%" stopColor="rgba(249,115,22,0)" />
            </radialGradient>
            <radialGradient id="capHalo" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(255,180,80,0.6)" />
              <stop offset="100%" stopColor="rgba(249,115,22,0)" />
            </radialGradient>
          </defs>

          {/* === BACKGROUND GLOW === */}
          <g>
            <ellipse cx="300" cy="350" rx="400" ry="200" fill="url(#heroTextBg)" filter="url(#heroTextBlur)" opacity="0.6" />
            <ellipse cx="350" cy="320" rx="500" ry="250" fill="url(#heroTextBg)" filter="url(#heroTextBlur)" opacity="0.4" />
            <ellipse cx="400" cy="300" rx="600" ry="300" fill="url(#heroTextBg)" filter="url(#heroTextBlur)" opacity="0.2" />
          </g>

          {/* === WAVES FROM BEHIND BOTTLE — wide fan across full screen height === */}
          {/* Origin OX,OY is bottle center (behind it). Waves fan from top to bottom edge */}

          {/* --- UPPER FAN (above bottle, sweeping up-right) --- */}

          {/* Thread U1 — extreme top */}
          <path id="threadU1" d={`M${OX} ${OY} Q200 400 450 220 Q650 80 900 40 Q1050 20 1200 10`} stroke="url(#threadFade1)" strokeWidth="0.6" fill="none" opacity="0.5" />
          <circle r="1.4" fill="url(#neonPulse1)" opacity="1" filter="url(#neonGlow)">
            <animateMotion dur="5.8s" repeatCount="indefinite"><mpath href="#threadU1" /></animateMotion>
          </circle>

          {/* Thread U2 */}
          <path id="threadU2" d={`M${OX} ${OY} Q180 430 400 280 Q600 150 850 100 Q1020 65 1200 50`} stroke="url(#threadFade2)" strokeWidth="1.0" fill="none" opacity="0.6" />
          <circle r="2" fill="url(#neonPulse2)" opacity="1" filter="url(#neonGlow)">
            <animateMotion dur="5.2s" repeatCount="indefinite"><mpath href="#threadU2" /></animateMotion>
          </circle>

          {/* Thread U3 */}
          <path id="threadU3" d={`M${OX} ${OY} Q220 460 460 320 Q660 210 880 160 Q1060 125 1250 110`} stroke="url(#threadFade3)" strokeWidth="1.4" fill="none" opacity="0.7" />
          <circle r="2.8" fill="url(#neonPulse3)" opacity="1" filter="url(#neonGlow)">
            <animateMotion dur="4.6s" repeatCount="indefinite"><mpath href="#threadU3" /></animateMotion>
          </circle>

          {/* Thread U4 */}
          <path id="threadU4" d={`M${OX} ${OY} Q240 490 490 370 Q700 270 920 225 Q1080 192 1260 180`} stroke="url(#threadFade1)" strokeWidth="0.8" fill="none" opacity="0.65" />
          <circle r="1.8" fill="url(#neonPulse1)" opacity="1" filter="url(#neonGlow)">
            <animateMotion dur="5.5s" repeatCount="indefinite"><mpath href="#threadU4" /></animateMotion>
          </circle>

          {/* Thread U5 */}
          <path id="threadU5" d={`M${OX} ${OY} Q260 510 510 410 Q720 330 940 290 Q1090 260 1270 248`} stroke="url(#threadFade2)" strokeWidth="1.2" fill="none" opacity="0.75" />
          <circle r="2.4" fill="url(#neonPulse2)" opacity="1" filter="url(#neonGlow)">
            <animateMotion dur="4.3s" repeatCount="indefinite"><mpath href="#threadU5" /></animateMotion>
          </circle>

          {/* Thread U6 */}
          <path id="threadU6" d={`M${OX} ${OY} Q280 528 530 450 Q740 385 955 350 Q1100 322 1280 312`} stroke="url(#threadFade3)" strokeWidth="1.5" fill="none" opacity="0.8" />
          <circle r="3" fill="url(#neonPulse3)" opacity="1" filter="url(#neonGlow)">
            <animateMotion dur="4.0s" repeatCount="indefinite"><mpath href="#threadU6" /></animateMotion>
          </circle>

          {/* Thread U7 */}
          <path id="threadU7" d={`M${OX} ${OY} Q295 538 548 480 Q758 430 966 400 Q1108 376 1285 368`} stroke="url(#threadFade1)" strokeWidth="0.9" fill="none" opacity="0.7" />
          <circle r="2.1" fill="url(#neonPulse1)" opacity="1" filter="url(#neonGlow)">
            <animateMotion dur="5.0s" repeatCount="indefinite"><mpath href="#threadU7" /></animateMotion>
          </circle>

          {/* Thread U8 */}
          <path id="threadU8" d={`M${OX} ${OY} Q308 548 560 506 Q770 468 978 444 Q1115 424 1290 418`} stroke="url(#threadFade2)" strokeWidth="1.3" fill="none" opacity="0.75" />
          <circle r="2.6" fill="url(#neonPulse2)" opacity="1" filter="url(#neonGlow)">
            <animateMotion dur="4.7s" repeatCount="indefinite"><mpath href="#threadU8" /></animateMotion>
          </circle>

          {/* Thread U9 */}
          <path id="threadU9" d={`M${OX} ${OY} Q315 556 568 526 Q778 496 986 476 Q1120 460 1292 456`} stroke="url(#threadFade3)" strokeWidth="0.6" fill="none" opacity="0.6" />
          <circle r="1.4" fill="url(#neonPulse3)" opacity="1" filter="url(#neonGlow)">
            <animateMotion dur="5.4s" repeatCount="indefinite"><mpath href="#threadU9" /></animateMotion>
          </circle>

          {/* --- MIDDLE FAN (near bottle height, near-horizontal) --- */}

          {/* Thread M1 — near horizontal upper-mid */}
          <path id="threadM1" d={`M${OX} ${OY} Q300 590 520 555 Q720 522 920 530 Q1080 538 1260 510 Q1350 496 1440 480`} stroke="url(#threadFade1)" strokeWidth="1.5" fill="none" opacity="0.9" />
          <circle r="3.2" fill="url(#neonPulse1)" opacity="1" filter="url(#neonGlow)">
            <animateMotion dur="4.1s" repeatCount="indefinite"><mpath href="#threadM1" /></animateMotion>
          </circle>

          {/* Thread M2 */}
          <path id="threadM2" d={`M${OX} ${OY} Q310 610 540 580 Q740 552 940 558 Q1100 564 1280 538 Q1360 522 1450 506`} stroke="url(#threadFade2)" strokeWidth="1.1" fill="none" opacity="0.8" />
          <circle r="2.5" fill="url(#neonPulse2)" opacity="1" filter="url(#neonGlow)">
            <animateMotion dur="4.8s" repeatCount="indefinite"><mpath href="#threadM2" /></animateMotion>
          </circle>

          {/* Thread M3 */}
          <path id="threadM3" d={`M${OX} ${OY} Q320 628 558 600 Q758 574 958 580 Q1116 586 1296 560 Q1372 546 1460 530`} stroke="url(#threadFade3)" strokeWidth="0.8" fill="none" opacity="0.7" />
          <circle r="2" fill="url(#neonPulse3)" opacity="1" filter="url(#neonGlow)">
            <animateMotion dur="5.2s" repeatCount="indefinite"><mpath href="#threadM3" /></animateMotion>
          </circle>

          {/* Thread M4 */}
          <path id="threadM4" d={`M${OX} ${OY} Q330 644 574 618 Q774 594 974 600 Q1132 606 1310 582 Q1384 568 1470 554`} stroke="url(#threadFade1)" strokeWidth="1.3" fill="none" opacity="0.85" />
          <circle r="2.8" fill="url(#neonPulse1)" opacity="1" filter="url(#neonGlow)">
            <animateMotion dur="4.4s" repeatCount="indefinite"><mpath href="#threadM4" /></animateMotion>
          </circle>

          {/* Thread M5 */}
          <path id="threadM5" d={`M${OX} ${OY} Q338 658 588 634 Q788 612 988 618 Q1146 624 1324 602 Q1396 588 1480 576`} stroke="url(#threadFade2)" strokeWidth="0.6" fill="none" opacity="0.65" />
          <circle r="1.5" fill="url(#neonPulse2)" opacity="1" filter="url(#neonGlow)">
            <animateMotion dur="5.7s" repeatCount="indefinite"><mpath href="#threadM5" /></animateMotion>
          </circle>

          {/* Thread M6 */}
          <path id="threadM6" d={`M${OX} ${OY} Q344 670 600 648 Q800 628 1000 634 Q1158 640 1336 620 Q1406 608 1490 596`} stroke="url(#threadFade3)" strokeWidth="1.5" fill="none" opacity="0.9" />
          <circle r="3.2" fill="url(#neonPulse3)" opacity="1" filter="url(#neonGlow)">
            <animateMotion dur="4.2s" repeatCount="indefinite"><mpath href="#threadM6" /></animateMotion>
          </circle>

          {/* --- LOWER FAN (below bottle, sweeping down-right) --- */}

          {/* Thread D1 */}
          <path id="threadD1" d={`M${OX} ${OY} Q340 700 580 690 Q780 680 980 690 Q1140 698 1320 678 Q1400 668 1480 658`} stroke="url(#threadFade1)" strokeWidth="1.0" fill="none" opacity="0.75" />
          <circle r="2.2" fill="url(#neonPulse1)" opacity="1" filter="url(#neonGlow)">
            <animateMotion dur="5.1s" repeatCount="indefinite"><mpath href="#threadD1" /></animateMotion>
          </circle>

          {/* Thread D2 */}
          <path id="threadD2" d={`M${OX} ${OY} Q340 720 570 718 Q770 716 970 726 Q1130 734 1308 720 Q1388 712 1470 704`} stroke="url(#threadFade2)" strokeWidth="1.4" fill="none" opacity="0.8" />
          <circle r="2.9" fill="url(#neonPulse2)" opacity="1" filter="url(#neonGlow)">
            <animateMotion dur="4.6s" repeatCount="indefinite"><mpath href="#threadD2" /></animateMotion>
          </circle>

          {/* Thread D3 */}
          <path id="threadD3" d={`M${OX} ${OY} Q330 740 556 746 Q756 752 956 762 Q1118 770 1298 760 Q1378 754 1460 748`} stroke="url(#threadFade3)" strokeWidth="0.8" fill="none" opacity="0.65" />
          <circle r="1.8" fill="url(#neonPulse3)" opacity="1" filter="url(#neonGlow)">
            <animateMotion dur="5.5s" repeatCount="indefinite"><mpath href="#threadD3" /></animateMotion>
          </circle>

          {/* Thread D4 */}
          <path id="threadD4" d={`M${OX} ${OY} Q310 758 528 772 Q730 786 930 796 Q1100 804 1280 796 Q1362 792 1446 788`} stroke="url(#threadFade1)" strokeWidth="1.2" fill="none" opacity="0.7" />
          <circle r="2.4" fill="url(#neonPulse1)" opacity="1" filter="url(#neonGlow)">
            <animateMotion dur="4.9s" repeatCount="indefinite"><mpath href="#threadD4" /></animateMotion>
          </circle>

          {/* Thread D5 — sweeping down toward bottom-right */}
          <path id="threadD5" d={`M${OX} ${OY} Q280 778 500 808 Q700 830 900 840 Q1060 848 1240 842 Q1340 838 1440 834`} stroke="url(#threadFade2)" strokeWidth="0.6" fill="none" opacity="0.55" />
          <circle r="1.4" fill="url(#neonPulse2)" opacity="1" filter="url(#neonGlow)">
            <animateMotion dur="6.0s" repeatCount="indefinite"><mpath href="#threadD5" /></animateMotion>
          </circle>

          {/* Thread D6 — near bottom edge */}
          <path id="threadD6" d={`M${OX} ${OY} Q240 800 460 840 Q660 870 860 882 Q1030 892 1210 888 Q1320 884 1430 880`} stroke="url(#threadFade3)" strokeWidth="1.1" fill="none" opacity="0.65" />
          <circle r="2.2" fill="url(#neonPulse3)" opacity="1" filter="url(#neonGlow)">
            <animateMotion dur="5.3s" repeatCount="indefinite"><mpath href="#threadD6" /></animateMotion>
          </circle>

          {/* Thread D7 — extreme bottom sweep */}
          <path id="threadD7" d={`M${OX} ${OY} Q190 830 420 876 Q620 910 820 924 Q1000 936 1190 932 Q1310 928 1430 924`} stroke="url(#threadFade1)" strokeWidth="0.5" fill="none" opacity="0.45" />
          <circle r="1.2" fill="url(#neonPulse1)" opacity="1" filter="url(#neonGlow)">
            <animateMotion dur="6.4s" repeatCount="indefinite"><mpath href="#threadD7" /></animateMotion>
          </circle>

          {/* === NEON PERFUME BOTTLE — rendered on top of waves === */}
          <ellipse cx={BX} cy={BY + 30} rx="105" ry="140" fill="url(#bottleHalo)" filter="url(#haloFilter)" opacity="0.9">
            <animate attributeName="opacity" values="0.7;1;0.7" dur="3.5s" repeatCount="indefinite" />
          </ellipse>
          <ellipse cx={BX} cy="590" rx="58" ry="42" fill="url(#capHalo)" filter="url(#haloFilter)" opacity="0.7">
            <animate attributeName="opacity" values="0.5;0.9;0.5" dur="2.8s" repeatCount="indefinite" />
          </ellipse>

          <g filter="url(#bottleGlow)">
            {/* ── BODY ── */}
            <rect x={BX - 72} y="630" width="144" height="160" rx="4" ry="4" fill="url(#bodyGrad)" />
            <rect x={BX - 72} y="630" width="144" height="160" rx="4" ry="4" stroke="url(#strokeGrad)" strokeWidth="2" fill="none" />
            <line x1={BX - 72} y1="640" x2={BX - 62} y2="630" stroke="rgba(251,146,60,0.5)" strokeWidth="1" />
            <line x1={BX + 62} y1="630" x2={BX + 72} y2="640" stroke="rgba(251,146,60,0.5)" strokeWidth="1" />
            <line x1={BX - 72} y1="780" x2={BX - 62} y2="790" stroke="rgba(251,146,60,0.3)" strokeWidth="1" />
            <line x1={BX + 62} y1="790" x2={BX + 72} y2="780" stroke="rgba(251,146,60,0.3)" strokeWidth="1" />
            <line x1={BX - 52} y1="634" x2={BX - 52} y2="786" stroke="rgba(255,180,80,0.18)" strokeWidth="1.2" />
            <line x1={BX - 20} y1="632" x2={BX - 20} y2="788" stroke="rgba(255,180,80,0.12)" strokeWidth="0.8" />
            <line x1={BX + 20} y1="632" x2={BX + 20} y2="788" stroke="rgba(255,180,80,0.08)" strokeWidth="0.6" />
            <line x1={BX + 52} y1="634" x2={BX + 52} y2="786" stroke="rgba(255,200,100,0.22)" strokeWidth="1.4" />
            <line x1={BX + 70} y1="642" x2={BX + 70} y2="778" stroke="rgba(255,220,140,0.55)" strokeWidth="1.5" />
            <line x1={BX - 60} y1="700" x2={BX + 60} y2="700" stroke="rgba(251,146,60,0.2)" strokeWidth="0.8" />
            <line x1={BX - 60} y1="760" x2={BX + 60} y2="760" stroke="rgba(251,146,60,0.15)" strokeWidth="0.8" />
            <rect x={BX - 50} y="706" width="100" height="48" rx="1" ry="1" stroke="rgba(251,146,60,0.25)" strokeWidth="0.7" fill="none" />
            <line x1={BX - 72} y1="790" x2={BX + 72} y2="790" stroke="rgba(255,200,100,0.6)" strokeWidth="2.5" />
            <line x1={BX - 60} y1="793" x2={BX + 60} y2="793" stroke="rgba(251,146,60,0.3)" strokeWidth="1" />
            {/* ── SHOULDER ── */}
            <path d={`M ${BX - 72} 630 L ${BX - 36} 614 L ${BX + 36} 614 L ${BX + 72} 630`} stroke="url(#strokeGrad)" strokeWidth="1.6" fill="url(#bodyGrad)" />
            <line x1={BX - 36} y1="614" x2={BX + 36} y2="614" stroke="rgba(255,200,100,0.55)" strokeWidth="1.2" />
            {/* ── NECK ── */}
            <rect x={BX - 22} y="578" width="44" height="37" rx="2" ry="2" fill="rgba(249,115,22,0.07)" stroke="url(#strokeGrad)" strokeWidth="1.5" />
            <line x1={BX - 12} y1="580" x2={BX - 12} y2="613" stroke="rgba(255,180,80,0.2)" strokeWidth="0.8" />
            <line x1={BX + 12} y1="580" x2={BX + 12} y2="613" stroke="rgba(255,200,120,0.25)" strokeWidth="0.8" />
            <rect x={BX - 26} y="610" width="52" height="8" rx="1" fill="rgba(249,115,22,0.1)" stroke="rgba(255,180,80,0.7)" strokeWidth="1.2" />
            {/* ── CAP ── */}
            <rect x={BX - 48} y="530" width="96" height="50" rx="3" ry="3" fill="rgba(249,115,22,0.1)" stroke="url(#strokeGrad)" strokeWidth="2" />
            <line x1={BX - 46} y1="532" x2={BX + 46} y2="532" stroke="rgba(255,220,140,0.7)" strokeWidth="1.5" />
            <line x1={BX - 46} y1="578" x2={BX + 46} y2="578" stroke="rgba(255,180,80,0.5)" strokeWidth="1" />
            <line x1={BX - 48} y1="540" x2={BX - 38} y2="530" stroke="rgba(251,146,60,0.6)" strokeWidth="1" />
            <line x1={BX + 38} y1="530" x2={BX + 48} y2="540" stroke="rgba(251,146,60,0.6)" strokeWidth="1" />
            <line x1={BX - 28} y1="533" x2={BX - 28} y2="576" stroke="rgba(255,180,80,0.2)" strokeWidth="0.8" />
            <line x1={BX + 28} y1="533" x2={BX + 28} y2="576" stroke="rgba(255,200,120,0.3)" strokeWidth="1" />
            <line x1={BX + 46} y1="538" x2={BX + 46} y2="572" stroke="rgba(255,220,140,0.6)" strokeWidth="1.2" />
            <path d={`M ${BX - 48} 530 L ${BX - 42} 522 L ${BX + 42} 522 L ${BX + 48} 530`} stroke="rgba(255,200,100,0.5)" strokeWidth="1.2" fill="rgba(249,115,22,0.06)" />
            <line x1={BX - 42} y1="522" x2={BX + 42} y2="522" stroke="rgba(255,220,140,0.6)" strokeWidth="1" />
          </g>

          {/* Pulsing neon outline */}
          <rect x={BX - 72} y="630" width="144" height="160" rx="4" ry="4" stroke="rgba(249,115,22,0.6)" strokeWidth="3.5" fill="none" filter="url(#neonGlow)">
            <animate attributeName="opacity" values="0.25;0.75;0.25" dur="2.8s" repeatCount="indefinite" />
          </rect>
          <rect x={BX - 48} y="530" width="96" height="50" rx="3" ry="3" stroke="rgba(255,160,50,0.5)" strokeWidth="3" fill="none" filter="url(#neonGlow)">
            <animate attributeName="opacity" values="0.2;0.6;0.2" dur="2.8s" repeatCount="indefinite" />
          </rect>

        </svg>
      </div>
    </div>
  )
}