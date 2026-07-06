// Tiny self-contained pixel-art SVG scenes, one per project slide.
// Everything is local (no assets, no requests): plain rects on a 6px grid,
// animated with namespaced CSS keyframes baked into each SVG. steps() timing
// keeps the motion chunky, like an old handheld console.

export type PixelArtVariant = 'uav' | 'monitor' | 'bots' | 'web';

const UavScene = () => (
  <svg viewBox="0 0 96 72" shapeRendering="crispEdges" aria-hidden="true" focusable="false">
    <style>{`
      .pxa-uav-track { animation: pxa-uav-track 7s steps(14) infinite alternate; }
      @keyframes pxa-uav-track { from { transform: translateX(0); } to { transform: translateX(28px); } }
      .pxa-uav-bob { animation: pxa-uav-bob 1.2s steps(2) infinite alternate; }
      @keyframes pxa-uav-bob { from { transform: translateY(0); } to { transform: translateY(3px); } }
      .pxa-uav-r1 { animation: pxa-uav-blink 0.24s steps(1) infinite; }
      .pxa-uav-r2 { animation: pxa-uav-blink 0.24s steps(1) infinite reverse; }
      @keyframes pxa-uav-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.25; } }
      .pxa-uav-beam { animation: pxa-uav-beam 1s steps(3) infinite; }
      @keyframes pxa-uav-beam { 0%, 100% { opacity: 0.85; } 50% { opacity: 0.25; } }
      .pxa-uav-ret { animation: pxa-uav-ret 0.8s steps(1) infinite; }
      @keyframes pxa-uav-ret { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
    `}</style>
    <rect width="96" height="72" fill="#0A0A1A" />
    {/* ground */}
    <rect y="60" width="96" height="6" fill="#14142E" />
    <rect y="66" width="96" height="6" fill="#101024" />
    <rect x="6" y="60" width="6" height="3" fill="#1E1E3E" />
    <rect x="42" y="63" width="6" height="3" fill="#1E1E3E" />
    <rect x="78" y="60" width="6" height="3" fill="#1E1E3E" />
    {/* drone tracks the tank */}
    <g className="pxa-uav-track">
      <g className="pxa-uav-bob">
        <rect className="pxa-uav-r1" x="12" y="6" width="6" height="2" fill="#34D399" />
        <rect className="pxa-uav-r2" x="30" y="6" width="6" height="2" fill="#34D399" />
        <rect x="17" y="8" width="2" height="2" fill="#6868A0" />
        <rect x="29" y="8" width="2" height="2" fill="#6868A0" />
        <rect x="15" y="10" width="18" height="4" fill="#F0F0FF" />
        <rect x="21" y="14" width="6" height="2" fill="#38BDF8" />
      </g>
      {/* scanner beam */}
      <g className="pxa-uav-beam">
        <rect x="22" y="20" width="3" height="4" fill="#34D399" />
        <rect x="22" y="27" width="3" height="4" fill="#34D399" />
        <rect x="22" y="34" width="3" height="4" fill="#34D399" />
        <rect x="22" y="41" width="3" height="4" fill="#34D399" />
      </g>
      {/* tank */}
      <rect x="12" y="48" width="24" height="6" fill="#55557E" />
      <rect x="15" y="44" width="12" height="4" fill="#6868A0" />
      <rect x="27" y="45" width="8" height="2" fill="#6868A0" />
      <rect x="14" y="50" width="2" height="2" fill="#2E2E52" />
      <rect x="20" y="50" width="2" height="2" fill="#2E2E52" />
      <rect x="26" y="50" width="2" height="2" fill="#2E2E52" />
      <rect x="32" y="50" width="2" height="2" fill="#2E2E52" />
      {/* target reticle */}
      <g className="pxa-uav-ret" fill="#34D399">
        <rect x="8" y="40" width="6" height="2" /><rect x="8" y="40" width="2" height="6" />
        <rect x="34" y="40" width="6" height="2" /><rect x="38" y="40" width="2" height="6" />
        <rect x="8" y="56" width="2" height="6" /><rect x="8" y="60" width="6" height="2" />
        <rect x="38" y="56" width="2" height="6" /><rect x="34" y="60" width="6" height="2" />
      </g>
    </g>
  </svg>
);

const MonitorScene = () => (
  <svg viewBox="0 0 96 72" shapeRendering="crispEdges" aria-hidden="true" focusable="false">
    <style>{`
      .pxa-mon-line { transform-origin: 6px 0; animation: pxa-mon-type 6s steps(8) infinite; }
      @keyframes pxa-mon-type { 0% { transform: scaleX(0); } 12% { transform: scaleX(1); } 92% { transform: scaleX(1); } 100% { transform: scaleX(0); } }
      .pxa-mon-scan { animation: pxa-mon-scan 3s steps(10) infinite; }
      @keyframes pxa-mon-scan { from { transform: translateY(0); } to { transform: translateY(51px); } }
      .pxa-mon-alert { animation: pxa-mon-alert 3s steps(1) infinite; }
      @keyframes pxa-mon-alert { 0%, 55% { opacity: 0; } 60%, 75% { opacity: 1; } 65%, 70% { opacity: 0.2; } 80%, 100% { opacity: 0; } }
      .pxa-mon-ok { animation: pxa-mon-ok 1.4s steps(1) infinite; }
      @keyframes pxa-mon-ok { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
    `}</style>
    <rect width="96" height="72" fill="#0A0A1A" />
    {/* window chrome */}
    <rect width="96" height="9" fill="#14142E" />
    <rect x="4" y="3" width="3" height="3" fill="#F87171" />
    <rect x="10" y="3" width="3" height="3" fill="#FBBF24" />
    <rect x="16" y="3" width="3" height="3" fill="#34D399" />
    <rect className="pxa-mon-ok" x="86" y="3" width="6" height="3" fill="#34D399" />
    {/* log lines typing in */}
    <g fill="#38BDF8" opacity="0.5">
      <rect className="pxa-mon-line" style={{ animationDelay: '0s' }} x="6" y="15" width="58" height="4" />
      <rect className="pxa-mon-line" style={{ animationDelay: '0.4s' }} x="6" y="23" width="40" height="4" />
      <rect className="pxa-mon-line" style={{ animationDelay: '0.8s' }} x="6" y="31" width="70" height="4" />
      <rect className="pxa-mon-line" style={{ animationDelay: '1.2s' }} x="6" y="39" width="34" height="4" />
      <rect className="pxa-mon-line" style={{ animationDelay: '1.6s' }} x="6" y="47" width="52" height="4" />
      <rect className="pxa-mon-line" style={{ animationDelay: '2s' }} x="6" y="55" width="64" height="4" />
    </g>
    {/* flagged line + marker */}
    <g className="pxa-mon-alert">
      <rect x="6" y="39" width="34" height="4" fill="#F87171" />
      <rect x="44" y="38" width="3" height="4" fill="#F87171" />
      <rect x="44" y="44" width="3" height="2" fill="#F87171" />
    </g>
    {/* scanline sweeping down */}
    <g className="pxa-mon-scan">
      <rect y="12" width="96" height="6" fill="#34D399" opacity="0.12" />
      <rect y="17" width="96" height="2" fill="#34D399" opacity="0.5" />
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
      .pxa-bot-bar { transform-origin: 60px 0; animation: pxa-bot-bar 4.8s steps(5) infinite; }
      @keyframes pxa-bot-bar { 0%, 50% { transform: scaleX(0); } 62%, 100% { transform: scaleX(1); } }
    `}</style>
    <rect width="96" height="72" fill="#0A0A1A" />
    {/* bot head */}
    <rect className="pxa-bot-ant" x="46" y="2" width="3" height="3" fill="#34D399" />
    <rect x="46" y="5" width="3" height="2" fill="#6868A0" />
    <rect x="38" y="7" width="19" height="13" fill="#1E1E3E" />
    <rect x="38" y="7" width="19" height="2" fill="#2E2E52" />
    <g className="pxa-bot-eye">
      <rect x="42" y="11" width="4" height="4" fill="#38BDF8" />
      <rect x="49" y="11" width="4" height="4" fill="#38BDF8" />
    </g>
    <rect x="44" y="17" width="7" height="1" fill="#6868A0" />
    {/* incoming bubble: typing */}
    <rect x="6" y="28" width="36" height="17" fill="#14324A" />
    <rect x="9" y="45" width="4" height="3" fill="#14324A" />
    <rect className="pxa-bot-d1" x="13" y="34" width="4" height="4" fill="#38BDF8" />
    <rect className="pxa-bot-d2" x="21" y="34" width="4" height="4" fill="#38BDF8" />
    <rect className="pxa-bot-d3" x="29" y="34" width="4" height="4" fill="#38BDF8" />
    {/* bot reply pops in */}
    <g className="pxa-bot-reply">
      <rect x="54" y="48" width="36" height="17" fill="#123B2E" />
      <rect x="83" y="65" width="4" height="3" fill="#123B2E" />
      <g fill="#34D399" opacity="0.8">
        <rect className="pxa-bot-bar" x="60" y="53" width="24" height="3" />
        <rect className="pxa-bot-bar" x="60" y="59" width="16" height="3" />
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
        20%, 30% { transform: translate(-12px, 21px); }
        31%, 45% { transform: translate(30px, 24px); }
        46%, 100% { transform: translate(42px, 36px); }
      }
    `}</style>
    <rect width="96" height="72" fill="#0A0A1A" />
    {/* browser chrome */}
    <rect width="96" height="9" fill="#14142E" />
    <rect x="4" y="3" width="3" height="3" fill="#F87171" />
    <rect x="10" y="3" width="3" height="3" fill="#FBBF24" />
    <rect x="16" y="3" width="3" height="3" fill="#34D399" />
    <rect x="24" y="2" width="66" height="5" fill="#0E0E24" />
    <rect x="27" y="4" width="20" height="1" fill="#38BDF8" opacity="0.6" />
    {/* page assembling block by block */}
    <g className="pxa-web-stage">
      <rect className="pxa-web-b1" x="6" y="14" width="84" height="9" fill="#818CF8" opacity="0.55" />
      <rect className="pxa-web-b2" x="6" y="28" width="24" height="31" fill="#38BDF8" opacity="0.45" />
      <rect className="pxa-web-b3" x="36" y="28" width="54" height="14" fill="#34D399" opacity="0.4" />
      <rect className="pxa-web-b4" x="36" y="47" width="54" height="12" fill="#F0F0FF" opacity="0.22" />
      <g className="pxa-web-cur">
        <rect x="30" y="16" width="3" height="3" fill="#F0F0FF" />
        <rect x="33" y="19" width="2" height="2" fill="#F0F0FF" />
      </g>
    </g>
    {/* load bar */}
    <rect x="6" y="64" width="84" height="3" fill="#14142E" />
    <rect className="pxa-web-load" x="6" y="64" width="84" height="3" fill="#34D399" opacity="0.8" />
  </svg>
);

const scenes = {
  uav: UavScene,
  monitor: MonitorScene,
  bots: BotsScene,
  web: WebScene,
} satisfies Record<PixelArtVariant, () => unknown>;

export default function PixelProjectArt({ variant }: { variant: PixelArtVariant }) {
  const Scene = scenes[variant];
  return (
    <span className="pixel-art-badge">
      <Scene />
    </span>
  );
}
