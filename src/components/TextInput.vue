<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  placeholder?: string
  modelValue: string
  disabled?: boolean
}>()

defineEmits(['update:modelValue'])

const inputEl = ref<null | HTMLInputElement>()
</script>

<template>
  <div class="_text-input" :class="{ disabled }" @click="inputEl?.focus()">
    <slot />

    <input
      type="text"
      :value="modelValue"
      ref="inputEl"
      :disabled="disabled"
      @input="$emit('update:modelValue', inputEl!.value)"
    />

    <span class="placeholder" v-if="placeholder && !modelValue">
      {{ placeholder }}
    </span>
  </div>
</template>

<style lang="scss">
._text-input {
  display: flex;
  flex-direction: row;
  align-items: center;
  position: relative;
  height: 1.25em;
  gap: 0.25em;
  padding: 0.25em;
  border: 1px solid $bg2;
  border-radius: $br;

  svg {
    width: 0.75em;
    color: $fg0;
    opacity: 0.6;
  }

  input {
    background: transparent;
    color: inherit;
    font-size: 0.8em;
    padding: 0;
    border: none;
    background: transparent;
    flex: 1;
    display: block;

    &:focus {
      outline: none;
    }
  }

  position: relative;

  .placeholder {
    z-index: -1;
    position: absolute;
    left: calc(1pt + 1.5em);
    font-size: 0.8em;
    color: rgba($color: $fg0, $alpha: 50%);
    opacity: 1;
  }

  cursor: text;
  &.disabled {
    cursor: default;
    .placeholder,
    input {
      opacity: 0.5;
    }
  }
}
</style>
