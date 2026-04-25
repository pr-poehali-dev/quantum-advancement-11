export default function HeroBackground() {
  // Bottle center: cx=148, body bottom: y=760, top of cap: y=570
  // All threads originate from bottle center-right area ~(210, 660)
  const BX = 148  // bottle center X
  const BY = 660  // bottle center Y (mid-body)
  const OX = 210  // wave origin X (right side of bottle)
  const OY = 665  // wave origin Y

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

          {/* === NEON PERFUME BOTTLE (Chanel-style) === */}
          {/* Halo glow behind bottle */}
          <ellipse cx={BX} cy={BY + 30} rx="105" ry="140" fill="url(#bottleHalo)" filter="url(#haloFilter)" opacity="0.9">
            <animate attributeName="opacity" values="0.7;1;0.7" dur="3.5s" repeatCount="indefinite" />
          </ellipse>

          {/* Cap halo */}
          <ellipse cx={BX} cy="590" rx="58" ry="42" fill="url(#capHalo)" filter="url(#haloFilter)" opacity="0.7">
            <animate attributeName="opacity" values="0.5;0.9;0.5" dur="2.8s" repeatCount="indefinite" />
          </ellipse>

          <g filter="url(#bottleGlow)">

            {/* ── BODY: main rectangular flask ── */}
            {/* Body fill */}
            <rect x={BX - 72} y="630" width="144" height="160" rx="4" ry="4"
              fill="url(#bodyGrad)" />
            {/* Body outer stroke — neon orange */}
            <rect x={BX - 72} y="630" width="144" height="160" rx="4" ry="4"
              stroke="url(#strokeGrad)" strokeWidth="2" fill="none" />

            {/* Body chamfer lines (inner bevel — like crystal glass) */}
            {/* Top-left bevel */}
            <line x1={BX - 72} y1="640" x2={BX - 62} y2="630"
              stroke="rgba(251,146,60,0.5)" strokeWidth="1" />
            {/* Top-right bevel */}
            <line x1={BX + 62} y1="630" x2={BX + 72} y2="640"
              stroke="rgba(251,146,60,0.5)" strokeWidth="1" />
            {/* Bottom-left bevel */}
            <line x1={BX - 72} y1="780" x2={BX - 62} y2="790"
              stroke="rgba(251,146,60,0.3)" strokeWidth="1" />
            {/* Bottom-right bevel */}
            <line x1={BX + 62} y1="790" x2={BX + 72} y2="780"
              stroke="rgba(251,146,60,0.3)" strokeWidth="1" />

            {/* Inner vertical highlight lines (glass facets) */}
            <line x1={BX - 52} y1="634" x2={BX - 52} y2="786"
              stroke="rgba(255,180,80,0.18)" strokeWidth="1.2" />
            <line x1={BX - 20} y1="632" x2={BX - 20} y2="788"
              stroke="rgba(255,180,80,0.12)" strokeWidth="0.8" />
            <line x1={BX + 20} y1="632" x2={BX + 20} y2="788"
              stroke="rgba(255,180,80,0.08)" strokeWidth="0.6" />
            <line x1={BX + 52} y1="634" x2={BX + 52} y2="786"
              stroke="rgba(255,200,100,0.22)" strokeWidth="1.4" />

            {/* Right-side bright highlight (light source) */}
            <line x1={BX + 70} y1="642" x2={BX + 70} y2="778"
              stroke="rgba(255,220,140,0.55)" strokeWidth="1.5" />

            {/* Inner horizontal divider (label zone top) */}
            <line x1={BX - 60} y1="700" x2={BX + 60} y2="700"
              stroke="rgba(251,146,60,0.2)" strokeWidth="0.8" />
            {/* Inner horizontal divider (label zone bottom) */}
            <line x1={BX - 60} y1="760" x2={BX + 60} y2="760"
              stroke="rgba(251,146,60,0.15)" strokeWidth="0.8" />

            {/* Label inner rect */}
            <rect x={BX - 50} y="706" width="100" height="48" rx="1" ry="1"
              stroke="rgba(251,146,60,0.25)" strokeWidth="0.7" fill="none" />

            {/* Bottom base — thicker base line */}
            <line x1={BX - 72} y1="790" x2={BX + 72} y2="790"
              stroke="rgba(255,200,100,0.6)" strokeWidth="2.5" />
            <line x1={BX - 60} y1="793" x2={BX + 60} y2="793"
              stroke="rgba(251,146,60,0.3)" strokeWidth="1" />

            {/* ── SHOULDER: tapered transition body→neck ── */}
            <path d={`M ${BX - 72} 630 L ${BX - 36} 614 L ${BX + 36} 614 L ${BX + 72} 630`}
              stroke="url(#strokeGrad)" strokeWidth="1.6" fill="url(#bodyGrad)" />
            {/* Shoulder top edge */}
            <line x1={BX - 36} y1="614" x2={BX + 36} y2="614"
              stroke="rgba(255,200,100,0.55)" strokeWidth="1.2" />

            {/* ── NECK ── */}
            <rect x={BX - 22} y="578" width="44" height="37" rx="2" ry="2"
              fill="rgba(249,115,22,0.07)"
              stroke="url(#strokeGrad)" strokeWidth="1.5" />
            {/* Neck inner lines */}
            <line x1={BX - 12} y1="580" x2={BX - 12} y2="613"
              stroke="rgba(255,180,80,0.2)" strokeWidth="0.8" />
            <line x1={BX + 12} y1="580" x2={BX + 12} y2="613"
              stroke="rgba(255,200,120,0.25)" strokeWidth="0.8" />
            {/* Neck collar ring */}
            <rect x={BX - 26} y="610" width="52" height="8" rx="1"
              fill="rgba(249,115,22,0.1)"
              stroke="rgba(255,180,80,0.7)" strokeWidth="1.2" />

            {/* ── CAP: wide flat-top square stopper (Chanel style) ── */}
            {/* Cap body */}
            <rect x={BX - 48} y="530" width="96" height="50" rx="3" ry="3"
              fill="rgba(249,115,22,0.1)"
              stroke="url(#strokeGrad)" strokeWidth="2" />
            {/* Cap top edge highlight */}
            <line x1={BX - 46} y1="532" x2={BX + 46} y2="532"
              stroke="rgba(255,220,140,0.7)" strokeWidth="1.5" />
            {/* Cap bottom edge */}
            <line x1={BX - 46} y1="578" x2={BX + 46} y2="578"
              stroke="rgba(255,180,80,0.5)" strokeWidth="1" />
            {/* Cap chamfer — top corners */}
            <line x1={BX - 48} y1="540" x2={BX - 38} y2="530"
              stroke="rgba(251,146,60,0.6)" strokeWidth="1" />
            <line x1={BX + 38} y1="530" x2={BX + 48} y2="540"
              stroke="rgba(251,146,60,0.6)" strokeWidth="1" />
            {/* Cap inner facet lines */}
            <line x1={BX - 28} y1="533" x2={BX - 28} y2="576"
              stroke="rgba(255,180,80,0.2)" strokeWidth="0.8" />
            <line x1={BX + 28} y1="533" x2={BX + 28} y2="576"
              stroke="rgba(255,200,120,0.3)" strokeWidth="1" />
            {/* Cap right highlight */}
            <line x1={BX + 46} y1="538" x2={BX + 46} y2="572"
              stroke="rgba(255,220,140,0.6)" strokeWidth="1.2" />

            {/* Cap top surface bevel — slight 3D perspective lines */}
            <path d={`M ${BX - 48} 530 L ${BX - 42} 522 L ${BX + 42} 522 L ${BX + 48} 530`}
              stroke="rgba(255,200,100,0.5)" strokeWidth="1.2" fill="rgba(249,115,22,0.06)" />
            <line x1={BX - 42} y1="522" x2={BX + 42} y2="522"
              stroke="rgba(255,220,140,0.6)" strokeWidth="1" />
          </g>

          {/* Pulsing neon outline — breathing glow */}
          <rect x={BX - 72} y="630" width="144" height="160" rx="4" ry="4"
            stroke="rgba(249,115,22,0.6)" strokeWidth="3.5" fill="none" filter="url(#neonGlow)">
            <animate attributeName="opacity" values="0.25;0.75;0.25" dur="2.8s" repeatCount="indefinite" />
          </rect>
          <rect x={BX - 48} y="530" width="96" height="50" rx="3" ry="3"
            stroke="rgba(255,160,50,0.5)" strokeWidth="3" fill="none" filter="url(#neonGlow)">
            <animate attributeName="opacity" values="0.2;0.6;0.2" dur="2.8s" repeatCount="indefinite" />
          </rect>

          {/* === WAVES FROM BOTTLE === */}
          {/* All threads originate from right side of bottle ~(OX, OY) */}

          {/* Thread 1 */}
          <path id="thread1" d={`M${OX} ${OY} Q350 590 500 540 Q650 490 800 520 Q950 550 1100 460 Q1200 400 1300 340`} stroke="url(#threadFade1)" strokeWidth="0.8" fill="none" opacity="0.8" />
          <circle r="2" fill="url(#neonPulse1)" opacity="1" filter="url(#neonGlow)">
            <animateMotion dur="4s" repeatCount="indefinite"><mpath href="#thread1" /></animateMotion>
          </circle>

          {/* Thread 2 */}
          <path id="thread2" d={`M${OX} ${OY} Q370 610 530 570 Q690 530 840 560 Q990 590 1140 500 Q1260 430 1350 370`} stroke="url(#threadFade2)" strokeWidth="1.5" fill="none" opacity="0.7" />
          <circle r="3" fill="url(#neonPulse2)" opacity="1" filter="url(#neonGlow)">
            <animateMotion dur="5s" repeatCount="indefinite"><mpath href="#thread2" /></animateMotion>
          </circle>

          {/* Thread 3 */}
          <path id="thread3" d={`M${OX} ${OY} Q330 580 470 530 Q610 480 750 510 Q890 540 1040 450 Q1160 375 1250 330`} stroke="url(#threadFade3)" strokeWidth="1.2" fill="none" opacity="0.8" />
          <circle r="2.5" fill="url(#neonPulse1)" opacity="1" filter="url(#neonGlow)">
            <animateMotion dur="4.5s" repeatCount="indefinite"><mpath href="#thread3" /></animateMotion>
          </circle>

          {/* Thread 4 */}
          <path id="thread4" d={`M${OX} ${OY} Q390 630 560 590 Q730 550 880 580 Q1030 610 1180 520 Q1300 445 1400 390`} stroke="url(#threadFade1)" strokeWidth="0.6" fill="none" opacity="0.6" />
          <circle r="1.5" fill="url(#neonPulse3)" opacity="1" filter="url(#neonGlow)">
            <animateMotion dur="5.5s" repeatCount="indefinite"><mpath href="#thread4" /></animateMotion>
          </circle>

          {/* Thread 5 */}
          <path id="thread5" d={`M${OX} ${OY} Q360 600 510 555 Q660 510 800 535 Q940 565 1090 475 Q1210 405 1330 355`} stroke="url(#threadFade2)" strokeWidth="1.0" fill="none" opacity="0.7" />
          <circle r="2.2" fill="url(#neonPulse2)" opacity="1" filter="url(#neonGlow)">
            <animateMotion dur="4.2s" repeatCount="indefinite"><mpath href="#thread5" /></animateMotion>
          </circle>

          {/* Thread 6 */}
          <path id="thread6" d={`M${OX} ${OY} Q410 640 580 610 Q750 580 900 610 Q1050 640 1200 555 Q1320 485 1450 420`} stroke="url(#threadFade3)" strokeWidth="1.3" fill="none" opacity="0.6" />
          <circle r="2.8" fill="url(#neonPulse1)" opacity="1" filter="url(#neonGlow)">
            <animateMotion dur="5.2s" repeatCount="indefinite"><mpath href="#thread6" /></animateMotion>
          </circle>

          {/* Thread 7 */}
          <path id="thread7" d={`M${OX} ${OY} Q340 585 480 535 Q620 485 760 515 Q900 545 1050 455 Q1180 370 1300 335`} stroke="url(#threadFade1)" strokeWidth="0.9" fill="none" opacity="0.8" />
          <circle r="2" fill="url(#neonPulse3)" opacity="1" filter="url(#neonGlow)">
            <animateMotion dur="4.8s" repeatCount="indefinite"><mpath href="#thread7" /></animateMotion>
          </circle>

          {/* Thread 8 */}
          <path id="thread8" d={`M${OX} ${OY} Q380 620 540 575 Q700 530 850 560 Q1000 590 1150 500 Q1270 430 1380 380`} stroke="url(#threadFade2)" strokeWidth="1.4" fill="none" opacity="0.7" />
          <circle r="3" fill="url(#neonPulse2)" opacity="1" filter="url(#neonGlow)">
            <animateMotion dur="5.8s" repeatCount="indefinite"><mpath href="#thread8" /></animateMotion>
          </circle>

          {/* Thread 9 */}
          <path id="thread9" d={`M${OX} ${OY} Q320 575 455 525 Q590 475 730 505 Q870 535 1010 445 Q1140 360 1240 325`} stroke="url(#threadFade3)" strokeWidth="0.5" fill="none" opacity="0.6" />
          <circle r="1.2" fill="url(#neonPulse1)" opacity="1" filter="url(#neonGlow)">
            <animateMotion dur="6s" repeatCount="indefinite"><mpath href="#thread9" /></animateMotion>
          </circle>

          {/* Thread 10 */}
          <path id="thread10" d={`M${OX} ${OY} Q400 635 565 595 Q730 555 875 585 Q1020 615 1165 525 Q1285 455 1370 400`} stroke="url(#threadFade1)" strokeWidth="1.1" fill="none" opacity="0.8" />
          <circle r="2.5" fill="url(#neonPulse3)" opacity="1" filter="url(#neonGlow)">
            <animateMotion dur="4.3s" repeatCount="indefinite"><mpath href="#thread10" /></animateMotion>
          </circle>

          {/* Thread 11 */}
          <path id="thread11" d={`M${OX} ${OY} Q355 598 495 552 Q635 508 775 535 Q915 565 1055 478 Q1175 400 1295 360`} stroke="url(#threadFade2)" strokeWidth="0.4" fill="none" opacity="0.5" />
          <circle r="1" fill="url(#neonPulse2)" opacity="1" filter="url(#neonGlow)">
            <animateMotion dur="5.7s" repeatCount="indefinite"><mpath href="#thread11" /></animateMotion>
          </circle>

          {/* Thread 12 */}
          <path id="thread12" d={`M${OX} ${OY} Q425 650 600 615 Q775 580 920 610 Q1065 640 1210 560 Q1330 495 1440 445`} stroke="url(#threadFade3)" strokeWidth="1.5" fill="none" opacity="0.7" />
          <circle r="3.2" fill="url(#neonPulse1)" opacity="1" filter="url(#neonGlow)">
            <animateMotion dur="4.7s" repeatCount="indefinite"><mpath href="#thread12" /></animateMotion>
          </circle>

          {/* Thread 13 */}
          <path id="thread13" d={`M${OX} ${OY} Q345 588 482 540 Q620 492 758 520 Q896 550 1036 462 Q1158 382 1268 345`} stroke="url(#threadFade1)" strokeWidth="0.7" fill="none" opacity="0.6" />
          <circle r="1.8" fill="url(#neonPulse3)" opacity="1" filter="url(#neonGlow)">
            <animateMotion dur="5.3s" repeatCount="indefinite"><mpath href="#thread13" /></animateMotion>
          </circle>

          {/* Thread 14 */}
          <path id="thread14" d={`M${OX} ${OY} Q365 607 520 565 Q675 525 815 555 Q955 585 1100 498 Q1218 425 1325 385`} stroke="url(#threadFade2)" strokeWidth="1.0" fill="none" opacity="0.8" />
          <circle r="2.3" fill="url(#neonPulse2)" opacity="1" filter="url(#neonGlow)">
            <animateMotion dur="4.9s" repeatCount="indefinite"><mpath href="#thread14" /></animateMotion>
          </circle>

          {/* Thread 15 */}
          <path id="thread15" d={`M${OX} ${OY} Q310 572 442 522 Q574 472 714 502 Q854 532 994 442 Q1120 358 1220 320`} stroke="url(#threadFade3)" strokeWidth="0.3" fill="none" opacity="0.4" />
          <circle r="0.8" fill="url(#neonPulse1)" opacity="1" filter="url(#neonGlow)">
            <animateMotion dur="6.2s" repeatCount="indefinite"><mpath href="#thread15" /></animateMotion>
          </circle>

          {/* Thread 16 */}
          <path id="thread16" d={`M${OX} ${OY} Q435 657 610 625 Q785 595 928 625 Q1072 655 1218 575 Q1338 510 1448 462`} stroke="url(#threadFade1)" strokeWidth="1.5" fill="none" opacity="0.9" />
          <circle r="3.2" fill="url(#neonPulse2)" opacity="1" filter="url(#neonGlow)">
            <animateMotion dur="4.1s" repeatCount="indefinite"><mpath href="#thread16" /></animateMotion>
          </circle>

          {/* Thread 17 — upward diagonal */}
          <path id="thread17" d={`M${OX} ${OY} Q350 580 500 510 Q650 440 800 450 Q950 460 1100 390 Q1200 340 1300 300`} stroke="url(#threadFade2)" strokeWidth="0.8" fill="none" opacity="0.6" />
          <circle r="1.8" fill="url(#neonPulse3)" opacity="1" filter="url(#neonGlow)">
            <animateMotion dur="5.1s" repeatCount="indefinite"><mpath href="#thread17" /></animateMotion>
          </circle>

          {/* Thread 18 */}
          <path id="thread18" d={`M${OX} ${OY} Q370 615 525 578 Q680 542 822 568 Q965 596 1108 508 Q1228 438 1342 392`} stroke="url(#threadFade3)" strokeWidth="1.2" fill="none" opacity="0.7" />
          <circle r="2.6" fill="url(#neonPulse1)" opacity="1" filter="url(#neonGlow)">
            <animateMotion dur="4.6s" repeatCount="indefinite"><mpath href="#thread18" /></animateMotion>
          </circle>

          {/* Thread 19 */}
          <path id="thread19" d={`M${OX} ${OY} Q336 582 468 534 Q600 486 740 514 Q880 542 1020 454 Q1142 372 1248 338`} stroke="url(#threadFade1)" strokeWidth="0.6" fill="none" opacity="0.5" />
          <circle r="1.4" fill="url(#neonPulse2)" opacity="1" filter="url(#neonGlow)">
            <animateMotion dur="5.4s" repeatCount="indefinite"><mpath href="#thread19" /></animateMotion>
          </circle>

          {/* Thread 20 */}
          <path id="thread20" d={`M${OX} ${OY} Q445 664 622 634 Q800 606 942 636 Q1084 666 1228 588 Q1348 525 1456 478`} stroke="url(#threadFade2)" strokeWidth="1.4" fill="none" opacity="0.8" />
          <circle r="3" fill="url(#neonPulse3)" opacity="1" filter="url(#neonGlow)">
            <animateMotion dur="4.4s" repeatCount="indefinite"><mpath href="#thread20" /></animateMotion>
          </circle>

          {/* Thread 21 */}
          <path id="thread21" d={`M${OX} ${OY} Q325 568 455 518 Q585 468 725 498 Q865 528 1005 440 Q1128 358 1232 322`} stroke="url(#threadFade3)" strokeWidth="0.5" fill="none" opacity="0.5" />
          <circle r="1.2" fill="url(#neonPulse1)" opacity="1" filter="url(#neonGlow)">
            <animateMotion dur="5.9s" repeatCount="indefinite"><mpath href="#thread21" /></animateMotion>
          </circle>

          {/* Thread 22 */}
          <path id="thread22" d={`M${OX} ${OY} Q388 625 548 586 Q708 548 850 576 Q992 606 1138 518 Q1258 448 1365 402`} stroke="url(#threadFade1)" strokeWidth="1.1" fill="none" opacity="0.7" />
          <circle r="2.5" fill="url(#neonPulse3)" opacity="1" filter="url(#neonGlow)">
            <animateMotion dur="4.8s" repeatCount="indefinite"><mpath href="#thread22" /></animateMotion>
          </circle>

          {/* Thread 23 */}
          <path id="thread23" d={`M${OX} ${OY} Q352 593 490 546 Q628 500 768 528 Q908 558 1048 468 Q1168 385 1278 350`} stroke="url(#threadFade2)" strokeWidth="0.9" fill="none" opacity="0.6" />
          <circle r="2.1" fill="url(#neonPulse2)" opacity="1" filter="url(#neonGlow)">
            <animateMotion dur="5.2s" repeatCount="indefinite"><mpath href="#thread23" /></animateMotion>
          </circle>

          {/* Thread 24 */}
          <path id="thread24" d={`M${OX} ${OY} Q415 645 588 608 Q762 572 904 600 Q1046 630 1192 548 Q1312 480 1420 435`} stroke="url(#threadFade3)" strokeWidth="1.3" fill="none" opacity="0.8" />
          <circle r="2.9" fill="url(#neonPulse1)" opacity="1" filter="url(#neonGlow)">
            <animateMotion dur="4.2s" repeatCount="indefinite"><mpath href="#thread24" /></animateMotion>
          </circle>

          {/* Thread 25 */}
          <path id="thread25" d={`M${OX} ${OY} Q343 586 478 538 Q614 492 754 520 Q894 550 1034 462 Q1154 380 1260 346`} stroke="url(#threadFade1)" strokeWidth="0.7" fill="none" opacity="0.5" />
          <circle r="1.6" fill="url(#neonPulse3)" opacity="1" filter="url(#neonGlow)">
            <animateMotion dur="5.6s" repeatCount="indefinite"><mpath href="#thread25" /></animateMotion>
          </circle>

          {/* Thread 26 */}
          <path id="thread26" d={`M${OX} ${OY} Q455 670 634 642 Q814 616 956 646 Q1098 676 1244 598 Q1362 535 1468 490`} stroke="url(#threadFade2)" strokeWidth="1.0" fill="none" opacity="0.7" />
          <circle r="2.4" fill="url(#neonPulse2)" opacity="1" filter="url(#neonGlow)">
            <animateMotion dur="4.7s" repeatCount="indefinite"><mpath href="#thread26" /></animateMotion>
          </circle>

          {/* Thread 27 */}
          <path id="thread27" d={`M${OX} ${OY} Q362 602 505 558 Q648 515 788 542 Q928 570 1068 480 Q1188 398 1298 362`} stroke="url(#threadFade3)" strokeWidth="0.4" fill="none" opacity="0.4" />
          <circle r="1" fill="url(#neonPulse1)" opacity="1" filter="url(#neonGlow)">
            <animateMotion dur="6.1s" repeatCount="indefinite"><mpath href="#thread27" /></animateMotion>
          </circle>

          {/* Thread 28 */}
          <path id="thread28" d={`M${OX} ${OY} Q404 638 572 600 Q740 564 882 592 Q1024 622 1170 534 Q1290 465 1398 420`} stroke="url(#threadFade1)" strokeWidth="1.5" fill="none" opacity="0.9" />
          <circle r="3.1" fill="url(#neonPulse3)" opacity="1" filter="url(#neonGlow)">
            <animateMotion dur="4.3s" repeatCount="indefinite"><mpath href="#thread28" /></animateMotion>
          </circle>

          {/* Thread 29 */}
          <path id="thread29" d={`M${OX} ${OY} Q334 577 465 528 Q596 480 736 508 Q876 538 1016 450 Q1136 368 1244 334`} stroke="url(#threadFade2)" strokeWidth="0.8" fill="none" opacity="0.6" />
          <circle r="2" fill="url(#neonPulse2)" opacity="1" filter="url(#neonGlow)">
            <animateMotion dur="5.3s" repeatCount="indefinite"><mpath href="#thread29" /></animateMotion>
          </circle>

          {/* Thread 30 */}
          <path id="thread30" d={`M${OX} ${OY} Q466 678 648 652 Q830 628 972 658 Q1114 688 1260 612 Q1378 550 1482 506`} stroke="url(#threadFade3)" strokeWidth="1.2" fill="none" opacity="0.8" />
          <circle r="2.7" fill="url(#neonPulse1)" opacity="1" filter="url(#neonGlow)">
            <animateMotion dur="4.5s" repeatCount="indefinite"><mpath href="#thread30" /></animateMotion>
          </circle>

          {/* Thread 31 */}
          <path id="thread31" d={`M${OX} ${OY} Q375 612 522 568 Q670 526 810 552 Q950 580 1090 492 Q1210 412 1318 376`} stroke="url(#threadFade1)" strokeWidth="0.6" fill="none" opacity="0.5" />
          <circle r="1.5" fill="url(#neonPulse3)" opacity="1" filter="url(#neonGlow)">
            <animateMotion dur="5.8s" repeatCount="indefinite"><mpath href="#thread31" /></animateMotion>
          </circle>

          {/* Thread 32 */}
          <path id="thread32" d={`M${OX} ${OY} Q393 630 556 592 Q720 556 862 584 Q1004 614 1150 526 Q1270 458 1378 414`} stroke="url(#threadFade2)" strokeWidth="1.4" fill="none" opacity="0.8" />
          <circle r="3" fill="url(#neonPulse1)" opacity="1" filter="url(#neonGlow)">
            <animateMotion dur="4.1s" repeatCount="indefinite"><mpath href="#thread32" /></animateMotion>
          </circle>

          {/* Thread 33 */}
          <path id="thread33" d={`M${OX} ${OY} Q360 596 504 550 Q648 506 788 532 Q928 560 1068 472 Q1188 390 1296 356`} stroke="url(#threadFade3)" strokeWidth="0.9" fill="none" opacity="0.6" />
          <circle r="2.1" fill="url(#neonPulse2)" opacity="1" filter="url(#neonGlow)">
            <animateMotion dur="5.1s" repeatCount="indefinite"><mpath href="#thread33" /></animateMotion>
          </circle>

          {/* Thread 34 */}
          <path id="thread34" d={`M${OX} ${OY} Q476 685 660 660 Q844 638 986 668 Q1128 698 1274 624 Q1392 562 1494 520`} stroke="url(#threadFade1)" strokeWidth="1.1" fill="none" opacity="0.7" />
          <circle r="2.6" fill="url(#neonPulse3)" opacity="1" filter="url(#neonGlow)">
            <animateMotion dur="4.9s" repeatCount="indefinite"><mpath href="#thread34" /></animateMotion>
          </circle>

          {/* Thread 35 */}
          <path id="thread35" d={`M${OX} ${OY} Q347 583 480 536 Q614 490 754 518 Q894 548 1034 460 Q1154 378 1258 344`} stroke="url(#threadFade2)" strokeWidth="0.3" fill="none" opacity="0.4" />
          <circle r="0.8" fill="url(#neonPulse1)" opacity="1" filter="url(#neonGlow)">
            <animateMotion dur="6.3s" repeatCount="indefinite"><mpath href="#thread35" /></animateMotion>
          </circle>

          {/* Thread 36 */}
          <path id="thread36" d={`M${OX} ${OY} Q460 674 642 648 Q824 624 966 652 Q1108 682 1254 606 Q1372 546 1476 502`} stroke="url(#threadFade3)" strokeWidth="1.5" fill="none" opacity="0.9" />
          <circle r="3.2" fill="url(#neonPulse2)" opacity="1" filter="url(#neonGlow)">
            <animateMotion dur="4.0s" repeatCount="indefinite"><mpath href="#thread36" /></animateMotion>
          </circle>

        </svg>
      </div>
    </div>
  )
}
