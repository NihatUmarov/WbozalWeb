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

### 🚀 FBSRemains (Служба синхронизации)
- **[MarketplaceStockService.cs](file:///C:/Users/pc09.loc/source/repos/FBSRemains/FBSRemains/MarketplaceStockService.cs)**:
    - Обновлен метод `GetUnifiedStocksAsync`.
    - Удален `LEFT JOIN [dbo].[FBSActiveProducts]`, который создавал лишнюю нагрузку на БД.
    - SQL-запросы для WB и Ozon переведены на использование поля `isActive` напрямую из таблиц `WBFBSData` и `OzonProduct`.
    - Логика расчета остатков теперь учитывает статус `isActive`: если товар выключен, в маркетплейс всегда отправляется 0, независимо от физического наличия на складе.

## Что это дает?
1. **Архитектурная чистота**: Статус товара хранится там, где он и должен быть — в его основной карточке.
2. **Синхронность**: Больше нет риска рассинхронизации между списком товаров в ЛК и службой отправки остатков. Если вы выключили товар в интерфейсе «Интеграции», служба синхронизации мгновенно увидит это при следующем цикле.
3. **Скорость работы**: Меньше запросов и джойнов при получении списков и расчете остатков.
4. **Удобство UX**: Управление продажами стало контекстным — вы видите связь товара со складом и его статус в одном месте.

> [!TIP]
> Изменения вступают в силу немедленно. При следующем запуске `FBSRemains` остатки будут обновлены согласно новым статусам `isActive`.

render_diffs(file:///C:/Users/pc09.loc/source/repos/FBSRemains/FBSRemains/MarketplaceStockService.cs)
