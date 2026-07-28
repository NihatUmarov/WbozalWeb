<template>
  <div class="tariff-wrapper">
    <div class="tariff-page">
      <!-- Шапка страницы -->
      <header class="tariff-header">
        <div class="header-main">
          <h1 class="title">Тарифы фулфилмента WBOZAL</h1>
          <p class="subtitle">
            Официальный прайс-лист на услуги складского комплекса и логистики от {{ currentDate }}
          </p>
        </div>
        <div class="header-contacts">
          <div class="contact-item">
            <span class="label">Адрес склада:</span>
            <span class="value">МО, г.о. Подольск, ИП Коледино д. 54, стр. 1</span>
          </div>
          <div class="contact-item align-right">
            <span class="label">Контакты:</span>
            <a href="tel:+79800107366" class="phone-link">+7 (980) 010-73-66</a>
          </div>
        </div>
      </header>

      <!-- Основная сетка блоков -->
      <main class="tariff-grid">
        <!-- 1. FBO & FBS -->
        <section class="tariff-card card-span-2">
          <div class="card-header">
            <h2>Обработка и сборка заказов (FBO / FBS)</h2>
          </div>
          <div class="tables-split">
            <!-- FBO -->
            <div class="table-block">
              <div class="sub-title">Операции FBO</div>
              <div class="compact-table">
                <div v-for="(item, idx) in fboTariffs" :key="idx" class="table-row">
                  <span class="row-name">{{ item.name }}</span>
                  <div class="row-price-wrap">
                    <span v-if="item.formula" class="price-formula">
                      <strong class="base">{{ item.formula.base }}</strong> / 1-й л.
                      <span v-if="item.formula.min" class="min">(мин. {{ item.formula.min }})</span>
                      <span v-if="item.formula.step" class="step"
                        >+ {{ item.formula.step }} / след. л.</span
                      >
                    </span>
                    <span v-else class="price-tag">{{ item.price }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- FBS -->
            <div class="table-block">
              <div class="sub-title">Операции FBS & Хранение</div>
              <div class="compact-table">
                <div v-for="(item, idx) in fbsTariffs" :key="idx" class="table-row">
                  <span class="row-name">{{ item.name }}</span>
                  <div class="row-price-wrap">
                    <span v-if="item.formula" class="price-formula">
                      <strong class="base">{{ item.formula.base }}</strong>
                      <span v-if="item.formula.min" class="min">(мин. {{ item.formula.min }})</span>
                      <span v-if="item.formula.step" class="step"
                        >+ {{ item.formula.step }} / след. л.</span
                      >
                    </span>
                    <span v-else-if="item.isFree" class="price-tag free">Бесплатно</span>
                    <span v-else class="price-tag">{{ item.price }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- 2. Логистика FBO -->
        <section class="tariff-card">
          <div class="card-header">
            <h2>Доставка FBO по направлениям</h2>
          </div>
          <div class="compact-table">
            <div class="table-head">
              <span>Направление</span>
              <span class="text-right">Короб / Паллет</span>
            </div>
            <div v-for="(item, idx) in fboDelivery" :key="idx" class="table-row border-row">
              <span class="row-name bold">{{ item.destination }}</span>
              <div class="delivery-pills">
                <span class="pill box">{{ item.box }} ₽</span>
                <span class="pill pallet">{{ item.pallet }} ₽</span>
              </div>
            </div>
          </div>
        </section>

        <!-- 3. Материалы и Доп. Услуги -->
        <section class="tariff-card">
          <div class="card-header">
            <h2>Упаковочные материалы и доп. услуги</h2>
          </div>
          <div class="compact-table">
            <div v-for="(item, idx) in combinedServices" :key="idx" class="table-row">
              <span class="row-name">{{ item.name }}</span>
              <span class="price-tag neutral">{{ item.price }}</span>
            </div>
          </div>
        </section>
      </main>

      <!-- Сноски -->
      <footer class="tariff-footer">
        <div class="note">
          * Услуги по обработке и забору возвратов предоставляются только в комплексе.
        </div>
        <div class="note">** Минимальная стоимость одной отгрузки составляет 500 ₽.</div>
        <div class="note">
          *** Актуальное расписание и графики отгрузок уточняйте у менеджеров склада.
        </div>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const currentDate = computed(() => {
  return (
    new Date().toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }) + ' г.'
  )
})

interface Formula {
  base: string
  min?: string
  step?: string
}

interface TariffItem {
  name: string
  price?: string
  isFree?: boolean
  formula?: Formula
}

const fboTariffs: TariffItem[] = [
  { name: 'Прием и сортировка', formula: { base: '6 ₽', min: '4 ₽', step: '0,4 ₽' } },
  { name: 'Упаковка (работа)', formula: { base: '8 ₽', min: '6 ₽', step: '0,75 ₽' } },
  { name: 'Визуальная проверка на брак', formula: { base: '8 ₽', min: '6 ₽', step: '0,75 ₽' } },
  { name: 'Детальная проверка на брак', formula: { base: '10 ₽', min: '5 ₽', step: '1 ₽' } },
  { name: 'Отгрузка со склада **', formula: { base: '6 ₽', min: '4 ₽', step: '0,4 ₽' } },
  { name: 'Маркировка товара', price: '6 ₽ / шт.' },
  { name: 'Нанесение Честного знака', price: '6 ₽ / шт.' },
  { name: 'Создание комплекта', price: '6 ₽ / шт.' },
  { name: 'Повесить бирку (с биркой)', price: '7 ₽ / шт.' },
  { name: 'Удаление бирки / этикетки', price: '5 ₽ / шт.' },
  { name: 'Дополнительное вложение', price: '6 ₽ / шт.' },
]

const fbsTariffs: TariffItem[] = [
  { name: 'Прием и сортировка', isFree: true },
  { name: 'Обработка FBS (заказ)', formula: { base: '30 ₽/л', min: '15 ₽', step: '2,5 ₽' } },
  { name: 'Хранение товара (в сутки)', formula: { base: '0,09 ₽/л', min: '0,06 ₽' } },
  { name: 'Обработка возвратов (брака) *', formula: { base: '50 ₽ (до 1л)', step: '3 ₽' } },
  { name: 'Хранение брака (в сутки)', formula: { base: '0,3 ₽ (до 1л)', step: '0,09 ₽' } },
]

const fboDelivery = [
  { destination: 'Коледино, Подольск', box: '350', pallet: '2 500' },
  { destination: 'Домодедово, Чехов', box: '400', pallet: '3 000' },
  {
    destination: 'Электросталь, Обухово, Алексин, Внуково, Софьино, Хоругвино, Петровское',
    box: '600',
    pallet: '4 000',
  },
  { destination: 'Санкт-Петербург, Рязань', box: '1 500', pallet: '7 000' },
  { destination: 'Казань', box: '1 500', pallet: '8 000' },
  { destination: 'Краснодар, Волгоград, Невинномысск', box: '1 500', pallet: '9 000' },
  { destination: 'Екатеринбург', box: '1 500', pallet: '11 000' },
  { destination: 'Новосемейкино, Сарапул', box: '2 000', pallet: '12 500' },
  { destination: 'Новосибирск', box: '2 500', pallet: '21 000' },
]

const combinedServices = [
  { name: 'Невозвратный палет (120×80 см)', price: '650 ₽' },
  { name: 'Короб (60×40×40 см)', price: '120 ₽' },
  { name: 'Воздушно-пузырчатая пленка', price: '40 ₽/м² (мин. 5 ₽)' },
  { name: 'Терморукав (22 мкм)', price: '45 ₽/м² (мин. 3 ₽)' },
  { name: 'Полиэтиленовый рукав (80 мкм)', price: '70 ₽/м² (мин. 5 ₽)' },
  { name: 'Снять размерную сетку', price: '200 ₽ / шт.' },
  { name: 'Забор брака с ПВЗ (Электромонтажный, 11)', price: 'Бесплатно' },
  { name: 'Забор брака с других ПВЗ (Подольск/Климовск)', price: '300 ₽ / ПВЗ' },
  { name: 'Хранение без поштучного приема', price: 'Короб — 20 ₽ | Палет — 55 ₽' },
  { name: 'Погрузка / разгрузка без приема', price: 'Короб — 40 ₽ | Палет — 200 ₽' },
]
</script>

<style scoped>
:deep(.main-content) {
  padding: 0 !important;
  margin: 0 !important;
  max-width: 100% !important;
  width: 100% !important;
}

.tariff-wrapper {
  width: 100%;
  min-height: 100vh;
  background-color: #f8fafc;
  padding: 24px 20px 40px;
  box-sizing: border-box;
}

.tariff-page {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, sans-serif;
  color: #0f172a;
}

/* Header с четкой черной рамкой */
.tariff-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  background: #ffffff;
  border: 1.5px solid #0f172a;
  border-radius: 10px;
  padding: 20px 24px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(15, 23, 42, 0.05);
}

.title {
  font-size: 20px;
  font-weight: 700;
  margin: 0 0 4px 0;
  color: #0f172a;
  letter-spacing: -0.01em;
}

.subtitle {
  font-size: 13px;
  color: #475569;
  margin: 0;
  font-weight: 500;
}

.header-contacts {
  display: flex;
  gap: 24px;
  font-size: 12px;
}

.contact-item {
  display: flex;
  flex-direction: column;
}

.contact-item.align-right {
  text-align: right;
}

.contact-item .label {
  color: #64748b;
  font-weight: 700;
  margin-bottom: 2px;
  text-transform: uppercase;
  font-size: 10px;
  letter-spacing: 0.05em;
}

.contact-item .value {
  color: #0f172a;
  font-weight: 600;
}

.phone-link {
  color: #4f46e5;
  font-weight: 700;
  text-decoration: none;
  font-size: 14px;
}

/* Grid Layout */
.tariff-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.card-span-2 {
  grid-column: span 2;
}

/* Карточки с четкой черной рамкой */
.tariff-card {
  background: #ffffff;
  border: 1.5px solid #0f172a;
  border-radius: 10px;
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 2px 4px rgba(15, 23, 42, 0.05);
}

.card-header {
  border-bottom: 1.5px solid #0f172a;
  padding-bottom: 12px;
  margin-bottom: 14px;
}

.card-header h2 {
  font-size: 14px;
  font-weight: 800;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: #0f172a;
}

/* Tables & Rows */
.tables-split {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 24px;
}

.sub-title {
  font-size: 12px;
  font-weight: 800;
  color: #334155;
  margin-bottom: 10px;
  padding-bottom: 4px;
  border-bottom: 1px solid #0f172a;
}

.compact-table {
  display: flex;
  flex-direction: column;
}

.table-head {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  font-weight: 800;
  color: #0f172a;
  text-transform: uppercase;
  padding-bottom: 8px;
  border-bottom: 1px solid #0f172a;
  margin-bottom: 4px;
}

.table-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 7px 0;
  border-bottom: 1px dashed #cbd5e1;
  font-size: 12px;
}

.table-row:last-child {
  border-bottom: none;
}

.table-row.border-row {
  border-bottom: 1px solid #e2e8f0;
}

.row-name {
  color: #1e293b;
  font-weight: 500;
}

.row-name.bold {
  font-weight: 600;
}

/* Formulas & Tags с контрастными границами */
.row-price-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
}

.price-formula {
  font-size: 11px;
  color: #334155;
  background: #f8fafc;
  padding: 3px 8px;
  border-radius: 4px;
  border: 1px solid #0f172a;
}

.price-formula .base {
  color: #0f172a;
  font-weight: 800;
}

.price-formula .min {
  color: #d97706;
  font-weight: 700;
  margin-left: 2px;
}

.price-formula .step {
  color: #4f46e5;
  font-weight: 700;
  margin-left: 2px;
}

.price-tag {
  font-size: 11px;
  font-weight: 700;
  color: #0f172a;
  background: #ffffff;
  padding: 3px 8px;
  border-radius: 4px;
  border: 1px solid #0f172a;
  white-space: nowrap;
}

.price-tag.free {
  background: #dcfce7;
  color: #14532d;
  border-color: #166534;
}

.price-tag.neutral {
  background: #ffffff;
  border: 1px solid #0f172a;
  color: #0f172a;
}

/* Delivery Pills */
.delivery-pills {
  display: flex;
  gap: 6px;
}

.pill {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 4px;
  border: 1px solid transparent;
}

.pill.box {
  background: #e0e7ff;
  color: #312e81;
  border-color: #4338ca;
}

.pill.pallet {
  background: #dcfce7;
  color: #14532d;
  border-color: #166534;
}

/* Footer Notes с черной рамкой */
.tariff-footer {
  margin-top: 20px;
  background: #ffffff;
  border: 1.5px solid #0f172a;
  border-radius: 8px;
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.note {
  font-size: 11px;
  color: #334155;
  font-weight: 500;
}

.text-right {
  text-align: right;
}

/* Adaptive Responsive */
@media (max-width: 900px) {
  .tariff-grid {
    grid-template-columns: 1fr;
  }
  .card-span-2 {
    grid-column: span 1;
  }
  .tables-split {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  .tariff-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  .header-contacts {
    text-align: left;
    width: 100%;
    justify-content: space-between;
  }
  .contact-item.align-right {
    text-align: left;
  }
}
</style>
