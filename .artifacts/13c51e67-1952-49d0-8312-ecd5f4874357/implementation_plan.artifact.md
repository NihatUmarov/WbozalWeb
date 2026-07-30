# Исправление типов данных при экспорте в Excel

Пользователь сообщил, что при выгрузке в Excel числовые значения (количество, остатки и т.д.) сохраняются как строки, что мешает проведению расчетов (сумм и т.д.) средствами Excel.

## Исследование проблемы

В файле `BaseTable.vue` функция `generateExcel` принудительно приводит все значения к строке:
```typescript
props.columns.forEach(c => r[c.label] = c.exportFormatter ? c.exportFormatter(getVal(item, c.key), item) : String(getVal(item, c.key) ?? '—'))
```
Использование `String(...)` делает все ячейки в Excel текстовыми.

## Предложенные изменения

### [UI Components]

#### [MODIFY] [BaseTable.vue](file:///C:/Users/pc09.loc/source/repos/WbozalWeb/src/components/ui/BaseTable.vue)

Изменить логику формирования строк для экспорта в `generateExcel`, чтобы сохранять оригинальный тип данных для чисел.

```diff
-    props.columns.forEach(c => r[c.label] = c.exportFormatter ? c.exportFormatter(getVal(item, c.key), item) : String(getVal(item, c.key) ?? '—'))
+    props.columns.forEach(c => {
+      const val = getVal(item, c.key)
+      if (c.exportFormatter) {
+        r[c.label] = c.exportFormatter(val, item)
+      } else {
+        r[c.label] = (typeof val === 'number') ? val : (val ?? '—')
+      }
+    })
```

## План верификации

### Автоматические тесты
- Проверка сборки проекта.

### Manual Verification
1. Открыть страницу "Остатки товаров".
2. Нажать кнопку "Выгрузить в Excel".
3. Открыть полученный файл.
4. Убедиться, что в колонках "Доступно", "В резерве" и т.д. находятся числа (их можно суммировать, Excel не показывает предупреждение "Число сохранено как текст").
5. Проверить другие таблицы, использующие `BaseTable` (например, "Карточки товаров").
