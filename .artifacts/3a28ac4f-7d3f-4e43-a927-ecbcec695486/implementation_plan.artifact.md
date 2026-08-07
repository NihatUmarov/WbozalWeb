# Исправление кнопки Сохранить и полировка UI кнопок

Пользователь сообщил, что кнопка "Применить изменения" в модальном окне массового обновления статусов не работает. Также есть запрос на улучшение внешнего вида кнопок во всем приложении ("чтобы не выглядели немощно").

## Основные исправления

### 1. Исправление логики сохранения (`StopListBulkImportModal.vue`)
- **Проблема**: Вызов несуществующего метода `productService.bulkUpdateActive` вместо `bulkUpdateMarketplaceActive`.
- **Решение**: Переименовать метод и привести параметры к виду, который ожидает бэкенд (верхний регистр для маркетплейса: `WB`, `OZON`).

### 2. Полировка UI кнопок (Глобально)
- Пройтись по ключевым экранам и убедиться, что кнопки действий выглядят солидно и консистентно.
- **StopListBulkImportModal.vue**: Усилить кнопки в футере.
- **MarketplaceLinks.vue**: Обновить кнопки в шапке и модальном окне связи.
- **JurpersonSelectView.vue**: Сделать кнопку создания организации более заметной.

## Предлагаемые изменения в файлах

### [StopListBulkImportModal.vue](file:///C:/Users/pc09.loc/source/repos/WbozalWeb/src/components/modals/StopListBulkImportModal.vue) [MODIFY]
- Исправление вызова `productService.bulkUpdateMarketplaceActive`.
- Обновление стилей кнопок в футере (добавление `h-44`, `px-24`).

### [MarketplaceLinks.vue](file:///C:/Users/pc09.loc/source/repos/WbozalWeb/src/views/MarketplaceLinks.vue) [MODIFY]
- Обновление кнопок в шапке страницы.
- Улучшение кнопок в модальном окне `BaseDialog` (настройка связи).

### [JurpersonSelectView.vue](file:///C:/Users/pc09.loc/source/repos/WbozalWeb/src/views/JurpersonSelectView.vue) [MODIFY]
- Приведение кнопок к "мощному" виду.

## План верификации

### Тестирование
1. Загрузить Excel в `StopListBulkImportModal.vue`, нажать "Применить изменения". Статусы должны обновиться (проверить тост об успехе).
2. Проверить визуально все обновленные кнопки — они должны быть крупнее и четче.
3. Проверить экран выбора организации.
