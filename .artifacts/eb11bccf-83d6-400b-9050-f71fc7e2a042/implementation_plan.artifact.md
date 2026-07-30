# Fix TypeScript Build Errors in MarketplaceLinks and BaseTable

The project fails to build due to TypeScript type mismatches in `BaseTable.vue` and `MarketplaceLinks.vue`. These are primarily caused by strict generic inference in Vue templates and issues with `UnwrapRef` when indexing generic objects.

## Proposed Changes

### [UI Components]

#### [MODIFY] [BaseTable.vue](file:///C:/Users/pc09.loc/source/repos/WbozalWeb/src/components/ui/BaseTable.vue)
- Update `getVal` to use `any` for arguments to bypass `UnwrapRef` and strict indexing issues in the template.
- Ensure `col.key` is treated as a string when used for slot names and indexing.

#### [MODIFY] [MarketplaceLinks.vue](file:///C:/Users/pc09.loc/source/repos/WbozalWeb/src/views/MarketplaceLinks.vue)
- Cast `items` and `columns` props to `any` in `BaseDataPage` and `BaseTable` components. This is necessary because the component is reused for both `OzonProduct` and `WbProduct`, which have different keys, making it impossible for TypeScript to infer a single `T` that satisfies `TableColumn<T>` for both sets of columns (since `TableColumn<T>` depends on `keyof T`).

## Verification Plan

### Automated Tests
- Run `npm run type-check` (or `bash deploy.sh` which triggers it) to verify that the build succeeds without TypeScript errors.

### Manual Verification
- Verify that the Marketplace Links page still displays data correctly for both Wildberries and Ozon tabs.
- Check that the "Связь WMS" column and other custom slots still work correctly.
