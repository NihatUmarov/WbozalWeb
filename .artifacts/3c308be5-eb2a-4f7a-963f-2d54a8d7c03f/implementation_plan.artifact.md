# Table Settings Relocation Plan

The goal is to move the "Table Display Settings" from the Profile page directly into the `BaseTable` component for better accessibility and context.

## Proposed Changes

### 1. BaseTable Enhancement
We will add a "Settings" button (gear icon) to the `BaseTable` component. Clicking this button will open a small dropdown menu allowing users to toggle column visibility globally.

#### [MODIFY] [BaseTable.vue](file:///C:/Users/pc09.loc/source/repos/WbozalWeb/src/components/ui/BaseTable.vue)
- Add `showSettings` ref state.
- Add a settings trigger button and a popover menu to the template.
- Move the `AppToggleButton` logic or a simplified version of it into `BaseTable.vue` for use inside the settings menu.
- Ensure the settings are applied reactively via `useViewSettings`.

### 2. Profile Page Cleanup
Remove the now-redundant settings block from the Profile page.

#### [MODIFY] [ProfileView.vue](file:///C:/Users/pc09.loc/source/repos/WbozalWeb/src/views/Profile/ProfileView.vue)
- Delete the "Настройки отображения таблиц" card.
- Remove the `AppToggleButton` component definition.
- Remove unused imports (`useViewSettings`, `AppToggleButton`).

## Verification Plan

### Manual Verification
1.  **Accessibility:** Go to any page with a table (e.g., Inventory, Invoices). Verify that a gear icon appears in the table corner.
2.  **Functionality:**
    *   Open the settings menu.
    *   Toggle "Show Image" and verify that images appear/disappear in real-time across all tables.
    *   Verify settings persist after page reload (since `useViewSettings` uses `localStorage`).
3.  **Profile Check:** Go to the Profile page and verify the settings block is gone.
4.  **UI Consistency:** Ensure the settings menu doesn't overlap with table headers or filters in an ugly way.
