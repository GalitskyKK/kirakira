-- ===============================================
-- 🔧 ПРИМЕНЕНИЕ ИСПРАВЛЕНИЙ К ФАЙЛУ daily_quests_migration_fixed.sql
-- ===============================================

-- 1. Очищаем дублированные квесты (только за последние 7 дней)
WITH duplicate_quests AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY telegram_id, quest_type, generated_at::date 
      ORDER BY generated_at ASC
    ) as rn
  FROM daily_quests
  WHERE status IN ('active', 'completed')
    AND generated_at >= CURRENT_DATE - INTERVAL '7 days'
)
DELETE FROM daily_quests 
WHERE id IN (
  SELECT id 
  FROM duplicate_quests 
  WHERE rn > 1
);

-- 2. Добавляем уникальное ограничение для предотвращения дублей
-- Используем generated_at::date вместо DATE() функции для совместимости
CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_quests_unique_daily 
ON daily_quests (telegram_id, quest_type, generated_at::date)
WHERE status IN ('active', 'completed');

-- 3. Обновляем функцию generate_daily_quests с исправленной логикой
DROP FUNCTION IF EXISTS generate_daily_quests(BIGINT, INTEGER);

CREATE OR REPLACE FUNCTION generate_daily_quests(
  p_telegram_id BIGINT,
  p_user_level INTEGER DEFAULT 1
)
RETURNS SETOF daily_quests AS $$
DECLARE
  quest_templates JSONB;
  selected_quests JSONB;
  quest_template JSONB;
  quest_record daily_quests%ROWTYPE;
  target_value INTEGER;
  rewards JSONB;
  expires_at TIMESTAMP WITH TIME ZONE;
  quest_count INTEGER := 3;
  i INTEGER;
BEGIN
  -- Проверяем, что у пользователя нет активных квестов на сегодня
  IF EXISTS (
    SELECT 1 FROM daily_quests 
    WHERE telegram_id = p_telegram_id 
      AND generated_at >= CURRENT_DATE 
      AND status IN ('active', 'completed')
  ) THEN
    RAISE EXCEPTION 'User already has active quests for today';
  END IF;

  -- Устанавливаем время истечения (конец дня)
  expires_at := (CURRENT_DATE + INTERVAL '1 day')::timestamp;
  
  -- Шаблоны квестов
  quest_templates := '[
    {
      "type": "record_specific_mood",
      "category": "mood",
      "name": "Настроение дня",
      "description": "Запиши настроение",
      "emoji": "😊",
      "weight": 8,
      "getTargetValue": "specific_mood"
    },
    {
      "type": "record_with_note",
      "category": "mood",
      "name": "Размышления",
      "description": "Запиши настроение с заметкой",
      "emoji": "📝",
      "weight": 6,
      "getTargetValue": "with_note"
    },
    {
      "type": "collect_elements",
      "category": "garden",
      "name": "Садовод",
      "description": "Собери элемент",
      "emoji": "🌱",
      "weight": 10,
      "getTargetValue": "garden_elements"
    },
    {
      "type": "collect_rare_element",
      "category": "garden",
      "name": "Искатель сокровищ",
      "description": "Найди редкий элемент",
      "emoji": "💎",
      "weight": 4,
      "getTargetValue": "rare_element"
    },
    {
      "type": "upgrade_element",
      "category": "garden",
      "name": "Улучшатель",
      "description": "Улучши элемент",
      "emoji": "⬆️",
      "weight": 6,
      "getTargetValue": "upgrade_elements"
    },
    {
      "type": "visit_friend_garden",
      "category": "social",
      "name": "Дружелюбный",
      "description": "Посети сад друга",
      "emoji": "👥",
      "weight": 7,
      "getTargetValue": "friend_visits"
    },
    {
      "type": "share_garden",
      "category": "social",
      "name": "Поделиться",
      "description": "Поделись своим садом",
      "emoji": "📤",
      "weight": 4,
      "getTargetValue": "share_garden"
    },
    {
      "type": "maintain_streak",
      "category": "streak",
      "name": "Постоянство",
      "description": "Поддержи стрик",
      "emoji": "🔥",
      "weight": 10,
      "getTargetValue": "maintain_streak"
    },
    {
      "type": "login_streak",
      "category": "streak",
      "name": "Ежедневный визит",
      "description": "Войди в приложение",
      "emoji": "🚪",
      "weight": 3,
      "getTargetValue": "login_streak"
    }
  ]'::jsonb;
  
  -- Выбираем квесты с учетом весов, обеспечивая уникальность типов
  WITH quest_elements AS (
    SELECT 
      jsonb_array_elements(quest_templates) as quest,
      (jsonb_array_elements(quest_templates)->>'weight')::integer as weight
  ),
  weighted_quests AS (
    SELECT 
      quest,
      quest->>'type' as quest_type,
      ROW_NUMBER() OVER (ORDER BY RANDOM()) as rn
    FROM quest_elements
    CROSS JOIN generate_series(1, quest_elements.weight)
  ),
  selected AS (
    SELECT DISTINCT ON (quest_type) quest
    FROM weighted_quests
    ORDER BY quest_type, RANDOM()
    LIMIT quest_count
  )
  SELECT jsonb_agg(quest) INTO selected_quests
  FROM selected;
  
  -- Создаем квесты
  FOR i IN 0..(jsonb_array_length(selected_quests) - 1) LOOP
    quest_template := selected_quests->i;
    
    -- Определяем target_value (ИСПРАВЛЕНО: collect_elements всегда 1)
    target_value := CASE quest_template->>'getTargetValue'
      WHEN 'specific_mood' THEN 1
      WHEN 'with_note' THEN 1
      WHEN 'garden_elements' THEN 1  -- ВСЕГДА 1, так как можно получить только 1 элемент в день
      WHEN 'rare_element' THEN 1
      WHEN 'upgrade_elements' THEN 1
      WHEN 'friend_visits' THEN 1
      WHEN 'share_garden' THEN 1
      WHEN 'maintain_streak' THEN 1
      WHEN 'login_streak' THEN 1
      ELSE 1
    END;
    
    -- Рассчитываем награды
    rewards := jsonb_build_object(
      'sprouts', 30 * target_value + (p_user_level * 2),
      'gems', CASE WHEN target_value >= 3 AND p_user_level >= 10 THEN 1 ELSE 0 END,
      'experience', 50 * target_value + (p_user_level * 5),
      'description', (quest_template->>'description') || ' (' || target_value || ')'
    );
    
    -- Вставляем квест
    INSERT INTO daily_quests (
      telegram_id,
      quest_type,
      quest_category,
      target_value,
      current_progress,
      status,
      rewards,
      expires_at,
      metadata
    ) VALUES (
      p_telegram_id,
      quest_template->>'type',
      quest_template->>'category',
      target_value,
      0,
      'active',
      rewards,
      expires_at,
      jsonb_build_object(
        'name', quest_template->>'name',
        'emoji', quest_template->>'emoji',
        'description', quest_template->>'description'
      )
    ) RETURNING * INTO quest_record;
    
    RETURN NEXT quest_record;
  END LOOP;
  
  RETURN;
END;
$$ LANGUAGE plpgsql;

-- 4. Логируем результат
DO $$
DECLARE
  deleted_count INTEGER;
BEGIN
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE 'Applied quest fixes: deleted % duplicate quests, added unique constraint, updated function', deleted_count;
END $$;
