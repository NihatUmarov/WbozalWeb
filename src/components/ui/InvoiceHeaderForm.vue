<template>
  <div class="flex items-start gap-16 w-full">
    <div class="input-group flex-shrink-0" style="width: 200px">
      <label class="input-label text-muted font-medium text-xs mb-6 block">
        {{ modelType === 'FBO' ? 'Планируемая дата прихода' : 'Планируемая дата отгрузки' }}
      </label>
      <input
        :value="modelValue.eventDate"
        @input="update('eventDate', ($event.target as HTMLInputElement).value)"
        type="date"
        class="input w-full"
      />
    </div>

    <div v-if="modelType !== 'FBO'" class="input-group flex-shrink-0" style="width: 260px">
      <label class="input-label text-muted font-medium text-xs mb-6 block">
        Направление (Куда / Откуда)
      </label>
      <input
        :value="modelValue.direction"
        @input="update('direction', ($event.target as HTMLInputElement).value)"
        type="text"
        placeholder="Коледино, Озон, г. Москва..."
        class="input w-full"
      />
    </div>

    <div class="input-group flex-1 textarea-container-wrapper">
      <label class="input-label text-muted font-medium text-xs mb-6 block">
        Техническое задание
      </label>
      <div class="textarea-relative-box" style="height: 38px">
        <textarea
          :value="modelValue.comment"
          @input="update('comment', ($event.target as HTMLTextAreaElement).value)"
          placeholder="Дополнительная информация для склада..."
          class="input absolute top-0 left-0 w-full expanding-textarea"
          rows="1"
        ></textarea>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
export interface InvoiceFormHeader {
  eventDate: string
  direction: string
  comment: string
}

const props = defineProps<{
  modelValue: InvoiceFormHeader
  modelType: 'FBO' | 'ORD' | 'DEF'
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: InvoiceFormHeader): void
}>()

const update = (key: keyof InvoiceFormHeader, value: string) => {
  emit('update:modelValue', { ...props.modelValue, [key]: value })
}
</script>

<style>
/* Глобально или в общем файле стилей, но для чистоты оставим тут пока,
   но без scoped, чтобы работало везде, где используется этот компонент */
.textarea-container-wrapper {
  position: relative;
  z-index: 20;
}
.textarea-container-wrapper:hover,
.textarea-container-wrapper:focus-within {
  z-index: 50;
}
.textarea-relative-box {
  position: relative;
  width: 100%;
}
.expanding-textarea {
  height: 38px;
  line-height: 1.4;
  padding-top: 8px;
  padding-bottom: 8px;
  resize: none;
  transition: height 0.2s ease-in-out, box-shadow 0.2s ease;
  z-index: 10;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  background-color: #fff;
}
.textarea-container-wrapper:hover .expanding-textarea:not(:placeholder-shown),
.expanding-textarea:focus {
  height: 130px;
  overflow-y: auto;
  white-space: normal;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15), 0 3px 10px rgba(0, 0, 0, 0.1);
}
.expanding-textarea::-webkit-scrollbar {
  width: 6px;
}
.expanding-textarea::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}
</style>
