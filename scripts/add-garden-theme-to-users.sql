-- Добавление поля garden_theme в таблицу users
-- Это поле будет хранить ID темы сада (например, 'light', 'dark', 'sunset', 'night', etc.)

-- Добавляем поле garden_theme с значением по умолчанию 'light'
ALTER TABLE public.users 
ADD COLUMN garden_theme text DEFAULT 'light'::text;

-- Добавляем комментарий к полю
COMMENT ON COLUMN public.users.garden_theme IS 'ID темы сада пользователя (light, dark, sunset, night, forest, aqua)';

-- Создаем индекс для быстрого поиска по теме сада (опционально)
CREATE INDEX IF NOT EXISTS idx_users_garden_theme ON public.users(garden_theme);

-- Обновляем существующих пользователей, устанавливая им тему 'light' по умолчанию
-- (это не обязательно, так как DEFAULT уже установлен, но для явности)
UPDATE public.users 
SET garden_theme = 'light' 
WHERE garden_theme IS NULL;
