# Implementation Plan - BaseTable.vue Virtual Scrolling

Upgrade `BaseTable.vue` to a high-performance virtual scrolling component capable of handling 10,000+ records with a sticky header and absolute viewport architecture.

## Proposed Changes

### UI Components

#### [MODIFY] [BaseTable.vue](file:///C:/Users/pc09.loc/source/repos/WbozalWeb/src/components/ui/BaseTable.vue)
- Implement **Absolute Viewport Architecture**:
    - Outer container with `overflow: auto`.
    - Phantom div for total height calculation.
    - Two-table approach (Header + Body) to ensure a perfectly sticky header without `transform` interference.
    - Use `transform: translateY` for the body table to position the visible window.
- **Dynamic Sizing**:
    - Integrate `ResizeObserver` to automatically update visible row counts when the container size changes.
- **Data Management**:
    - Internal `computed` property for instant sorting and filtering of the `items` prop.
    - Optimized rendering with `v-for` on a sliced array of items.
- **Performance & Stability**:
    - Throttled/optimized scroll handling.
    - Fixed `table-layout: fixed` and `rowHeight` for predictable calculations.
    - Resolve the "Freezing" bug by ensuring clean state management and avoiding nested scroll conflicts.

## Verification Plan

### Automated Tests
- Since this is a UI component, manual verification on the device/emulator is primary.
- I will verify the code builds and has no TypeScript errors.

### Manual Verification
1. Load 10,000+ items into the table.
2. Scroll rapidly to check for "blank" spots or freezing.
3. Verify the header stays at the top.
4. Verify sorting and filtering work instantly.
5. Resize the window to verify `ResizeObserver` updates the visible rows count.
6. Check that the first row doesn't "freeze" during scroll.
