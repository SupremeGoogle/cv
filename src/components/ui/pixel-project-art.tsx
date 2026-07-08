// Tiny self-contained pixel-art SVG scenes, one per project slide.
// Everything is local (no assets, no requests): plain rects on a 6px grid,
// animated with namespaced CSS keyframes baked into each SVG. steps() timing
// keeps the motion chunky, like an old handheld console.

export type PixelArtVariant =
  | 'uav' | 'monitor' | 'bots' | 'web'
  | 'neural' | 'teach' | 'grad' | 'signal';

const UavScene = () => (
  <svg viewBox="0 0 96 72" shapeRendering="crispEdges" aria-hidden="true" focusable="false">
    <style>{`
      .pxa-uav-track { animation: pxa-uav-track 7s steps(11) infinite alternate; }
      @keyframes pxa-uav-track { from { transform: translateX(0); } to { transform: translateX(22px); } }
      .pxa-uav-bob { animation: pxa-uav-bob 1.2s steps(2) infinite alternate; }
      @keyframes pxa-uav-bob { from { transform: translateY(0); } to { transform: translateY(3px); } }
      .pxa-uav-r1 { animation: pxa-uav-blink 0.24s steps(1) infinite; }
      .pxa-uav-r2 { animation: pxa-uav-blink 0.24s steps(1) infinite reverse; }
      @keyframes pxa-uav-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.25; } }
      .pxa-uav-beam { animation: pxa-uav-beam 1s steps(3) infinite; }
      @keyframes pxa-uav-beam { 0%, 100% { opacity: 0.9; } 50% { opacity: 0.25; } }
      .pxa-uav-ret { animation: pxa-uav-ret 0.8s steps(1) infinite; }
      @keyframes pxa-uav-ret { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
    `}</style>
    <rect width="96" height="72" fill="#0A0A1A" />
    {/* ground */}
    <rect y="64" width="96" height="4" fill="#14142E" />
    <rect y="68" width="96" height="4" fill="#101024" />
    <rect x="4" y="64" width="8" height="2" fill="#1E1E3E" />
    <rect x="44" y="66" width="8" height="2" fill="#1E1E3E" />
    <rect x="82" y="64" width="8" height="2" fill="#1E1E3E" />
    {/* drone tracks the tank */}
    <g className="pxa-uav-track">
      <g className="pxa-uav-bob">
        <rect className="pxa-uav-r1" x="6" y="2" width="10" height="3" fill="#34D399" />
        <rect className="pxa-uav-r2" x="34" y="2" width="10" height="3" fill="#34D399" />
        <rect x="10" y="5" width="3" height="3" fill="#6868A0" />
        <rect x="37" y="5" width="3" height="3" fill="#6868A0" />
        <rect x="8" y="8" width="34" height="6" fill="#F0F0FF" />
        <rect x="21" y="14" width="8" height="4" fill="#38BDF8" />
      </g>
      {/* scanner beam */}
      <g className="pxa-uav-beam" fill="#34D399">
        <rect x="23" y="21" width="4" height="5" />
        <rect x="23" y="29" width="4" height="5" />
        <rect x="23" y="37" width="4" height="5" />
      </g>
      {/* tank */}
      <rect x="16" y="42" width="16" height="7" fill="#6868A0" />
      <rect x="30" y="44" width="14" height="3" fill="#6868A0" />
      <rect x="6" y="49" width="38" height="9" fill="#55557E" />
      <rect x="6" y="55" width="38" height="3" fill="#3A3A60" />
      <rect x="9" y="52" width="4" height="4" fill="#2E2E52" />
      <rect x="17" y="52" width="4" height="4" fill="#2E2E52" />
      <rect x="25" y="52" width="4" height="4" fill="#2E2E52" />
      <rect x="33" y="52" width="4" height="4" fill="#2E2E52" />
      {/* target reticle */}
      <g className="pxa-uav-ret" fill="#34D399">
        <rect x="1" y="37" width="9" height="3" /><rect x="1" y="37" width="3" height="9" />
        <rect x="40" y="37" width="9" height="3" /><rect x="46" y="37" width="3" height="9" />
        <rect x="1" y="56" width="3" height="9" /><rect x="1" y="62" width="9" height="3" />
        <rect x="46" y="56" width="3" height="9" /><rect x="40" y="62" width="9" height="3" />
      </g>
    </g>
  </svg>
);

const MonitorScene = () => (
  <svg viewBox="0 0 96 72" shapeRendering="crispEdges" aria-hidden="true" focusable="false">
    <style>{`
      .pxa-mon-line { transform-origin: 6px 0; animation: pxa-mon-type 6s steps(8) infinite; }
      @keyframes pxa-mon-type { 0% { transform: scaleX(0); } 12% { transform: scaleX(1); } 92% { transform: scaleX(1); } 100% { transform: scaleX(0); } }
      .pxa-mon-scan { animation: pxa-mon-scan 3s steps(8) infinite; }
      @keyframes pxa-mon-scan { from { transform: translateY(0); } to { transform: translateY(48px); } }
      .pxa-mon-alert { animation: pxa-mon-alert 3s steps(1) infinite; }
      @keyframes pxa-mon-alert { 0%, 40% { opacity: 0; } 45%, 60% { opacity: 1; } 50%, 55% { opacity: 0.2; } 92%, 100% { opacity: 0; } }
      .pxa-mon-ok { animation: pxa-mon-ok 1.4s steps(1) infinite; }
      @keyframes pxa-mon-ok { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
    `}</style>
    <rect width="96" height="72" fill="#0A0A1A" />
    {/* window chrome */}
    <rect width="96" height="10" fill="#14142E" />
    <rect x="4" y="3" width="4" height="4" fill="#F87171" />
    <rect x="11" y="3" width="4" height="4" fill="#FBBF24" />
    <rect x="18" y="3" width="4" height="4" fill="#34D399" />
    <rect className="pxa-mon-ok" x="85" y="3" width="7" height="4" fill="#34D399" />
    {/* log lines typing in */}
    <g fill="#38BDF8" opacity="0.55">
      <rect className="pxa-mon-line" style={{ animationDelay: '0s' }} x="6" y="16" width="56" height="5" />
      <rect className="pxa-mon-line" style={{ animationDelay: '0.4s' }} x="6" y="25" width="40" height="5" />
      <rect className="pxa-mon-line" style={{ animationDelay: '0.8s' }} x="6" y="34" width="64" height="5" />
      <rect className="pxa-mon-line" style={{ animationDelay: '1.2s' }} x="6" y="43" width="34" height="5" />
      <rect className="pxa-mon-line" style={{ animationDelay: '1.6s' }} x="6" y="52" width="48" height="5" />
    </g>
    {/* flagged line + marker */}
    <g className="pxa-mon-alert">
      <rect x="6" y="34" width="64" height="5" fill="#F87171" />
      <rect x="76" y="30" width="5" height="9" fill="#F87171" />
      <rect x="76" y="42" width="5" height="3" fill="#F87171" />
    </g>
    {/* scanline sweeping down */}
    <g className="pxa-mon-scan">
      <rect y="12" width="96" height="8" fill="#34D399" opacity="0.14" />
      <rect y="18" width="96" height="3" fill="#34D399" opacity="0.55" />
    </g>
  </svg>
);

const BotsScene = () => (
  <svg viewBox="0 0 96 72" shapeRendering="crispEdges" aria-hidden="true" focusable="false">
    <style>{`
      .pxa-bot-eye { animation: pxa-bot-eye 3.4s steps(1) infinite; }
      @keyframes pxa-bot-eye { 0%, 100% { opacity: 1; } 88%, 94% { opacity: 0; } }
      .pxa-bot-ant { animation: pxa-bot-ant 1s steps(1) infinite; }
      @keyframes pxa-bot-ant { 0%, 100% { opacity: 1; } 50% { opacity: 0.25; } }
      .pxa-bot-d1 { animation: pxa-bot-dot 1.2s steps(1) infinite; }
      .pxa-bot-d2 { animation: pxa-bot-dot 1.2s steps(1) 0.2s infinite; }
      .pxa-bot-d3 { animation: pxa-bot-dot 1.2s steps(1) 0.4s infinite; }
      @keyframes pxa-bot-dot { 0%, 100% { opacity: 0.2; } 25%, 60% { opacity: 1; } }
      .pxa-bot-reply { animation: pxa-bot-reply 4.8s steps(1) infinite; }
      @keyframes pxa-bot-reply { 0%, 45% { opacity: 0; } 50%, 92% { opacity: 1; } 100% { opacity: 0; } }
      .pxa-bot-bar { transform-origin: 58px 0; animation: pxa-bot-bar 4.8s steps(5) infinite; }
      @keyframes pxa-bot-bar { 0%, 50% { transform: scaleX(0); } 62%, 100% { transform: scaleX(1); } }
    `}</style>
    <rect width="96" height="72" fill="#0A0A1A" />
    {/* bot head */}
    <rect className="pxa-bot-ant" x="45" y="1" width="5" height="4" fill="#34D399" />
    <rect x="46" y="5" width="3" height="3" fill="#6868A0" />
    <rect x="34" y="8" width="28" height="18" fill="#1E1E3E" />
    <rect x="34" y="8" width="28" height="3" fill="#2E2E52" />
    <g className="pxa-bot-eye">
      <rect x="40" y="14" width="6" height="6" fill="#38BDF8" />
      <rect x="50" y="14" width="6" height="6" fill="#38BDF8" />
    </g>
    <rect x="43" y="22" width="10" height="2" fill="#6868A0" />
    {/* incoming bubble: typing */}
    <rect x="4" y="32" width="40" height="20" fill="#14324A" />
    <rect x="8" y="52" width="5" height="4" fill="#14324A" />
    <rect className="pxa-bot-d1" x="11" y="39" width="5" height="5" fill="#38BDF8" />
    <rect className="pxa-bot-d2" x="21" y="39" width="5" height="5" fill="#38BDF8" />
    <rect className="pxa-bot-d3" x="31" y="39" width="5" height="5" fill="#38BDF8" />
    {/* bot reply pops in */}
    <g className="pxa-bot-reply">
      <rect x="52" y="44" width="40" height="22" fill="#123B2E" />
      <rect x="83" y="66" width="5" height="4" fill="#123B2E" />
      <g fill="#34D399" opacity="0.85">
        <rect className="pxa-bot-bar" x="58" y="50" width="28" height="4" />
        <rect className="pxa-bot-bar" x="58" y="58" width="18" height="4" />
      </g>
    </g>
  </svg>
);

const WebScene = () => (
  <svg viewBox="0 0 96 72" shapeRendering="crispEdges" aria-hidden="true" focusable="false">
    <style>{`
      .pxa-web-stage { animation: pxa-web-stage 6s steps(1) infinite; }
      @keyframes pxa-web-stage { 0%, 94% { opacity: 1; } 95%, 100% { opacity: 0; } }
      .pxa-web-b1 { animation: pxa-web-pop 6s steps(1) infinite; }
      .pxa-web-b2 { animation: pxa-web-pop 6s steps(1) 0.7s infinite; }
      .pxa-web-b3 { animation: pxa-web-pop 6s steps(1) 1.4s infinite; }
      .pxa-web-b4 { animation: pxa-web-pop 6s steps(1) 2.1s infinite; }
      @keyframes pxa-web-pop { 0%, 8% { opacity: 0; } 9%, 100% { opacity: 1; } }
      .pxa-web-load { transform-origin: 6px 0; animation: pxa-web-load 6s steps(12) infinite; }
      @keyframes pxa-web-load { 0% { transform: scaleX(0); } 55%, 100% { transform: scaleX(1); } }
      .pxa-web-cur { animation: pxa-web-cur 6s steps(1) infinite; }
      @keyframes pxa-web-cur {
        0%, 8% { transform: translate(0, 0); }
        9%, 19% { transform: translate(24px, 3px); }
        20%, 30% { transform: translate(-14px, 20px); }
        31%, 45% { transform: translate(28px, 23px); }
        46%, 100% { transform: translate(40px, 38px); }
      }
    `}</style>
    <rect width="96" height="72" fill="#0A0A1A" />
    {/* browser chrome */}
    <rect width="96" height="10" fill="#14142E" />
    <rect x="4" y="3" width="4" height="4" fill="#F87171" />
    <rect x="11" y="3" width="4" height="4" fill="#FBBF24" />
    <rect x="18" y="3" width="4" height="4" fill="#34D399" />
    <rect x="26" y="2" width="64" height="6" fill="#0E0E24" />
    <rect x="29" y="4" width="24" height="2" fill="#38BDF8" opacity="0.6" />
    {/* page assembling block by block */}
    <g className="pxa-web-stage">
      <rect className="pxa-web-b1" x="6" y="14" width="84" height="10" fill="#818CF8" opacity="0.55" />
      <rect className="pxa-web-b2" x="6" y="28" width="26" height="32" fill="#38BDF8" opacity="0.45" />
      <rect className="pxa-web-b3" x="37" y="28" width="53" height="14" fill="#34D399" opacity="0.4" />
      <rect className="pxa-web-b4" x="37" y="46" width="53" height="14" fill="#F0F0FF" opacity="0.22" />
      <g className="pxa-web-cur">
        <rect x="30" y="16" width="4" height="4" fill="#F0F0FF" />
        <rect x="34" y="20" width="3" height="3" fill="#F0F0FF" />
      </g>
    </g>
    {/* load bar */}
    <rect x="6" y="64" width="84" height="4" fill="#14142E" />
    <rect className="pxa-web-load" x="6" y="64" width="84" height="4" fill="#34D399" opacity="0.85" />
  </svg>
);

const NeuralScene = () => (
  <svg viewBox="0 0 96 72" shapeRendering="crispEdges" aria-hidden="true" focusable="false">
    <style>{`
      .pxa-neu-p { animation: pxa-neu-pulse 2.5s steps(1) infinite; }
      @keyframes pxa-neu-pulse { 0%, 100% { opacity: 0.3; } 8%, 35% { opacity: 1; } 45% { opacity: 0.3; } }
    `}</style>
    <rect width="96" height="72" fill="#0A0A1A" />
    {/* edges */}
    <g stroke="#2E2E52" strokeWidth="2">
      {[17, 36, 55].map(y1 => [11, 27, 43, 59].map(y2 => (
        <line key={`a${y1}-${y2}`} x1="16" y1={y1} x2="48" y2={y2} />
      )))}
      {[11, 27, 43, 59].map(y1 => [25, 47].map(y2 => (
        <line key={`b${y1}-${y2}`} x1="48" y1={y1} x2="85" y2={y2} />
      )))}
    </g>
    {/* signal sweeping through the layers */}
    <g className="pxa-neu-p" style={{ animationDelay: '0s' }} fill="#38BDF8">
      <rect x="6" y="12" width="10" height="10" /><rect x="6" y="31" width="10" height="10" /><rect x="6" y="50" width="10" height="10" />
    </g>
    <g className="pxa-neu-p" style={{ animationDelay: '0.4s' }} stroke="#38BDF8" strokeWidth="2" opacity="0.3">
      {[17, 36, 55].map(y1 => [11, 27, 43, 59].map(y2 => (
        <line key={`c${y1}-${y2}`} x1="16" y1={y1} x2="48" y2={y2} />
      )))}
    </g>
    <g className="pxa-neu-p" style={{ animationDelay: '0.8s' }} fill="#818CF8">
      <rect x="43" y="6" width="10" height="10" /><rect x="43" y="22" width="10" height="10" />
      <rect x="43" y="38" width="10" height="10" /><rect x="43" y="54" width="10" height="10" />
    </g>
    <g className="pxa-neu-p" style={{ animationDelay: '1.2s' }} stroke="#818CF8" strokeWidth="2" opacity="0.3">
      {[11, 27, 43, 59].map(y1 => [25, 47].map(y2 => (
        <line key={`d${y1}-${y2}`} x1="48" y1={y1} x2="85" y2={y2} />
      )))}
    </g>
    <g className="pxa-neu-p" style={{ animationDelay: '1.6s' }} fill="#34D399">
      <rect x="80" y="20" width="10" height="10" /><rect x="80" y="42" width="10" height="10" />
    </g>
  </svg>
);

const TeachScene = () => (
  <svg viewBox="0 0 96 72" shapeRendering="crispEdges" aria-hidden="true" focusable="false">
    <style>{`
      .pxa-tea-code { transform-origin: 13px 0; animation: pxa-tea-code 5s steps(6) infinite; }
      @keyframes pxa-tea-code { 0% { transform: scaleX(0); } 14% { transform: scaleX(1); } 90% { transform: scaleX(1); } 100% { transform: scaleX(0); } }
      .pxa-tea-cursor { animation: pxa-tea-cursor 0.9s steps(1) infinite; }
      @keyframes pxa-tea-cursor { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
      .pxa-tea-arm1 { animation: pxa-tea-arm 1.6s steps(1) infinite; }
      .pxa-tea-arm2 { animation: pxa-tea-arm 1.6s steps(1) infinite reverse; }
      @keyframes pxa-tea-arm { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
      .pxa-tea-hand { animation: pxa-tea-hand 4.5s steps(1) infinite; }
      @keyframes pxa-tea-hand { 0%, 55% { opacity: 0; } 60%, 92% { opacity: 1; } 96%, 100% { opacity: 0; } }
      .pxa-tea-star { animation: pxa-tea-star 4.5s steps(2) infinite; }
      @keyframes pxa-tea-star {
        0%, 12% { opacity: 0; transform: translateY(5px); }
        16%, 42% { opacity: 1; transform: translateY(0); }
        48%, 100% { opacity: 0; transform: translateY(-4px); }
      }
    `}</style>
    <rect width="96" height="72" fill="#0A0A1A" />
    {/* big screen with code being typed */}
    <rect x="4" y="4" width="62" height="36" fill="#2E2E52" />
    <rect x="7" y="7" width="56" height="30" fill="#0E0E24" />
    <rect className="pxa-tea-code" style={{ animationDelay: '0s' }} x="13" y="11" width="26" height="4" fill="#818CF8" />
    <rect className="pxa-tea-code" style={{ animationDelay: '0.5s' }} x="19" y="18" width="32" height="4" fill="#38BDF8" />
    <rect className="pxa-tea-code" style={{ animationDelay: '1s' }} x="19" y="25" width="22" height="4" fill="#34D399" />
    <rect className="pxa-tea-cursor" x="44" y="25" width="4" height="4" fill="#F0F0FF" />
    {/* teacher pointing at the screen */}
    <rect x="78" y="8" width="11" height="11" fill="#A0A0C0" />
    <rect x="75" y="20" width="17" height="20" fill="#38BDF8" />
    <rect className="pxa-tea-arm1" x="66" y="23" width="9" height="4" fill="#A0A0C0" />
    <rect className="pxa-tea-arm2" x="66" y="31" width="9" height="4" fill="#A0A0C0" />
    {/* students: one levels up with a star, one raises a hand */}
    <g fill="#6868A0">
      <rect x="11" y="50" width="10" height="10" /><rect x="7" y="60" width="18" height="10" />
      <rect x="39" y="50" width="10" height="10" /><rect x="35" y="60" width="18" height="10" />
      <rect x="67" y="50" width="10" height="10" /><rect x="63" y="60" width="18" height="10" />
    </g>
    <g className="pxa-tea-star" fill="#FBBF24">
      <rect x="42" y="38" width="4" height="4" />
      <rect x="38" y="42" width="4" height="4" />
      <rect x="42" y="42" width="4" height="4" />
      <rect x="46" y="42" width="4" height="4" />
      <rect x="42" y="46" width="4" height="4" />
    </g>
    <rect className="pxa-tea-hand" x="23" y="41" width="4" height="11" fill="#A0A0C0" />
  </svg>
);

const GradScene = () => (
  <svg viewBox="0 0 96 72" shapeRendering="crispEdges" aria-hidden="true" focusable="false">
    <style>{`
      .pxa-gra-tas { animation: pxa-gra-tas 1.8s steps(3) infinite alternate; }
      @keyframes pxa-gra-tas { from { transform: translateX(0); } to { transform: translateX(7px); } }
      .pxa-gra-dip { animation: pxa-gra-dip 1.4s steps(2) infinite alternate; }
      @keyframes pxa-gra-dip { from { transform: translateY(0); } to { transform: translateY(3px); } }
      .pxa-gra-s1 { animation: pxa-gra-spark 2.2s steps(1) infinite; }
      .pxa-gra-s2 { animation: pxa-gra-spark 2.2s steps(1) 0.55s infinite; }
      .pxa-gra-s3 { animation: pxa-gra-spark 2.2s steps(1) 1.1s infinite; }
      .pxa-gra-s4 { animation: pxa-gra-spark 2.2s steps(1) 1.65s infinite; }
      @keyframes pxa-gra-spark { 0%, 100% { opacity: 0.15; } 20%, 45% { opacity: 1; } }
    `}</style>
    <rect width="96" height="72" fill="#0A0A1A" />
    {/* mortarboard */}
    <rect x="20" y="12" width="56" height="8" fill="#F0F0FF" />
    <rect x="28" y="20" width="40" height="4" fill="#A0A0C0" />
    <rect x="36" y="24" width="24" height="12" fill="#6868A0" />
    <rect x="45" y="8" width="6" height="4" fill="#34D399" />
    {/* swinging tassel */}
    <g className="pxa-gra-tas">
      <rect x="72" y="20" width="3" height="8" fill="#FBBF24" />
      <rect x="72" y="28" width="3" height="8" fill="#FBBF24" />
      <rect x="69" y="36" width="8" height="6" fill="#FBBF24" />
    </g>
    {/* red diploma */}
    <g className="pxa-gra-dip">
      <rect x="30" y="50" width="36" height="10" fill="#F0F0FF" />
      <rect x="43" y="50" width="10" height="10" fill="#F87171" />
      <rect x="27" y="53" width="3" height="5" fill="#A0A0C0" />
      <rect x="66" y="53" width="3" height="5" fill="#A0A0C0" />
    </g>
    {/* sparkles */}
    <g fill="#34D399">
      <rect className="pxa-gra-s1" x="10" y="10" width="4" height="4" />
      <rect className="pxa-gra-s3" x="12" y="42" width="4" height="4" />
    </g>
    <g fill="#38BDF8">
      <rect className="pxa-gra-s2" x="83" y="8" width="4" height="4" />
      <rect className="pxa-gra-s4" x="82" y="46" width="4" height="4" />
    </g>
  </svg>
);

const SignalScene = () => (
  <svg viewBox="0 0 96 72" shapeRendering="crispEdges" aria-hidden="true" focusable="false">
    <style>{`
      .pxa-sig-w1 { animation: pxa-sig-wave 1.8s steps(1) infinite; }
      .pxa-sig-w2 { animation: pxa-sig-wave 1.8s steps(1) 0.3s infinite; }
      .pxa-sig-w3 { animation: pxa-sig-wave 1.8s steps(1) 0.6s infinite; }
      @keyframes pxa-sig-wave { 0%, 100% { opacity: 0.15; } 17%, 55% { opacity: 1; } }
      .pxa-sig-plane { animation: pxa-sig-plane 3.2s steps(8) infinite; }
      @keyframes pxa-sig-plane { 0% { transform: translate(0, 0); opacity: 1; } 80% { transform: translate(44px, -16px); opacity: 1; } 81%, 100% { transform: translate(44px, -16px); opacity: 0; } }
      .pxa-sig-t1 { animation: pxa-sig-trail 3.2s steps(1) infinite; }
      .pxa-sig-t2 { animation: pxa-sig-trail 3.2s steps(1) 0.5s infinite; }
      .pxa-sig-t3 { animation: pxa-sig-trail 3.2s steps(1) 1s infinite; }
      @keyframes pxa-sig-trail { 0%, 20% { opacity: 0; } 25%, 70% { opacity: 0.6; } 75%, 100% { opacity: 0; } }
      .pxa-sig-seal { animation: pxa-sig-seal 1.4s steps(1) infinite; }
      @keyframes pxa-sig-seal { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }
    `}</style>
    <rect width="96" height="72" fill="#0A0A1A" />
    {/* envelope */}
    <rect x="6" y="32" width="42" height="30" fill="#14324A" />
    <rect x="6" y="32" width="42" height="4" fill="#1E4A6A" />
    <rect x="10" y="36" width="34" height="4" fill="#1E4A6A" />
    <rect x="16" y="40" width="22" height="4" fill="#1E4A6A" />
    <rect x="22" y="44" width="10" height="4" fill="#1E4A6A" />
    <rect className="pxa-sig-seal" x="24" y="51" width="6" height="6" fill="#34D399" />
    {/* signal bars */}
    <g fill="#34D399">
      <rect className="pxa-sig-w1" x="56" y="48" width="8" height="14" />
      <rect className="pxa-sig-w2" x="68" y="40" width="8" height="22" />
      <rect className="pxa-sig-w3" x="80" y="30" width="8" height="32" />
    </g>
    {/* paper plane with trail */}
    <g className="pxa-sig-plane">
      <rect x="30" y="22" width="12" height="4" fill="#F0F0FF" />
      <rect x="42" y="19" width="4" height="4" fill="#F0F0FF" />
      <rect x="30" y="26" width="6" height="4" fill="#A0A0C0" />
    </g>
    <rect className="pxa-sig-t1" x="48" y="18" width="4" height="4" fill="#38BDF8" />
    <rect className="pxa-sig-t2" x="60" y="12" width="4" height="4" fill="#38BDF8" />
    <rect className="pxa-sig-t3" x="72" y="6" width="4" height="4" fill="#38BDF8" />
  </svg>
);

const scenes = {
  uav: UavScene,
  monitor: MonitorScene,
  bots: BotsScene,
  web: WebScene,
  neural: NeuralScene,
  teach: TeachScene,
  grad: GradScene,
  signal: SignalScene,
} satisfies Record<PixelArtVariant, () => unknown>;

export default function PixelProjectArt({ variant }: { variant: PixelArtVariant }) {
  const Scene = scenes[variant];
  return (
    <span className="pixel-art-badge">
      <Scene />
    </span>
  );
}
