<template>
  <div class="tariff-shell">
    <main class="tariff-page">
      <!-- Hero -->
      <section class="hero">
        <div class="hero__content">
          <div class="eyebrow">
            <span class="eyebrow__dot"></span>
            Актуальные тарифы WBOZAL
          </div>

          <h1>Фулфилмент без скрытых платежей</h1>
          <p class="hero__lead">
            Приёмка, хранение, обработка FBS и подготовка поставок FBO на одном складе рядом с
            Коледино.
          </p>

          <div class="hero__meta">
            <span>Прайс действует с {{ currentDate }}</span>
            <span class="hero__separator"></span>
            <span>Все цены указаны в рублях</span>
          </div>
        </div>

        <div class="hero__contact-card">
          <span class="hero__contact-label">Консультация по тарифам</span>
          <a href="tel:+79800107366" class="hero__phone">+7 (980) 010-73-66</a>
          <span class="hero__address">МО, г.о. Подольск, Коледино, д. 54, стр. 1</span>
        </div>
      </section>

      <!-- Key rates -->
      <section class="highlights" aria-label="Ключевые тарифы">
        <article class="highlight highlight--primary">
          <div class="highlight__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M4 7.5 12 3l8 4.5-8 4.5-8-4.5Z" stroke="currentColor" stroke-width="1.7" />
              <path d="M4 7.5V16l8 5 8-5V7.5M12 12v9" stroke="currentColor" stroke-width="1.7" />
            </svg>
          </div>
          <div>
            <span class="highlight__label">Обработка FBS</span>
            <div class="highlight__price">от 15 ₽</div>
            <span class="highlight__caption">за заказ до 0,5 литра</span>
          </div>
        </article>

        <article class="highlight">
          <div class="highlight__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M5 9h14v11H5V9Z" stroke="currentColor" stroke-width="1.7" />
              <path d="M8 9V6a4 4 0 0 1 8 0v3" stroke="currentColor" stroke-width="1.7" />
            </svg>
          </div>
          <div>
            <span class="highlight__label">Приёмка FBS</span>
            <div class="highlight__price">Бесплатно</div>
            <span class="highlight__caption">при размещении на хранение</span>
          </div>
        </article>

        <article class="highlight">
          <div class="highlight__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path
                d="M4 6h16M6 6v14h12V6M9 10h6M9 14h6"
                stroke="currentColor"
                stroke-width="1.7"
              />
            </svg>
          </div>
          <div>
            <span class="highlight__label">Хранение</span>
            <div class="highlight__price">от 0,06 ₽</div>
            <span class="highlight__caption">за единицу в сутки</span>
          </div>
        </article>

        <article class="highlight">
          <div class="highlight__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M3 15h13V6H7L3 10v5Z" stroke="currentColor" stroke-width="1.7" />
              <path d="M16 10h3l2 3v2h-5v-5Z" stroke="currentColor" stroke-width="1.7" />
              <circle cx="7" cy="17.5" r="1.5" stroke="currentColor" stroke-width="1.7" />
              <circle cx="18" cy="17.5" r="1.5" stroke="currentColor" stroke-width="1.7" />
            </svg>
          </div>
          <div>
            <span class="highlight__label">Отгрузки</span>
            <div class="highlight__price">2 раза в день</div>
            <span class="highlight__caption">без выходных</span>
          </div>
        </article>
      </section>

      <!-- Main tariff cards -->
      <section class="section-block">
        <div class="section-heading">
          <div>
            <span class="section-heading__kicker">Основные услуги</span>
            <h2>Обработка заказов</h2>
          </div>
          <p>Стоимость зависит от объёма товара и выбранного набора операций.</p>
        </div>

        <div class="tariff-columns">
          <!-- FBS -->
          <article class="rate-card rate-card--featured">
            <div class="rate-card__top">
              <div>
                <div class="rate-card__badge">Основное направление</div>
                <h3>FBS и хранение</h3>
                <p>Ежедневная обработка заказов Wildberries и Ozon.</p>
              </div>
              <div class="rate-card__mark">FBS</div>
            </div>

            <div class="rate-list">
              <div v-for="(item, idx) in fbsTariffs" :key="`fbs-${idx}`" class="rate-row">
                <div class="rate-row__content">
                  <span class="rate-row__name">{{ item.name }}</span>
                  <span v-if="item.description" class="rate-row__description">{{
                    item.description
                  }}</span>
                </div>

                <div class="rate-row__price">
                  <span v-if="item.isFree" class="price-chip price-chip--free">Бесплатно</span>
                  <template v-else-if="item.formula">
                    <strong>{{ item.formula.base }}</strong>
                    <small v-if="item.formula.min">мин. {{ item.formula.min }}</small>
                    <small v-if="item.formula.step">+ {{ item.formula.step }} / след. л.</small>
                  </template>
                  <strong v-else>{{ item.price }}</strong>
                </div>
              </div>
            </div>

            <div class="formula-note">
              <div class="formula-note__icon">i</div>
              <p>
                Для товаров объёмом до 0,5 литра обработка FBS стоит 15 ₽ за заказ. Свыше 0,5 литра
                применяется объёмная формула.
              </p>
            </div>
          </article>

          <!-- FBO -->
          <article class="rate-card">
            <div class="rate-card__top">
              <div>
                <div class="rate-card__badge rate-card__badge--neutral">Подготовка поставок</div>
                <h3>Операции FBO</h3>
                <p>Приёмка, маркировка, упаковка и отгрузка на маркетплейс.</p>
              </div>
              <div class="rate-card__mark rate-card__mark--neutral">FBO</div>
            </div>

            <div class="rate-list">
              <div v-for="(item, idx) in fboTariffs" :key="`fbo-${idx}`" class="rate-row">
                <div class="rate-row__content">
                  <span class="rate-row__name">{{ item.name }}</span>
                  <span v-if="item.description" class="rate-row__description">{{
                    item.description
                  }}</span>
                </div>

                <div class="rate-row__price">
                  <template v-if="item.formula">
                    <strong>{{ item.formula.base }}</strong>
                    <small v-if="item.formula.min">мин. {{ item.formula.min }}</small>
                    <small v-if="item.formula.step">+ {{ item.formula.step }} / след. л.</small>
                  </template>
                  <strong v-else>{{ item.price }}</strong>
                </div>
              </div>
            </div>
          </article>
        </div>
      </section>

      <!-- Delivery -->
      <section class="section-block">
        <div class="section-heading">
          <div>
            <span class="section-heading__kicker">Логистика</span>
            <h2>Доставка поставок FBO</h2>
          </div>
          <p>Фиксированная стоимость доставки одного короба или паллета.</p>
        </div>

        <article class="data-card">
          <div class="delivery-table delivery-table--head">
            <span>Направление</span>
            <span>Короб</span>
            <span>Паллет</span>
          </div>

          <div
            v-for="(item, idx) in fboDelivery"
            :key="`delivery-${idx}`"
            class="delivery-table delivery-table--row"
          >
            <span class="delivery-table__destination">{{ item.destination }}</span>
            <span class="delivery-price">{{ item.box }} ₽</span>
            <span class="delivery-price delivery-price--accent">{{ item.pallet }} ₽</span>
          </div>
        </article>
      </section>

      <!-- Materials -->
      <section class="section-block">
        <div class="section-heading">
          <div>
            <span class="section-heading__kicker">Дополнительно</span>
            <h2>Материалы и складские услуги</h2>
          </div>
          <p>Упаковка, забор возвратов и операции без поштучной приёмки.</p>
        </div>

        <div class="services-grid">
          <article
            v-for="(item, idx) in combinedServices"
            :key="`service-${idx}`"
            class="service-card"
          >
            <span class="service-card__name">{{ item.name }}</span>
            <span
              :class="[
                'service-card__price',
                { 'service-card__price--free': item.price === 'Бесплатно' },
              ]"
            >
              {{ item.price }}
            </span>
          </article>
        </div>
      </section>

      <!-- Notes and CTA -->
      <section class="bottom-panel">
        <div class="bottom-panel__notes">
          <h2>Важная информация</h2>
          <ul>
            <li>Услуги по обработке и забору возвратов предоставляются только в комплексе.</li>
            <li>Минимальная стоимость одной отгрузки составляет 500 ₽.</li>
            <li>Актуальное расписание и графики отгрузок уточняйте у менеджера.</li>
          </ul>
        </div>

        <div class="bottom-panel__cta">
          <span>Нужен индивидуальный расчёт?</span>
          <p>Подберём оптимальную схему работы под объём и особенности вашего товара.</p>
          <a href="tel:+79800107366" class="cta-button">Обсудить тариф</a>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const currentDate = computed(() =>
  new Date().toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }),
)

interface Formula {
  base: string
  min?: string
  step?: string
}

interface TariffItem {
  name: string
  price?: string
  isFree?: boolean
  description?: string
  formula?: Formula
}

const fboTariffs: TariffItem[] = [
  { name: 'Приём и сортировка', formula: { base: '6 ₽ / 1-й л.', min: '4 ₽', step: '0,4 ₽' } },
  { name: 'Упаковка — работа', formula: { base: '8 ₽ / 1-й л.', min: '6 ₽', step: '0,75 ₽' } },
  {
    name: 'Визуальная проверка на брак',
    formula: { base: '8 ₽ / 1-й л.', min: '6 ₽', step: '0,75 ₽' },
  },
  {
    name: 'Детальная проверка на брак',
    formula: { base: '10 ₽ / 1-й л.', min: '5 ₽', step: '1 ₽' },
  },
  {
    name: 'Отгрузка со склада',
    formula: { base: '6 ₽ / 1-й л.', min: '4 ₽', step: '0,4 ₽' },
  },
  { name: 'Маркировка товара', price: '6 ₽ / шт.' },
  { name: 'Нанесение Честного знака', price: '6 ₽ / шт.' },
  { name: 'Создание комплекта', price: '6 ₽ / шт.' },
  { name: 'Повесить бирку с биркой', price: '7 ₽ / шт.' },
  { name: 'Удаление бирки или этикетки', price: '5 ₽ / шт.' },
  { name: 'Дополнительное вложение', price: '6 ₽ / шт.' },
]

const fbsTariffs: TariffItem[] = [
  {
    name: 'Приём и сортировка',
    description: 'При размещении товара на хранение',
    isFree: true,
  },
  {
    name: 'Обработка заказа FBS',
    formula: { base: '30 ₽ / 1-й л.', min: '15 ₽', step: '2,5 ₽' },
  },
  {
    name: 'Хранение товара в сутки',
    formula: { base: '0,09 ₽ / л.', min: '0,06 ₽' },
  },
  {
    name: 'Обработка возвратов и брака',
    formula: { base: '50 ₽ до 1 л.', step: '3 ₽' },
  },
  {
    name: 'Хранение брака в сутки',
    formula: { base: '0,3 ₽ до 1 л.', step: '0,09 ₽' },
  },
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
  { name: 'Невозвратный паллет 120 × 80 см', price: '650 ₽' },
  { name: 'Короб 60 × 40 × 40 см', price: '120 ₽' },
  { name: 'Воздушно-пузырчатая плёнка', price: '40 ₽ / м² · мин. 5 ₽' },
  { name: 'Терморукав 22 мкм', price: '45 ₽ / м² · мин. 3 ₽' },
  { name: 'Полиэтиленовый рукав 80 мкм', price: '70 ₽ / м² · мин. 5 ₽' },
  { name: 'Снять размерную сетку', price: '200 ₽ / шт.' },
  { name: 'Забор брака с ПВЗ на Электромонтажном, 11', price: 'Бесплатно' },
  { name: 'Забор брака с других ПВЗ Подольска и Климовска', price: '300 ₽ / ПВЗ' },
  { name: 'Хранение без поштучной приёмки', price: 'Короб 20 ₽ · паллет 55 ₽' },
  { name: 'Погрузка и разгрузка без приёмки', price: 'Короб 40 ₽ · паллет 200 ₽' },
]
</script>

<style scoped>
:deep(.main-content) {
  width: 100% !important;
  max-width: none !important;
  margin: 0 !important;
  padding: 0 !important;
}

.tariff-shell {
  --ink: #172033;
  --muted: #677289;
  --line: #e4e8f0;
  --soft: #f4f6fa;
  --paper: #ffffff;
  --accent: #7c3aed;
  --accent-dark: #5b21b6;
  --accent-soft: #f1eafe;
  --green: #087a55;
  --green-soft: #e7f8f1;

  min-height: 100vh;
  padding: 32px 20px 56px;
  box-sizing: border-box;
  background: radial-gradient(circle at 8% 2%, rgba(124, 58, 237, 0.08), transparent 30%), #f7f8fb;
  color: var(--ink);
}

.tariff-page {
  width: 100%;
  max-width: 1240px;
  margin: 0 auto;
  font-family:
    Inter,
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    sans-serif;
}

/* Hero */
.hero {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 36px;
  align-items: end;
  overflow: hidden;
  padding: 42px 46px;
  border-radius: 28px;
  background: linear-gradient(135deg, #19142e 0%, #272047 58%, #40206f 100%);
  box-shadow: 0 22px 55px rgba(29, 20, 54, 0.2);
}

.hero::before,
.hero::after {
  position: absolute;
  content: '';
  border-radius: 999px;
  pointer-events: none;
}

.hero::before {
  width: 330px;
  height: 330px;
  top: -190px;
  right: 110px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.hero::after {
  width: 180px;
  height: 180px;
  right: -70px;
  bottom: -90px;
  background: rgba(236, 72, 153, 0.16);
  filter: blur(2px);
}

.hero__content,
.hero__contact-card {
  position: relative;
  z-index: 1;
}

.eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  margin-bottom: 18px;
  color: #dfd4ff;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.09em;
  text-transform: uppercase;
}

.eyebrow__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ec4899;
  box-shadow: 0 0 0 5px rgba(236, 72, 153, 0.15);
}

.hero h1 {
  max-width: 760px;
  margin: 0;
  color: #ffffff;
  font-size: clamp(34px, 4.2vw, 58px);
  line-height: 1.02;
  letter-spacing: -0.045em;
}

.hero__lead {
  max-width: 700px;
  margin: 20px 0 0;
  color: rgba(255, 255, 255, 0.75);
  font-size: 17px;
  line-height: 1.58;
}

.hero__meta {
  display: flex;
  align-items: center;
  gap: 13px;
  margin-top: 28px;
  color: rgba(255, 255, 255, 0.52);
  font-size: 12px;
  font-weight: 650;
}

.hero__separator {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.38);
}

.hero__contact-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 22px;
  border: 1px solid rgba(255, 255, 255, 0.13);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(14px);
}

.hero__contact-label {
  margin-bottom: 9px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.07em;
  text-transform: uppercase;
}

.hero__phone {
  color: #ffffff;
  font-size: 21px;
  font-weight: 850;
  text-decoration: none;
  letter-spacing: -0.02em;
}

.hero__address {
  margin-top: 12px;
  color: rgba(255, 255, 255, 0.57);
  font-size: 12px;
  line-height: 1.5;
}

/* Highlights */
.highlights {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  margin-top: 18px;
}

.highlight {
  display: flex;
  align-items: center;
  gap: 15px;
  min-height: 112px;
  padding: 20px;
  border: 1px solid var(--line);
  border-radius: 20px;
  background: var(--paper);
  box-shadow: 0 8px 24px rgba(28, 35, 55, 0.055);
}

.highlight--primary {
  border-color: transparent;
  background: linear-gradient(145deg, var(--accent) 0%, var(--accent-dark) 100%);
  color: #ffffff;
}

.highlight__icon {
  display: grid;
  flex: 0 0 44px;
  width: 44px;
  height: 44px;
  place-items: center;
  border-radius: 14px;
  background: var(--accent-soft);
  color: var(--accent);
}

.highlight--primary .highlight__icon {
  background: rgba(255, 255, 255, 0.14);
  color: #ffffff;
}

.highlight__icon svg {
  width: 23px;
  height: 23px;
}

.highlight__label,
.highlight__caption {
  display: block;
}

.highlight__label {
  margin-bottom: 5px;
  color: var(--muted);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.055em;
  text-transform: uppercase;
}

.highlight--primary .highlight__label,
.highlight--primary .highlight__caption {
  color: rgba(255, 255, 255, 0.68);
}

.highlight__price {
  font-size: 20px;
  font-weight: 850;
  line-height: 1.15;
  letter-spacing: -0.025em;
}

.highlight__caption {
  margin-top: 4px;
  color: var(--muted);
  font-size: 11px;
  line-height: 1.35;
}

/* Sections */
.section-block {
  margin-top: 56px;
}

.section-heading {
  display: flex;
  justify-content: space-between;
  gap: 32px;
  align-items: end;
  margin-bottom: 20px;
}

.section-heading__kicker {
  display: block;
  margin-bottom: 6px;
  color: var(--accent);
  font-size: 11px;
  font-weight: 850;
  letter-spacing: 0.085em;
  text-transform: uppercase;
}

.section-heading h2 {
  margin: 0;
  font-size: clamp(25px, 3vw, 35px);
  line-height: 1.1;
  letter-spacing: -0.035em;
}

.section-heading p {
  max-width: 460px;
  margin: 0;
  color: var(--muted);
  font-size: 13px;
  line-height: 1.55;
  text-align: right;
}

/* Rate cards */
.tariff-columns {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
  align-items: start;
}

.rate-card {
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: 24px;
  background: var(--paper);
  box-shadow: 0 12px 32px rgba(28, 35, 55, 0.065);
}

.rate-card--featured {
  border-color: rgba(124, 58, 237, 0.26);
  box-shadow: 0 16px 38px rgba(91, 33, 182, 0.11);
}

.rate-card__top {
  display: flex;
  justify-content: space-between;
  gap: 24px;
  align-items: flex-start;
  padding: 26px 28px 23px;
  border-bottom: 1px solid var(--line);
  background: linear-gradient(180deg, #ffffff 0%, #fbfbfd 100%);
}

.rate-card--featured .rate-card__top {
  background: linear-gradient(145deg, #fbf8ff 0%, #f3edff 100%);
}

.rate-card__badge {
  display: inline-flex;
  margin-bottom: 12px;
  padding: 6px 9px;
  border-radius: 999px;
  background: var(--accent);
  color: #ffffff;
  font-size: 10px;
  font-weight: 850;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.rate-card__badge--neutral {
  background: #edf0f5;
  color: #555f72;
}

.rate-card h3 {
  margin: 0;
  font-size: 24px;
  letter-spacing: -0.03em;
}

.rate-card__top p {
  max-width: 390px;
  margin: 9px 0 0;
  color: var(--muted);
  font-size: 12px;
  line-height: 1.5;
}

.rate-card__mark {
  display: grid;
  flex: 0 0 58px;
  width: 58px;
  height: 58px;
  place-items: center;
  border-radius: 18px;
  background: var(--accent);
  color: #ffffff;
  font-size: 15px;
  font-weight: 900;
  letter-spacing: -0.02em;
}

.rate-card__mark--neutral {
  background: #202b40;
}

.rate-list {
  padding: 4px 28px;
}

.rate-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(150px, auto);
  gap: 20px;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid var(--line);
}

.rate-row:last-child {
  border-bottom: 0;
}

.rate-row__content {
  min-width: 0;
}

.rate-row__name,
.rate-row__description {
  display: block;
}

.rate-row__name {
  font-size: 13px;
  font-weight: 720;
  line-height: 1.35;
}

.rate-row__description {
  margin-top: 4px;
  color: var(--muted);
  font-size: 10px;
  line-height: 1.4;
}

.rate-row__price {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  text-align: right;
}

.rate-row__price strong {
  font-size: 13px;
  font-weight: 850;
  line-height: 1.25;
}

.rate-row__price small {
  margin-top: 3px;
  color: var(--muted);
  font-size: 10px;
  font-weight: 650;
}

.price-chip {
  display: inline-flex;
  padding: 7px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 850;
}

.price-chip--free {
  background: var(--green-soft);
  color: var(--green);
}

.formula-note {
  display: flex;
  gap: 11px;
  margin: 4px 20px 20px;
  padding: 14px 16px;
  border-radius: 15px;
  background: var(--accent-soft);
  color: #4d327c;
}

.formula-note__icon {
  display: grid;
  flex: 0 0 22px;
  width: 22px;
  height: 22px;
  place-items: center;
  border-radius: 50%;
  background: #ffffff;
  color: var(--accent);
  font-size: 12px;
  font-weight: 900;
}

.formula-note p {
  margin: 1px 0 0;
  font-size: 10px;
  font-weight: 650;
  line-height: 1.5;
}

/* Delivery */
.data-card {
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: 24px;
  background: var(--paper);
  box-shadow: 0 12px 32px rgba(28, 35, 55, 0.055);
}

.delivery-table {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 130px 150px;
  gap: 16px;
  align-items: center;
}

.delivery-table--head {
  padding: 14px 24px;
  background: #f1f3f7;
  color: #657087;
  font-size: 10px;
  font-weight: 850;
  letter-spacing: 0.07em;
  text-transform: uppercase;
}

.delivery-table--head span:not(:first-child) {
  text-align: right;
}

.delivery-table--row {
  padding: 15px 24px;
  border-top: 1px solid var(--line);
}

.delivery-table--row:first-of-type {
  border-top: 0;
}

.delivery-table__destination {
  font-size: 12px;
  font-weight: 680;
  line-height: 1.45;
}

.delivery-price {
  justify-self: end;
  padding: 6px 10px;
  border-radius: 9px;
  background: #f0f2f6;
  color: #364157;
  font-size: 11px;
  font-weight: 850;
  white-space: nowrap;
}

.delivery-price--accent {
  background: var(--accent-soft);
  color: var(--accent-dark);
}

/* Services */
.services-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.service-card {
  display: flex;
  justify-content: space-between;
  gap: 22px;
  align-items: center;
  min-height: 74px;
  padding: 17px 20px;
  border: 1px solid var(--line);
  border-radius: 17px;
  background: var(--paper);
  box-shadow: 0 7px 20px rgba(28, 35, 55, 0.04);
}

.service-card__name {
  color: #3a4559;
  font-size: 12px;
  font-weight: 680;
  line-height: 1.4;
}

.service-card__price {
  flex: 0 0 auto;
  color: var(--ink);
  font-size: 12px;
  font-weight: 850;
  text-align: right;
  white-space: nowrap;
}

.service-card__price--free {
  padding: 6px 9px;
  border-radius: 999px;
  background: var(--green-soft);
  color: var(--green);
  font-size: 10px;
}

/* Bottom panel */
.bottom-panel {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 380px;
  gap: 26px;
  margin-top: 56px;
  padding: 30px;
  border-radius: 24px;
  background: #20283a;
  color: #ffffff;
}

.bottom-panel h2 {
  margin: 0 0 18px;
  font-size: 18px;
}

.bottom-panel ul {
  display: grid;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.bottom-panel li {
  position: relative;
  padding-left: 18px;
  color: rgba(255, 255, 255, 0.66);
  font-size: 11px;
  line-height: 1.5;
}

.bottom-panel li::before {
  position: absolute;
  top: 0.55em;
  left: 0;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #a78bfa;
  content: '';
}

.bottom-panel__cta {
  padding: 22px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.055);
}

.bottom-panel__cta > span {
  display: block;
  font-size: 17px;
  font-weight: 850;
}

.bottom-panel__cta p {
  margin: 9px 0 18px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 11px;
  line-height: 1.5;
}

.cta-button {
  display: inline-flex;
  justify-content: center;
  min-width: 160px;
  padding: 12px 16px;
  border-radius: 12px;
  background: #ffffff;
  color: #20283a;
  font-size: 12px;
  font-weight: 850;
  text-decoration: none;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease;
}

.cta-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 9px 22px rgba(0, 0, 0, 0.22);
}

@media (max-width: 1020px) {
  .hero {
    grid-template-columns: 1fr;
  }

  .hero__contact-card {
    max-width: 420px;
  }

  .highlights {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .tariff-columns {
    grid-template-columns: 1fr;
  }

  .bottom-panel {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .tariff-shell {
    padding: 14px 12px 36px;
  }

  .hero {
    gap: 26px;
    padding: 30px 24px;
    border-radius: 22px;
  }

  .hero h1 {
    font-size: 37px;
  }

  .hero__lead {
    font-size: 15px;
  }

  .hero__meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
  }

  .hero__separator {
    display: none;
  }

  .highlights {
    grid-template-columns: 1fr;
  }

  .highlight {
    min-height: auto;
  }

  .section-block {
    margin-top: 42px;
  }

  .section-heading {
    align-items: flex-start;
    flex-direction: column;
    gap: 10px;
  }

  .section-heading p {
    max-width: none;
    text-align: left;
  }

  .rate-card__top {
    padding: 22px 20px 19px;
  }

  .rate-list {
    padding: 2px 20px;
  }

  .rate-row {
    grid-template-columns: minmax(0, 1fr) 130px;
    gap: 12px;
  }

  .delivery-table {
    grid-template-columns: minmax(0, 1fr) 86px 96px;
    gap: 8px;
  }

  .delivery-table--head,
  .delivery-table--row {
    padding-left: 14px;
    padding-right: 14px;
  }

  .delivery-price {
    padding: 5px 7px;
    font-size: 10px;
  }

  .services-grid {
    grid-template-columns: 1fr;
  }

  .service-card {
    min-height: 68px;
  }

  .bottom-panel {
    padding: 24px 20px;
  }
}

@media (max-width: 480px) {
  .hero h1 {
    font-size: 32px;
  }

  .hero__contact-card {
    padding: 17px;
  }

  .hero__phone {
    font-size: 18px;
  }

  .rate-card__mark {
    display: none;
  }

  .rate-row {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .rate-row__price {
    align-items: flex-start;
    text-align: left;
  }

  .delivery-table--head {
    display: none;
  }

  .delivery-table--row {
    grid-template-columns: 1fr 1fr;
    padding-top: 14px;
    padding-bottom: 14px;
  }

  .delivery-table__destination {
    grid-column: 1 / -1;
    margin-bottom: 2px;
  }

  .delivery-price {
    justify-self: stretch;
    text-align: center;
  }

  .service-card {
    align-items: flex-start;
    flex-direction: column;
    gap: 9px;
  }

  .service-card__price {
    text-align: left;
  }
}
</style>
