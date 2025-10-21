-- ===============================================
-- 🔧 ОБНОВЛЕНИЕ ФУНКЦИИ generate_daily_quests
-- Исправление логики target_value для квестов сбора элементов
-- ===============================================

-- Удаляем существующую функцию
DROP FUNCTION IF EXISTS generate_daily_quests(BIGINT, INTEGER);

-- Создаем обновленную функцию
CREATE OR REPLACE FUNCTION generate_daily_quests(
  p_telegram_id BIGINT,
  p_user_level INTEGER DEFAULT 1
) RETURNS SETOF daily_quests AS $$
DECLARE
  quest_record daily_quests%ROWTYPE;
  quest_templates JSONB;
  selected_quests JSONB;
  quest_count INTEGER;
  i INTEGER;
  quest_template JSONB;
  target_value INTEGER;
  rewards JSONB;
  expires_at TIMESTAMP WITH TIME ZONE;
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

  -- Устанавливаем время истечения на следующий день в 00:00 UTC
  expires_at := (CURRENT_DATE + INTERVAL '1 day')::timestamp with time zone;
  
  -- Определяем количество квестов (3-5 в зависимости от уровня)
  quest_count := CASE 
    WHEN p_user_level <= 5 THEN 3
    WHEN p_user_level <= 15 THEN 4
    ELSE 5
  END;
  
  -- Шаблоны квестов с весами для рандомизации
  quest_templates := '[
    {
      "type": "record_mood_count",
      "category": "mood",
      "name": "Отслеживай настроение",
      "description": "Запиши {target} настроений",
      "emoji": "😊",
      "weight": 15,
      "getTargetValue": "mood_count"
    },
    {
      "type": "record_specific_mood",
      "category": "mood", 
      "name": "Позитивное настроение",
      "description": "Запиши настроение радости",
      "emoji": "😄",
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
      "weight": 12,
      "getTargetValue": "garden_elements"
    },
    {
      "type": "collect_rare_element",
      "category": "garden",
      "name": "Охотник за редкостями",
      "description": "Найди редкий элемент",
      "emoji": "💎",
      "weight": 5,
      "getTargetValue": "rare_element"
    },
    {
      "type": "upgrade_element",
      "category": "garden",
      "name": "Улучшатель",
      "description": "Улучши {target} элементов",
      "emoji": "⬆️",
      "weight": 8,
      "getTargetValue": "upgrade_elements"
    },
    {
      "type": "visit_friend_garden",
      "category": "social",
      "name": "Социальный садовод",
      "description": "Посети {target} садов друзей",
      "emoji": "👥",
      "weight": 6,
      "getTargetValue": "friend_visits"
    },
    {
      "type": "share_garden",
      "category": "social",
      "name": "Поделись красотой",
      "description": "Поделись她不своим садом",
      "emoji": "📤",
      "weight": 4,
      "getTargetValue": "share_garden"
    },
    {
      "type": "like_gardens",
      "category": "social",
      "name": "Лайкер",
      "description": "Лайкни {target} садов",
      "emoji": "❤️",
      "weight": 5,
      "getTargetValue": "like_gardens"
    },
    {
      "type": "maintain_streak",
      "category": "streak",
      "name": "Постоянство",
      "description": "Поддержи стрик {target} дней",
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
  
  -- Выбираем квесты с учетом весов и категорий, обеспечивая уникальность типов
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
    
    -- Определяем target_value на основе типа и уровня пользователя
    -- ИСПРАВЛЕНО: collect_elements всегда имеет target_value = 1
    target_value := CASE quest_template->>'getTargetValue'
      WHEN 'mood_count' THEN LEAST(1 + FLOOR(p_user_level / 5), 3)
      WHEN 'specific_mood' THEN 1
      WHEN 'with_note' THEN 1
      WHEN 'garden_elements' THEN 1  -- ВСЕГДА 1, так как можно получить только 1 элемент в день
      WHEN 'rare_element' THEN 1
      WHEN 'upgrade_elements' THEN LEAST(1, FLOOR(p_user_level / 10))
      WHEN 'friend_visits' THEN LEAST(1 + FLOOR(p_user_level / 6), 3)
      WHEN 'share_garden' THEN 1
      WHEN 'like_gardens' THEN LEAST(2 + FLOOR(p_user_level / 4), 5)
      WHEN 'maintain_streak' THEN LEAST(1, FLOOR(p_user_level / 5))
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

-- Добавляем комментарий
COMMENT ON FUNCTION generate_daily_quests IS 'Генерирует 3-5 случайных ежедневных заданий для пользователя. ИСПРАВЛЕНО: collect_elements всегда имеет target_value = 1';
