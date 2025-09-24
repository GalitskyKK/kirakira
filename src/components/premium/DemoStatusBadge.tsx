/**
 * Компонент для отображения статуса доступа в демо-режиме
 */

import React from 'react'
import { motion } from 'framer-motion'
import { Clock, Gift, Trophy, Zap, Lock } from 'lucide-react'
import {
  canAccessPremiumForFree,
  UserPremiumState,
  isInTrialPeriod,
  isHappyHour,
} from '@/utils/premiumLimits'
import { PAYMENT_CONFIG } from '@/config/payment'

interface DemoStatusBadgeProps {
  userState: UserPremiumState
  featureId: string
  className?: string
}

export function DemoStatusBadge({
  userState,
  featureId,
  className = '',
}: DemoStatusBadgeProps) {
  if (!PAYMENT_CONFIG.DEMO_MODE) {
    return null
  }

  const accessCheck = canAccessPremiumForFree(userState, featureId)

  const getBadgeContent = () => {
    if (accessCheck.canAccess) {
      switch (accessCheck.reason) {
        case 'trial':
          return {
            icon: <Gift className="h-3 w-3" />,
            text: 'TRIAL',
            color: 'bg-purple-100 text-purple-700 border-purple-200',
          }
        case 'happy_hour':
          return {
            icon: <Clock className="h-3 w-3" />,
            text: 'СЧАСТЛИВЫЙ ЧАС',
            color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
          }
        case 'task_reward':
          return {
            icon: <Trophy className="h-3 w-3" />,
            text: 'НАГРАДА',
            color: 'bg-green-100 text-green-700 border-green-200',
          }
        case 'free_activation':
          return {
            icon: <Zap className="h-3 w-3" />,
            text: 'БЕСПЛАТНО',
            color: 'bg-blue-100 text-blue-700 border-blue-200',
          }
      }
    }

    // Недоступно
    const activationsLeft =
      PAYMENT_CONFIG.DEMO_LIMITS.FREE_ACTIVATIONS_PER_FEATURE -
      (userState.activations[featureId] || 0)

    if (activationsLeft > 0) {
      return {
        icon: <Zap className="h-3 w-3" />,
        text: `${activationsLeft} ОСТАЛОСЬ`,
        color: 'bg-gray-100 text-gray-600 border-gray-200',
      }
    }

    if (isInTrialPeriod(userState.registrationDate)) {
      return {
        icon: <Gift className="h-3 w-3" />,
        text: 'TRIAL АКТИВЕН',
        color: 'bg-purple-100 text-purple-700 border-purple-200',
      }
    }

    if (isHappyHour()) {
      return {
        icon: <Clock className="h-3 w-3" />,
        text: 'СЧАСТЛИВЫЙ ЧАС',
        color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      }
    }

    return {
      icon: <Lock className="h-3 w-3" />,
      text: 'НЕДОСТУПНО',
      color: 'bg-red-100 text-red-700 border-red-200',
    }
  }

  const badge = getBadgeContent()

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className={`inline-flex items-center space-x-1 rounded-full border px-2 py-1 text-xs font-medium ${badge.color} ${className}`}
    >
      {badge.icon}
      <span>{badge.text}</span>
    </motion.div>
  )
}
