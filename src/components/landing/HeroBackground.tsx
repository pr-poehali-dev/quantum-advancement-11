export default function HeroBackground() {
  // Bottle image: right side, partially off-screen right
  // Waves origin: left edge of bottle image, flowing left
  const IMG_RIGHT = 1260  // bottle image right anchor (off-screen right)
  const IMG_W     = 520   // visible image width
  const IMG_X     = IMG_RIGHT - IMG_W  // left edge of image = wave origin X
  const OX        = IMG_X + 30         // wave origin X (left edge of bottle)
  const OY        = 480                // wave origin Y (mid-cap area)

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

            {/* Background glow — shifted right */}
            <radialGradient id="heroTextBg" cx="70%" cy="50%" r="70%">
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

            {/* Thread gradients — flowing RIGHT to LEFT (x2→x1) */}
            <linearGradient id="threadFade1" x1="100%" y1="0%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="rgba(249,115,22,0.9)" />
              <stop offset="50%" stopColor="rgba(251,146,60,0.6)" />
              <stop offset="100%" stopColor="rgba(249,115,22,0)" />
            </linearGradient>
            <linearGradient id="threadFade2" x1="100%" y1="0%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="rgba(251,146,60,0.8)" />
              <stop offset="55%" stopColor="rgba(249,115,22,0.5)" />
              <stop offset="100%" stopColor="rgba(234,88,12,0)" />
            </linearGradient>
            <linearGradient id="threadFade3" x1="100%" y1="0%" x2="0%" y2="0%">
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

            {/* Bottle image fade mask — fades left edge into black */}
            <linearGradient id="bottleFade" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="black" stopOpacity="1" />
              <stop offset="25%" stopColor="black" stopOpacity="0" />
              <stop offset="100%" stopColor="black" stopOpacity="0" />
            </linearGradient>
            <mask id="bottleMask">
              <rect x="0" y="0" width="1200" height="800" fill="white" />
              <rect x={IMG_X - 60} y="0" width="200" height="800" fill="url(#bottleFade)" />
            </mask>
          </defs>

          {/* === BACKGROUND GLOW === */}
          <g>
            <ellipse cx="900" cy="350" rx="400" ry="200" fill="url(#heroTextBg)" filter="url(#heroTextBlur)" opacity="0.6" />
            <ellipse cx="850" cy="320" rx="500" ry="250" fill="url(#heroTextBg)" filter="url(#heroTextBlur)" opacity="0.4" />
            <ellipse cx="800" cy="300" rx="600" ry="300" fill="url(#heroTextBg)" filter="url(#heroTextBlur)" opacity="0.2" />
          </g>

          {/* === WAVES — origin at left edge of bottle, flowing LEFT === */}

          {/* Thread 1 */}
          <path id="thread1" d={`M${OX} ${OY} Q${OX-120} ${OY+10} ${OX-280} ${OY-40} Q${OX-440} ${OY-90} ${OX-600} ${OY-60} Q${OX-760} ${OY-30} ${OX-900} ${OY-100}`} stroke="url(#threadFade1)" strokeWidth="0.8" fill="none" opacity="0.8" />
          <circle r="2" fill="url(#neonPulse1)" opacity="1" filter="url(#neonGlow)">
            <animateMotion dur="4s" repeatCount="indefinite"><mpath href="#thread1" /></animateMotion>
          </circle>

          {/* Thread 2 */}
          <path id="thread2" d={`M${OX} ${OY} Q${OX-130} ${OY+30} ${OX-300} ${OY-10} Q${OX-470} ${OY-50} ${OX-640} ${OY-30} Q${OX-800} ${OY-10} ${OX-950} ${OY-70}`} stroke="url(#threadFade2)" strokeWidth="1.5" fill="none" opacity="0.7" />
          <circle r="3" fill="url(#neonPulse2)" opacity="1" filter="url(#neonGlow)">
            <animateMotion dur="5s" repeatCount="indefinite"><mpath href="#thread2" /></animateMotion>
          </circle>

          {/* Thread 3 */}
          <path id="thread3" d={`M${OX} ${OY} Q${OX-110} ${OY-10} ${OX-260} ${OY-70} Q${OX-410} ${OY-130} ${OX-570} ${OY-90} Q${OX-730} ${OY-50} ${OX-870} ${OY-130}`} stroke="url(#threadFade3)" strokeWidth="1.1" fill="none" opacity="0.75" />
          <circle r="2.5" fill="url(#neonPulse3)" opacity="1" filter="url(#neonGlow)">
            <animateMotion dur="4.5s" repeatCount="indefinite"><mpath href="#thread3" /></animateMotion>
          </circle>

          {/* Thread 4 */}
          <path id="thread4" d={`M${OX} ${OY} Q${OX-140} ${OY+50} ${OX-330} ${OY+20} Q${OX-520} ${OY-10} ${OX-700} ${OY+10} Q${OX-860} ${OY+30} ${OX-1010} ${OY-30}`} stroke="url(#threadFade1)" strokeWidth="1.3" fill="none" opacity="0.65" />
          <circle r="2" fill="url(#neonPulse1)" opacity="0.9" filter="url(#neonGlow)">
            <animateMotion dur="5.5s" repeatCount="indefinite"><mpath href="#thread4" /></animateMotion>
          </circle>

          {/* Thread 5 */}
          <path id="thread5" d={`M${OX} ${OY} Q${OX-100} ${OY-25} ${OX-240} ${OY-90} Q${OX-380} ${OY-155} ${OX-540} ${OY-110} Q${OX-700} ${OY-65} ${OX-840} ${OY-155}`} stroke="url(#threadFade2)" strokeWidth="0.7" fill="none" opacity="0.6" />
          <circle r="1.8" fill="url(#neonPulse2)" opacity="0.85" filter="url(#neonGlow)">
            <animateMotion dur="4.8s" repeatCount="indefinite"><mpath href="#thread5" /></animateMotion>
          </circle>

          {/* Thread 6 */}
          <path id="thread6" d={`M${OX} ${OY} Q${OX-150} ${OY+65} ${OX-360} ${OY+40} Q${OX-570} ${OY+15} ${OX-750} ${OY+35} Q${OX-920} ${OY+55} ${OX-1060} ${OY+5}`} stroke="url(#threadFade3)" strokeWidth="1.0" fill="none" opacity="0.55" />
          <circle r="2.2" fill="url(#neonPulse3)" opacity="0.8" filter="url(#neonGlow)">
            <animateMotion dur="6s" repeatCount="indefinite"><mpath href="#thread6" /></animateMotion>
          </circle>

          {/* Thread 7 */}
          <path id="thread7" d={`M${OX} ${OY} Q${OX-90} ${OY-40} ${OX-220} ${OY-110} Q${OX-350} ${OY-180} ${OX-510} ${OY-130} Q${OX-670} ${OY-80} ${OX-810} ${OY-180}`} stroke="url(#threadFade1)" strokeWidth="0.6" fill="none" opacity="0.5" />
          <circle r="1.6" fill="url(#neonPulse1)" opacity="0.75" filter="url(#neonGlow)">
            <animateMotion dur="5.2s" repeatCount="indefinite"><mpath href="#thread7" /></animateMotion>
          </circle>

          {/* Thread 8 */}
          <path id="thread8" d={`M${OX} ${OY} Q${OX-135} ${OY+40} ${OX-320} ${OY+5} Q${OX-505} ${OY-30} ${OX-690} ${OY-10} Q${OX-870} ${OY+10} ${OX-1020} ${OY-50}`} stroke="url(#threadFade2)" strokeWidth="1.2" fill="none" opacity="0.6" />
          <circle r="2.4" fill="url(#neonPulse2)" opacity="0.85" filter="url(#neonGlow)">
            <animateMotion dur="4.3s" repeatCount="indefinite"><mpath href="#thread8" /></animateMotion>
          </circle>

          {/* Thread 9 */}
          <path id="thread9" d={`M${OX} ${OY} Q${OX-80} ${OY-55} ${OX-200} ${OY-130} Q${OX-320} ${OY-205} ${OX-480} ${OY-150} Q${OX-640} ${OY-95} ${OX-780} ${OY-205}`} stroke="url(#threadFade3)" strokeWidth="0.5" fill="none" opacity="0.45" />
          <circle r="1.5" fill="url(#neonPulse3)" opacity="0.7" filter="url(#neonGlow)">
            <animateMotion dur="5.8s" repeatCount="indefinite"><mpath href="#thread9" /></animateMotion>
          </circle>

          {/* Thread 10 */}
          <path id="thread10" d={`M${OX} ${OY} Q${OX-160} ${OY+80} ${OX-390} ${OY+55} Q${OX-620} ${OY+30} ${OX-810} ${OY+50} Q${OX-980} ${OY+70} ${OX-1110} ${OY+20}`} stroke="url(#threadFade1)" strokeWidth="0.9" fill="none" opacity="0.5" />
          <circle r="1.9" fill="url(#neonPulse1)" opacity="0.75" filter="url(#neonGlow)">
            <animateMotion dur="6.3s" repeatCount="indefinite"><mpath href="#thread10" /></animateMotion>
          </circle>

          {/* Thread 11 */}
          <path id="thread11" d={`M${OX} ${OY} Q${OX-105} ${OY-15} ${OX-250} ${OY-60} Q${OX-395} ${OY-105} ${OX-555} ${OY-75} Q${OX-715} ${OY-45} ${OX-855} ${OY-115}`} stroke="url(#threadFade2)" strokeWidth="0.7" fill="none" opacity="0.55" />
          <circle r="2.1" fill="url(#neonPulse2)" opacity="0.8" filter="url(#neonGlow)">
            <animateMotion dur="4.7s" repeatCount="indefinite"><mpath href="#thread11" /></animateMotion>
          </circle>

          {/* Thread 12 */}
          <path id="thread12" d={`M${OX} ${OY} Q${OX-155} ${OY+95} ${OX-400} ${OY+72} Q${OX-645} ${OY+49} ${OX-840} ${OY+68} Q${OX-1010} ${OY+87} ${OX-1140} ${OY+37}`} stroke="url(#threadFade3)" strokeWidth="1.4" fill="none" opacity="0.5" />
          <circle r="2.3" fill="url(#neonPulse3)" opacity="0.75" filter="url(#neonGlow)">
            <animateMotion dur="5.6s" repeatCount="indefinite"><mpath href="#thread12" /></animateMotion>
          </circle>

          {/* Thread 13 */}
          <path id="thread13" d={`M${OX} ${OY} Q${OX-115} ${OY+20} ${OX-270} ${OY-20} Q${OX-425} ${OY-60} ${OX-590} ${OY-45} Q${OX-755} ${OY-30} ${OX-900} ${OY-85}`} stroke="url(#threadFade1)" strokeWidth="0.8" fill="none" opacity="0.6" />
          <circle r="2" fill="url(#neonPulse1)" opacity="0.8" filter="url(#neonGlow)">
            <animateMotion dur="4.1s" repeatCount="indefinite"><mpath href="#thread13" /></animateMotion>
          </circle>

          {/* Thread 14 */}
          <path id="thread14" d={`M${OX} ${OY} Q${OX-125} ${OY-5} ${OX-295} ${OY-45} Q${OX-465} ${OY-85} ${OX-635} ${OY-65} Q${OX-805} ${OY-45} ${OX-950} ${OY-100}`} stroke="url(#threadFade2)" strokeWidth="1.1" fill="none" opacity="0.55" />
          <circle r="2.2" fill="url(#neonPulse2)" opacity="0.75" filter="url(#neonGlow)">
            <animateMotion dur="5.3s" repeatCount="indefinite"><mpath href="#thread14" /></animateMotion>
          </circle>

          {/* Thread 15 */}
          <path id="thread15" d={`M${OX} ${OY} Q${OX-75} ${OY-70} ${OX-185} ${OY-150} Q${OX-295} ${OY-230} ${OX-455} ${OY-170} Q${OX-615} ${OY-110} ${OX-755} ${OY-230}`} stroke="url(#threadFade3)" strokeWidth="0.6" fill="none" opacity="0.5" />
          <circle r="1.7" fill="url(#neonPulse3)" opacity="0.7" filter="url(#neonGlow)">
            <animateMotion dur="4.9s" repeatCount="indefinite"><mpath href="#thread15" /></animateMotion>
          </circle>

          {/* Thread 16 */}
          <path id="thread16" d={`M${OX} ${OY} Q${OX-170} ${OY+110} ${OX-420} ${OY+88} Q${OX-670} ${OY+66} ${OX-870} ${OY+84} Q${OX-1040} ${OY+102} ${OX-1160} ${OY+52}`} stroke="url(#threadFade1)" strokeWidth="1.0" fill="none" opacity="0.5" />
          <circle r="2" fill="url(#neonPulse1)" opacity="0.7" filter="url(#neonGlow)">
            <animateMotion dur="6.1s" repeatCount="indefinite"><mpath href="#thread16" /></animateMotion>
          </circle>

          {/* === BOTTLE IMAGE — right side, partially off-screen === */}
          <image
            href="https://cdn.poehali.dev/projects/1a5ec0e8-88b9-4062-a5e2-e2ec44d19777/bucket/6f085d77-0cb7-4dd9-9cbc-50e3091e83dd.jpg"
            x={IMG_X}
            y="0"
            width={IMG_W + 200}
            height="900"
            preserveAspectRatio="xMaxYMid meet"
            mask="url(#bottleMask)"
            opacity="0.9"
          />

        </svg>
      </div>
    </div>
  )
}
