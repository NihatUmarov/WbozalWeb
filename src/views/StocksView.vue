<template>
  <MainLayout>
    <div class="stocks-page">
      <h1 class="page-title">Складские остатки</h1>

      <div class="mock-table">
        <div class="table-header">
          <span>Товар</span>
          <span>Артикул</span>
          <span>Доступно (шт)</span>
        </div>
        <div class="table-row">
          <span>📦 Футболка Oversize</span>
          <span>TSH-ORD-01</span>
          <strong>142</strong>
        </div>
        <div class="table-row">
          <span>📦 Худи Black</span>
          <span>HD-BLK-02</span>
          <strong>89</strong>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import MainLayout from '@/components/ui/MainLayout.vue'
</script>

<style scoped>
.stocks-page {
  background: white;
  padding: 30px;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}
.page-title {
  font-size: 24px;
  color: #0f172a;
  margin-bottom: 24px;
  font-weight: 700;
}
.mock-table {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.table-header {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  padding: 12px 16px;
  background: #f8fafc;
  border-radius: 8px;
  font-weight: 600;
  color: #64748b;
  font-size: 14px;
}
.table-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  padding: 16px;
  border-bottom: 1px solid #f1f5f9;
  color: #334155;
  font-size: 15px;
}
.table-row strong {
  color: #4f46e5;
}
</style>
