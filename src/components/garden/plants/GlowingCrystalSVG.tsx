import { motion } from 'framer-motion'
import { useId } from 'react'
import type { SVGProps } from 'react'

interface GlowingCrystalSVGProps extends SVGProps<SVGSVGElement> {
  size?: number
}

export function GlowingCrystalSVG({
  size = 40,
  className,
  onClick,
}: GlowingCrystalSVGProps) {
  const uniqueId = useId()

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      onClick={onClick}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 20,
        delay: Math.random() * 0.5,
      }}
    >
      <defs>
        {/* Градиенты для кристалла */}
        <linearGradient
          id={`crystalMain-${uniqueId}`}
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop offset="0%" stopColor="#e0e7ff" />
          <stop offset="50%" stopColor="#c7d2fe" />
          <stop offset="100%" stopColor="#a5b4fc" />
        </linearGradient>

        <radialGradient
          id={`crystalGlow-${uniqueId}`}
          cx="50%"
          cy="50%"
          r="60%"
        >
          <stop offset="0%" stopColor="#818cf8" stopOpacity="0.8" />
          <stop offset="50%" stopColor="#6366f1" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.2" />
        </radialGradient>

        <linearGradient
          id={`crystalFace1-${uniqueId}`}
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>

        <linearGradient
          id={`crystalFace2-${uniqueId}`}
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>

        <linearGradient
          id={`crystalFace3-${uniqueId}`}
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop offset="0%" stopColor="#f472b6" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>

        {/* Эффект свечения */}
        <filter id={`outerGlow-${uniqueId}`}>
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <filter id={`innerGlow-${uniqueId}`}>
          <feGaussianBlur stdDeviation="1" result="innerColoredBlur" />
          <feMerge>
            <feMergeNode in="innerColoredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Основание кристалла */}
      <motion.ellipse
        cx="20"
        cy="35"
        rx="8"
        ry="2"
        fill={`url(#crystalGlow-${uniqueId})`}
        opacity="0.6"
        initial={{ scaleX: 0 }}
        animate={{
          scaleX: [1, 1.2, 1],
          opacity: [0.4, 0.8, 0.4],
        }}
        transition={{
          scaleX: { delay: 0.5, duration: 0.3 },
          opacity: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
        }}
      />

      {/* Главный кристалл - центральная часть */}
      <motion.polygon
        points="20,8 28,18 24,32 16,32 12,18"
        fill={`url(#crystalMain-${uniqueId})`}
        filter={`url(#outerGlow-${uniqueId})`}
        initial={{ scale: 0 }}
        animate={{
          scale: 1,
          opacity: [0.9, 1, 0.9],
        }}
        transition={{
          scale: { delay: 0.3, duration: 0.4 },
          opacity: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
        }}
      />

      {/* Боковые грани кристалла */}
      <motion.polygon
        points="20,8 12,18 16,32 20,25"
        fill={`url(#crystalFace1-${uniqueId})`}
        filter={`url(#innerGlow-${uniqueId})`}
        initial={{ scale: 0 }}
        animate={{
          scale: 1,
          opacity: [0.7, 0.9, 0.7],
        }}
        transition={{
          scale: { delay: 0.4, duration: 0.3 },
          opacity: { duration: 2.5, repeat: Infinity, ease: 'easeInOut' },
        }}
      />

      <motion.polygon
        points="20,8 28,18 24,32 20,25"
        fill={`url(#crystalFace2-${uniqueId})`}
        filter={`url(#innerGlow-${uniqueId})`}
        initial={{ scale: 0 }}
        animate={{
          scale: 1,
          opacity: [0.7, 0.9, 0.7],
        }}
        transition={{
          scale: { delay: 0.5, duration: 0.3 },
          opacity: { duration: 2.8, repeat: Infinity, ease: 'easeInOut' },
        }}
      />

      {/* Верхняя грань */}
      <motion.polygon
        points="20,8 12,18 20,15 28,18"
        fill={`url(#crystalFace3-${uniqueId})`}
        filter={`url(#innerGlow-${uniqueId})`}
        initial={{ scale: 0 }}
        animate={{
          scale: 1,
          opacity: [0.8, 1, 0.8],
        }}
        transition={{
          scale: { delay: 0.6, duration: 0.3 },
          opacity: { duration: 2.2, repeat: Infinity, ease: 'easeInOut' },
        }}
      />

      {/* Яркие блики */}
      <motion.path
        d="M18 12 L22 10 L21 16 L17 14 Z"
        fill="rgba(255, 255, 255, 0.8)"
        initial={{ opacity: 0 }}
        animate={{
          opacity: [0, 1, 0],
        }}
        transition={{
          delay: 1,
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      <motion.circle
        cx="16"
        cy="20"
        r="1.5"
        fill="rgba(255, 255, 255, 0.9)"
        initial={{ scale: 0 }}
        animate={{
          scale: [0, 1, 0],
          opacity: [0, 1, 0],
        }}
        transition={{
          delay: 1.5,
          duration: 1,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Энергетические частицы */}
      {[...Array(8)].map((_, i) => (
        <motion.circle
          key={i}
          cx={20 + Math.cos((i * 45 * Math.PI) / 180) * 15}
          cy={20 + Math.sin((i * 45 * Math.PI) / 180) * 15}
          r="1"
          fill={`hsl(${240 + i * 15}, 80%, 70%)`}
          initial={{ scale: 0, opacity: 0 }}
          animate={{
            scale: [0, 1, 0],
            opacity: [0, 0.8, 0],
            x: [0, Math.cos((i * 45 * Math.PI) / 180) * 5, 0],
            y: [0, Math.sin((i * 45 * Math.PI) / 180) * 5, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: 2 + i * 0.25,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Пульсирующий ореол */}
      <motion.circle
        cx="20"
        cy="20"
        r="18"
        fill="none"
        stroke={`url(#crystalGlow-${uniqueId})`}
        strokeWidth="0.5"
        strokeOpacity="0.4"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{
          scale: [0.8, 1.2, 0.8],
          opacity: [0, 0.6, 0],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          delay: 1,
          ease: 'easeInOut',
        }}
      />
    </motion.svg>
  )
}
