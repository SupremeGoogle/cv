import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export interface DigitalProject {
  id: number;
  name: string;
  url: string;
  img: string;
  desc: string;
}

interface DigitalProjectSphereProps {
  projects: DigitalProject[];
  onProjectClick: (project: DigitalProject) => void;
}

interface SpherePoint {
  theta: number;
  phi: number;
}

interface RenderPoint extends SpherePoint {
  project: DigitalProject;
  x: number;
  y: number;
  z: number;
  scale: number;
  opacity: number;
  zIndex: number;
}

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const normalizeAngle = (value: number) => {
  let angle = value;
  while (angle > 180) angle -= 360;
  while (angle < -180) angle += 360;
  return angle;
};

const toRadians = (degrees: number) => (Math.PI / 180) * degrees;

export default function DigitalProjectSphere({ projects, onProjectClick }: DigitalProjectSphereProps) {
  const [rotation, setRotation] = useState({ x: 15, y: 15 });
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const lastPointer = useRef({ x: 0, y: 0 });
  const velocityRef = useRef({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const frameRef = useRef<number | null>(null);

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const isShort = typeof window !== 'undefined' && window.innerHeight < 850;
  const size = isMobile ? 260 : isShort ? 370 : 460;
  const radius = isMobile ? 100 : isShort ? 140 : 175;
  const imageSize = isMobile ? 58 : isShort ? 70 : 78;

  const basePoints = useMemo<SpherePoint[]>(() => {
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));

    return projects.map((_, index) => {
      const progress = projects.length <= 1 ? 0.5 : index / (projects.length - 1);
      let phi = Math.acos(1 - 2 * progress);
      let theta = goldenAngle * index;

      phi = clamp(phi + toRadians((index % 3 - 1) * 8), toRadians(12), toRadians(168));
      theta += toRadians((index % 2 ? 10 : -10));

      return {
        theta,
        phi,
      };
    });
  }, [projects]);

  const renderedPoints = useMemo<RenderPoint[]>(() => {
    const rotX = toRadians(rotation.x);
    const rotY = toRadians(rotation.y);

    return basePoints
      .map((point, index) => {
        const sinPhi = Math.sin(point.phi);
        const baseX = radius * sinPhi * Math.cos(point.theta);
        const baseY = radius * Math.cos(point.phi);
        const baseZ = radius * sinPhi * Math.sin(point.theta);

        const rotatedX = baseX * Math.cos(rotY) + baseZ * Math.sin(rotY);
        const zAfterY = -baseX * Math.sin(rotY) + baseZ * Math.cos(rotY);
        const rotatedY = baseY * Math.cos(rotX) - zAfterY * Math.sin(rotX);
        const rotatedZ = baseY * Math.sin(rotX) + zAfterY * Math.cos(rotX);

        const depth = (rotatedZ + radius) / (2 * radius);
        const edgeDistance = Math.hypot(rotatedX, rotatedY) / radius;
        const scale = clamp(0.55 + depth * 0.45 - edgeDistance * 0.12, 0.42, 1.08);
        const opacity = rotatedZ < -radius * 0.45 ? 0.22 : clamp(0.45 + depth * 0.55, 0.35, 1);

        return {
          ...point,
          project: projects[index],
          x: rotatedX,
          y: rotatedY,
          z: rotatedZ,
          scale,
          opacity,
          zIndex: Math.round(1000 + rotatedZ),
        };
      })
      .sort((a, b) => a.z - b.z);
  }, [basePoints, projects, radius, rotation.x, rotation.y]);

  useEffect(() => {
    const tick = () => {
      const velocity = velocityRef.current;

      setRotation(prev => ({
        x: normalizeAngle(prev.x + velocity.x),
        y: normalizeAngle(prev.y + (isDraggingRef.current ? velocity.y : velocity.y + (isShort ? 0.35 : 0.65))),
      }));

      velocityRef.current = {
        x: Math.abs(velocity.x) < 0.01 ? 0 : velocity.x * 0.94,
        y: Math.abs(velocity.y) < 0.01 ? 0 : velocity.y * 0.94,
      };

      frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [isShort]);

  const beginDrag = useCallback((x: number, y: number) => {
    isDraggingRef.current = true;
    velocityRef.current = { x: 0, y: 0 };
    lastPointer.current = { x, y };
  }, []);

  const moveDrag = useCallback((x: number, y: number) => {
    if (!isDraggingRef.current) return;

    const deltaX = x - lastPointer.current.x;
    const deltaY = y - lastPointer.current.y;
    const nextVelocity = {
      x: clamp(-deltaY * 0.45, -5, 5),
      y: clamp(deltaX * 0.45, -5, 5),
    };

    setRotation(prev => ({
      x: normalizeAngle(prev.x + nextVelocity.x),
      y: normalizeAngle(prev.y + nextVelocity.y),
    }));
    velocityRef.current = nextVelocity;
    lastPointer.current = { x, y };
  }, []);

  const endDrag = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  return (
    <div
      className="digital-sphere"
      style={{ width: size, height: size }}
      onMouseDown={event => beginDrag(event.clientX, event.clientY)}
      onMouseMove={event => moveDrag(event.clientX, event.clientY)}
      onMouseUp={endDrag}
      onMouseLeave={endDrag}
      onTouchStart={event => {
        const touch = event.touches[0];
        beginDrag(touch.clientX, touch.clientY);
      }}
      onTouchMove={event => {
        const touch = event.touches[0];
        moveDrag(touch.clientX, touch.clientY);
      }}
      onTouchEnd={endDrag}
    >
      <div className="digital-sphere-glow"></div>
      <div className="digital-sphere-ring digital-sphere-ring-a"></div>
      <div className="digital-sphere-ring digital-sphere-ring-b"></div>
      {renderedPoints.map(point => {
        const isHovered = hoveredId === point.project.id;

        return (
          <button
            key={point.project.id}
            type="button"
            className="digital-sphere-item"
            style={{
              width: imageSize,
              height: imageSize,
              opacity: point.opacity,
              zIndex: isHovered ? 2000 : point.zIndex,
              transform: `translate3d(${point.x}px, ${point.y}px, 0) translate(-50%, -50%) scale(${isHovered ? point.scale * 1.18 : point.scale})`,
            }}
            aria-label={`Открыть проект ${point.project.name}`}
            title={point.project.name}
            onClick={() => onProjectClick(point.project)}
            onMouseEnter={() => setHoveredId(point.project.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            <img src={point.project.img} alt="" draggable={false} />
            <span>{point.project.name}</span>
          </button>
        );
      })}
    </div>
  );
}
