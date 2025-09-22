import { motion } from 'framer-motion'
import { useId } from 'react'
import type { SVGProps } from 'react'

interface MysticMushroomSVGProps extends SVGProps<SVGSVGElement> {
  size?: number
}

export function MysticMushroomSVG({
  size = 40,
  className,
  onClick,
}: MysticMushroomSVGProps) {
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
        {/* Градиенты для шляпки */}
        <radialGradient
          id={`capGradient-${uniqueId}`}
          cx="50%"
          cy="30%"
          r="70%"
        >
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="50%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#5b21b6" />
        </radialGradient>

        {/* Градиент для ножки */}
        <linearGradient
          id={`stemGradient-${uniqueId}`}
          x1="0%"
          y1="0%"
          x2="100%"
          y2="0%"
        >
          <stop offset="0%" stopColor="#f3f4f6" />
          <stop offset="50%" stopColor="#e5e7eb" />
          <stop offset="100%" stopColor="#d1d5db" />
        </linearGradient>

        {/* Мистические пятна */}
        <radialGradient id={`spot1-${uniqueId}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.4" />
        </radialGradient>

        <radialGradient id={`spot2-${uniqueId}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#34d399" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0.4" />
        </radialGradient>

        <radialGradient id={`spot3-${uniqueId}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#f472b6" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#ec4899" stopOpacity="0.4" />
        </radialGradient>

        {/* Эффекты свечения */}
        <filter id={`mysticalGlow-${uniqueId}`}>
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <filter id={`sparkleGlow-${uniqueId}`}>
          <feGaussianBlur stdDeviation="1" result="sparkleBlur" />
          <feMerge>
            <feMergeNode in="sparkleBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Тень под грибом */}
      <motion.ellipse
        cx="20"
        cy="36"
        rx="6"
        ry="1.5"
        fill="rgba(0, 0, 0, 0.2)"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 0.5, duration: 0.3 }}
      />

      {/* Ножка гриба */}
      <motion.path
        d="M17 35 Q17 25 18 20 Q18.5 18 19 18 Q19.5 18 20 20 Q21 25 21 35 Q20 36 19 36 Q18 36 17 35"
        fill={`url(#stemGradient-${uniqueId})`}
        stroke="#d1d5db"
        strokeWidth="0.5"
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      />

      {/* Кольцо на ножке */}
      <motion.ellipse
        cx="19"
        cy="25"
        rx="2.5"
        ry="0.8"
        fill="#e5e7eb"
        stroke="#d1d5db"
        strokeWidth="0.3"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.6, duration: 0.3 }}
      />

      {/* Шляпка гриба */}
      <motion.path
        d="M8 17 Q8 10 15 8 Q20 7 25 8 Q32 10 32 17 Q32 20 28 22 Q20 24 12 22 Q8 20 8 17"
        fill={`url(#capGradient-${uniqueId})`}
        filter={`url(#mysticalGlow-${uniqueId})`}
        initial={{ scale: 0 }}
        animate={{
          scale: 1,
          opacity: [0.9, 1, 0.9],
        }}
        transition={{
          scale: { delay: 0.4, duration: 0.4 },
          opacity: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
        }}
      />

      {/* Нижняя часть шляпки */}
      <motion.ellipse
        cx="20"
        cy="18"
        rx="10"
        ry="3"
        fill="#6d28d9"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.5, duration: 0.3 }}
      />

      {/* Пластинки под шляпкой */}
      {[...Array(12)].map((_, i) => (
        <motion.line
          key={i}
          x1={20 + Math.cos((i * 30 * Math.PI) / 180) * 8}
          y1={18}
          x2={20 + Math.cos((i * 30 * Math.PI) / 180) * 6}
          y2={20}
          stroke="#5b21b6"
          strokeWidth="0.5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          transition={{ delay: 0.6 + i * 0.02, duration: 0.2 }}
        />
      ))}

      {/* Мистические пятна на шляпке */}
      <motion.circle
        cx="15"
        cy="14"
        r="2"
        fill={`url(#spot1-${uniqueId})`}
        filter={`url(#sparkleGlow-${uniqueId})`}
        initial={{ scale: 0 }}
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.7, 1, 0.7],
        }}
        transition={{
          scale: { delay: 0.8, duration: 0.3 },
          opacity: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
        }}
      />

      <motion.circle
        cx="25"
        cy="12"
        r="1.5"
        fill={`url(#spot2-${uniqueId})`}
        filter={`url(#sparkleGlow-${uniqueId})`}
        initial={{ scale: 0 }}
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.7, 1, 0.7],
        }}
        transition={{
          scale: { delay: 0.9, duration: 0.3 },
          opacity: { duration: 2.3, repeat: Infinity, ease: 'easeInOut' },
        }}
      />

      <motion.circle
        cx="22"
        cy="16"
        r="1"
        fill={`url(#spot3-${uniqueId})`}
        filter={`url(#sparkleGlow-${uniqueId})`}
        initial={{ scale: 0 }}
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.7, 1, 0.7],
        }}
        transition={{
          scale: { delay: 1, duration: 0.3 },
          opacity: { duration: 1.8, repeat: Infinity, ease: 'easeInOut' },
        }}
      />

      {/* Магические искры */}
      {[...Array(6)].map((_, i) => (
        <motion.g key={i}>
          <motion.circle
            cx={20 + Math.cos((i * 60 * Math.PI) / 180) * 12}
            cy={15 + Math.sin((i * 60 * Math.PI) / 180) * 8}
            r="0.5"
            fill="#fbbf24"
            filter={`url(#sparkleGlow-${uniqueId})`}
            initial={{ scale: 0, opacity: 0 }}
            animate={{
              scale: [0, 1, 0],
              opacity: [0, 1, 0],
              y: [0, -5, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: 1.5 + i * 0.5,
              ease: 'easeInOut',
            }}
          />

          {/* Звездочки */}
          <motion.path
            d={`M${20 + Math.cos(((i * 60 + 30) * Math.PI) / 180) * 14} ${12 + Math.sin(((i * 60 + 30) * Math.PI) / 180) * 10} l1 0 l0.3 0.9 l0.9 0.3 l0 1 l-0.9 0.3 l-0.3 0.9 l-1 0 l-0.3 -0.9 l-0.9 -0.3 l0 -1 l0.9 -0.3 z`}
            fill="#34d399"
            filter={`url(#sparkleGlow-${uniqueId})`}
            initial={{ scale: 0, opacity: 0 }}
            animate={{
              scale: [0, 1, 0],
              opacity: [0, 0.8, 0],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              delay: 2 + i * 0.3,
              ease: 'easeInOut',
            }}
          />
        </motion.g>
      ))}

      {/* Мистический ореол */}
      <motion.circle
        cx="20"
        cy="15"
        r="16"
        fill="none"
        stroke="rgba(139, 92, 246, 0.3)"
        strokeWidth="0.5"
        strokeDasharray="2 4"
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{
          scale: [0.8, 1.1, 0.8],
          opacity: [0, 0.4, 0],
          rotate: [0, 360],
        }}
        transition={{
          scale: { duration: 5, repeat: Infinity, ease: 'easeInOut' },
          opacity: { duration: 5, repeat: Infinity, ease: 'easeInOut' },
          rotate: { duration: 20, repeat: Infinity, ease: 'linear' },
        }}
      />
    </motion.svg>
  )
}
