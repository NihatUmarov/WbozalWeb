# План устранения ошибок линтера (ESLint Any Genocide)

Необходимо полностью искоренить `any` из проекта, так как текущая конфигурация ESLint блокирует запуск dev-сервера и сборку при их наличии. Мы заменим `any` на более строгие типы или `unknown` с последующим приведением, чтобы удовлетворить и компилятор, и линтер.

## Proposed Changes

### 🛠 API и Типизация

#### [MODIFY] [productService.ts](file:///C:/Users/pc09.loc/source/repos/WbozalWeb/src/api/productService.ts)
- Удалить `extends any` у дженерика `normalize`.
- Заменить аргумент `p: any` на `p: unknown`.
- Использовать `Record<string, unknown>` внутри функции для безопасного доступа к полям через приведение типа.

### 🧩 UI Компоненты

#### [MODIFY] [BaseTable.vue](file:///C:/Users/pc09.loc/source/repos/WbozalWeb/src/components/ui/BaseTable.vue)
- Заменить `T = any` в интерфейсе `TableColumn` на более подходящий тип (например, `object`).
- Исправить `getVal` и `getItemId`, чтобы они не использовали `any`.
- Создать интерфейс для `exposed` методов таблицы, чтобы не использовать `ref<any>` в родительских компонентах.

#### [MODIFY] [CatalogTable.vue](file:///C:/Users/pc09.loc/source/repos/WbozalWeb/src/components/ui/CatalogTable.vue)
- Уточнить типы для `baseTableRef` и `baseColumns`.

#### [MODIFY] [BaseDataPage.vue](file:///C:/Users/pc09.loc/source/repos/WbozalWeb/src/components/ui/BaseDataPage.vue)
- Заменить `ref<any>` на типизированные ссылки.

### 🌐 Views

#### [MODIFY] [MarketplaceLinks.vue](file:///C:/Users/pc09.loc/source/repos/WbozalWeb/src/views/MarketplaceLinks.vue)
- Исправить `catch (err: any)`.
- Уточнить типы аргументов в `toggleActive` и `openLinkModal`.

## Verification Plan

### Automated Tests
- Запуск `npm run dev` или `npm run build` для подтверждения отсутствия ошибок ESLint.
- Проверка через `vue-tsc --noEmit`.

### Manual Verification
- Убедиться, что функционал таблиц (сортировка, фильтрация) и модалок не пострадал после уточнения типов.
