import React from 'react'

interface LogoProps {
  className?: string
  animated?: boolean
}

export default function Logo({ className = '', animated = true }: LogoProps) {
  return (
    <svg
      viewBox="0 0 200 200"
      xmlns="http://www.w3.org/2000/svg"
      className={`w-16 h-16 ${className}`}
    >
      <defs>
        <style>{`
          @keyframes float {
            0%, 100% {
              transform: translateY(0px) scale(1);
            }
            50% {
              transform: translateY(-8px) scale(1.02);
            }
          }
          
          @keyframes pulse-glow {
            0%, 100% {
              filter: drop-shadow(0 0 8px rgba(184, 53, 75, 0.6));
            }
            50% {
              filter: drop-shadow(0 0 20px rgba(255, 107, 107, 0.9));
            }
          }
          
          @keyframes rotate-slow {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }
          
          .logo-main {
            ${animated ? 'animation: float 3s ease-in-out infinite;' : ''}
            transform-origin: 100px 100px;
          }
          
          .logo-glow {
            ${animated ? 'animation: pulse-glow 2s ease-in-out infinite;' : ''}
          }
          
          .logo-spinner {
            ${animated ? 'animation: rotate-slow 15s linear infinite;' : ''}
            transform-origin: 100px 100px;
          }
        `}</style>
        
        {/* Gradients */}
        <linearGradient id="maroonPink" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#C94277', stopOpacity: 1 }} />
          <stop offset="50%" style={{ stopColor: '#B8354B', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#7B2D49', stopOpacity: 1 }} />
        </linearGradient>
        
        <linearGradient id="purpleGrad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" style={{ stopColor: '#5C2A54', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#8B4A7A', stopOpacity: 1 }} />
        </linearGradient>
        
        <linearGradient id="whiteStroke" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#FFFFFF', stopOpacity: 0.9 }} />
          <stop offset="100%" style={{ stopColor: '#E8E8E8', stopOpacity: 0.7 }} />
        </linearGradient>
        
        <linearGradient id="innerPurple" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#6B3A63', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#3D1F3A', stopOpacity: 1 }} />
        </linearGradient>
      </defs>

      {/* Rotating background circle */}
      <g className="logo-spinner" opacity="0.15">
        <circle cx="100" cy="100" r="90" fill="none" stroke="url(#maroonPink)" strokeWidth="2" strokeDasharray="10,5" />
      </g>

      {/* Main logo group */}
      <g className="logo-main logo-glow">
        {/* Outer left wing */}
        <path
          d="M 50 140 L 50 70 L 85 35 L 100 50 L 100 95 L 70 125 Z"
          fill="url(#maroonPink)"
          stroke="url(#whiteStroke)"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        
        {/* Outer right wing */}
        <path
          d="M 150 140 L 150 70 L 115 35 L 100 50 L 100 95 L 130 125 Z"
          fill="url(#maroonPink)"
          stroke="url(#whiteStroke)"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        
        {/* Bottom center piece */}
        <path
          d="M 70 125 L 100 95 L 130 125 L 130 165 L 100 180 L 70 165 Z"
          fill="url(#purpleGrad)"
          stroke="url(#whiteStroke)"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        
        {/* Inner white frame - top */}
        <rect
          x="92"
          y="55"
          width="16"
          height="30"
          fill="url(#whiteStroke)"
          rx="2"
        />
        
        {/* Inner center diamond */}
        <path
          d="M 100 110 L 115 125 L 100 140 L 85 125 Z"
          fill="url(#innerPurple)"
          stroke="url(#whiteStroke)"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        
        {/* Accent highlights */}
        <circle cx="100" cy="125" r="3" fill="#FFFFFF" opacity="0.8" />
      </g>
    </svg>
  )
}
