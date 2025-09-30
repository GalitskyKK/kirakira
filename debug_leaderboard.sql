-- ===============================================
-- ДИАГНОСТИКА ПРОБЛЕМЫ С ПУСТЫМ LEADERBOARD
-- ===============================================

-- 1. Проверяем существующие челленджи
SELECT 
  id, 
  title, 
  status, 
  start_date, 
  end_date,
  start_date <= now() as started,
  end_date > now() as not_expired
FROM challenges 
WHERE status = 'active'
ORDER BY start_date;

-- 2. Проверяем участников челленджей
SELECT 
  cp.id,
  cp.challenge_id,
  cp.telegram_id,
  cp.status,
  cp.current_progress,
  cp.joined_at,
  c.title as challenge_title
FROM challenge_participants cp
JOIN challenges c ON cp.challenge_id = c.id
WHERE cp.status != 'dropped'
ORDER BY cp.joined_at DESC;

-- 3. Проверяем пользователей
SELECT 
  telegram_id,
  first_name,
  last_name,
  username,
  level,
  created_at
FROM users
ORDER BY created_at DESC
LIMIT 10;

-- 4. Тестируем функцию get_challenge_leaderboard для каждого активного челленджа
SELECT 'Testing leaderboard function for all active challenges:' as message;

-- Получаем ID всех активных челленджей и тестируем функцию
DO $$
DECLARE
    challenge_record RECORD;
BEGIN
    FOR challenge_record IN 
        SELECT id, title FROM challenges WHERE status = 'active'
    LOOP
        RAISE NOTICE 'Testing challenge: % (ID: %)', challenge_record.title, challenge_record.id;
        
        -- Проверяем что возвращает функция
        PERFORM * FROM get_challenge_leaderboard(challenge_record.id);
        
        RAISE NOTICE 'Function executed successfully for %', challenge_record.title;
    END LOOP;
END $$;

-- 5. Проверяем данные для функции get_challenge_leaderboard вручную
-- (то же что делает функция, но по шагам)
SELECT 
  cp.id as participant_id,
  cp.telegram_id,
  u.first_name,
  u.last_name,
  u.username,
  u.photo_url,
  u.level,
  cp.current_progress,
  cp.max_progress,
  CASE 
    WHEN cp.max_progress > 0 THEN (cp.current_progress::numeric / cp.max_progress::numeric * 100)
    ELSE 0
  END as progress_percentage,
  RANK() OVER (
    ORDER BY cp.current_progress DESC, cp.last_update_at ASC
  ) as rank,
  cp.completed_at,
  c.title as challenge_title
FROM challenge_participants cp
JOIN users u ON cp.telegram_id = u.telegram_id
JOIN challenges c ON cp.challenge_id = c.id
WHERE c.status = 'active'
  AND cp.status != 'dropped'
ORDER BY c.title, rank ASC;

-- 6. Проверяем есть ли отсутствующие связи между challenge_participants и users
SELECT 
  cp.telegram_id,
  cp.status,
  c.title,
  CASE WHEN u.telegram_id IS NULL THEN 'MISSING USER' ELSE 'USER EXISTS' END as user_status
FROM challenge_participants cp
JOIN challenges c ON cp.challenge_id = c.id
LEFT JOIN users u ON cp.telegram_id = u.telegram_id
WHERE c.status = 'active' AND cp.status != 'dropped'
ORDER BY user_status, c.title;
