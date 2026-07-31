# Рефакторинг Стоп-листа и расширение таблиц маркетплейсов

Мы успешно перевели управление активностью товаров на прямую работу с таблицами маркетплейсов (`OzonProduct` и `WBFBSData`), отказавшись от избыточной таблицы `FBSActiveProducts`. Также таблицы связей на фронтенде стали более информативными и функциональными.

## Основные изменения

### ⚙️ Backend (WbozalWebApi)
- **[ProductRepository.cs](file:///C:/Users/pc09.loc/source/repos/WbozalWebApi/WbozalWebApi/Service/ProductRepository.cs)**:
    - Обновлены методы получения товаров Ozon и WB: теперь они возвращают статус `isActive`, список штрихкодов и фото.
    - Добавлены методы для одиночного (`UpdateOzonActiveAsync`, `UpdateWbActiveAsync`) и массового (`BulkUpdateMarketplaceActiveAsync`) обновления статуса активности.
    - Удалена устаревшая логика работы с таблицей `FBSActiveProducts`.
- **[CardsController.cs](file:///C:/Users/pc09.loc/source/repos/WbozalWebApi/WbozalWebApi/Controllers/CardsController.cs)**:
    - Добавлены эндпоинты `ozon/active`, `wb/active` и `bulk-update-active`.
    - Удалены старые эндпоинты Стоп-листа.

### 🌐 Frontend (WbozalWeb)
- **[productService.ts](file:///C:/Users/pc09.loc/source/repos/WbozalWeb/src/api/productService.ts)**:
    - Расширены интерфейсы `OzonProduct` и `WbProduct`.
    - Обновлена нормализация данных: теперь штрихкоды и статусы корректно обрабатываются для всех типов товаров.
    - Добавлены методы для управления активностью.
- **[MarketplaceLinks.vue](file:///C:/Users/pc09.loc/source/repos/WbozalWeb/src/views/MarketplaceLinks.vue)**:
    - В таблицы добавлены колонки: **Фото**, **Размер**, **Штрихкоды**.
    - Добавлена колонка **В продаже** с интерактивным переключателем. Теперь можно мгновенно остановить продажи товара прямо из списка связей.
    - Кнопка «Стоп-лист» заменена на **«Импорт статусов»**, которая позволяет массово обновлять активность через Excel по штрихкоду.
- **[StopListBulkImportModal.vue](file:///C:/Users/pc09.loc/source/repos/WbozalWeb/src/components/modals/StopListBulkImportModal.vue)**:
    - Модалка адаптирована для работы с новым API массового обновления.
    - Добавлена визуализация фото и данных товаров в превью импорта.

## Что это дает?
1. **Архитектурная чистота**: Статус товара хранится там, где он и должен быть — в его основной карточке.
2. **Скорость работы**: Меньше запросов и джойнов при получении списков.
3. **Удобство UX**: Управление продажами стало контекстным — вы видите связь товара со складом и его статус в одном месте.

> [!TIP]
> Теперь для массового отключения товаров достаточно загрузить Excel со списком штрихкодов и нулями в колонке статуса.
