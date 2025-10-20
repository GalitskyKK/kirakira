-- =============================================
-- МИГРАЦИЯ: Добавление системы магазина тем
-- =============================================

-- 1. Создаем таблицу для покупок в магазине (если не существует)
CREATE TABLE IF NOT EXISTS public.shop_purchases (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  telegram_id bigint NOT NULL,
  item_type text NOT NULL CHECK (item_type = ANY (ARRAY['garden_theme'::text, 'premium_feature'::text, 'decoration'::text])),
  item_id text NOT NULL,
  price_sprouts integer DEFAULT 0 CHECK (price_sprouts >= 0),
  price_gems integer DEFAULT 0 CHECK (price_gems >= 0),
  purchased_at timestamp with time zone DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT shop_purchases_pkey PRIMARY KEY (id),
  CONSTRAINT shop_purchases_telegram_id_fkey FOREIGN KEY (telegram_id) REFERENCES public.users(telegram_id),
  CONSTRAINT shop_purchases_unique UNIQUE (telegram_id, item_type, item_id)
);

-- 2. Удаляем существующую функцию (если есть) и создаем новую
-- Удаляем все возможные варианты функции spend_currency
DO $$ 
BEGIN
  -- Пытаемся удалить функцию с 6 параметрами
  BEGIN
    DROP FUNCTION IF EXISTS public.spend_currency(bigint,text,integer,text,text,jsonb);
  EXCEPTION WHEN OTHERS THEN
    -- Игнорируем ошибки
  END;
  
  -- Пытаемся удалить функцию с 5 параметрами
  BEGIN
    DROP FUNCTION IF EXISTS public.spend_currency(bigint,text,integer,text,text);
  EXCEPTION WHEN OTHERS THEN
    -- Игнорируем ошибки
  END;
  
  -- Пытаемся удалить функцию с 4 параметрами
  BEGIN
    DROP FUNCTION IF EXISTS public.spend_currency(bigint,text,integer,text);
  EXCEPTION WHEN OTHERS THEN
    -- Игнорируем ошибки
  END;
END $$;

-- Создаем функцию для траты валюты
CREATE OR REPLACE FUNCTION public.spend_currency(
  p_telegram_id bigint,
  p_currency_type text,
  p_amount integer,
  p_reason text,
  p_description text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_balance integer;
  v_new_balance integer;
  v_transaction_id uuid;
  v_result jsonb;
BEGIN
  -- Проверяем входные параметры
  IF p_telegram_id IS NULL OR p_currency_type IS NULL OR p_amount IS NULL OR p_reason IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Missing required parameters'
    );
  END IF;

  -- Проверяем тип валюты
  IF p_currency_type NOT IN ('sprouts', 'gems') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid currency type'
    );
  END IF;

  -- Проверяем сумму
  IF p_amount <= 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Amount must be positive'
    );
  END IF;

  -- Получаем текущий баланс
  SELECT 
    CASE 
      WHEN p_currency_type = 'sprouts' THEN sprouts
      WHEN p_currency_type = 'gems' THEN gems
    END
  INTO v_current_balance
  FROM public.user_currency
  WHERE telegram_id = p_telegram_id;

  -- Проверяем, существует ли пользователь
  IF v_current_balance IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User not found'
    );
  END IF;

  -- Проверяем достаточность средств
  IF v_current_balance < p_amount THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Insufficient funds',
      'current_balance', v_current_balance,
      'required_amount', p_amount
    );
  END IF;

  -- Вычисляем новый баланс
  v_new_balance := v_current_balance - p_amount;

  -- Обновляем баланс пользователя
  UPDATE public.user_currency
  SET 
    sprouts = CASE WHEN p_currency_type = 'sprouts' THEN v_new_balance ELSE sprouts END,
    gems = CASE WHEN p_currency_type = 'gems' THEN v_new_balance ELSE gems END,
    total_sprouts_spent = CASE WHEN p_currency_type = 'sprouts' THEN total_sprouts_spent + p_amount ELSE total_sprouts_spent END,
    total_gems_spent = CASE WHEN p_currency_type = 'gems' THEN total_gems_spent + p_amount ELSE total_gems_spent END,
    last_updated = now(),
    updated_at = now()
  WHERE telegram_id = p_telegram_id;

  -- Создаем запись транзакции
  INSERT INTO public.currency_transactions (
    telegram_id,
    transaction_type,
    currency_type,
    amount,
    balance_before,
    balance_after,
    reason,
    description,
    metadata
  ) VALUES (
    p_telegram_id,
    'spend',
    p_currency_type,
    p_amount,
    v_current_balance,
    v_new_balance,
    p_reason,
    p_description,
    p_metadata
  ) RETURNING id INTO v_transaction_id;

  -- Возвращаем успешный результат
  RETURN jsonb_build_object(
    'success', true,
    'transaction_id', v_transaction_id,
    'balance_before', v_current_balance,
    'balance_after', v_new_balance,
    'amount_spent', p_amount
  );

EXCEPTION
  WHEN OTHERS THEN
    -- В случае ошибки возвращаем информацию об ошибке
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Database error: ' || SQLERRM
    );
END;
$$;

-- 3. Создаем индексы для оптимизации
CREATE INDEX IF NOT EXISTS idx_shop_purchases_telegram_id ON public.shop_purchases(telegram_id);
CREATE INDEX IF NOT EXISTS idx_shop_purchases_item_type ON public.shop_purchases(item_type);
CREATE INDEX IF NOT EXISTS idx_shop_purchases_item_id ON public.shop_purchases(item_id);

-- 4. Добавляем комментарии
COMMENT ON TABLE public.shop_purchases IS 'Покупки пользователей в магазине (темы, премиум функции, декорации)';
COMMENT ON FUNCTION public.spend_currency IS 'Функция для траты валюты пользователем с созданием транзакции';

-- 5. Даем права доступа
GRANT SELECT, INSERT, UPDATE ON public.shop_purchases TO authenticated;
GRANT EXECUTE ON FUNCTION public.spend_currency TO authenticated;
