# 🔧 Исправление 404 ошибки API

## Проблема:

```
Error: API GET error: 404
/user?action=get-streak-freezes&telegramId=311830507
```

## Причина:

Vercel **НЕ обновил** serverless функцию `api/user.js` при деплое.

---

## ✅ Решение (2 варианта):

### Вариант 1: Форсированный редеплой (быстро)

```bash
# 1. Пустой коммит для триггера редеплоя
git commit --allow-empty -m "chore: redeploy to update API functions"
git push

# 2. Или через Vercel Dashboard:
# → Deployments → Latest → Redeploy
```

### Вариант 2: Очистка кэша API (через Vercel Dashboard)

```
1. Откройте Vercel Dashboard
2. Перейдите в Settings → Functions
3. Нажмите "Clear Cache"
4. Redeploy
```

---

## 🔍 Проверка после редеплоя:

### Проверьте что API доступен:

```bash
# В браузере или curl:
https://your-app.vercel.app/api/user?action=stats&telegramId=311830507

# Должно работать
```

### Проверьте новый endpoint:

```bash
https://your-app.vercel.app/api/user?action=get-streak-freezes&telegramId=311830507

# Ожидаемый ответ:
{
  "success": true,
  "data": {
    "manual": 0,
    "auto": 0,
    "max": 3,
    "canAccumulate": true
  }
}
```

---

## 💡 Временный workaround (пока Vercel не обновился)

Fallback уже добавлен в `useStreakFreeze.ts`:

- Если API недоступен → берёт данные из `currentUser.stats`
- UI показывает 0/0 заморозок
- Функционал не ломается

---

## ✅ После исправления:

1. Заморозки отобразятся в хедере
2. API будет работать
3. Модалка появится при пропуске дня
4. Авто-заморозки будут срабатывать

**Просто пересоберите на Vercel!** 🚀
