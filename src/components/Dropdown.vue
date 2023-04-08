<script setup lang="ts">
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/vue/24/solid'
import { ref } from 'vue'

const props = defineProps<{
  choices: string[]
  modelValue: string
}>()
const emit = defineEmits(['update:modelValue'])

const open = ref(false)

const handleClick = (choice: string | undefined) => {
  if (open.value) emit('update:modelValue', choice)
  open.value = !open.value
}

const dropdownEl = ref<null | HTMLDivElement>()
window.addEventListener('click', e => {
  if (!dropdownEl.value?.contains(e.target as Node) && open.value) {
    open.value = false
  }
})
</script>

<template>
  <div class="_dropdown" :class="{ open }" ref="dropdownEl">
    <div class="choices">
      <label class="choice" :class="{ selected: modelValue == '' }">
        <input type="radio" @click.stop="handleClick('')" />
        None
      </label>

      <template v-for="choice in choices">
        <label class="choice" :class="{ selected: modelValue == choice }">
          <input type="radio" @click.stop="handleClick(choice)" />
          {{ choice }}
        </label>
      </template>
    </div>

    <div class="arrow">
      <ChevronUpIcon v-if="open" />
      <ChevronDownIcon v-else />
    </div>
  </div>
</template>

<style lang="scss">
._dropdown {
  display: flex;
  flex-direction: row;
  align-items: center;
  position: relative;
  width: 100%;
  font-size: 0.8rem;
  height: 1.5em;
  box-sizing: border-box;

  .arrow {
    padding: 0.25em 0.5em;
    position: absolute;
    height: 1.5em;
    inset: 0;
    pointer-events: none;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    svg {
      height: 0.8rem;
    }
  }

  .choices {
    background: $bg0;
    border: 1px solid $bg2;
    border-radius: $br;
    box-sizing: border-box;

    max-height: 10rem;
    overflow: auto;
    width: 100%;

    position: absolute;
    top: 0;
    left: 0;
  }

  .choice {
    box-sizing: border-box;
    user-select: none;
    font-size: 0.8rem;
    cursor: pointer;
    padding: 0.25em 0.5em;
    padding-right: 2.25em;
    display: block;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;

    &:hover,
    &.selected {
      background: #f8f8f8ff;
    }

    input {
      display: none;
    }

    &:not(.selected) {
      display: none;
    }
  }

  &.open .choice {
    display: block;
  }
  &:not(.open) .choice {
    background: transparent !important;
  }
}
</style>
