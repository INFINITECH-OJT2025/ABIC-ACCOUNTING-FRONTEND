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
          @keyframes rotate {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }
          
          @keyframes float {
            0%, 100% {
              transform: translateY(0px);
            }
            50% {
              transform: translateY(-10px);
            }
          }
          
          @keyframes glow {
            0%, 100% {
              filter: drop-shadow(0 0 5px rgba(139, 0, 0, 0.5));
            }
            50% {
              filter: drop-shadow(0 0 15px rgba(165, 42, 42, 0.8));
            }
          }
          
          .logo-outer {
            ${animated ? 'animation: rotate 20s linear infinite;' : ''}
            transform-origin: 100px 100px;
          }
          
          .logo-inner {
            ${animated ? 'animation: rotate -10s linear infinite;' : ''}
            transform-origin: 100px 100px;
          }
          
          .logo-diamond {
            ${animated ? 'animation: glow 3s ease-in-out infinite;' : ''}
          }
        `}</style>
        <linearGradient id="maroonGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#A52A2A', stopOpacity: 1 }} />
          <stop offset="50%" style={{ stopColor: '#8B0000', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#5C0000', stopOpacity: 1 }} />
        </linearGradient>
        <linearGradient id="maroonGradientLight" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#DC143C', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#8B0000', stopOpacity: 1 }} />
        </linearGradient>
      </defs>

      {/* Outer diamond shape */}
      <g className="logo-outer">
        <polygon
          points="100,20 180,100 100,180 20,100"
          fill="url(#maroonGradient)"
          opacity="0.3"
        />
      </g>

      {/* Middle border */}
      <g className="logo-inner">
        <polygon
          points="100,45 155,100 100,155 45,100"
          fill="none"
          stroke="url(#maroonGradientLight)"
          strokeWidth="4"
          opacity="0.6"
        />
      </g>

      {/* Inner diamond */}
      <g className="logo-diamond">
        <polygon
          points="100,70 130,100 100,130 70,100"
          fill="url(#maroonGradient)"
        />
      </g>

      {/* Center accent point */}
      <circle
        cx="100"
        cy="100"
        r="3"
        fill="#FFFFFF"
        opacity="0.8"
      />
    </svg>
  )
}
