# MEDPAL

MEDPAL е съвременно уеб приложение, създадено за ефективно управление и проследяване на медикаментозно лечение. То предоставя на пациентите възможност да добавят и управляват своите медикаменти, да отбелязват приеми, да следят подробна история и да получават напомняния за предстоящи дози. Лекарите могат да създават и управляват профили на пациенти, да предписват медикаменти и да следят спазването на терапевтичните режими. Приложението използва модерни технологии като React, TypeScript, Tailwind CSS и Firebase, осигурявайки сигурно съхранение и синхронизация на данните в реално време. MEDPAL е проектирано с фокус върху удобството, сигурността и достъпността, за да улесни ежедневието на пациенти и медицински специалисти.

## Описание на проекта

Това приложение улеснява пациентите и лекарите в управлението на лекарствени планове, история на приемите и комуникация. Пациентите могат да добавят и отбелязват медикаменти, да следят историята на приемите си и да получават напомняния. Лекарите имат възможност да управляват пациенти, да предписват медикаменти и да следят спазването на терапията.

## Технологии

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Firebase (Authentication & Firestore)

## Инсталация и стартиране

1. Клонирайте репозиторито:
   ```sh
   git clone <GIT_URL>
   cd <PROJECT_NAME>
   ```
2. Инсталирайте зависимостите:
   ```sh
   npm install
   ```
3. Стартирайте приложението в development режим:
   ```sh
   npm run dev
   ```
4. Приложението ще бъде достъпно на http://localhost:5173 (или друг порт, ако е зает).

## Деплоймънт

За production build използвайте:
```sh
npm run build
```

## Структура на проекта
- `src/pages` – Основни страници (Login, Register, Landing, Dashboard и др.)
- `src/components` – UI компоненти и специфични за проекта елементи
- `src/contexts` – Контексти за автентикация и тема
- `src/hooks` – Персонализирани React hook-ове
- `src/config` – Конфигурация за Firebase
- `src/models` – Типове и модели на данни

