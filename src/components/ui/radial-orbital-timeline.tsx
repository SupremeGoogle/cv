"use client";
import React, { useState, useEffect, useRef } from "react";
import { Badge } from "./badge";
import { Card, CardContent, CardHeader, CardTitle } from "./card";

// --- Custom SVG Icons to avoid lucide-react dependency issues ---
const CustomIcon = ({ name, size = 16, className = "" }: { name: string; size?: number; className?: string }) => {
  const icons: Record<string, React.ReactNode> = {
    bot: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <rect x="3" y="11" width="18" height="10" rx="2" />
        <circle cx="12" cy="5" r="2" />
        <path d="M12 7v4" />
        <line x1="8" y1="15" x2="8" y2="15.01" />
        <line x1="16" y1="15" x2="16" y2="15.01" />
      </svg>
    ),
    zap: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
    home: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
    car: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
        <circle cx="7" cy="17" r="2" />
        <path d="M9 17h6" />
        <circle cx="17" cy="17" r="2" />
      </svg>
    ),
    fileText: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
    shieldCheck: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),
    messageSquare: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
    arrowRight: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <line x1="5" y1="12" x2="19" y2="12" />
        <polyline points="12 5 19 12 12 19" />
      </svg>
    ),
    link: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </svg>
    ),
  };
  return icons[name] || icons.bot;
};

interface TimelineItem {
  id: number;
  title: string;
  date: string;
  content: string;
  category: string;
  iconName: string;
  relatedIds: number[];
  status: "completed" | "in-progress" | "pending";
  energy: number;
  link?: string;
}

interface RadialOrbitalTimelineProps {
  timelineData: TimelineItem[];
}

export default function RadialOrbitalTimeline({
  timelineData,
}: RadialOrbitalTimelineProps) {
  const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>(
    {}
  );
  const [rotationAngle, setRotationAngle] = useState<number>(0);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [pulseEffect, setPulseEffect] = useState<Record<number, boolean>>({});
  const [activeNodeId, setActiveNodeId] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const orbitRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === containerRef.current || e.target === orbitRef.current) {
      setExpandedItems({});
      setActiveNodeId(null);
      setPulseEffect({});
      setAutoRotate(true);
    }
  };

  const toggleItem = (id: number) => {
    setExpandedItems((prev) => {
      const newState = { ...prev };
      Object.keys(newState).forEach((key) => {
        if (parseInt(key) !== id) {
          newState[parseInt(key)] = false;
        }
      });

      newState[id] = !prev[id];

      if (!prev[id]) {
        setActiveNodeId(id);
        setAutoRotate(false);

        const relatedItems = getRelatedItems(id);
        const newPulseEffect: Record<number, boolean> = {};
        relatedItems.forEach((relId) => {
          newPulseEffect[relId] = true;
        });
        setPulseEffect(newPulseEffect);

        centerViewOnNode(id);
      } else {
        setActiveNodeId(null);
        setAutoRotate(true);
        setPulseEffect({});
      }

      return newState;
    });
  };

  useEffect(() => {
    let rotationTimer: any;

    if (autoRotate) {
      rotationTimer = setInterval(() => {
        setRotationAngle((prev) => (prev + 0.3) % 360);
      }, 50);
    }

    return () => {
      if (rotationTimer) clearInterval(rotationTimer);
    };
  }, [autoRotate]);

  const centerViewOnNode = (nodeId: number) => {
    if (!nodeRefs.current[nodeId]) return;
    const nodeIndex = timelineData.findIndex((item) => item.id === nodeId);
    const totalNodes = timelineData.length;
    const targetAngle = (nodeIndex / totalNodes) * 360;
    setRotationAngle(270 - targetAngle);
  };

  const calculateNodePosition = (index: number, total: number) => {
    const angle = ((index / total) * 360 + rotationAngle) % 360;
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const radius = isMobile ? 115 : 145;
    const radian = (angle * Math.PI) / 180;
    const x = radius * Math.cos(radian);
    const y = radius * Math.sin(radian);
    const zIndex = Math.round(100 + 50 * Math.cos(radian));
    const opacity = Math.max(0.4, Math.min(1, 0.4 + 0.6 * ((1 + Math.sin(radian)) / 2)));
    return { x, y, angle, zIndex, opacity };
  };

  const getRelatedItems = (itemId: number): number[] => {
    const currentItem = timelineData.find((item) => item.id === itemId);
    return currentItem ? currentItem.relatedIds : [];
  };

  const isRelatedToActive = (itemId: number): boolean => {
    if (!activeNodeId) return false;
    const relatedItems = getRelatedItems(activeNodeId);
    return relatedItems.includes(itemId);
  };

  const getStatusStyles = (status: TimelineItem["status"]): string => {
    switch (status) {
      case "completed": return "text-white bg-black border-white";
      case "in-progress": return "text-black bg-white border-black";
      default: return "text-white bg-black/40 border-white/50";
    }
  };

  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center bg-transparent overflow-hidden rounded-xl relative"
      style={{ minHeight: typeof window !== 'undefined' && window.innerWidth < 768 ? '260px' : '480px' }}
      ref={containerRef}
      onClick={handleContainerClick}
    >
      <div 
        className="relative w-full h-full flex items-center justify-center" 
        style={{ minHeight: typeof window !== 'undefined' && window.innerWidth < 768 ? '260px' : '480px' }}
      >
        <div
          className="absolute w-full h-full flex items-center justify-center"
          ref={orbitRef}
          style={{
            perspective: "1000px",
          }}
        >
          {/* Central Hub */}
          <div className="absolute w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 via-blue-500 to-teal-500 animate-pulse flex items-center justify-center z-10">
            <div className="absolute w-16 h-16 rounded-full border border-white/20 animate-ping opacity-70"></div>
            <div className="w-6 h-6 rounded-full bg-white/80 backdrop-blur-md"></div>
          </div>

          {/* Orbit paths */}
          <div className={`absolute rounded-full border border-white/10 ${typeof window !== 'undefined' && window.innerWidth < 768 ? 'w-[230px] h-[230px]' : 'w-[290px] h-[290px]'}`}></div>

          {timelineData.map((item, index) => {
            const position = calculateNodePosition(index, timelineData.length);
            const isExpanded = expandedItems[item.id];
            const isRelated = isRelatedToActive(item.id);
            const isPulsing = pulseEffect[item.id];
            const isBottomHalf = position.y > 20;

            return (
              <div
                key={item.id}
                ref={(el) => { nodeRefs.current[item.id] = el; }}
                className="absolute transition-all duration-700 cursor-pointer"
                style={{
                  transform: `translate(${position.x}px, ${position.y}px)`,
                  zIndex: isExpanded ? 200 : position.zIndex,
                  opacity: isExpanded ? 1 : position.opacity,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleItem(item.id);
                }}
              >
                {/* Visual Glow */}
                <div
                  className={`absolute rounded-full -inset-4 ${isPulsing ? "animate-pulse" : ""}`}
                  style={{
                    background: `radial-gradient(circle, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 70%)`
                  }}
                ></div>

                {/* Node Circle */}
                <div
                  className={`
                  w-8 h-8 rounded-full flex items-center justify-center
                  ${isExpanded ? "bg-white text-black" : isRelated ? "bg-white/50 text-black" : "bg-black text-white"}
                  border-2 ${isExpanded ? "border-white shadow-lg" : isRelated ? "border-white animate-pulse" : "border-white/40"}
                  transition-all duration-300 transform ${isExpanded ? "scale-125" : ""}
                `}
                >
                  <CustomIcon name={item.iconName} size={14} />
                </div>

                {/* Node Label */}
                <div className={`absolute ${isBottomHalf ? 'bottom-10' : 'top-10'} left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] font-semibold tracking-wider transition-all duration-300 ${isExpanded ? "text-white scale-110" : "text-white/60"}`}>
                  {item.title}
                </div>

                {/* Expanded Card */}
                {isExpanded && (
                  <Card className={`absolute ${isBottomHalf ? 'bottom-16' : 'top-16'} left-1/2 -translate-x-1/2 w-52 bg-black/95 backdrop-blur-xl border-white/20 shadow-2xl z-[300] overflow-visible`}>
                    <div className={`absolute ${isBottomHalf ? '-bottom-3' : '-top-3'} left-1/2 -translate-x-1/2 w-px h-3 bg-white/40`}></div>
                    <CardHeader className="p-3 pb-1">
                      <div className="flex justify-between items-center mb-1">
                        <Badge className={`px-1.5 py-0 text-[8px] rounded-none ${getStatusStyles(item.status)}`}>
                          {item.status.toUpperCase()}
                        </Badge>
                        <span className="text-[9px] font-mono text-white/40">{item.date}</span>
                      </div>
                      <CardTitle className="text-[11px] text-white tracking-widest uppercase">
                        {item.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-1 text-[10px] text-white/70 leading-relaxed">
                      <p className="mb-3">{item.content}</p>

                      <div className="pt-2 border-t border-white/10 space-y-2">
                        <div className="flex justify-between items-center text-[9px]">
                          <span className="flex items-center text-white/50"><CustomIcon name="zap" size={8} className="mr-1" /> Energy</span>
                          <span className="font-mono text-white">{item.energy}%</span>
                        </div>
                        <div className="w-full h-0.5 bg-white/10">
                          <div className="h-full bg-white" style={{ width: `${item.energy}%` }}></div>
                        </div>
                      </div>

                      {item.link && (
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 mt-3 text-[9px] text-white/70 hover:text-white border border-white/20 hover:border-white/40 px-2 py-1 rounded transition-all"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <CustomIcon name="link" size={8} />
                          Открыть бота
                        </a>
                      )}

                      {item.relatedIds.length > 0 && (
                        <div className="mt-3 pt-2 border-t border-white/10">
                          <div className="flex items-center mb-1.5 text-white/40 uppercase text-[8px] font-bold tracking-tighter">
                            <CustomIcon name="link" size={8} className="mr-1" /> Connected
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {item.relatedIds.map((relId) => {
                                const relItem = timelineData.find(i => i.id === relId);
                                return (
                                  <button
                                    key={relId}
                                    className="px-1.5 py-0.5 border border-white/10 text-[8px] hover:bg-white/10 transition-colors uppercase"
                                    onClick={(e) => { e.stopPropagation(); toggleItem(relId); }}
                                  >
                                    {relItem?.title}
                                  </button>
                                );
                            })}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
