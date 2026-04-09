"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X } from 'lucide-react';

export interface Position3D { x: number; y: number; z: number; }
export interface SphericalPosition { theta: number; phi: number; radius: number; }
export interface WorldPosition extends Position3D { scale: number; zIndex: number; isVisible: boolean; fadeOpacity: number; originalIndex: number; }
export interface ImageData { id: string; src: string; alt: string; title?: string; description?: string; }
export interface SphereImageGridProps {
  images?: ImageData[];
  containerSize?: number;
  sphereRadius?: number;
  dragSensitivity?: number;
  momentumDecay?: number;
  maxRotationSpeed?: number;
  baseImageScale?: number;
  hoverScale?: number;
  perspective?: number;
  autoRotate?: boolean;
  autoRotateSpeed?: number;
  className?: string;
  onImageClick?: (image: ImageData) => void;
}
interface RotationState { x: number; y: number; z: number; }
interface VelocityState { x: number; y: number; }
interface MousePosition { x: number; y: number; }

const SPHERE_MATH = {
  degreesToRadians: (d: number) => d * (Math.PI / 180),
  radiansToDegrees: (r: number) => r * (180 / Math.PI),
  sphericalToCartesian: (radius: number, theta: number, phi: number): Position3D => ({
    x: radius * Math.sin(phi) * Math.cos(theta),
    y: radius * Math.cos(phi),
    z: radius * Math.sin(phi) * Math.sin(theta)
  }),
  calculateDistance: (pos: Position3D, center: Position3D = { x: 0, y: 0, z: 0 }): number => {
    const dx = pos.x - center.x, dy = pos.y - center.y, dz = pos.z - center.z;
    return Math.sqrt(dx*dx + dy*dy + dz*dz);
  },
  normalizeAngle: (angle: number): number => {
    while (angle > 180) angle -= 360;
    while (angle < -180) angle += 360;
    return angle;
  }
};

const SphereImageGrid: React.FC<SphereImageGridProps> = ({
  images = [], containerSize = 400, sphereRadius = 200,
  dragSensitivity = 0.5, momentumDecay = 0.95, maxRotationSpeed = 5,
  baseImageScale = 0.12, perspective = 1000,
  autoRotate = false, autoRotateSpeed = 0.3, className = '', onImageClick
}) => {
  const [isMounted, setIsMounted] = useState(false);
  const [rotation, setRotation] = useState<RotationState>({ x: 15, y: 15, z: 0 });
  const [velocity, setVelocity] = useState<VelocityState>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [selectedImage, setSelectedImage] = useState<ImageData | null>(null);
  const [imagePositions, setImagePositions] = useState<SphericalPosition[]>([]);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastMousePos = useRef<MousePosition>({ x: 0, y: 0 });
  const animationFrame = useRef<number | null>(null);
  const actualSphereRadius = sphereRadius || containerSize * 0.5;
  const baseImageSize = containerSize * baseImageScale;

  const generateSpherePositions = useCallback((): SphericalPosition[] => {
    const positions: SphericalPosition[] = [];
    const imageCount = images.length;
    const goldenRatio = (1 + Math.sqrt(5)) / 2;
    const angleIncrement = 2 * Math.PI / goldenRatio;
    for (let i = 0; i < imageCount; i++) {
      const t = i / imageCount;
      const inclination = Math.acos(1 - 2 * t);
      const azimuth = angleIncrement * i;
      let phi = inclination * (180 / Math.PI);
      let theta = (azimuth * (180 / Math.PI)) % 360;
      const poleBonus = Math.pow(Math.abs(phi - 90) / 90, 0.6) * 35;
      if (phi < 90) phi = Math.max(5, phi - poleBonus);
      else phi = Math.min(175, phi + poleBonus);
      phi = 15 + (phi / 180) * 150;
      theta = (theta + (Math.random() - 0.5) * 20) % 360;
      phi = Math.max(0, Math.min(180, phi + (Math.random() - 0.5) * 10));
      positions.push({ theta, phi, radius: actualSphereRadius });
    }
    return positions;
  }, [images.length, actualSphereRadius]);

  const calculateWorldPositions = useCallback((): WorldPosition[] => {
    const positions = imagePositions.map((pos, index) => {
      const thetaRad = SPHERE_MATH.degreesToRadians(pos.theta);
      const phiRad = SPHERE_MATH.degreesToRadians(pos.phi);
      const rotXRad = SPHERE_MATH.degreesToRadians(rotation.x);
      const rotYRad = SPHERE_MATH.degreesToRadians(rotation.y);
      let x = pos.radius * Math.sin(phiRad) * Math.cos(thetaRad);
      let y = pos.radius * Math.cos(phiRad);
      let z = pos.radius * Math.sin(phiRad) * Math.sin(thetaRad);
      const x1 = x * Math.cos(rotYRad) + z * Math.sin(rotYRad);
      const z1 = -x * Math.sin(rotYRad) + z * Math.cos(rotYRad);
      x = x1; z = z1;
      const y2 = y * Math.cos(rotXRad) - z * Math.sin(rotXRad);
      const z2 = y * Math.sin(rotXRad) + z * Math.cos(rotXRad);
      y = y2; z = z2;
      const fadeZoneStart = -10, fadeZoneEnd = -30;
      const isVisible = z > fadeZoneEnd;
      let fadeOpacity = 1;
      if (z <= fadeZoneStart) fadeOpacity = Math.max(0, (z - fadeZoneEnd) / (fadeZoneStart - fadeZoneEnd));
      const isPoleImage = pos.phi < 30 || pos.phi > 150;
      const distanceFromCenter = Math.sqrt(x*x + y*y);
      const maxDistance = actualSphereRadius;
      const distanceRatio = Math.min(distanceFromCenter / maxDistance, 1);
      const distancePenalty = isPoleImage ? 0.4 : 0.7;
      const centerScale = Math.max(0.3, 1 - distanceRatio * distancePenalty);
      const depthScale = (z + actualSphereRadius) / (2 * actualSphereRadius);
      const scale = centerScale * Math.max(0.5, 0.8 + depthScale * 0.3);
      return { x, y, z, scale, zIndex: Math.round(1000 + z), isVisible, fadeOpacity, originalIndex: index };
    });
    const adjustedPositions = [...positions];
    for (let i = 0; i < adjustedPositions.length; i++) {
      const pos = adjustedPositions[i];
      if (!pos.isVisible) continue;
      let adjustedScale = pos.scale;
      const imageSize = baseImageSize * adjustedScale;
      for (let j = 0; j < adjustedPositions.length; j++) {
        if (i === j) continue;
        const other = adjustedPositions[j];
        if (!other.isVisible) continue;
        const otherSize = baseImageSize * other.scale;
        const dx = pos.x - other.x, dy = pos.y - other.y;
        const distance = Math.sqrt(dx*dx + dy*dy);
        const minDistance = (imageSize + otherSize) / 2 + 25;
        if (distance < minDistance && distance > 0) {
          const overlap = minDistance - distance;
          const reductionFactor = Math.max(0.4, 1 - (overlap / minDistance) * 0.6);
          adjustedScale = Math.min(adjustedScale, adjustedScale * reductionFactor);
        }
      }
      adjustedPositions[i] = { ...pos, scale: Math.max(0.25, adjustedScale) };
    }
    return adjustedPositions;
  }, [imagePositions, rotation, actualSphereRadius, baseImageSize]);

  const clampRotationSpeed = useCallback((speed: number) => Math.max(-maxRotationSpeed, Math.min(maxRotationSpeed, speed)), [maxRotationSpeed]);

  const updateMomentum = useCallback(() => {
    if (isDragging) return;
    setVelocity(prev => {
      const nv = { x: prev.x * momentumDecay, y: prev.y * momentumDecay };
      if (!autoRotate && Math.abs(nv.x) < 0.01 && Math.abs(nv.y) < 0.01) return { x: 0, y: 0 };
      return nv;
    });
    setRotation(prev => {
      let newY = prev.y;
      if (autoRotate) newY += autoRotateSpeed;
      newY += clampRotationSpeed(velocity.y);
      return { x: SPHERE_MATH.normalizeAngle(prev.x + clampRotationSpeed(velocity.x)), y: SPHERE_MATH.normalizeAngle(newY), z: prev.z };
    });
  }, [isDragging, momentumDecay, velocity, clampRotationSpeed, autoRotate, autoRotateSpeed]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setVelocity({ x: 0, y: 0 });
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - lastMousePos.current.x;
    const deltaY = e.clientY - lastMousePos.current.y;
    const rd = { x: -deltaY * dragSensitivity, y: deltaX * dragSensitivity };
    setRotation(prev => ({ x: SPHERE_MATH.normalizeAngle(prev.x + clampRotationSpeed(rd.x)), y: SPHERE_MATH.normalizeAngle(prev.y + clampRotationSpeed(rd.y)), z: prev.z }));
    setVelocity({ x: clampRotationSpeed(rd.x), y: clampRotationSpeed(rd.y) });
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  }, [isDragging, dragSensitivity, clampRotationSpeed]);

  const handleMouseUp = useCallback(() => setIsDragging(false), []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    setIsDragging(true);
    setVelocity({ x: 0, y: 0 });
    lastMousePos.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const touch = e.touches[0];
    const deltaX = touch.clientX - lastMousePos.current.x;
    const deltaY = touch.clientY - lastMousePos.current.y;
    const rd = { x: -deltaY * dragSensitivity, y: deltaX * dragSensitivity };
    setRotation(prev => ({ x: SPHERE_MATH.normalizeAngle(prev.x + clampRotationSpeed(rd.x)), y: SPHERE_MATH.normalizeAngle(prev.y + clampRotationSpeed(rd.y)), z: prev.z }));
    setVelocity({ x: clampRotationSpeed(rd.x), y: clampRotationSpeed(rd.y) });
    lastMousePos.current = { x: touch.clientX, y: touch.clientY };
  }, [isDragging, dragSensitivity, clampRotationSpeed]);

  const handleTouchEnd = useCallback(() => setIsDragging(false), []);

  useEffect(() => { setIsMounted(true); }, []);
  useEffect(() => { setImagePositions(generateSpherePositions()); }, [generateSpherePositions]);
  useEffect(() => {
    const animate = () => { updateMomentum(); animationFrame.current = requestAnimationFrame(animate); };
    if (isMounted) animationFrame.current = requestAnimationFrame(animate);
    return () => { if (animationFrame.current) cancelAnimationFrame(animationFrame.current); };
  }, [isMounted, updateMomentum]);

  useEffect(() => {
    if (!isMounted) return;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isMounted, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  const worldPositions = calculateWorldPositions();

  const renderImageNode = useCallback((image: ImageData, index: number) => {
    const position = worldPositions[index];
    if (!position || !position.isVisible) return null;
    const isHovered = hoveredIndex === index;
    const finalScale = isHovered ? Math.min(1.2, 1.2 / position.scale) : 1;
    
    // Check if it's the C# project
    const isCSharp = image.title?.includes('C#');
    
    return (
      <div
        key={image.id}
        className="absolute cursor-pointer select-none transition-transform duration-300 ease-out group"
        style={{
          width: 'auto',
          minWidth: `${baseImageSize * position.scale}px`,
          height: 'auto',
          left: `${containerSize/2 + position.x}px`,
          top: `${containerSize/2 + position.y}px`,
          opacity: position.fadeOpacity,
          transform: `translate(-50%, -50%) scale(${finalScale})`,
          zIndex: position.zIndex
        }}
        onMouseEnter={() => setHoveredIndex(index)}
        onMouseLeave={() => setHoveredIndex(null)}
        onClick={() => {
          if (onImageClick) {
            onImageClick(image);
          } else {
            setSelectedImage(image);
          }
        }}
      >
        <div className={`
          rounded-full border border-white/20 overflow-hidden
          flex items-center justify-center
          transition-all duration-300
          ${isHovered ? 'border-white/50 scale-110' : ''}
        `}
        style={{
          boxShadow: isHovered 
            ? `0 10px 30px rgba(0,0,0,0.5), 0 0 20px rgba(52,211,153,0.3)` 
            : '0 4px 10px rgba(0,0,0,0.3)',
          width: baseImageSize * 1.5,
          height: baseImageSize * 1.5
        }}>
          <img src={image.src} alt={image.alt} className="w-full h-full object-cover" />
          {isHovered && (
             <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm transition-all duration-300">
                <span className="text-[10px] md:text-xs font-bold tracking-tight text-white/90 text-center px-2">
                  {image.title || image.alt}
                </span>
             </div>
          )}
        </div>
      </div>
    );
  }, [worldPositions, baseImageSize, containerSize, hoveredIndex]);

  if (!isMounted) return <div className="bg-gray-100 rounded-lg animate-pulse flex items-center justify-center" style={{ width: containerSize, height: containerSize }}><div className="text-gray-400">Loading...</div></div>;
  if (!images.length) return <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center" style={{ width: containerSize, height: containerSize }}><div className="text-gray-400 text-center"><p>No images</p></div></div>;

  return (
    <>
      <style>{`@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } } @keyframes scaleIn { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }`}</style>
      <div ref={containerRef} className={`relative select-none cursor-grab active:cursor-grabbing ${className}`}
        style={{ width: containerSize, height: containerSize, perspective: `${perspective}px` }}
        onMouseDown={handleMouseDown} onTouchStart={handleTouchStart}>
        <div className="relative w-full h-full" style={{ zIndex: 10 }}>
          {images.map((image, index) => renderImageNode(image, index))}
        </div>
      </div>
      {selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
          onClick={() => setSelectedImage(null)}
          style={{ animation: 'fadeIn 0.3s ease-out' }}>
          <div className="bg-gray-900 border border-white/10 rounded-xl max-w-md w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            style={{ animation: 'scaleIn 0.3s ease-out' }}>
            <div className="relative aspect-square">
              <img src={selectedImage.src} alt={selectedImage.alt} className="w-full h-full object-cover" />
              <button onClick={() => setSelectedImage(null)} className="absolute top-2 right-2 w-8 h-8 bg-black/60 rounded-full text-white flex items-center justify-center hover:bg-black/80 transition-all cursor-pointer">
                <X size={16} />
              </button>
            </div>
            {(selectedImage.title || selectedImage.description) && (
              <div className="p-4">
                {selectedImage.title && <h3 className="text-lg font-bold text-white mb-1">{selectedImage.title}</h3>}
                {selectedImage.description && <p className="text-gray-400 text-sm">{selectedImage.description}</p>}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default SphereImageGrid;
