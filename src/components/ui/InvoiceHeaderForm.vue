<template>
  <div class="flex items-start gap-24 w-full">
    <div class="input-group shrink-0" style="width: 280px">
      <label class="input-label text-muted font-bold mb-10 block uppercase tracking-wide">{{ modelType === 'FBO' ? 'Дата прихода' : 'Дата отгрузки' }}</label>
      <input :value="modelValue.eventDate" @input="update('eventDate', ($event.target as HTMLInputElement).value)" type="date" class="input w-full" />
    </div>

    <div v-if="modelType !== 'FBO'" class="input-group shrink-0" style="width: 380px">
      <label class="input-label text-muted font-bold mb-10 block uppercase tracking-wide">Направление</label>
      <input :value="modelValue.direction" @input="update('direction', ($event.target as HTMLInputElement).value)" type="text" placeholder="Коледино, Озон..." class="input w-full" />
    </div>

    <div class="input-group flex-1 textarea-wrapper">
      <label class="input-label text-muted font-bold mb-10 block uppercase tracking-wide">Техническое задание</label>
      <div class="relative w-full h-44">
        <textarea :value="modelValue.comment" @input="update('comment', ($event.target as HTMLTextAreaElement).value)" placeholder="Доп. инфо..." class="input absolute inset-0 w-full expanding-textarea" rows="1" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
export interface InvoiceFormHeader { eventDate: string; direction: string; comment: string }
const props = defineProps<{ modelValue: InvoiceFormHeader; modelType: 'FBO' | 'ORD' | 'DEF' }>()
const emit = defineEmits<{ (e: 'update:modelValue', value: InvoiceFormHeader): void }>()
const update = (k: keyof InvoiceFormHeader, v: string) => emit('update:modelValue', { ...props.modelValue, [k]: v })
</script>

<style scoped>
.textarea-wrapper { position: relative; z-index: 20; }
.textarea-wrapper:hover, .textarea-wrapper:focus-within { z-index: 50; }
.expanding-textarea { height: 44px; line-height: 1.4; padding: 10px 15px; resize: none; transition: all 0.2s; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; background: var(--color-surface); }
.textarea-wrapper:hover .expanding-textarea:not(:placeholder-shown), .expanding-textarea:focus { height: 120px; overflow-y: auto; white-space: normal; box-shadow: var(--shadow-lg); }
.expanding-textarea::-webkit-scrollbar { width: 6px; }
.expanding-textarea::-webkit-scrollbar-thumb { background: var(--color-border-dark); border-radius: 3px; }
</style>
