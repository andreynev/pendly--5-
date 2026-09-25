# Pendly у Google Play

Матеріали для сторінки застосунку й анкет Play Console.

| Файл | Куди в Play Console |
| --- | --- |
| `icon-512.png` | Main store listing → App icon (512×512, 32-bit PNG) |
| `feature-graphic-1024x500.png` | Main store listing → Feature graphic |
| `screenshots/*.png` | Main store listing → Phone screenshots (1080×1920) |

Посилання:
- Політика конфіденційності: https://pendly-c0b1f.web.app/privacy.html
- Видалення акаунта: https://pendly-c0b1f.web.app/delete-account.html

---

## Сторінка в магазині — українська (uk-UA)

**Назва** (до 30 символів)
```
Pendly — відлік днів до подій
```

**Короткий опис** (до 80 символів)
```
Скільки днів до важливого: дні народження, відпустки, зустрічі та свята.
```

**Повний опис** (до 4000 символів)
```
Pendly — простий і красивий застосунок, який показує, скільки днів залишилося до важливих для вас подій.

Додайте день народження, відпустку, зустріч чи свято — і Pendly рахуватиме дні за вас. Найближча подія завжди на виду, а минулі переходять в архів.

ОСНОВНЕ
• Великий зворотний відлік днів для кожної події
• Повторення: щотижня, щомісяця, щороку — дні народження й річниці рахуються автоматично
• Категорії: свято, зустріч, робота, подорож, інше
• Пошук і фільтр за категоріями
• Архів минулих подій
• Нотатки, час і місце для кожної події

СИНХРОНІЗАЦІЯ
• Вхід через Google — ваші події на всіх пристроях
• Імпорт подій із Google Calendar (лише читання — Pendly нічого не змінює у вашому календарі)
• Імпорт і експорт у форматі .ics (Apple Calendar, Outlook, Google)
• Працює офлайн: зміни синхронізуються, щойно з'явиться інтернет

ЗРУЧНО
• Світла, темна або системна тема
• Швидке редагування — просто торкніться події
• Випадково видалили подію? Натисніть «Повернути»

БЕЗ РЕКЛАМИ Й СТЕЖЕННЯ
Pendly не показує рекламу, не використовує аналітику і не продає ваші дані. Ви можете будь-коли видалити акаунт разом з усіма даними прямо в застосунку.
```

## Store listing — English (en-US)

**App name**
```
Pendly — Event Countdown
```

**Short description**
```
Count down the days to birthdays, trips, meetings and holidays.
```

**Full description**
```
Pendly is a simple, beautiful app that shows how many days are left until the events that matter to you.

Add a birthday, a trip, a meeting or a holiday — Pendly counts the days for you. Your next event is always in view, and past events move to the archive.

FEATURES
• Big, clear day countdown for every event
• Repeats: weekly, monthly, yearly — birthdays and anniversaries roll over automatically
• Categories: holiday, meeting, work, travel, other
• Search and category filters
• Archive of past events
• Notes, time and location for each event

SYNC
• Sign in with Google — your events on all your devices
• Import events from Google Calendar (read-only — Pendly never changes your calendar)
• Import and export .ics files (Apple Calendar, Outlook, Google)
• Works offline: changes sync as soon as you're back online

CONVENIENT
• Light, dark or system theme
• Quick editing — just tap an event
• Deleted something by mistake? Tap "Undo"

NO ADS, NO TRACKING
Pendly shows no ads, uses no analytics and never sells your data. You can delete your account and all your data at any time right in the app.

The app interface is in Ukrainian.
```

---

## Налаштування застосунку в Play Console

- **Категорія:** Productivity (Продуктивність)
- **Теги:** Calendar, Productivity, Planner
- **Реклама:** ні
- **Платний/безкоштовний:** безкоштовний
- **Цільова аудиторія:** 18+ (простіше пройти перевірку; застосунок не для дітей)
- **Доступ до застосунку (App access):** «All functionality is available without special access» не підходить — потрібен вхід через Google. Оберіть «All or some functionality is restricted» і вкажіть: *«Sign in with any Google account. No special credentials needed.»*

### Анкета віку (Content rating, IARC)
Категорія: **Utility, Productivity, Communication, or Other**. На всі питання про насильство, сексуальний контент, мову, наркотики, азартні ігри — **Ні**. Спілкування між користувачами — **Ні**. Обмін місцезнаходженням — **Ні**. Очікуваний рейтинг: 3+ / Everyone.

### Безпека даних (Data safety)
- **Чи збирає або передає застосунок дані користувачів?** Так
- **Чи шифруються дані під час передачі?** Так
- **Чи можуть користувачі запросити видалення даних?** Так → https://pendly-c0b1f.web.app/delete-account.html

| Тип даних | Збирається | Передається третім особам | Обов'язково | Мета |
| --- | --- | --- | --- | --- |
| Personal info → Name | Так | Ні | Так | App functionality, Account management |
| Personal info → Email address | Так | Ні | Так | App functionality, Account management |
| Personal info → User IDs | Так | Ні | Так | App functionality, Account management |
| Calendar → Calendar events | Так | Ні | Ні (за бажанням) | App functionality |

Дані не обробляються «ефемерно», зберігаються до видалення акаунта. Firebase/Google Cloud — це обробник даних (service provider), тому «передачею третім особам» не вважається.

---

## Android-пакет (Trusted Web Activity)

1. https://www.pwabuilder.com → URL `https://pendly-c0b1f.web.app` → **Package for stores → Android → Google Play**.
2. Налаштування:
   - **Package ID:** `app.pendly.twa` (змінити потім неможливо)
   - **App name:** Pendly · **Launcher name:** Pendly
   - **Theme / background color:** `#8b5cf6` / `#0f172a`
   - **Signing key:** *Create new* — збережіть архів із ключем і паролями в надійному місці.
3. Завантажте `.aab` у Play Console (спершу **Internal testing**).
4. Надішліть SHA-256 відбитки двох ключів — з PWABuilder (`assetlinks.json` в архіві) і з Play Console → **Test and release → App integrity → App signing key certificate**. Вони йдуть у `public/.well-known/assetlinks.json`, щоб застосунок відкривався без адресного рядка.
