import React from 'react';
import type { MotifType } from '../types';

interface CrochetArtworkProps {
  motif: MotifType;
  primaryColor?: string;
  accentColor?: string;
  variant?: 'main' | 'closeup' | 'giftbox';
  customImageUrl?: string;
  realPhotoUrl?: string;
  realPhotoPosition?: string;
  alt: string;
  className?: string;
}

export const CrochetArtwork: React.FC<CrochetArtworkProps> = ({
  motif,
  primaryColor = '#E3A1B4',
  accentColor = '#8B3152',
  variant = 'main',
  customImageUrl,
  realPhotoUrl,
  realPhotoPosition = 'object-center',
  alt,
  className = '',
}) => {
  if (customImageUrl) {
    return (
      <div className={`relative overflow-hidden bg-[#F5EFE8] ${className}`}>
        <img
          src={customImageUrl}
          alt={alt}
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
    );
  }

  if (variant === 'closeup') {
    return (
      <div className={`relative overflow-hidden bg-[#F4ECE4] ${className}`} role="img" aria-label={`${alt} stitch detail`}>
        <svg viewBox="0 0 400 340" className="h-full w-full">
          <defs>
            <radialGradient id={`cg-${motif}`} cx="50%" cy="45%" r="65%">
              <stop offset="0%" stopColor="#FFFDF9" />
              <stop offset="100%" stopColor="#EFE4D8" />
            </radialGradient>
            <pattern id={`stitch-${motif}`} width="28" height="22" patternUnits="userSpaceOnUse">
              <path
                d="M2 14 Q7 4 14 14 Q21 4 26 14"
                fill="none"
                stroke={primaryColor}
                strokeWidth="5"
                strokeLinecap="round"
                opacity="0.82"
              />
              <path
                d="M2 14 Q7 4 14 14 Q21 4 26 14"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="1.2"
                strokeDasharray="2 3"
                opacity="0.55"
              />
            </pattern>
          </defs>
          <rect width="400" height="340" fill={`url(#cg-${motif})`} />
          <circle cx="200" cy="170" r="118" fill="#FFF9F3" stroke="#E2D5C8" strokeWidth="1.5" />
          <circle cx="200" cy="170" r="102" fill={`url(#stitch-${motif})`} />
          <circle cx="200" cy="170" r="102" fill="none" stroke={accentColor} strokeWidth="2.5" strokeDasharray="6 6" opacity="0.45" />
          {/* Yarn skein & wooden hook */}
          <g transform="translate(245, 210) rotate(-28)">
            <rect x="-8" y="-95" width="9" height="165" rx="4.5" fill="#C89D72" />
            <path d="M-8 -92 C-12 -104, 4 -108, 2 -95 C0 -88, -5 -88, -8 -92 Z" fill="#C89D72" />
            <rect x="-8" y="-18" width="9" height="32" rx="2" fill="#A67C52" />
          </g>
          <g transform="translate(115, 240)">
            <ellipse cx="0" cy="0" rx="42" ry="28" fill={primaryColor} />
            <path d="M-32 -8 Q0 -26 32 -8 M-36 4 Q0 -14 36 4 M-28 14 Q0 0 28 14" fill="none" stroke={accentColor} strokeWidth="2.2" opacity="0.45" />
            <path d="M35 8 Q72 22 96 6" fill="none" stroke={primaryColor} strokeWidth="3.5" strokeLinecap="round" />
          </g>
          <text x="200" y="315" textAnchor="middle" fill="#6E6266" fontSize="12" fontFamily="Plus Jakarta Sans, sans-serif">
            Hand-looped cotton stitch texture
          </text>
        </svg>
      </div>
    );
  }

  if (variant === 'giftbox') {
    return (
      <div className={`relative overflow-hidden bg-[#F5EDF0] ${className}`} role="img" aria-label={`${alt} boutique gift packaging`}>
        <svg viewBox="0 0 400 340" className="h-full w-full">
          <rect width="400" height="340" fill="#F6EEF0" />
          <ellipse cx="200" cy="272" rx="125" ry="18" fill="#E3D4D8" opacity="0.7" />
          {/* Keepsake Box */}
          <rect x="95" y="130" width="210" height="135" rx="12" fill="#FFFDF9" stroke="#DFD0CA" strokeWidth="1.5" />
          <rect x="86" y="106" width="228" height="34" rx="8" fill="#FBF5EE" stroke="#DFD0CA" strokeWidth="1.5" />
          {/* Satin Ribbon */}
          <rect x="188" y="106" width="24" height="159" fill={primaryColor} opacity="0.85" />
          <rect x="86" y="166" width="228" height="18" fill={primaryColor} opacity="0.65" />
          {/* Ribbon Bow */}
          <path d="M200 106 C172 74, 146 92, 166 106 Z" fill={accentColor} opacity="0.85" />
          <path d="M200 106 C228 74, 254 92, 234 106 Z" fill={accentColor} opacity="0.85" />
          <circle cx="200" cy="105" r="9" fill={primaryColor} stroke={accentColor} strokeWidth="1.5" />
          {/* Handwritten Tag */}
          <g transform="translate(232, 118) rotate(12)">
            <rect x="0" y="0" width="66" height="40" rx="5" fill="#FFF9F3" stroke="#D7C7BE" strokeWidth="1.2" />
            <circle cx="8" cy="20" r="2.5" fill={accentColor} />
            <line x1="16" y1="15" x2="54" y2="15" stroke="#8C7B7F" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="16" y1="24" x2="46" y2="24" stroke="#B7A7AB" strokeWidth="1.5" strokeLinecap="round" />
          </g>
          <text x="200" y="308" textAnchor="middle" fill="#6E6266" fontSize="12" fontFamily="Plus Jakarta Sans, sans-serif">
            Signature linen wrap &amp; keepsake note
          </text>
        </svg>
      </div>
    );
  }

  if (realPhotoUrl && variant === 'main') {
    return (
      <div className={`relative overflow-hidden bg-[#F5EFE8] ${className}`}>
        <img
          src={realPhotoUrl}
          alt={alt}
          referrerPolicy="no-referrer"
          className={`h-full w-full object-cover ${realPhotoPosition} scale-[1.45] transition-transform duration-500 group-hover:scale-[1.52]`}
        />
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden bg-[#F5EFE8] ${className}`} role="img" aria-label={alt}>
      <svg viewBox="0 0 400 340" className="h-full w-full">
        <defs>
          <radialGradient id={`bg-${motif}`} cx="50%" cy="40%" r="65%">
            <stop offset="0%" stopColor="#FFFDF9" />
            <stop offset="100%" stopColor="#EFE6DC" />
          </radialGradient>
        </defs>
        <rect width="400" height="340" fill={`url(#bg-${motif})`} />
        <ellipse cx="200" cy="285" rx="108" ry="15" fill="#DFD2C6" opacity="0.65" />

        {motif === 'bouquet' && (
          <g transform="translate(200, 175)">
            {/* Wrapping cone */}
            <path d="M-76 -20 L0 112 L76 -20 Q0 -42 -76 -20 Z" fill="#EFE0D2" stroke="#D5C2B2" strokeWidth="1.5" />
            <path d="M-64 -16 L0 98 L64 -16" fill="#F9F1E8" opacity="0.85" />
            {/* Sage foliage */}
            <ellipse cx="-42" cy="-35" rx="14" ry="30" transform="rotate(-24 -42 -35)" fill="#89A082" />
            <ellipse cx="44" cy="-32" rx="14" ry="30" transform="rotate(24 44 -32)" fill="#789071" />
            <ellipse cx="0" cy="-58" rx="12" ry="26" fill="#9BB094" />
            {/* Stems */}
            <path d="M-28 -30 L-6 40 M28 -30 L6 40 M0 -45 L0 45" stroke="#6E8466" strokeWidth="3.5" strokeLinecap="round" />
            {/* Tulip blooms */}
            <g transform="translate(-34, -46) rotate(-14)">
              <path d="M-20 0 C-22 -28, 22 -28, 20 0 C18 18, -18 18, -20 0 Z" fill={primaryColor} />
              <path d="M-10 -20 C-4 -5, 4 -5, 10 -20" fill="none" stroke={accentColor} strokeWidth="2" opacity="0.5" />
            </g>
            <g transform="translate(34, -42) rotate(14)">
              <path d="M-20 0 C-22 -28, 22 -28, 20 0 C18 18, -18 18, -20 0 Z" fill={primaryColor} />
              <path d="M-10 -20 C-4 -5, 4 -5, 10 -20" fill="none" stroke={accentColor} strokeWidth="2" opacity="0.5" />
            </g>
            <g transform="translate(0, -68)">
              <path d="M-22 0 C-25 -32, 25 -32, 22 0 C20 20, -20 20, -22 0 Z" fill={primaryColor} stroke="#FFFDF9" strokeWidth="1.5" />
              <path d="M-12 -22 C-4 -6, 4 -6, 12 -22" fill="none" stroke={accentColor} strokeWidth="2.2" opacity="0.6" />
            </g>
            {/* Baby's breath dots */}
            <circle cx="-54" cy="-18" r="5" fill="#FFFDF9" />
            <circle cx="56" cy="-16" r="5" fill="#FFFDF9" />
            <circle cx="-18" cy="-86" r="4.5" fill="#FFFDF9" />
            <circle cx="20" cy="-84" r="4.5" fill="#FFFDF9" />
            {/* Satin Ribbon */}
            <path d="M-20 34 Q0 42 20 34 L14 48 Q0 54 -14 48 Z" fill={accentColor} />
            <path d="M0 44 L-16 74 M0 44 L16 74" stroke={accentColor} strokeWidth="3.5" strokeLinecap="round" />
          </g>
        )}

        {motif === 'sunflower' && (
          <g transform="translate(200, 175)">
            <path d="M-24 25 L-4 106 M22 30 L4 106 M0 -10 L0 106" stroke="#6E8466" strokeWidth="4.5" strokeLinecap="round" />
            <ellipse cx="-26" cy="56" rx="18" ry="9" transform="rotate(-30 -26 56)" fill="#89A082" />
            <ellipse cx="26" cy="62" rx="18" ry="9" transform="rotate(28 26 62)" fill="#789071" />
            {/* Main Sunflower */}
            <g transform="translate(0, -34)">
              {Array.from({ length: 12 }).map((_, idx) => (
                <ellipse
                  key={idx}
                  cx="0"
                  cy="-38"
                  rx="11"
                  ry="22"
                  transform={`rotate(${idx * 30})`}
                  fill={primaryColor}
                  stroke="#FFFDF9"
                  strokeWidth="1"
                />
              ))}
              <circle cx="0" cy="0" r="24" fill={accentColor} />
              <circle cx="0" cy="0" r="18" fill="none" stroke="#FFFDF9" strokeDasharray="2 4" strokeWidth="1.5" opacity="0.55" />
            </g>
            {/* Side Daisy */}
            <g transform="translate(-52, 8)">
              {Array.from({ length: 8 }).map((_, idx) => (
                <ellipse
                  key={idx}
                  cx="0"
                  cy="-18"
                  rx="6"
                  ry="12"
                  transform={`rotate(${idx * 45})`}
                  fill="#FFFDF9"
                  stroke="#E5DDD5"
                  strokeWidth="1"
                />
              ))}
              <circle cx="0" cy="0" r="10" fill={primaryColor} />
            </g>
          </g>
        )}

        {motif === 'rose' && (
          <g transform="translate(200, 180)">
            <path d="M-28 10 L-8 102 M28 10 L8 102 M0 -20 L0 102" stroke="#6E8466" strokeWidth="4" strokeLinecap="round" />
            <ellipse cx="-22" cy="48" rx="18" ry="9" transform="rotate(-25 -22 48)" fill="#89A082" />
            <ellipse cx="22" cy="52" rx="18" ry="9" transform="rotate(25 22 52)" fill="#789071" />
            {[
              { x: -34, y: -12, s: 0.85 },
              { x: 34, y: -10, s: 0.85 },
              { x: 0, y: -42, s: 1.05 },
            ].map((r, i) => (
              <g key={i} transform={`translate(${r.x}, ${r.y}) scale(${r.s})`}>
                <circle cx="0" cy="0" r="28" fill={primaryColor} />
                <path
                  d="M-16 -4 C-16 -18, 16 -18, 16 -2 C16 14, -12 18, -12 2 C-12 -10, 8 -10, 8 0 C8 6, -4 8, -4 0"
                  fill="none"
                  stroke={accentColor}
                  strokeWidth="3"
                  strokeLinecap="round"
                  opacity="0.7"
                />
              </g>
            ))}
          </g>
        )}

        {motif === 'teddy' && (
          <g transform="translate(200, 175)">
            {/* Ears */}
            <circle cx="-46" cy="-68" r="22" fill={primaryColor} />
            <circle cx="-46" cy="-68" r="12" fill={accentColor} opacity="0.45" />
            <circle cx="46" cy="-68" r="22" fill={primaryColor} />
            <circle cx="46" cy="-68" r="12" fill={accentColor} opacity="0.45" />
            {/* Body */}
            <ellipse cx="0" cy="45" rx="54" ry="58" fill={primaryColor} />
            <ellipse cx="0" cy="48" rx="32" ry="38" fill="#FFFDF9" opacity="0.65" />
            {/* Collar */}
            <path d="M-38 4 Q0 24 38 4 L30 22 Q0 36 -30 22 Z" fill="#9BB094" />
            {/* Head */}
            <circle cx="0" cy="-32" r="48" fill={primaryColor} />
            <ellipse cx="0" cy="-18" rx="22" ry="16" fill="#FFFDF9" opacity="0.82" />
            {/* Face */}
            <circle cx="-18" cy="-40" r="4.5" fill="#2A2225" />
            <circle cx="18" cy="-40" r="4.5" fill="#2A2225" />
            <ellipse cx="0" cy="-23" rx="7" ry="5" fill={accentColor} />
            <path d="M0 -18 L0 -12 M-6 -12 Q0 -7 6 -12" fill="none" stroke={accentColor} strokeWidth="2.2" strokeLinecap="round" />
            {/* Arms & Feet */}
            <ellipse cx="-52" cy="36" rx="18" ry="28" transform="rotate(24 -52 36)" fill={primaryColor} />
            <ellipse cx="52" cy="36" rx="18" ry="28" transform="rotate(-24 52 36)" fill={primaryColor} />
            <ellipse cx="-34" cy="92" rx="22" ry="18" fill={primaryColor} />
            <ellipse cx="34" cy="92" rx="22" ry="18" fill={primaryColor} />
            <ellipse cx="-34" cy="92" rx="12" ry="9" fill={accentColor} opacity="0.35" />
            <ellipse cx="34" cy="92" rx="12" ry="9" fill={accentColor} opacity="0.35" />
          </g>
        )}

        {motif === 'bunny' && (
          <g transform="translate(200, 182)">
            {/* Long Ears */}
            <ellipse cx="-24" cy="-92" rx="14" ry="44" transform="rotate(-12 -24 -92)" fill={primaryColor} />
            <ellipse cx="-24" cy="-90" rx="7" ry="30" transform="rotate(-12 -24 -90)" fill={accentColor} opacity="0.35" />
            <ellipse cx="26" cy="-86" rx="14" ry="44" transform="rotate(18 26 -86)" fill={primaryColor} />
            <ellipse cx="26" cy="-84" rx="7" ry="30" transform="rotate(18 26 -84)" fill={accentColor} opacity="0.35" />
            {/* Pinafore Dress */}
            <path d="M-40 16 L40 16 L54 90 Q0 100 -54 90 Z" fill={accentColor} opacity="0.88" />
            {/* Head */}
            <ellipse cx="0" cy="-26" rx="44" ry="38" fill={primaryColor} />
            <circle cx="-16" cy="-30" r="4" fill="#2A2225" />
            <circle cx="16" cy="-30" r="4" fill="#2A2225" />
            <ellipse cx="-26" cy="-20" rx="7" ry="4" fill="#E89DAE" opacity="0.6" />
            <ellipse cx="26" cy="-20" rx="7" ry="4" fill="#E89DAE" opacity="0.6" />
            <path d="M-4 -18 L4 -18 L0 -13 Z" fill="#D57A8E" />
            {/* Paws */}
            <ellipse cx="-42" cy="40" rx="13" ry="22" transform="rotate(20 -42 40)" fill={primaryColor} />
            <ellipse cx="42" cy="40" rx="13" ry="22" transform="rotate(-20 42 40)" fill={primaryColor} />
            <ellipse cx="-26" cy="94" rx="16" ry="12" fill={primaryColor} />
            <ellipse cx="26" cy="94" rx="16" ry="12" fill={primaryColor} />
          </g>
        )}

        {motif === 'tote' && (
          <g transform="translate(200, 180)">
            {/* Handles */}
            <path d="M-44 -48 C-44 -108, 44 -108, 44 -48" fill="none" stroke={primaryColor} strokeWidth="11" strokeLinecap="round" />
            {/* Tote Body */}
            <rect x="-78" y="-48" width="156" height="142" rx="12" fill={accentColor} stroke="#D8C9BC" strokeWidth="1.5" />
            {/* 3x2 Granny Squares */}
            {[-50, 0, 50].map((gx) =>
              [-16, 40].map((gy) => (
                <g key={`${gx}-${gy}`} transform={`translate(${gx}, ${gy})`}>
                  <rect x="-21" y="-21" width="42" height="42" rx="4" fill={primaryColor} opacity="0.88" />
                  <circle cx="0" cy="0" r="12" fill="#FFFDF9" />
                  <circle cx="0" cy="0" r="5" fill="#E9B84B" />
                </g>
              ))
            )}
          </g>
        )}

        {motif === 'purse' && (
          <g transform="translate(200, 182)">
            <path d="M-64 -38 C-64 -116, 64 -116, 64 -38" fill="none" stroke={accentColor} strokeWidth="5" strokeDasharray="5 4" />
            <rect x="-74" y="-36" width="148" height="114" rx="22" fill={primaryColor} stroke={accentColor} strokeWidth="1.5" />
            <path d="M-74 -12 Q0 42 74 -12 L74 -26 Q0 -44 -74 -26 Z" fill={primaryColor} stroke="#FFFDF9" strokeWidth="2" />
            {/* Scallop edge */}
            {[-54, -36, -18, 0, 18, 36, 54].map((sx) => (
              <circle key={sx} cx={sx} cy="22" r="9" fill={primaryColor} />
            ))}
            <circle cx="0" cy="24" r="7" fill="#FFFDF9" stroke="#D5C4B6" strokeWidth="1.5" />
          </g>
        )}

        {motif === 'blanket' && (
          <g transform="translate(200, 175)">
            <rect x="-86" y="-68" width="172" height="146" rx="14" fill={primaryColor} stroke={accentColor} strokeWidth="2" />
            <rect x="-74" y="-56" width="148" height="122" rx="8" fill="none" stroke="#FFFDF9" strokeWidth="2" strokeDasharray="4 4" />
            {[-42, -14, 14, 42].map((y) => (
              <path
                key={y}
                d={`M-64 ${y} Q-48 ${y - 14} -32 ${y} Q-16 ${y - 14} 0 ${y} Q16 ${y - 14} 32 ${y} Q48 ${y - 14} 64 ${y}`}
                fill="none"
                stroke={accentColor}
                strokeWidth="2.5"
                opacity="0.55"
              />
            ))}
            {/* Satin Ribbon Wrap */}
            <rect x="-86" y="18" width="172" height="16" fill={accentColor} opacity="0.7" />
            <circle cx="0" cy="26" r="10" fill="#FFFDF9" stroke={accentColor} strokeWidth="2" />
          </g>
        )}

        {motif === 'booties' && (
          <g transform="translate(200, 182)">
            {/* Beanie */}
            <g transform="translate(-38, -28)">
              <path d="M-42 20 C-42 -42, 42 -42, 42 20 Z" fill={primaryColor} />
              <rect x="-46" y="16" width="92" height="22" rx="8" fill={accentColor} opacity="0.82" />
              <circle cx="0" cy="-32" r="12" fill="#FFFDF9" />
            </g>
            {/* Bootie */}
            <g transform="translate(46, 36)">
              <path d="M-34 0 L-34 32 Q0 42 42 32 Q46 12 24 8 L8 4 L8 -16 L-34 -16 Z" fill={primaryColor} />
              <rect x="-36" y="-22" width="46" height="14" rx="5" fill={accentColor} opacity="0.82" />
              <path d="M-12 -14 Q0 -26 12 -14" fill="none" stroke="#FFFDF9" strokeWidth="2" />
            </g>
          </g>
        )}

        {motif === 'wall-hanging' && (
          <g transform="translate(200, 168)">
            <path d="M-76 -84 L0 -114 L76 -84" fill="none" stroke="#B7A392" strokeWidth="2.5" />
            <rect x="-92" y="-88" width="184" height="10" rx="5" fill="#B68B64" />
            <path d="M-74 -78 L74 -78 L74 30 L0 88 L-74 30 Z" fill={accentColor} stroke="#D9CBBF" strokeWidth="1.5" />
            <path d="M-54 -44 Q0 -12 54 -44" fill="none" stroke={primaryColor} strokeWidth="6" strokeLinecap="round" />
            <path d="M-42 -12 Q0 18 42 -12" fill="none" stroke={primaryColor} strokeWidth="6" strokeLinecap="round" />
            {[-60, -40, -20, 0, 20, 40, 60].map((fx, idx) => (
              <line
                key={fx}
                x1={fx}
                y1={idx === 3 ? 88 : 52 + (3 - Math.abs(idx - 3)) * 10}
                x2={fx}
                y2={124}
                stroke="#DFD2C3"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
            ))}
          </g>
        )}

        {motif === 'coasters' && (
          <g transform="translate(200, 175)">
            {[
              { x: -34, y: -24, c: primaryColor },
              { x: 34, y: -16, c: accentColor },
              { x: -24, y: 32, c: '#D8C7E4' },
              { x: 28, y: 36, c: '#F1DFB6' },
            ].map((co, idx) => (
              <g key={idx} transform={`translate(${co.x}, ${co.y})`}>
                <circle cx="0" cy="0" r="46" fill={co.c} stroke="#FFFDF9" strokeWidth="2" />
                <circle cx="0" cy="0" r="34" fill="none" stroke="#FFFDF9" strokeWidth="1.8" strokeDasharray="3 4" />
                <circle cx="0" cy="0" r="14" fill="#FFFDF9" opacity="0.7" />
              </g>
            ))}
          </g>
        )}

        {motif === 'gift-box' && (
          <g transform="translate(200, 175)">
            <rect x="-84" y="-56" width="168" height="128" rx="14" fill="#FFFDF9" stroke="#DFCFC6" strokeWidth="1.5" />
            <circle cx="-32" cy="-4" r="24" fill={primaryColor} />
            <text x="-32" y="4" textAnchor="middle" fill="#FFFDF9" fontSize="22" fontFamily="Cormorant Garamond, serif" fontWeight="700">
              A
            </text>
            <g transform="translate(30, -8)">
              <path d="M0 16 C-26 -4, -18 -28, 0 -12 C18 -28, 26 -4, 0 16 Z" fill={accentColor} />
            </g>
            <rect x="-66" y="34" width="132" height="22" rx="6" fill="#F4ECE4" />
            <line x1="-46" y1="45" x2="46" y2="45" stroke="#9A898D" strokeWidth="2" strokeLinecap="round" />
          </g>
        )}
      </svg>
    </div>
  );
};
