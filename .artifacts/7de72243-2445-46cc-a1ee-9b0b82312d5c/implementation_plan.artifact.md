# Fix TypeScript Generic and Reference Errors

The project currently fails to build due to several TypeScript errors in the UI components, specifically related to generic type constraints and Vue's `v-for` type inference in templates.

## User Review Required

> [!IMPORTANT]
> The changes involve updating generic constraints from `any` to `Record<string, any>`. This is necessary for type compatibility between components but might require minor adjustments in components that pass non-object types (though unlikely for table data).

## Proposed Changes

### UI Components

#### [MODIFY] [BaseTable.vue](file:///C:/Users/pc09.loc/source/repos/WbozalWeb/src/components/ui/BaseTable.vue)
- Refine the `TableColumn` interface to handle potential `UnwrapRef` issues in templates.
- Update `dynamicColumns` logic to ensure keys are treated as `string | keyof T` correctly.
- Use `shallowRef` for `columnOrder` to avoid unnecessary deep reactivity which often causes `UnwrapRef` complications in TS.

#### [MODIFY] [BaseDataPage.vue](file:///C:/Users/pc09.loc/source/repos/WbozalWeb/src/components/ui/BaseDataPage.vue)
- Update generic constraint to `T extends Record<string, any>`.
- Fix `registerExternalTable` to return `void` instead of the result of assignment.

#### [MODIFY] [CatalogTable.vue](file:///C:/Users/pc09.loc/source/repos/WbozalWeb/src/components/ui/CatalogTable.vue)
- Update generic constraint to `T extends Record<string, any>`.

### Views

- No changes required in views if the above fixes resolve the `VNodeRef` and generic mismatch errors.

## Verification Plan

### Automated Tests
- Run `bash deploy.sh` to trigger the build and type-check.
- Verify that the 14 errors are resolved.

### Manual Verification
- Check the application in the browser to ensure tables still render correctly and Excel export works.
