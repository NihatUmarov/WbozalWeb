# Implementation Plan - Marketplace Statistics (Frontend)

The goal is to implement a Sales Statistics feature on the frontend, including a new modal with charts, filters, and Excel export, while refactoring the marketplace API service.

## User Review Required

> [!NOTE]
> I will implement a custom CSS/SVG-based bar chart for the sales graphics to avoid adding large external charting libraries like Chart.js, ensuring the app remains lightweight while fulfilling the "graphics" requirement.

## Proposed Changes

### [Component] API Service Refactoring

#### [NEW] [marketplaceService.ts](file:///C:/Users/pc09.loc/source/repos/WbozalWeb/src/api/marketplaceService.ts)
Create a dedicated service for all marketplace-related operations.
- Move methods from `productService.ts` and update routes to `/api/marketplace`.
- Add `getWeeklyStats()` method calling `/api/marketplace/stats`.

#### [MODIFY] [productService.ts](file:///C:/Users/pc09.loc/source/repos/WbozalWeb/src/api/productService.ts)
- Remove marketplace-specific methods (Ozon/WB products, linking, sync, active toggles).

#### [MODIFY] [types.ts](file:///C:/Users/pc09.loc/source/repos/WbozalWeb/src/api/types.ts)
- Add `MarketplaceStat` interface.

### [Component] UI Components & Utilities

#### [NEW] [excelExporter.ts](file:///C:/Users/pc09.loc/source/repos/WbozalWeb/src/utils/excelExporter.ts)
- Implement `exportToExcel(data, filename)` using the `xlsx` library.

#### [NEW] [MarketplaceStatsModal.vue](file:///C:/Users/pc09.loc/source/repos/WbozalWeb/src/components/modals/MarketplaceStatsModal.vue)
Create a comprehensive statistics modal.
- **Filters**: Marketplace (ALL, WB, OZON), Date range (auto-calculated from 7 days), and Search.
- **Graphic Section**: Daily sales bar chart (CSS/SVG).
- **Summary Section**: Weekly total quantities.
- **Data Table**: List of sales with product details and daily breakdown.
- **Export Button**: Trigger Excel download.

### [Component] Views

#### [MODIFY] [MarketplaceLinks.vue](file:///C:/Users/pc09.loc/source/repos/WbozalWeb/src/views/MarketplaceLinks.vue)
- Add "Статистика продаж" button in the header.
- Use `marketplaceService` instead of `productService` for all marketplace calls.
- Integrate the new `MarketplaceStatsModal`.

## Verification Plan

### Manual Verification
1. Open "Интеграция с маркетплейсами".
2. Click the new "Статистика продаж" button.
3. Verify that the modal opens and displays data correctly (Daily/Weekly totals).
4. Test the Marketplace filter (WB/OZON/ALL).
5. Click "Экспорт в Excel" and verify the downloaded file contains the correct data.
6. Verify that linking and status toggles still work after service refactoring.
