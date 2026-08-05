# Implementation Plan - Project Cleanup (Anti-Fragmentation Approach)

The goal is to reduce code volume and improve architecture without over-fragmenting the project into tiny files. We will focus on removing unused code, standardizing usage, and simplifying existing components.

## User Review Required

> [!IMPORTANT]
> I will **NOT** split `UnifiedUI.vue` into separate files for now, as per your feedback. Instead, I will clean up its internal logic to make it more concise and easier to use.

## Proposed Changes

### 1. Remove Dead Code
#### [DELETE] `src/components/icons/IconEcosystem.vue`
- Removing standard boilerplate that isn't used.

### 2. Consolidate and Organize Modals
#### [MOVE] `src/views/Profile/UserManagementModal.vue` -> `src/components/modals/UserManagementModal.vue`
- Centralizing modals to keep `views` folders focused only on page layouts.

### 3. Simplify UI Components
#### [MODIFY] [UnifiedUI.vue](file:///C:/Users/pc09.loc/source/repos/WbozalWeb/src/components/ui/UnifiedUI.vue)
- Refactor to use cleaner Kotlin-style (Vue 3 script setup) logic.
- Ensure props are strictly typed and default values are sensible.
- Keep the `skeleton` logic inside if it's compact, but optimize the template.

#### [MODIFY] [BaseDataPage.vue](file:///C:/Users/pc09.loc/source/repos/WbozalWeb/src/components/ui/BaseDataPage.vue)
- Currently, it has a "default" `BaseTable` that is often ignored. I'll simplify it to be a pure layout wrapper (Header + Tabs + Content Slot), which will reduce nested complexity.

### 4. Standardize Naming and Imports
- Rename `CatalogTable.vue` to `ProductTable.vue` for clarity.
- Update all views (`CardsView.vue`, `RemainsList.vue`) to use consistent names for UI components.

## Verification Plan

### Automated Tests
- Run `npm run lint` and `npm run type-check` to ensure no broken references.

### Manual Verification
- Verify that `UserManagementModal` still opens correctly from the Profile page.
- Ensure `ProductTable` (formerly CatalogTable) works in both `CardsView` and `RemainsList`.
- Check that `BaseDataPage` layouts are still consistent across all screens.
