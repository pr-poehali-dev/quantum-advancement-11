export default function HeroBackground() {
  // Bottle: positioned so only cap+neck visible at bottom-left
  // The bottle body goes below the screen edge
  // BX = bottle center X (left side), BotY = bottom of visible area (below screen)
  const BX = 110   // bottle center X
  const S  = 1.6   // scale factor

  // Bottle parts dimensions
  const bw  = Math.round(72  * S)   // body half-width
  const bh  = Math.round(160 * S)   // body height
  const nw  = Math.round(22  * S)   // neck half-width
  const nh  = Math.round(37  * S)   // neck height
  const shH = Math.round(18  * S)   // shoulder height
  const cw  = Math.round(48  * S)   // cap half-width
  const ch  = Math.round(50  * S)   // cap height
  const tipH = Math.round(10 * S)   // cap tip height

  // Position bottle so body is below screen, cap+neck visible at bottom
  // viewBox height = 800. We want cap top at ~680, body disappearing below 800
  const capTop  = 680              // cap top Y — near bottom of screen
  const capBot  = capTop + ch      // cap bottom
  const tipTop  = capTop - tipH    // tip top Y (above cap)
  const neckTop = capBot           // neck starts where cap ends
  const neckBot = neckTop + nh
  const shTop   = neckBot          // shoulder starts
  const bodyTop = shTop + shH      // body starts — will go below screen edge

  // Spray origin: right side of cap tip (pulsverizer nozzle)
  const OX = BX + Math.round(42 * S) + 8   // tip right edge + small offset
  const OY = tipTop + tipH * 0.5             // mid-height of tip

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

            {/* Thread gradients — diagonal, fade towards right */}
            <linearGradient id="threadFade1" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(249,115,22,0.9)" />
              <stop offset="50%" stopColor="rgba(251,146,60,0.6)" />
              <stop offset="100%" stopColor="rgba(249,115,22,0)" />
            </linearGradient>
            <linearGradient id="threadFade2" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(251,146,60,0.8)" />
              <stop offset="55%" stopColor="rgba(249,115,22,0.5)" />
              <stop offset="100%" stopColor="rgba(234,88,12,0)" />
            </linearGradient>
            <linearGradient id="threadFade3" x1="0%" y1="100%" x2="100%" y2="0%">
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

            {/* Bottle body gradient */}
            <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(249,115,22,0.05)" />
              <stop offset="18%" stopColor="rgba(249,115,22,0.12)" />
              <stop offset="45%" stopColor="rgba(249,115,22,0.08)" />
              <stop offset="72%" stopColor="rgba(255,180,80,0.18)" />
              <stop offset="100%" stopColor="rgba(249,115,22,0.06)" />
            </linearGradient>
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
            <ellipse cx="500" cy="350" rx="500" ry="300" fill="url(#heroTextBg)" filter="url(#heroTextBlur)" opacity="0.6" />
            <ellipse cx="550" cy="300" rx="600" ry="350" fill="url(#heroTextBg)" filter="url(#heroTextBlur)" opacity="0.4" />
          </g>

          {/* === WAVES — from nozzle tip, going up-right diagonally === */}

          {/* Thread 1 — top stream */}
          <path id="thread1" d={`M${OX} ${OY} Q${OX+100} ${OY-80} ${OX+280} ${OY-180} Q${OX+460} ${OY-270} ${OX+650} ${OY-310} Q${OX+820} ${OY-340} 1350 ${OY-400}`} stroke="url(#threadFade1)" strokeWidth="0.8" fill="none" opacity="0.8" />
          <circle r="2" fill="url(#neonPulse1)" opacity="1" filter="url(#neonGlow)">
            <animateMotion dur="4s" repeatCount="indefinite"><mpath href="#thread1" /></animateMotion>
          </circle>

          {/* Thread 2 */}
          <path id="thread2" d={`M${OX} ${OY} Q${OX+110} ${OY-60} ${OX+300} ${OY-150} Q${OX+490} ${OY-230} ${OX+680} ${OY-265} Q${OX+860} ${OY-290} 1370 ${OY-340}`} stroke="url(#threadFade2)" strokeWidth="1.5" fill="none" opacity="0.7" />
          <circle r="3" fill="url(#neonPulse2)" opacity="1" filter="url(#neonGlow)">
            <animateMotion dur="5s" repeatCount="indefinite"><mpath href="#thread2" /></animateMotion>
          </circle>

          {/* Thread 3 */}
          <path id="thread3" d={`M${OX} ${OY} Q${OX+90} ${OY-95} ${OX+260} ${OY-200} Q${OX+440} ${OY-295} ${OX+630} ${OY-340} Q${OX+800} ${OY-375} 1330 ${OY-450}`} stroke="url(#threadFade3)" strokeWidth="1.1" fill="none" opacity="0.75" />
          <circle r="2.5" fill="url(#neonPulse3)" opacity="1" filter="url(#neonGlow)">
            <animateMotion dur="4.5s" repeatCount="indefinite"><mpath href="#thread3" /></animateMotion>
          </circle>

          {/* Thread 4 */}
          <path id="thread4" d={`M${OX} ${OY} Q${OX+120} ${OY-40} ${OX+320} ${OY-110} Q${OX+510} ${OY-175} ${OX+710} ${OY-210} Q${OX+890} ${OY-240} 1380 ${OY-280}`} stroke="url(#threadFade1)" strokeWidth="1.3" fill="none" opacity="0.65" />
          <circle r="2" fill="url(#neonPulse1)" opacity="0.9" filter="url(#neonGlow)">
            <animateMotion dur="5.5s" repeatCount="indefinite"><mpath href="#thread4" /></animateMotion>
          </circle>

          {/* Thread 5 */}
          <path id="thread5" d={`M${OX} ${OY} Q${OX+85} ${OY-110} ${OX+240} ${OY-215} Q${OX+420} ${OY-315} ${OX+600} ${OY-365} Q${OX+780} ${OY-405} 1310 ${OY-480}`} stroke="url(#threadFade2)" strokeWidth="0.7" fill="none" opacity="0.6" />
          <circle r="1.8" fill="url(#neonPulse2)" opacity="0.85" filter="url(#neonGlow)">
            <animateMotion dur="4.8s" repeatCount="indefinite"><mpath href="#thread5" /></animateMotion>
          </circle>

          {/* Thread 6 */}
          <path id="thread6" d={`M${OX} ${OY} Q${OX+130} ${OY-20} ${OX+340} ${OY-75} Q${OX+540} ${OY-130} ${OX+740} ${OY-165} Q${OX+920} ${OY-195} 1390 ${OY-230}`} stroke="url(#threadFade3)" strokeWidth="1.0" fill="none" opacity="0.55" />
          <circle r="2.2" fill="url(#neonPulse3)" opacity="0.8" filter="url(#neonGlow)">
            <animateMotion dur="6s" repeatCount="indefinite"><mpath href="#thread6" /></animateMotion>
          </circle>

          {/* Thread 7 */}
          <path id="thread7" d={`M${OX} ${OY} Q${OX+95} ${OY-125} ${OX+255} ${OY-235} Q${OX+435} ${OY-340} ${OX+615} ${OY-390} Q${OX+795} ${OY-430} 1320 ${OY-510}`} stroke="url(#threadFade1)" strokeWidth="0.6" fill="none" opacity="0.5" />
          <circle r="1.6" fill="url(#neonPulse1)" opacity="0.75" filter="url(#neonGlow)">
            <animateMotion dur="5.2s" repeatCount="indefinite"><mpath href="#thread7" /></animateMotion>
          </circle>

          {/* Thread 8 */}
          <path id="thread8" d={`M${OX} ${OY} Q${OX+115} ${OY-50} ${OX+310} ${OY-130} Q${OX+500} ${OY-205} ${OX+695} ${OY-240} Q${OX+875} ${OY-268} 1375 ${OY-310}`} stroke="url(#threadFade2)" strokeWidth="1.2" fill="none" opacity="0.6" />
          <circle r="2.4" fill="url(#neonPulse2)" opacity="0.85" filter="url(#neonGlow)">
            <animateMotion dur="4.3s" repeatCount="indefinite"><mpath href="#thread8" /></animateMotion>
          </circle>

          {/* Thread 9 — thin top accent */}
          <path id="thread9" d={`M${OX} ${OY} Q${OX+80} ${OY-140} ${OX+230} ${OY-250} Q${OX+410} ${OY-360} ${OX+590} ${OY-415} Q${OX+770} ${OY-460} 1300 ${OY-540}`} stroke="url(#threadFade3)" strokeWidth="0.5" fill="none" opacity="0.45" />
          <circle r="1.5" fill="url(#neonPulse3)" opacity="0.7" filter="url(#neonGlow)">
            <animateMotion dur="5.8s" repeatCount="indefinite"><mpath href="#thread9" /></animateMotion>
          </circle>

          {/* Thread 10 */}
          <path id="thread10" d={`M${OX} ${OY} Q${OX+105} ${OY-30} ${OX+290} ${OY-95} Q${OX+480} ${OY-155} ${OX+670} ${OY-188} Q${OX+855} ${OY-218} 1365 ${OY-258}`} stroke="url(#threadFade1)" strokeWidth="0.9" fill="none" opacity="0.5" />
          <circle r="1.9" fill="url(#neonPulse1)" opacity="0.75" filter="url(#neonGlow)">
            <animateMotion dur="6.3s" repeatCount="indefinite"><mpath href="#thread10" /></animateMotion>
          </circle>

          {/* Thread 11 */}
          <path id="thread11" d={`M${OX} ${OY} Q${OX+88} ${OY-70} ${OX+245} ${OY-165} Q${OX+425} ${OY-255} ${OX+605} ${OY-298} Q${OX+785} ${OY-332} 1315 ${OY-390}`} stroke="url(#threadFade2)" strokeWidth="0.7" fill="none" opacity="0.55" />
          <circle r="2.1" fill="url(#neonPulse2)" opacity="0.8" filter="url(#neonGlow)">
            <animateMotion dur="4.7s" repeatCount="indefinite"><mpath href="#thread11" /></animateMotion>
          </circle>

          {/* Thread 12 — widest spread bottom */}
          <path id="thread12" d={`M${OX} ${OY} Q${OX+135} ${OY-5} ${OX+360} ${OY-55} Q${OX+560} ${OY-105} ${OX+760} ${OY-138} Q${OX+940} ${OY-165} 1395 ${OY-200}`} stroke="url(#threadFade3)" strokeWidth="1.4" fill="none" opacity="0.5" />
          <circle r="2.3" fill="url(#neonPulse3)" opacity="0.75" filter="url(#neonGlow)">
            <animateMotion dur="5.6s" repeatCount="indefinite"><mpath href="#thread12" /></animateMotion>
          </circle>

          {/* === BOTTLE — only cap+neck visible, body goes below screen === */}
          <g filter="url(#bottleGlow)">
            {/* ── CAP TIP (pulsverizer nozzle) ── */}
            <path d={`M ${BX - cw} ${capTop} L ${BX - Math.round(42 * S)} ${tipTop} L ${BX + Math.round(42 * S)} ${tipTop} L ${BX + cw} ${capTop}`} stroke="rgba(255,200,100,0.5)" strokeWidth="1.4" fill="rgba(249,115,22,0.06)" />
            <line x1={BX - Math.round(42 * S)} y1={tipTop} x2={BX + Math.round(42 * S)} y2={tipTop} stroke="rgba(255,220,140,0.6)" strokeWidth="1.2" />

            {/* ── CAP ── */}
            <rect x={BX - cw} y={capTop} width={cw * 2} height={ch} rx="4" ry="4" fill="rgba(249,115,22,0.1)" stroke="url(#strokeGrad)" strokeWidth="2.5" />
            <line x1={BX - cw + 2} y1={capTop + 4} x2={BX + cw - 2} y2={capTop + 4} stroke="rgba(255,220,140,0.7)" strokeWidth="1.8" />
            <line x1={BX - cw + 2} y1={capBot - 4} x2={BX + cw - 2} y2={capBot - 4} stroke="rgba(255,180,80,0.5)" strokeWidth="1.2" />
            <line x1={BX - cw} y1={capTop + 14} x2={BX - cw + 14} y2={capTop} stroke="rgba(251,146,60,0.6)" strokeWidth="1.2" />
            <line x1={BX + cw - 14} y1={capTop} x2={BX + cw} y2={capTop + 14} stroke="rgba(251,146,60,0.6)" strokeWidth="1.2" />
            <line x1={BX - Math.round(28 * S)} y1={capTop + 4} x2={BX - Math.round(28 * S)} y2={capBot - 4} stroke="rgba(255,180,80,0.2)" strokeWidth="0.9" />
            <line x1={BX + Math.round(28 * S)} y1={capTop + 4} x2={BX + Math.round(28 * S)} y2={capBot - 4} stroke="rgba(255,200,120,0.3)" strokeWidth="1.1" />
            <line x1={BX + cw - 2} y1={capTop + 8} x2={BX + cw - 2} y2={capBot - 8} stroke="rgba(255,220,140,0.6)" strokeWidth="1.4" />

            {/* ── NECK ── */}
            <rect x={BX - nw} y={neckTop} width={nw * 2} height={nh} rx="2" ry="2" fill="rgba(249,115,22,0.07)" stroke="url(#strokeGrad)" strokeWidth="1.8" />
            <line x1={BX - Math.round(12 * S)} y1={neckTop + 2} x2={BX - Math.round(12 * S)} y2={neckBot - 2} stroke="rgba(255,180,80,0.2)" strokeWidth="0.9" />
            <line x1={BX + Math.round(12 * S)} y1={neckTop + 2} x2={BX + Math.round(12 * S)} y2={neckBot - 2} stroke="rgba(255,200,120,0.25)" strokeWidth="0.9" />
            <rect x={BX - Math.round(26 * S)} y={neckBot - 10} width={Math.round(52 * S)} height="12" rx="1" fill="rgba(249,115,22,0.1)" stroke="rgba(255,180,80,0.7)" strokeWidth="1.4" />

            {/* ── SHOULDER (partially visible) ── */}
            <path d={`M ${BX - bw} ${bodyTop} L ${BX - Math.round(36 * S)} ${shTop} L ${BX + Math.round(36 * S)} ${shTop} L ${BX + bw} ${bodyTop}`} stroke="url(#strokeGrad)" strokeWidth="2" fill="url(#bodyGrad)" />
            <line x1={BX - Math.round(36 * S)} y1={shTop} x2={BX + Math.round(36 * S)} y2={shTop} stroke="rgba(255,200,100,0.55)" strokeWidth="1.4" />

            {/* ── BODY TOP — fades into bottom edge ── */}
            <rect x={BX - bw} y={bodyTop} width={bw * 2} height={bh} rx="5" ry="5" fill="url(#bodyGrad)" />
            <rect x={BX - bw} y={bodyTop} width={bw * 2} height={bh} rx="5" ry="5" stroke="url(#strokeGrad)" strokeWidth="2.5" fill="none" />
            <line x1={BX + Math.round(70 * S)} y1={bodyTop + 14} x2={BX + Math.round(70 * S)} y2={bodyTop + Math.round(50 * S)} stroke="rgba(255,220,140,0.4)" strokeWidth="1.6" />
          </g>

          {/* Pulsing neon outline — cap */}
          <rect x={BX - cw} y={capTop} width={cw * 2} height={ch} rx="4" ry="4" stroke="rgba(255,160,50,0.5)" strokeWidth="3.5" fill="none" filter="url(#neonGlow)">
            <animate attributeName="opacity" values="0.2;0.6;0.2" dur="2.8s" repeatCount="indefinite" />
          </rect>
          {/* Pulsing neon outline — tip */}
          <path d={`M ${BX - cw} ${capTop} L ${BX - Math.round(42 * S)} ${tipTop} L ${BX + Math.round(42 * S)} ${tipTop} L ${BX + cw} ${capTop}`} stroke="rgba(249,115,22,0.5)" strokeWidth="3" fill="none" filter="url(#neonGlow)">
            <animate attributeName="opacity" values="0.25;0.7;0.25" dur="2.8s" repeatCount="indefinite" />
          </path>

          {/* Halo glow around cap area */}
          <ellipse cx={BX} cy={capTop + ch * 0.5} rx={cw + 20} ry={ch * 0.7} fill="url(#capHalo)" filter="url(#haloFilter)" opacity="0.7">
            <animate attributeName="opacity" values="0.5;0.9;0.5" dur="2.8s" repeatCount="indefinite" />
          </ellipse>

        </svg>
      </div>
    </div>
  )
}
