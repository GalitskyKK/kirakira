-- 🍂 Скрипт для исправления seasonal_variant в существующих элементах сада
-- Устанавливает сезон на основе даты разблокировки элемента

-- Обновляем все элементы с NULL seasonal_variant
-- Используем CASE для определения сезона на основе месяца
UPDATE garden_elements
SET seasonal_variant = CASE
  WHEN EXTRACT(MONTH FROM unlock_date) >= 3 AND EXTRACT(MONTH FROM unlock_date) <= 5 THEN 'spring'
  WHEN EXTRACT(MONTH FROM unlock_date) >= 6 AND EXTRACT(MONTH FROM unlock_date) <= 8 THEN 'summer'
  WHEN EXTRACT(MONTH FROM unlock_date) >= 9 AND EXTRACT(MONTH FROM unlock_date) <= 11 THEN 'autumn'
  ELSE 'winter'
END
WHERE seasonal_variant IS NULL;

-- Проверяем результаты
SELECT 
  seasonal_variant,
  COUNT(*) as count
FROM garden_elements
GROUP BY seasonal_variant
ORDER BY seasonal_variant;

-- Показываем примеры обновленных элементов
SELECT 
  id,
  element_type,
  unlock_date,
  seasonal_variant,
  EXTRACT(MONTH FROM unlock_date) as month
FROM garden_elements
ORDER BY unlock_date DESC
LIMIT 10;

