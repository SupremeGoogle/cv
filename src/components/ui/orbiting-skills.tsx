"use client"
import React, { useEffect, useState, memo } from 'react';

// --- Type Definitions ---
type IconType = 'nextjs' | 'nodejs' | 'python' | 'react' | 'sql' | 'ml';

type GlowColor = 'cyan' | 'purple';

interface SkillIconProps {
  type: IconType;
}

interface SkillConfig {
  id: string;
  orbitRadius: number;
  size: number;
  speed: number;
  iconType: IconType;
  phaseShift: number;
  glowColor: GlowColor;
  label: string;
}

interface OrbitingSkillProps {
  config: SkillConfig;
  angle: number;
}

interface GlowingOrbitPathProps {
  radius: number;
  glowColor?: GlowColor;
  animationDelay?: number;
}

// --- Improved SVG Icon Components ---
const iconComponents: Record<IconType, { component: () => React.JSX.Element; color: string }> = {
  nextjs: {
    component: () => (
      <svg viewBox="0 0 128 128" fill="none" className="w-full h-full">
        <circle cx="64" cy="64" r="64" fill="#000000"/>
        <path d="M107.5 113.8L47.2 36H36v56h12V52.8l52 66.8c2.6-1.8 5.1-3.8 7.5-5.8z" fill="url(#next-grad)"/>
        <path d="M82 36h12v56H82z" fill="#FFFFFF"/>
        <defs>
          <linearGradient id="next-grad" x1="77" y1="74.5" x2="103.5" y2="108.5" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FFFFFF"/>
            <stop offset="1" stopColor="#FFFFFF" stopOpacity="0"/>
          </linearGradient>
        </defs>
      </svg>
    ),
    color: '#FFFFFF'
  },
  nodejs: {
    component: () => (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
        <path d="M12 1.847a2.213 2.213 0 0 0-1.107.297L2.43 6.958A2.213 2.213 0 0 0 1.323 8.87v9.645c0 .79.421 1.52 1.107 1.914l8.463 4.814a2.213 2.213 0 0 0 2.214 0l8.463-4.814A2.213 2.213 0 0 0 22.677 18.515V8.87a2.213 2.213 0 0 0-1.107-1.912L13.107 2.144A2.213 2.213 0 0 0 12 1.847zm-1.041 3.504c.162-.094.364-.094.526 0l6.98 3.972a.526.526 0 0 1 .263.456v7.944a.526.526 0 0 1-.263.456l-6.98 3.972a.526.526 0 0 1-.526 0l-6.98-3.972a.526.526 0 0 1-.263-.456V9.779c0-.188.1-.354.263-.456l6.98-3.972z" fill="#5FA04E"/>
      </svg>
    ),
    color: '#5FA04E'
  },
      python: {
    component: () => (
      <img src="/python-logo.png" alt="Python Logo" className="w-full h-full object-contain drop-shadow-[0_0_12px_rgba(56,189,248,0.5)] rounded-full" />
    ),
    color: '#3776AB'
  },
  react: {
    component: () => (
      <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
        <g stroke="#61DAFB" strokeWidth="1" fill="none">
          <circle cx="12" cy="12" r="2.05" fill="#61DAFB"/>
          <ellipse cx="12" cy="12" rx="11" ry="4.2"/>
          <ellipse cx="12" cy="12" rx="11" ry="4.2" transform="rotate(60 12 12)"/>
          <ellipse cx="12" cy="12" rx="11" ry="4.2" transform="rotate(120 12 12)"/>
        </g>
      </svg>
    ),
    color: '#61DAFB'
  },
  sql: {
    component: () => (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
        <path d="M12 2C6.48 2 2 4 2 6.5v11c0 2.5 4.48 4.5 10 4.5s10-2 10-4.5v-11C22 4 17.52 2 12 2zm0 2.5c4.7 0 8 1.5 8 2s-3.3 2-8 2-8-1.5-8-2 3.3-2 8-2zm8 4.67c-.24.08-.52.17-.81.25-1.74.5-4.14.83-7.19.83s-5.45-.33-7.19-.83c-.29-.08-.57-.17-.81-.25V8.5c1.47.88 4.51 1.5 8 1.5s6.53-.62 8-1.5v.67zm0 4.5c-.24.08-.52.17-.81.25-1.74.5-4.14.83-7.19.83s-5.45-.33-7.19-.83c-.29-.08-.57-.17-.81-.25v-1.17c1.47.88 4.51 1.5 8 1.5s6.53-.62 8-1.5v1.17zm0 4.83c-1.47.88-4.51 1.5-8 1.5s-6.53-.62-8-1.5v-1.17c.24.08.52.17.81.25 1.74.5 4.14.83 7.19.83s5.45-.33 7.19-.83c.29-.08.57-.17.81-.25v1.17z" fill="#336791"/>
      </svg>
    ),
    color: '#336791'
  },
  ml: {
    component: () => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-full h-full">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#9333EA" />
        <circle cx="12" cy="7" r="2" fill="#9333EA" stroke="none" />
        <circle cx="12" cy="12" r="2" fill="#9333EA" stroke="none" />
        <circle cx="12" cy="17" r="2" fill="#9333EA" stroke="none" />
      </svg>
    ),
    color: '#9333EA'
  }
};

// --- Memoized Icon Component ---
const SkillIcon = memo(({ type }: SkillIconProps) => {
  const IconComponent = iconComponents[type]?.component;
  return IconComponent ? <IconComponent /> : null;
});
SkillIcon.displayName = 'SkillIcon';

// --- Configuration for the Orbiting Skills ---
const skillsConfig: SkillConfig[] = [
  // Inner Orbit
  { 
    id: 'nextjs',
    orbitRadius: 100, 
    size: 45, 
    speed: 1, 
    iconType: 'nextjs', 
    phaseShift: 0, 
    glowColor: 'cyan',
    label: 'Next.js'
  },
  { 
    id: 'nodejs',
    orbitRadius: 100, 
    size: 45, 
    speed: 1, 
    iconType: 'nodejs', 
    phaseShift: (2 * Math.PI) / 3, 
    glowColor: 'cyan',
    label: 'Node.js'
  },
  { 
    id: 'python',
    orbitRadius: 100, 
    size: 50, 
    speed: 1, 
    iconType: 'python', 
    phaseShift: (4 * Math.PI) / 3, 
    glowColor: 'cyan',
    label: 'Python'
  },
  // Outer Orbit
  { 
    id: 'react',
    orbitRadius: 180, 
    size: 50, 
    speed: -0.6, 
    iconType: 'react', 
    phaseShift: 0, 
    glowColor: 'purple',
    label: 'React'
  },
  { 
    id: 'sql',
    orbitRadius: 180, 
    size: 45, 
    speed: -0.6, 
    iconType: 'sql', 
    phaseShift: (2 * Math.PI) / 3, 
    glowColor: 'purple',
    label: 'PostgreSQL'
  },
  { 
    id: 'ml',
    orbitRadius: 180, 
    size: 40, 
    speed: -0.6, 
    iconType: 'ml', 
    phaseShift: (4 * Math.PI) / 3, 
    glowColor: 'purple',
    label: 'AI / LLM'
  },
];

// --- Memoized Orbiting Skill Component ---
const OrbitingSkill = memo(({ config, angle }: OrbitingSkillProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const { orbitRadius, size, iconType, label } = config;

  const x = Math.cos(angle) * orbitRadius;
  const y = Math.sin(angle) * orbitRadius;

  return (
    <div
      className="absolute top-1/2 left-1/2"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        transform: `translate(calc(${x}px - 50%), calc(${y}px - 50%))`,
        zIndex: isHovered ? 20 : 10,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`
          relative w-full h-full p-2 bg-gray-800/90 backdrop-blur-sm
          rounded-full flex items-center justify-center
          transition-all duration-300 cursor-pointer
          ${isHovered ? 'scale-125 shadow-2xl' : 'shadow-lg hover:shadow-xl'}
        `}
        style={{
          boxShadow: isHovered
            ? `0 0 30px ${iconComponents[iconType]?.color}40, 0 0 60px ${iconComponents[iconType]?.color}20`
            : `0 0 15px ${iconComponents[iconType]?.color}20`,
        }}
      >
        <SkillIcon type={iconType} />
        {isHovered && (
          <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap border border-gray-700">
            {label}
          </div>
        )}
      </div>
    </div>
  );
});
OrbitingSkill.displayName = 'OrbitingSkill';

// --- Glowing Orbit Path Component ---
const GlowingOrbitPath = memo(({ radius, glowColor = 'cyan', animationDelay = 0 }: GlowingOrbitPathProps) => {
  const glowStyles = {
    cyan: 'border-cyan-500/30 shadow-[0_0_25px_rgba(6,182,212,0.15)]',
    purple: 'border-purple-500/30 shadow-[0_0_25px_rgba(168,85,247,0.15)]',
  };

  return (
    <div
      className={`
        absolute top-1/2 left-1/2 rounded-full border border-dashed
        transform -translate-x-1/2 -translate-y-1/2 pointer-events-none
        transition-all duration-1000 animate-pulse
        ${glowStyles[glowColor]}
      `}
      style={{
        width: `${radius * 2}px`,
        height: `${radius * 2}px`,
        animationDelay: `${animationDelay}s`,
      }}
    />
  );
});
GlowingOrbitPath.displayName = 'GlowingOrbitPath';

// --- Main OrbitingSkills Component ---
export const OrbitingSkills = memo(() => {
  const [time, setTime] = useState(0);

  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();

    const animate = (currentTime: number) => {
      const deltaTime = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      setTime((prevTime) => prevTime + deltaTime);
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="relative w-full h-full min-h-[400px] flex items-center justify-center overflow-hidden">
      {/* Central Core */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
        <div className="relative w-20 h-20 bg-gradient-to-tr from-cyan-500 to-purple-600 rounded-full flex items-center justify-center p-0.5 shadow-[0_0_50px_rgba(6,182,212,0.4)] animate-pulse">
          <div className="w-full h-full bg-gray-900 rounded-full flex flex-col items-center justify-center p-2 text-center">
            <span className="text-xs font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              FULLSTACK
            </span>
            <span className="text-[9px] text-gray-400">DEV</span>
          </div>
        </div>
      </div>

      {/* Orbit Paths */}
      <GlowingOrbitPath radius={100} glowColor="cyan" animationDelay={0} />
      <GlowingOrbitPath radius={180} glowColor="purple" animationDelay={1} />

      {/* Skill Icons */}
      {skillsConfig.map((config) => {
        const currentAngle = config.phaseShift + time * config.speed * 0.5;
        return <OrbitingSkill key={config.id} config={config} angle={currentAngle} />;
      })}
    </div>
  );
});

OrbitingSkills.displayName = 'OrbitingSkills';
export default OrbitingSkills;
