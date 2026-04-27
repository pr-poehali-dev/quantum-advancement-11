export default function HeroBackground() {
  // Bottle: large, left-bottom corner, mostly off-screen left
  const BX = 62    // bottle center X — 60% visible on left side of screen
  const BY = 660   // bottle center Y (mid-body)
  const S  = 1.45  // scale factor for bottle size
  // Wave origin: from right side of bottle at mid-body level
  const OX = BX + Math.round(72 * S)  // right edge of bottle body
  const OY = 600                        // mid-body height

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

          {/* === WAVES — original diagonal flow, origin behind bottle === */}

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
          <path id="thread3" d={`M${OX} ${OY} Q330 580 470 530 Q610 480 750 510 Q890 540 1040 450 Q1160 375 1250 330`} stroke="url(#threadFade3)" strokeWidth="1.1" fill="none" opacity="0.75" />
          <circle r="2.5" fill="url(#neonPulse3)" opacity="1" filter="url(#neonGlow)">
            <animateMotion dur="4.5s" repeatCount="indefinite"><mpath href="#thread3" /></animateMotion>
          </circle>

          {/* Thread 4 */}
          <path id="thread4" d={`M${OX} ${OY} Q380 620 550 585 Q720 550 870 578 Q1020 605 1170 515 Q1280 450 1370 390`} stroke="url(#threadFade1)" strokeWidth="1.3" fill="none" opacity="0.65" />
          <circle r="2" fill="url(#neonPulse1)" opacity="0.9" filter="url(#neonGlow)">
            <animateMotion dur="5.5s" repeatCount="indefinite"><mpath href="#thread4" /></animateMotion>
          </circle>

          {/* Thread 5 */}
          <path id="thread5" d={`M${OX} ${OY} Q320 570 455 520 Q590 470 725 498 Q860 525 1010 438 Q1130 362 1220 318`} stroke="url(#threadFade2)" strokeWidth="0.7" fill="none" opacity="0.6" />
          <circle r="1.8" fill="url(#neonPulse2)" opacity="0.85" filter="url(#neonGlow)">
            <animateMotion dur="4.8s" repeatCount="indefinite"><mpath href="#thread5" /></animateMotion>
          </circle>

          {/* Thread 6 */}
          <path id="thread6" d={`M${OX} ${OY} Q390 630 565 598 Q740 565 892 592 Q1044 618 1195 528 Q1308 462 1395 402`} stroke="url(#threadFade3)" strokeWidth="1.0" fill="none" opacity="0.55" />
          <circle r="2.2" fill="url(#neonPulse3)" opacity="0.8" filter="url(#neonGlow)">
            <animateMotion dur="6s" repeatCount="indefinite"><mpath href="#thread6" /></animateMotion>
          </circle>

          {/* Thread 7 */}
          <path id="thread7" d={`M${OX} ${OY} Q310 560 440 508 Q570 456 700 482 Q830 508 980 422 Q1100 348 1188 305`} stroke="url(#threadFade1)" strokeWidth="0.6" fill="none" opacity="0.5" />
          <circle r="1.6" fill="url(#neonPulse1)" opacity="0.75" filter="url(#neonGlow)">
            <animateMotion dur="5.2s" repeatCount="indefinite"><mpath href="#thread7" /></animateMotion>
          </circle>

          {/* Thread 8 */}
          <path id="thread8" d={`M${OX} ${OY} Q400 640 580 610 Q760 580 915 606 Q1070 630 1220 542 Q1335 475 1420 415`} stroke="url(#threadFade2)" strokeWidth="1.2" fill="none" opacity="0.6" />
          <circle r="2.4" fill="url(#neonPulse2)" opacity="0.85" filter="url(#neonGlow)">
            <animateMotion dur="4.3s" repeatCount="indefinite"><mpath href="#thread8" /></animateMotion>
          </circle>

          {/* Thread 9 */}
          <path id="thread9" d={`M${OX} ${OY} Q300 550 425 496 Q550 442 675 466 Q800 490 948 406 Q1068 334 1155 292`} stroke="url(#threadFade3)" strokeWidth="0.5" fill="none" opacity="0.45" />
          <circle r="1.5" fill="url(#neonPulse3)" opacity="0.7" filter="url(#neonGlow)">
            <animateMotion dur="5.8s" repeatCount="indefinite"><mpath href="#thread9" /></animateMotion>
          </circle>

          {/* Thread 10 */}
          <path id="thread10" d={`M${OX} ${OY} Q410 648 592 620 Q774 592 930 617 Q1086 642 1238 554 Q1352 488 1438 428`} stroke="url(#threadFade1)" strokeWidth="0.9" fill="none" opacity="0.5" />
          <circle r="1.9" fill="url(#neonPulse1)" opacity="0.75" filter="url(#neonGlow)">
            <animateMotion dur="6.3s" repeatCount="indefinite"><mpath href="#thread10" /></animateMotion>
          </circle>

          {/* Thread 11 */}
          <path id="thread11" d={`M${OX} ${OY} Q290 542 410 485 Q530 428 650 450 Q770 472 916 390 Q1035 320 1122 280`} stroke="url(#threadFade2)" strokeWidth="0.7" fill="none" opacity="0.55" />
          <circle r="2.1" fill="url(#neonPulse2)" opacity="0.8" filter="url(#neonGlow)">
            <animateMotion dur="4.7s" repeatCount="indefinite"><mpath href="#thread11" /></animateMotion>
          </circle>

          {/* Thread 12 */}
          <path id="thread12" d={`M${OX} ${OY} Q358 602 515 558 Q672 514 818 542 Q964 570 1112 482 Q1230 415 1318 355`} stroke="url(#threadFade3)" strokeWidth="1.4" fill="none" opacity="0.5" />
          <circle r="2.3" fill="url(#neonPulse3)" opacity="0.75" filter="url(#neonGlow)">
            <animateMotion dur="5.6s" repeatCount="indefinite"><mpath href="#thread12" /></animateMotion>
          </circle>

          {/* Thread 13 */}
          <path id="thread13" d={`M${OX} ${OY} Q342 595 492 548 Q642 501 785 530 Q928 558 1078 470 Q1196 404 1285 344`} stroke="url(#threadFade1)" strokeWidth="0.8" fill="none" opacity="0.6" />
          <circle r="2" fill="url(#neonPulse1)" opacity="0.8" filter="url(#neonGlow)">
            <animateMotion dur="4.1s" repeatCount="indefinite"><mpath href="#thread13" /></animateMotion>
          </circle>

          {/* Thread 14 */}
          <path id="thread14" d={`M${OX} ${OY} Q375 615 542 578 Q709 540 858 568 Q1007 595 1158 506 Q1274 440 1362 380`} stroke="url(#threadFade2)" strokeWidth="1.1" fill="none" opacity="0.55" />
          <circle r="2.2" fill="url(#neonPulse2)" opacity="0.75" filter="url(#neonGlow)">
            <animateMotion dur="5.3s" repeatCount="indefinite"><mpath href="#thread14" /></animateMotion>
          </circle>

          {/* Thread 15 */}
          <path id="thread15" d={`M${OX} ${OY} Q315 565 448 514 Q581 463 714 490 Q847 516 994 430 Q1112 358 1200 315`} stroke="url(#threadFade3)" strokeWidth="0.6" fill="none" opacity="0.5" />
          <circle r="1.7" fill="url(#neonPulse3)" opacity="0.7" filter="url(#neonGlow)">
            <animateMotion dur="4.9s" repeatCount="indefinite"><mpath href="#thread15" /></animateMotion>
          </circle>

          {/* Thread 16 */}
          <path id="thread16" d={`M${OX} ${OY} Q385 625 558 590 Q731 555 882 582 Q1033 608 1184 520 Q1298 454 1385 394`} stroke="url(#threadFade1)" strokeWidth="1.0" fill="none" opacity="0.5" />
          <circle r="2" fill="url(#neonPulse1)" opacity="0.7" filter="url(#neonGlow)">
            <animateMotion dur="6.1s" repeatCount="indefinite"><mpath href="#thread16" /></animateMotion>
          </circle>

          {/* Thread 17 */}
          <path id="thread17" d={`M${OX} ${OY} Q278 535 398 478 Q518 421 635 444 Q752 466 898 385 Q1016 315 1102 275`} stroke="url(#threadFade2)" strokeWidth="0.5" fill="none" opacity="0.4" />
          <circle r="1.5" fill="url(#neonPulse2)" opacity="0.65" filter="url(#neonGlow)">
            <animateMotion dur="5.4s" repeatCount="indefinite"><mpath href="#thread17" /></animateMotion>
          </circle>

          {/* Thread 18 */}
          <path id="thread18" d={`M${OX} ${OY} Q395 633 572 600 Q749 566 902 592 Q1055 617 1207 530 Q1320 464 1408 404`} stroke="url(#threadFade3)" strokeWidth="1.3" fill="none" opacity="0.48" />
          <circle r="2.3" fill="url(#neonPulse3)" opacity="0.7" filter="url(#neonGlow)">
            <animateMotion dur="4.6s" repeatCount="indefinite"><mpath href="#thread18" /></animateMotion>
          </circle>

          {/* Thread 19 */}
          <path id="thread19" d={`M${OX} ${OY} Q360 608 520 565 Q680 522 826 550 Q972 578 1122 490 Q1240 424 1328 364`} stroke="url(#threadFade1)" strokeWidth="0.9" fill="none" opacity="0.58" />
          <circle r="1.9" fill="url(#neonPulse1)" opacity="0.78" filter="url(#neonGlow)">
            <animateMotion dur="5.1s" repeatCount="indefinite"><mpath href="#thread19" /></animateMotion>
          </circle>

          {/* Thread 20 */}
          <path id="thread20" d={`M${OX} ${OY} Q325 575 462 524 Q599 473 732 500 Q865 526 1012 440 Q1130 368 1218 325`} stroke="url(#threadFade2)" strokeWidth="0.7" fill="none" opacity="0.52" />
          <circle r="1.8" fill="url(#neonPulse2)" opacity="0.73" filter="url(#neonGlow)">
            <animateMotion dur="4.4s" repeatCount="indefinite"><mpath href="#thread20" /></animateMotion>
          </circle>

          {/* Thread 21 */}
          <path id="thread21" d={`M${OX} ${OY} Q404 638 584 607 Q764 575 918 601 Q1072 626 1224 538 Q1338 472 1425 412`} stroke="url(#threadFade3)" strokeWidth="1.1" fill="none" opacity="0.46" />
          <circle r="2.1" fill="url(#neonPulse3)" opacity="0.68" filter="url(#neonGlow)">
            <animateMotion dur="5.9s" repeatCount="indefinite"><mpath href="#thread21" /></animateMotion>
          </circle>

          {/* Thread 22 */}
          <path id="thread22" d={`M${OX} ${OY} Q268 528 385 470 Q502 412 617 434 Q732 456 876 376 Q993 307 1078 268`} stroke="url(#threadFade1)" strokeWidth="0.4" fill="none" opacity="0.38" />
          <circle r="1.4" fill="url(#neonPulse1)" opacity="0.6" filter="url(#neonGlow)">
            <animateMotion dur="6.2s" repeatCount="indefinite"><mpath href="#thread22" /></animateMotion>
          </circle>

          {/* Thread 23 */}
          <path id="thread23" d={`M${OX} ${OY} Q345 598 498 554 Q651 510 796 538 Q941 566 1090 478 Q1208 412 1296 352`} stroke="url(#threadFade2)" strokeWidth="0.8" fill="none" opacity="0.56" />
          <circle r="2" fill="url(#neonPulse2)" opacity="0.76" filter="url(#neonGlow)">
            <animateMotion dur="4.2s" repeatCount="indefinite"><mpath href="#thread23" /></animateMotion>
          </circle>

          {/* Thread 24 */}
          <path id="thread24" d={`M${OX} ${OY} Q378 618 548 582 Q718 546 868 574 Q1018 601 1170 512 Q1286 446 1374 386`} stroke="url(#threadFade3)" strokeWidth="1.2" fill="none" opacity="0.52" />
          <circle r="2.2" fill="url(#neonPulse3)" opacity="0.72" filter="url(#neonGlow)">
            <animateMotion dur="5.7s" repeatCount="indefinite"><mpath href="#thread24" /></animateMotion>
          </circle>

          {/* Thread 25 */}
          <path id="thread25" d={`M${OX} ${OY} Q305 558 435 505 Q565 452 695 478 Q825 504 972 418 Q1090 346 1178 303`} stroke="url(#threadFade1)" strokeWidth="0.6" fill="none" opacity="0.48" />
          <circle r="1.7" fill="url(#neonPulse1)" opacity="0.7" filter="url(#neonGlow)">
            <animateMotion dur="4.95s" repeatCount="indefinite"><mpath href="#thread25" /></animateMotion>
          </circle>

          {/* Thread 26 */}
          <path id="thread26" d={`M${OX} ${OY} Q412 644 595 614 Q778 582 932 608 Q1086 633 1238 546 Q1352 480 1440 420`} stroke="url(#threadFade2)" strokeWidth="1.4" fill="none" opacity="0.44" />
          <circle r="2.4" fill="url(#neonPulse2)" opacity="0.66" filter="url(#neonGlow)">
            <animateMotion dur="6.4s" repeatCount="indefinite"><mpath href="#thread26" /></animateMotion>
          </circle>

          {/* Thread 27 */}
          <path id="thread27" d={`M${OX} ${OY} Q258 522 372 462 Q486 402 598 424 Q710 446 852 366 Q968 298 1052 260`} stroke="url(#threadFade3)" strokeWidth="0.4" fill="none" opacity="0.35" />
          <circle r="1.3" fill="url(#neonPulse3)" opacity="0.55" filter="url(#neonGlow)">
            <animateMotion dur="5.5s" repeatCount="indefinite"><mpath href="#thread27" /></animateMotion>
          </circle>

          {/* Thread 28 */}
          <path id="thread28" d={`M${OX} ${OY} Q363 605 526 560 Q689 515 835 544 Q981 572 1131 484 Q1248 418 1336 358`} stroke="url(#threadFade1)" strokeWidth="1.0" fill="none" opacity="0.54" />
          <circle r="2.1" fill="url(#neonPulse1)" opacity="0.74" filter="url(#neonGlow)">
            <animateMotion dur="4.85s" repeatCount="indefinite"><mpath href="#thread28" /></animateMotion>
          </circle>

          {/* Thread 29 */}
          <path id="thread29" d={`M${OX} ${OY} Q335 585 480 536 Q625 487 768 516 Q911 544 1060 456 Q1178 390 1266 330`} stroke="url(#threadFade2)" strokeWidth="0.8" fill="none" opacity="0.58" />
          <circle r="1.9" fill="url(#neonPulse2)" opacity="0.78" filter="url(#neonGlow)">
            <animateMotion dur="5.15s" repeatCount="indefinite"><mpath href="#thread29" /></animateMotion>
          </circle>

          {/* Thread 30 */}
          <path id="thread30" d={`M${OX} ${OY} Q390 628 566 594 Q742 558 894 585 Q1046 611 1198 523 Q1312 457 1400 397`} stroke="url(#threadFade3)" strokeWidth="1.1" fill="none" opacity="0.5" />
          <circle r="2" fill="url(#neonPulse3)" opacity="0.7" filter="url(#neonGlow)">
            <animateMotion dur="6.05s" repeatCount="indefinite"><mpath href="#thread30" /></animateMotion>
          </circle>

          {/* Thread 31 */}
          <path id="thread31" d={`M${OX} ${OY} Q248 516 358 454 Q468 392 578 414 Q688 436 828 357 Q943 290 1026 252`} stroke="url(#threadFade1)" strokeWidth="0.3" fill="none" opacity="0.32" />
          <circle r="1.2" fill="url(#neonPulse1)" opacity="0.5" filter="url(#neonGlow)">
            <animateMotion dur="5.35s" repeatCount="indefinite"><mpath href="#thread31" /></animateMotion>
          </circle>

          {/* Thread 32 */}
          <path id="thread32" d={`M${OX} ${OY} Q420 648 605 618 Q790 587 945 613 Q1100 638 1252 551 Q1365 485 1453 425`} stroke="url(#threadFade2)" strokeWidth="1.3" fill="none" opacity="0.42" />
          <circle r="2.3" fill="url(#neonPulse2)" opacity="0.63" filter="url(#neonGlow)">
            <animateMotion dur="6.55s" repeatCount="indefinite"><mpath href="#thread32" /></animateMotion>
          </circle>

          {/* Thread 33 */}
          <path id="thread33" d={`M${OX} ${OY} Q352 600 508 554 Q664 508 808 537 Q952 565 1102 477 Q1220 411 1308 351`} stroke="url(#threadFade3)" strokeWidth="0.9" fill="none" opacity="0.55" />
          <circle r="2" fill="url(#neonPulse3)" opacity="0.73" filter="url(#neonGlow)">
            <animateMotion dur="4.65s" repeatCount="indefinite"><mpath href="#thread33" /></animateMotion>
          </circle>

          {/* Thread 34 */}
          <path id="thread34" d={`M${OX} ${OY} Q318 568 452 517 Q586 466 718 493 Q850 519 997 433 Q1114 362 1202 319`} stroke="url(#threadFade1)" strokeWidth="0.6" fill="none" opacity="0.49" />
          <circle r="1.7" fill="url(#neonPulse1)" opacity="0.69" filter="url(#neonGlow)">
            <animateMotion dur="5.45s" repeatCount="indefinite"><mpath href="#thread34" /></animateMotion>
          </circle>

          {/* Thread 35 */}
          <path id="thread35" d={`M${OX} ${OY} Q382 622 554 587 Q726 551 878 578 Q1030 604 1182 516 Q1296 450 1384 390`} stroke="url(#threadFade2)" strokeWidth="1.1" fill="none" opacity="0.47" />
          <circle r="2.1" fill="url(#neonPulse2)" opacity="0.67" filter="url(#neonGlow)">
            <animateMotion dur="5.75s" repeatCount="indefinite"><mpath href="#thread35" /></animateMotion>
          </circle>

          {/* Thread 36 */}
          <path id="thread36" d={`M${OX} ${OY} Q238 510 344 446 Q450 382 558 404 Q666 426 804 348 Q918 282 1000 244`} stroke="url(#threadFade3)" strokeWidth="0.3" fill="none" opacity="0.28" />
          <circle r="1.1" fill="url(#neonPulse3)" opacity="0.45" filter="url(#neonGlow)">
            <animateMotion dur="6.75s" repeatCount="indefinite"><mpath href="#thread36" /></animateMotion>
          </circle>

          {/* === NEON PERFUME BOTTLE — scaled ×S, left-bottom corner === */}
          {/* Coordinates: bw=body half-width, bt=body top Y, bb=body bottom Y */}
          {(() => {
            const bw  = Math.round(72  * S)   // body half-width  ~104
            const bh  = Math.round(160 * S)   // body height       ~232
            const bt  = 550                    // body top Y
            const bb  = bt + bh               // body bottom Y     ~782
            const nw  = Math.round(22  * S)   // neck half-width   ~32
            const nh  = Math.round(37  * S)   // neck height       ~54
            const nt  = bt - nh               // neck top Y        ~496
            const shH = Math.round(18  * S)   // shoulder height   ~26
            const cw  = Math.round(48  * S)   // cap half-width    ~70
            const ch  = Math.round(50  * S)   // cap height        ~73
            const ct  = nt - ch               // cap top Y         ~423
            const tipH = Math.round(10 * S)   // cap tip height    ~15
            const tipT = ct - tipH            // tip top Y         ~408
            return (
              <>
                {/* Halo glow */}
                <ellipse cx={BX} cy={bt + bh * 0.4} rx={bw + 30} ry={bh * 0.55} fill="url(#bottleHalo)" filter="url(#haloFilter)" opacity="0.9">
                  <animate attributeName="opacity" values="0.7;1;0.7" dur="3.5s" repeatCount="indefinite" />
                </ellipse>
                <ellipse cx={BX} cy={ct + ch * 0.5} rx={cw + 10} ry={Math.round(42 * S)} fill="url(#capHalo)" filter="url(#haloFilter)" opacity="0.7">
                  <animate attributeName="opacity" values="0.5;0.9;0.5" dur="2.8s" repeatCount="indefinite" />
                </ellipse>

                <g filter="url(#bottleGlow)">
                  {/* ── BODY ── */}
                  <rect x={BX - bw} y={bt} width={bw * 2} height={bh} rx="5" ry="5" fill="url(#bodyGrad)" />
                  <rect x={BX - bw} y={bt} width={bw * 2} height={bh} rx="5" ry="5" stroke="url(#strokeGrad)" strokeWidth="2.5" fill="none" />
                  <line x1={BX - bw} y1={bt + 14} x2={BX - bw + 14} y2={bt} stroke="rgba(251,146,60,0.5)" strokeWidth="1" />
                  <line x1={BX + bw - 14} y1={bt} x2={BX + bw} y2={bt + 14} stroke="rgba(251,146,60,0.5)" strokeWidth="1" />
                  <line x1={BX - bw} y1={bb - 14} x2={BX - bw + 14} y2={bb} stroke="rgba(251,146,60,0.3)" strokeWidth="1" />
                  <line x1={BX + bw - 14} y1={bb} x2={BX + bw} y2={bb - 14} stroke="rgba(251,146,60,0.3)" strokeWidth="1" />
                  <line x1={BX - Math.round(52 * S)} y1={bt + 6} x2={BX - Math.round(52 * S)} y2={bb - 6} stroke="rgba(255,180,80,0.18)" strokeWidth="1.5" />
                  <line x1={BX - Math.round(20 * S)} y1={bt + 4} x2={BX - Math.round(20 * S)} y2={bb - 4} stroke="rgba(255,180,80,0.12)" strokeWidth="0.9" />
                  <line x1={BX + Math.round(20 * S)} y1={bt + 4} x2={BX + Math.round(20 * S)} y2={bb - 4} stroke="rgba(255,180,80,0.08)" strokeWidth="0.7" />
                  <line x1={BX + Math.round(52 * S)} y1={bt + 6} x2={BX + Math.round(52 * S)} y2={bb - 6} stroke="rgba(255,200,100,0.22)" strokeWidth="1.6" />
                  <line x1={BX + Math.round(70 * S)} y1={bt + 14} x2={BX + Math.round(70 * S)} y2={bb - 14} stroke="rgba(255,220,140,0.55)" strokeWidth="1.8" />
                  <line x1={BX - Math.round(60 * S)} y1={bt + Math.round(70 * S)} x2={BX + Math.round(60 * S)} y2={bt + Math.round(70 * S)} stroke="rgba(251,146,60,0.2)" strokeWidth="0.9" />
                  <line x1={BX - Math.round(60 * S)} y1={bt + Math.round(130 * S)} x2={BX + Math.round(60 * S)} y2={bt + Math.round(130 * S)} stroke="rgba(251,146,60,0.15)" strokeWidth="0.9" />
                  <rect x={BX - Math.round(50 * S)} y={bt + Math.round(76 * S)} width={Math.round(100 * S)} height={Math.round(48 * S)} rx="1" ry="1" stroke="rgba(251,146,60,0.25)" strokeWidth="0.8" fill="none" />
                  <line x1={BX - bw} y1={bb + 2} x2={BX + bw} y2={bb + 2} stroke="rgba(255,200,100,0.6)" strokeWidth="3" />
                  {/* ── SHOULDER ── */}
                  <path d={`M ${BX - bw} ${bt} L ${BX - Math.round(36 * S)} ${bt - shH} L ${BX + Math.round(36 * S)} ${bt - shH} L ${BX + bw} ${bt}`} stroke="url(#strokeGrad)" strokeWidth="2" fill="url(#bodyGrad)" />
                  <line x1={BX - Math.round(36 * S)} y1={bt - shH} x2={BX + Math.round(36 * S)} y2={bt - shH} stroke="rgba(255,200,100,0.55)" strokeWidth="1.4" />
                  {/* ── NECK ── */}
                  <rect x={BX - nw} y={nt} width={nw * 2} height={nh} rx="2" ry="2" fill="rgba(249,115,22,0.07)" stroke="url(#strokeGrad)" strokeWidth="1.8" />
                  <line x1={BX - Math.round(12 * S)} y1={nt + 2} x2={BX - Math.round(12 * S)} y2={nt + nh - 2} stroke="rgba(255,180,80,0.2)" strokeWidth="0.9" />
                  <line x1={BX + Math.round(12 * S)} y1={nt + 2} x2={BX + Math.round(12 * S)} y2={nt + nh - 2} stroke="rgba(255,200,120,0.25)" strokeWidth="0.9" />
                  <rect x={BX - Math.round(26 * S)} y={nt + nh - 10} width={Math.round(52 * S)} height="12" rx="1" fill="rgba(249,115,22,0.1)" stroke="rgba(255,180,80,0.7)" strokeWidth="1.4" />
                  {/* ── CAP ── */}
                  <rect x={BX - cw} y={ct} width={cw * 2} height={ch} rx="4" ry="4" fill="rgba(249,115,22,0.1)" stroke="url(#strokeGrad)" strokeWidth="2.5" />
                  <line x1={BX - cw + 2} y1={ct + 4} x2={BX + cw - 2} y2={ct + 4} stroke="rgba(255,220,140,0.7)" strokeWidth="1.8" />
                  <line x1={BX - cw + 2} y1={ct + ch - 4} x2={BX + cw - 2} y2={ct + ch - 4} stroke="rgba(255,180,80,0.5)" strokeWidth="1.2" />
                  <line x1={BX - cw} y1={ct + 14} x2={BX - cw + 14} y2={ct} stroke="rgba(251,146,60,0.6)" strokeWidth="1.2" />
                  <line x1={BX + cw - 14} y1={ct} x2={BX + cw} y2={ct + 14} stroke="rgba(251,146,60,0.6)" strokeWidth="1.2" />
                  <line x1={BX - Math.round(28 * S)} y1={ct + 4} x2={BX - Math.round(28 * S)} y2={ct + ch - 4} stroke="rgba(255,180,80,0.2)" strokeWidth="0.9" />
                  <line x1={BX + Math.round(28 * S)} y1={ct + 4} x2={BX + Math.round(28 * S)} y2={ct + ch - 4} stroke="rgba(255,200,120,0.3)" strokeWidth="1.1" />
                  <line x1={BX + cw - 2} y1={ct + 8} x2={BX + cw - 2} y2={ct + ch - 8} stroke="rgba(255,220,140,0.6)" strokeWidth="1.4" />
                  {/* ── CAP TIP ── */}
                  <path d={`M ${BX - cw} ${ct} L ${BX - Math.round(42 * S)} ${tipT} L ${BX + Math.round(42 * S)} ${tipT} L ${BX + cw} ${ct}`} stroke="rgba(255,200,100,0.5)" strokeWidth="1.4" fill="rgba(249,115,22,0.06)" />
                  <line x1={BX - Math.round(42 * S)} y1={tipT} x2={BX + Math.round(42 * S)} y2={tipT} stroke="rgba(255,220,140,0.6)" strokeWidth="1.2" />
                </g>

                {/* Pulsing neon outline */}
                <rect x={BX - bw} y={bt} width={bw * 2} height={bh} rx="5" ry="5" stroke="rgba(249,115,22,0.6)" strokeWidth="4" fill="none" filter="url(#neonGlow)">
                  <animate attributeName="opacity" values="0.25;0.75;0.25" dur="2.8s" repeatCount="indefinite" />
                </rect>
                <rect x={BX - cw} y={ct} width={cw * 2} height={ch} rx="4" ry="4" stroke="rgba(255,160,50,0.5)" strokeWidth="3.5" fill="none" filter="url(#neonGlow)">
                  <animate attributeName="opacity" values="0.2;0.6;0.2" dur="2.8s" repeatCount="indefinite" />
                </rect>
              </>
            )
          })()}

        </svg>
      </div>
    </div>
  )
}
