/**
 * 🌈 Vibe Companion - Full companion with WebGL body + SVG face
 */

import { motion } from 'framer-motion'
import { VibeCompanionBody } from './VibeCompanionBody'
import type { CompanionEmotion } from '@/types'

interface VibeCompanionProps {
  readonly emotion: CompanionEmotion
  readonly scale?: number
}

// Eye shapes for different emotions
function getEyeShape(emotion: CompanionEmotion) {
  switch (emotion) {
    case 'joy':
    case 'celebration':
      return {
        type: 'arc' as const,
        left: 'M56 82 Q 64 76 72 82',
        right: 'M88 82 Q 96 76 104 82',
      }
    case 'calm':
      return {
        type: 'arc' as const,
        left: 'M56 82 Q 64 78 72 82',
        right: 'M88 82 Q 96 78 104 82',
      }
    case 'sadness':
      return {
        type: 'arc' as const,
        left: 'M56 80 Q 64 88 72 80',
        right: 'M88 80 Q 96 88 104 80',
      }
    case 'anger':
      return {
        type: 'arc' as const,
        left: 'M56 78 L 72 82',
        right: 'M88 82 L 104 78',
      }
    case 'stress':
    case 'anxiety':
      return {
        type: 'circle' as const,
        left: { cx: 64, cy: 82, r: 5 },
        right: { cx: 96, cy: 82, r: 5 },
      }
    default:
      return {
        type: 'circle' as const,
        left: { cx: 64, cy: 82, r: 6 },
        right: { cx: 96, cy: 82, r: 6 },
      }
  }
}

// Mouth shapes for different emotions
function getMouthShape(emotion: CompanionEmotion) {
  switch (emotion) {
    case 'joy':
    case 'celebration':
      return 'M64 112 Q 80 124 96 112'
    case 'calm':
      return 'M66 112 Q 80 118 94 112'
    case 'sadness':
      return 'M64 118 Q 80 106 96 118'
    case 'anger':
      return 'M66 116 L94 114'
    case 'stress':
      return 'M66 112 Q 80 108 94 112'
    case 'anxiety':
      return 'M64 112 Q 80 108 96 112 Q 80 116 64 112'
    default:
      return 'M66 112 Q 80 118 94 112'
  }
}

// Get emotion-based accent color for face integration
function getEmotionAccentColor(emotion: CompanionEmotion): string {
  const accentMap: Record<CompanionEmotion, string> = {
    neutral: '#cbd5e1',
    joy: '#fde047',
    calm: '#67e8f9',
    sadness: '#93c5fd',
    anger: '#f87171',
    stress: '#fb7185',
    anxiety: '#c084fc',
    celebration: '#fbbf24',
  }
  return accentMap[emotion] || accentMap.neutral
}

export function VibeCompanion({ emotion, scale = 1 }: VibeCompanionProps) {
  const eyeShape = getEyeShape(emotion)
  const mouthPath = getMouthShape(emotion)
  const accentColor = getEmotionAccentColor(emotion)

  return (
    <motion.div
      style={{
        width: 96 * scale,
        height: 108 * scale,
        position: 'relative',
      }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* WebGL Body */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      >
        <VibeCompanionBody emotion={emotion} width={160} height={160} />
      </div>

      {/* Integrated Face Layer */}
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 160 160"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          pointerEvents: 'none',
        }}
      >
        <defs>
          {/* Eye glow gradient */}
          <radialGradient id={`eye-glow-${emotion}`}>
            <stop offset="0%" stopColor={accentColor} stopOpacity="0.3" />
            <stop offset="60%" stopColor={accentColor} stopOpacity="0.1" />
            <stop offset="100%" stopColor={accentColor} stopOpacity="0" />
          </radialGradient>

          {/* Eye shadow gradient */}
          <radialGradient id={`eye-shadow-${emotion}`}>
            <stop offset="0%" stopColor="#000000" stopOpacity="0" />
            <stop offset="70%" stopColor="#000000" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.3" />
          </radialGradient>

          {/* Mouth glow */}
          <radialGradient id={`mouth-glow-${emotion}`}>
            <stop offset="0%" stopColor={accentColor} stopOpacity="0.2" />
            <stop offset="100%" stopColor={accentColor} stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Eye glows - behind eyes */}
        {eyeShape.type === 'circle' && (
          <>
            <circle
              cx={eyeShape.left.cx}
              cy={eyeShape.left.cy}
              r={eyeShape.left.r * 2.5}
              fill={`url(#eye-glow-${emotion})`}
            />
            <circle
              cx={eyeShape.right.cx}
              cy={eyeShape.right.cy}
              r={eyeShape.right.r * 2.5}
              fill={`url(#eye-glow-${emotion})`}
            />
          </>
        )}

        {/* Subtle face area darkening for depth */}
        <ellipse
          cx="80"
          cy="95"
          rx="35"
          ry="28"
          fill="rgba(0, 0, 0, 0.08)"
          opacity="0.6"
        />

        {/* Eyes with depth */}
        {eyeShape.type === 'circle' ? (
          <>
            {/* Eye shadows */}
            <circle
              cx={eyeShape.left.cx}
              cy={eyeShape.left.cy + 2}
              r={eyeShape.left.r + 2}
              fill={`url(#eye-shadow-${emotion})`}
            />
            <circle
              cx={eyeShape.right.cx}
              cy={eyeShape.right.cy + 2}
              r={eyeShape.right.r + 2}
              fill={`url(#eye-shadow-${emotion})`}
            />

            {/* Eye whites with subtle color */}
            <circle
              cx={eyeShape.left.cx}
              cy={eyeShape.left.cy}
              r={eyeShape.left.r + 1}
              fill="rgba(255, 255, 255, 0.85)"
            />
            <circle
              cx={eyeShape.right.cx}
              cy={eyeShape.right.cy}
              r={eyeShape.right.r + 1}
              fill="rgba(255, 255, 255, 0.85)"
            />

            {/* Pupils */}
            <circle
              cx={eyeShape.left.cx}
              cy={eyeShape.left.cy}
              r={eyeShape.left.r}
              fill="#1a1a1f"
            />
            <circle
              cx={eyeShape.right.cx}
              cy={eyeShape.right.cy}
              r={eyeShape.right.r}
              fill="#1a1a1f"
            />

            {/* Eye highlights */}
            <circle
              cx={eyeShape.left.cx - 1.5}
              cy={eyeShape.left.cy - 1.5}
              r={eyeShape.left.r * 0.35}
              fill="white"
              opacity="0.9"
            />
            <circle
              cx={eyeShape.right.cx - 1.5}
              cy={eyeShape.right.cy - 1.5}
              r={eyeShape.right.r * 0.35}
              fill="white"
              opacity="0.9"
            />
          </>
        ) : (
          <>
            {/* Arc eyes with glow */}
            <path
              d={eyeShape.left}
              stroke={accentColor}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              opacity="0.4"
              transform="translate(0, 1)"
            />
            <path
              d={eyeShape.right}
              stroke={accentColor}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              opacity="0.4"
              transform="translate(0, 1)"
            />

            {/* Main arc eyes */}
            <path
              d={eyeShape.left}
              stroke="#1a1a1f"
              strokeWidth="4.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <path
              d={eyeShape.right}
              stroke="#1a1a1f"
              strokeWidth="4.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </>
        )}

        {/* Mouth glow area */}
        <ellipse
          cx="80"
          cy="116"
          rx="20"
          ry="12"
          fill={`url(#mouth-glow-${emotion})`}
        />

        {/* Mouth with subtle shadow */}
        <path
          d={mouthPath}
          stroke="rgba(0, 0, 0, 0.15)"
          strokeWidth="4.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          transform="translate(0, 1)"
        />
        <path
          d={mouthPath}
          stroke="#1a1a1f"
          strokeWidth="4.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />

        {/* Integrated highlights that blend with body */}
        <g opacity="0.5">
          <circle cx="92" cy="62" r="5" fill="white" opacity="0.6" />
          <circle cx="92" cy="62" r="2.5" fill="white" />
          
          <circle cx="66" cy="50" r="4" fill="white" opacity="0.5" />
          <circle cx="66" cy="50" r="2" fill="white" />
          
          <circle cx="120" cy="76" r="3.5" fill="white" opacity="0.4" />
          <circle cx="120" cy="76" r="1.5" fill="white" />
        </g>

        {/* Subtle ambient particles around face */}
        <g opacity="0.25">
          <circle cx="52" cy="88" r="1.5" fill={accentColor} />
          <circle cx="108" cy="92" r="1.2" fill={accentColor} />
          <circle cx="78" cy="68" r="1" fill={accentColor} />
        </g>
      </svg>
    </motion.div>
  )
}

