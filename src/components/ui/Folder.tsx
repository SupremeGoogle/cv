// React Bits Folder, typed for this project.
// Click (or hover) a folder and up to three "papers" fan out of it.

import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import './Folder.css';

const darkenColor = (hex: string, percent: number) => {
  let color = hex.startsWith('#') ? hex.slice(1) : hex;
  if (color.length === 3) {
    color = color.split('').map(c => c + c).join('');
  }
  const num = parseInt(color.slice(0, 6), 16);
  let r = (num >> 16) & 0xff;
  let g = (num >> 8) & 0xff;
  let b = num & 0xff;
  r = Math.max(0, Math.min(255, Math.floor(r * (1 - percent))));
  g = Math.max(0, Math.min(255, Math.floor(g * (1 - percent))));
  b = Math.max(0, Math.min(255, Math.floor(b * (1 - percent))));
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
};

type FolderProps = {
  color?: string;
  size?: number;
  items?: ReactNode[];
  className?: string;
  /** Flip to true to open the folder without a click — used on scroll. */
  autoOpen?: boolean;
};

const Folder = ({ color = '#5227FF', size = 1, items = [], className = '', autoOpen = false }: FolderProps) => {
  // Upstream caps this at 3; a fourth slot is supported here so one folder can
  // hold all four stats (see the .paper:nth-child(4) rules in Folder.css).
  const maxItems = 4;
  const papers: ReactNode[] = items.slice(0, maxItems);
  while (papers.length < maxItems) papers.push(null);

  const [open, setOpen] = useState(false);

  // Opening on scroll should not fight the click handler: once autoOpen fires
  // the folder stays clickable and can be closed again by hand.
  useEffect(() => {
    if (autoOpen) setOpen(true);
  }, [autoOpen]);
  const [paperOffsets, setPaperOffsets] = useState(
    Array.from({ length: maxItems }, () => ({ x: 0, y: 0 })),
  );

  const folderStyle = {
    '--folder-color': color,
    '--folder-back-color': darkenColor(color, 0.08),
    '--paper-1': darkenColor('#ffffff', 0.1),
    '--paper-2': darkenColor('#ffffff', 0.05),
    '--paper-3': '#ffffff',
  } as CSSProperties;

  const handleClick = () => {
    setOpen(prev => !prev);
    if (open) setPaperOffsets(Array.from({ length: maxItems }, () => ({ x: 0, y: 0 })));
  };

  const handlePaperMouseMove = (e: React.MouseEvent<HTMLDivElement>, index: number) => {
    if (!open) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetX = (e.clientX - (rect.left + rect.width / 2)) * 0.15;
    const offsetY = (e.clientY - (rect.top + rect.height / 2)) * 0.15;
    setPaperOffsets(prev => {
      const next = [...prev];
      next[index] = { x: offsetX, y: offsetY };
      return next;
    });
  };

  const handlePaperMouseLeave = (index: number) => {
    setPaperOffsets(prev => {
      const next = [...prev];
      next[index] = { x: 0, y: 0 };
      return next;
    });
  };

  return (
    <div style={{ transform: `scale(${size})` }} className={className}>
      <div
        className={`folder ${open ? 'open' : ''}`.trim()}
        style={folderStyle}
        onClick={handleClick}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
          }
        }}
        tabIndex={0}
        role="button"
        aria-expanded={open}
        aria-label={open ? 'Закрыть папку' : 'Открыть папку'}
      >
        <div className="folder__back">
          {papers.map((item, i) => (
            <div
              key={i}
              className={`paper paper-${i + 1}`}
              onMouseMove={e => handlePaperMouseMove(e, i)}
              onMouseLeave={() => handlePaperMouseLeave(i)}
              style={
                open
                  ? ({
                      '--magnet-x': `${paperOffsets[i]?.x || 0}px`,
                      '--magnet-y': `${paperOffsets[i]?.y || 0}px`,
                    } as CSSProperties)
                  : undefined
              }
            >
              {item}
            </div>
          ))}
          <div className="folder__front"></div>
          <div className="folder__front right"></div>
        </div>
      </div>
    </div>
  );
};

export default Folder;
