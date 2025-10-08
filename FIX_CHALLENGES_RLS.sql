-- ===========================================
-- 🔧 ИСПРАВЛЕНИЕ RLS ДЛЯ CHALLENGES
-- ===========================================
-- Применить в Supabase Dashboard → SQL Editor

-- 1. Проверяем включен ли RLS на challenges
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'challenges';

-- 2. Удаляем старые политики (если есть)
DROP POLICY IF EXISTS "challenges_select_active" ON challenges;
DROP POLICY IF EXISTS "challenges_select_all" ON challenges;

-- 3. Создаем политику для публичного чтения челленджей
-- Все пользователи могут читать активные/предстоящие челленджи
CREATE POLICY "challenges_select_all" ON challenges
  FOR SELECT
  USING (
    status IN ('active', 'draft')
    OR
    -- Создатель может видеть свои челленджи в любом статусе
    created_by = public.get_telegram_id()
  );

-- 4. Если нужно разрешить создание челленджей
CREATE POLICY "challenges_insert_own" ON challenges
  FOR INSERT
  WITH CHECK (created_by = public.get_telegram_id());

-- 5. Если нужно разрешить обновление своих челленджей
CREATE POLICY "challenges_update_own" ON challenges
  FOR UPDATE
  USING (created_by = public.get_telegram_id())
  WITH CHECK (created_by = public.get_telegram_id());

-- 6. Проверка
SELECT 
  policyname, 
  cmd as operation,
  CASE cmd
    WHEN 'SELECT' THEN '👁️ Чтение'
    WHEN 'INSERT' THEN '➕ Создание'
    WHEN 'UPDATE' THEN '✏️ Обновление'
  END as operation_rus
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'challenges';

-- 7. Тест: проверить что челленджи возвращаются
SELECT id, title, status, start_date, end_date 
FROM challenges 
WHERE status = 'active'
LIMIT 5;

