# Pendly

Мінімалістичний PWA-застосунок для відліку днів до важливих подій.

## Можливості

- Вхід через Google, події зберігаються у Firestore і синхронізуються між пристроями в реальному часі
- Робота офлайн: зміни зберігаються локально й надсилаються, щойно з'явиться з'єднання
- Відлік днів до подій з повтореннями (щотижня / щомісяця / щороку)
- Додавання, редагування (натисніть на подію) та видалення з можливістю «Повернути»
- Пошук і фільтр за категоріями, архів минулих подій
- Синхронізація з Google Calendar (лише читання): нові події додаються, змінені оновлюються
- Імпорт/експорт `.ics` (Apple, Outlook, Google), експорт окремої події в календар
- Світла / темна / системна тема, встановлення на телефон як застосунок

## Firebase

Проєкт: `pendly-c0b1f` (конфіг у `services/firebaseConfig.ts` — він публічний, дані захищають правила).

- Дані: `users/{uid}/events/{eventId}`
- Правила доступу: `firestore.rules` — кожен користувач бачить і змінює лише свої події
- У консолі Firebase мають бути увімкнені **Authentication → Google** та створена **Firestore Database**

## Google Calendar

Pendly отримує доступ `calendar.readonly` через той самий вхід Google (без сервера): токен діє ~1 годину
і зберігається лише в поточній сесії браузера; після цього кнопка «Синхронізувати» один раз запитає доступ знову.
При відкритті застосунку, поки токен дійсний, синхронізація запускається автоматично.

Одноразове налаштування в [Google Cloud Console](https://console.cloud.google.com) (проєкт `pendly-c0b1f`):

1. **APIs & Services → Library → Google Calendar API → Enable**.
2. **Google Auth Platform → Data access → Add or remove scopes** → додайте
   `https://www.googleapis.com/auth/calendar.readonly` → **Save**.
3. **Google Auth Platform → Audience**:
   - режим **Testing** — додайте свій Gmail (і тих, хто користуватиметься) у **Test users**;
   - режим **In production** без перевірки Google — користувачі побачать попередження
     «Google hasn't verified this app» (**Advanced → Go to Pendly**), ліміт 100 користувачів.
     Для публічного застосунку потрібна верифікація Google.

## Запуск локально

**Потрібно:** Node.js 20+ (і Java 11+ для емуляторів)

```bash
npm install
npm run dev                # з реальним Firebase-проєктом
```

Робота з локальними емуляторами (без реальних даних):

```bash
npm run emulators          # у першому терміналі
npm run dev:emulators      # у другому
```

## Скрипти

- `npm run build` — перевірка типів і продакшн-збірка в `dist/`
- `npm test` — юніт-тести (дати, повторення, ICS)
- `npm run test:rules` — тести правил Firestore на емуляторі
- `npm run deploy` — збірка і деплой хостингу та правил (потрібен `firebase login`)

## Деплой

Сайт публікується на Firebase Hosting: https://pendly-c0b1f.web.app

**Автоматично (GitHub Actions)** — кожен push у `main` запускає `.github/workflows/deploy.yml`.
Один раз потрібно додати секрет із ключем сервісного акаунта:

1. Google Cloud Console → проєкт `pendly-c0b1f` → **IAM & Admin → Service Accounts** → **Create service account**
   (наприклад, `github-deploy`) з ролями **Firebase Hosting Admin**, **Firebase Rules Admin**,
   **Service Usage Consumer** та **API Keys Viewer**.
2. У створеному акаунті: **Keys → Add key → Create new key → JSON** — завантажиться файл.
3. GitHub → репозиторій → **Settings → Secrets and variables → Actions → New repository secret**:
   назва `FIREBASE_SERVICE_ACCOUNT`, значення — увесь вміст JSON-файлу.

**Вручну:** `npx firebase login`, потім `npm run deploy`.
