# Быстрая настройка проекта

## 1. Установка зависимостей

```bash
npm install
# или
pnpm install
```

## 2. Настройка переменных окружения

Создайте файл `.env.local` в корне проекта:

```env
# Google Maps API (обязательно для карты)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=ваш_ключ_здесь

# TikTok API (опционально)
NEXT_PUBLIC_TIKTOK_CLIENT_KEY=your_client_key_here
TIKTOK_CLIENT_SECRET=your_client_secret_here
NEXT_PUBLIC_TIKTOK_REDIRECT_URI=http://localhost:3000/api/auth/tiktok/callback
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 3. Получение Google Maps API ключа

1. Перейдите на [Google Cloud Console](https://console.cloud.google.com/)
2. Создайте проект или выберите существующий
3. Включите **Maps JavaScript API**
4. Создайте API ключ в разделе "Credentials"
5. Добавьте ключ в `.env.local`

## 4. Запуск проекта

```bash
npm run dev
# или
pnpm dev
```

Откройте [http://localhost:3000](http://localhost:3000)

## 5. Проверка работы

- ✅ Главная страница загружается
- ✅ Страница поиска работает
- ✅ Карта загружается (если настроен API ключ)
- ✅ Аутентификация работает

## Проблемы?

### Карта не загружается
- Проверьте, что Google Maps API ключ добавлен в `.env.local`
- Убедитесь, что Maps JavaScript API включен в Google Cloud Console
- Перезапустите сервер разработки

### Ошибки аутентификации
- Проверьте настройки Firebase в `src/lib/firebase/config.ts`
- Убедитесь, что Firebase проект настроен правильно

Подробные инструкции см. в файлах:
- `GOOGLE_MAPS_SETUP.md` - настройка Google Maps
- `TIKTOK_SETUP.md` - настройка TikTok API
