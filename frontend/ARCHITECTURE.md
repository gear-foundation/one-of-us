# Frontend Architecture

## 📁 Структура проекта

```
frontend/src/
├── components/           # Презентационные компоненты
│   ├── StarsBackground/  # WebGL фон с анимацией звезд
│   ├── Header/          # Шапка с кошельком
│   ├── Footer/          # Подвал с ссылками
│   ├── SloganCarousel/  # Карусель слоганов
│   ├── Stats/           # Статистика членов
│   ├── JoinSection/     # Секция с кнопкой присоединения
│   ├── FloatingCat/     # Плавающий кот
│   └── index.ts         # Экспорты компонентов
│
├── hooks/               # Бизнес-логика и хуки
│   ├── useWallet.tsx         # Подключение MetaMask
│   ├── useSails.tsx          # Работа с Sails IDL
│   ├── useVaraApi.tsx        # Инициализация Vara.Eth API
│   ├── useMemberCount.tsx    # Получение количества участников
│   └── useJoinProgram.tsx    # Логика присоединения к программе
│
├── config/              # Конфигурация
│   ├── env.ts           # Переменные окружения
│   └── constants.ts     # Константы приложения
│
├── App.tsx              # Главный компонент (чистая композиция)
├── App.css              # Глобальные стили
├── index.tsx            # Точка входа
└── index.css            # Базовые стили

```

## 🏗️ Архитектурные принципы

### 1. **Разделение ответственности**

- **Components**: Только UI, получают данные через props
- **Hooks**: Бизнес-логика, работа с API, состояние
- **Config**: Конфигурация и константы

### 2. **Композиция вместо наследования**

```tsx
<App>
  <StarsBackground />
  <FloatingCat />
  <Header {...headerProps} />
  <main>
    <SloganCarousel />
    <Stats memberCount={memberCount} />
    <JoinSection {...joinProps} />
  </main>
  <Footer />
</App>
```

### 3. **Hooks для логики**

Каждый hook отвечает за одну задачу:

- `useWallet` - управление MetaMask
- `useVaraApi` - инициализация Vara.Eth API
- `useMemberCount` - получение и обновление счетчика
- `useJoinProgram` - логика присоединения

### 4. **Конфигурация через ENV**

```typescript
// config/env.ts
export const ENV = {
  ROUTER_ADDRESS: import.meta.env.VITE_ROUTER_ADDRESS,
  PROGRAM_ID: import.meta.env.VITE_PROGRAM_ID,
  VARA_ETH_HTTP: import.meta.env.VITE_VARA_ETH_HTTP,
  VARA_ETH_WS: import.meta.env.VITE_VARA_ETH_WS,
};
```

## 🎨 Компоненты

### StarsBackground

WebGL компонент с анимированным фоном звезд. Самодостаточный, не требует props.

### Header

Отображает статус подключения кошелька и кнопки подключения/отключения.

**Props:**

- `address`, `chainId`, `isConnected`, `isConnecting`
- `isMetaMaskInstalled`, `error`
- `onConnect`, `onDisconnect`

### JoinSection

Главная секция с кнопкой присоединения и отображением статуса транзакций.

**Props:**

- Статусы: `isConnected`, `isJoined`, `loading`, `sailsLoading`
- Данные: `preConfirmed`, `finalized`, `error`
- Колбэки: `onConnect`, `onJoin`

### Stats

Отображает статистику участников.

**Props:**

- `memberCount: number`

## 🔗 Hooks

### useVaraApi

Создает и управляет экземпляром `VaraEthApi`.

```tsx
const varaApi = useVaraApi(ethereumClient, isConnected);
```

### useMemberCount

Получает количество участников из программы и обновляет каждые 10 секунд.

```tsx
const { memberCount, refetchCount } = useMemberCount(varaApi, sails, address);
```

### useJoinProgram

Управляет процессом присоединения к программе.

```tsx
const { isJoined, loading, preConfirmed, finalized, handleJoin } = useJoinProgram(varaApi, sails, address, isConnected);
```

## ⚙️ Конфигурация

### Environment Variables

Создайте файл `.env` в корне `frontend/`:

```env
VITE_ROUTER_ADDRESS=0x579D6098197517140e5aec47c78d6f7181916dd6
VITE_PROGRAM_ID=0xe1e91aaa2e33dcb5472abda548a875fc955d2c95
VITE_WVARA_ADDRESS=0x7e01A323534AA027Ac3aD17e7DBf8C90d4FFEf8e
VITE_VARA_ETH_HTTP=https://hoodi-reth-rpc.gear-tech.io
VITE_VARA_ETH_WS=wss://hoodi-reth-rpc.gear-tech.io/ws
```

### Constants

```typescript
// config/constants.ts
export const SLOGANS = ['STOP FRAGMENTING', 'STOP BRIDGING', 'STOP COMPLICATING', 'STOP SACRIFICING', 'BE PART OF US!'];

export const SLOGAN_INTERVAL_MS = 2000;
export const MEMBER_COUNT_REFRESH_MS = 10000;
```

## 🚀 Запуск

```bash
# Установка зависимостей
npm install

# Разработка
npm run dev

# Сборка
npm run build

# Превью продакшн-сборки
npm run preview
```

## 📦 Зависимости

- **React 18** - UI library
- **@vara-eth/api** - Vara.Eth blockchain integration
- **sails-js** - Sails framework client
- **viem** - Ethereum interactions
- **TypeScript** - Type safety
- **Vite** - Build tool

## 🎯 Best Practices

1. **Один компонент = один файл** - каждый компонент в своей папке с CSS
2. **Props интерфейсы** - все props типизированы через TypeScript
3. **CSS модули по компонентам** - изолированные стили
4. **Кастомные hooks для логики** - переиспользуемая бизнес-логика
5. **ENV для конфигурации** - не хардкодим адреса и настройки
6. **Clean-up в useEffect** - всегда очищаем подписки и таймеры

## 🔄 Data Flow

```
User Action → Hook → API Call → State Update → Component Re-render
     ↓
handleJoin() → useJoinProgram → VaraEthApi → setIsJoined(true) → JoinSection
```

## 📝 Добавление нового компонента

1. Создайте папку в `components/`
2. Создайте файлы `Component.tsx` и `Component.css`
3. Экспортируйте в `components/index.ts`
4. Используйте в `App.tsx`

```tsx
// components/NewComponent/NewComponent.tsx
import './NewComponent.css';

interface NewComponentProps {
  title: string;
}

export const NewComponent = ({ title }: NewComponentProps) => {
  return <div className="new-component">{title}</div>;
};
```

## 🐛 Отладка

- Проверьте консоль браузера для логов
- Используйте React DevTools
- Проверьте Network tab для API запросов
- Проверьте подключение к MetaMask









