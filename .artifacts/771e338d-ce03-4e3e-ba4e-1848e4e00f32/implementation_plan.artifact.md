# План рефакторинга MarketplaceStockService (Синхронизация остатков)

Мы продолжаем избавляться от таблицы `FBSActiveProducts`. Теперь служба синхронизации остатков будет проверять статус активности товара напрямую в таблицах маркетплейсов `WBFBSData` и `OzonProduct`.

## Proposed Changes

### FBSRemains (Служба синхронизации)

#### [MODIFY] [MarketplaceStockService.cs](file:///C:/Users/pc09.loc/source/repos/FBSRemains/FBSRemains/MarketplaceStockService.cs)
- В методе `GetUnifiedStocksAsync` обновить SQL-запросы для WB и Ozon:
    - Удалить `LEFT JOIN [dbo].[FBSActiveProducts] ap`.
    - Заменить условие `ISNULL(ap.[IsActive], 1) = 1` на прямую проверку поля `isActive` из основной таблицы (`wbfbs.[isActive]` или `ozp.[isActive]`).
    - Учесть, что если `isActive` равно 0 (или `false`), остаток для маркетплейса должен уходить как 0.

## Verification Plan

### SQL Verification
- Убедиться, что при `isActive = 0` в таблице `WBFBSData` или `OzonProduct`, запрос `GetUnifiedStocksAsync` возвращает `DbQty = 0`.
- Проверить, что при `isActive = 1` расчет остатков (включая комплекты и резервы) работает корректно.

### Manual Verification
- Запустить синхронизацию остатков для тестового бренда.
- Проверить логи `MarketplaceRemains.log`, чтобы убедиться, что товары в «стопе» отправляются с нулевым остатком.
