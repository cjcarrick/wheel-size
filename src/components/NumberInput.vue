<script setup lang="ts">
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/vue/24/solid'
import { ref } from 'vue'

const props = defineProps<{
  modelValue: number
  min: number
  max: number
  step: number
  defaultValue: number
  width?: number
  disabled?: boolean
  /** number of decimal places to show */
  precision?: number
}>()

const input = ref<null | HTMLInputElement>()
const emit = defineEmits(['update:modelValue'])

const decr = (step = props.step) => {
  let newValue = Math.max(props.min, props.modelValue - step)
  newValue = Math.round(newValue / step) * step
  emit('update:modelValue', newValue)
}
const incr = (step = props.step) => {
  let newValue = Math.min(props.max, props.modelValue + step)
  newValue = Math.round(newValue / step) * step
  emit('update:modelValue', newValue)
}

let savedValue: number | undefined = undefined
const cancelTyping = () => {
  if (typeof savedValue == 'number') {
    emit('update:modelValue', savedValue)
    savedValue = undefined
  }
  input.value?.blur()
}

const confirmTyping = () => {
  let newValue = parseFloat(input.value?.value || '_')
  if (isNaN(newValue)) newValue = savedValue ?? 0
  emit('update:modelValue', newValue)
  input.value?.blur()
}

const typing = ref(false)
const dragging = ref<undefined | 'left' | 'right'>(undefined)
let lastX = 0
let trigger = 2
let pxPerStep = 12
function handleMouseDown(ev: MouseEvent) {
  if (!input.value) return

  if (typing.value) return

  ev.preventDefault()
  lastX = ev.x

  function handleMouseMove(ev2: MouseEvent) {
    ev2.preventDefault()

    let dx = ev2.x - lastX

    if (dragging.value || Math.abs(dx) > trigger) {
      if (dx > 0) {
        dragging.value = 'right'
      } else {
        dragging.value = 'left'
      }

      let numberOfSteps = dx / pxPerStep
      if (!ev2.shiftKey) {
        numberOfSteps = Math.round(numberOfSteps)
      }

      if (Math.abs(numberOfSteps) >= 1) {
        lastX = ev2.x
      }

      const newValue = props.modelValue + props.step * numberOfSteps
      emit(
        'update:modelValue',
        Math.max(props.min, Math.min(props.max, newValue))
      )

      // document.body.removeEventListener('mouseup', handleMouseUp)
      // ev2.target?.removeEventListener('mousemove', handleMouseMove)
    }
  }

  function handleMouseUp(ev2: MouseEvent) {
    document.body.removeEventListener('mousemove', handleMouseMove)

    if (dragging.value) {
      dragging.value = undefined
      return
    }

    ev2.preventDefault()
    savedValue = props.modelValue
    typing.value = true
    input.value?.select()
    ev.target?.addEventListener(
      'blur',
      () => {
        typing.value = false
      },
      { once: true }
    )
  }
  document.body.addEventListener('mousemove', handleMouseMove)
  document.body.addEventListener('mouseup', handleMouseUp, { once: true })
}
</script>
<template>
  <div class="_number-input" :class="{ typing, dragging, disabled }">
    <div
      class="decr button"
      @click.stop="decr()"
      :class="{ disabled: modelValue <= min }"
    >
      <ChevronLeftIcon />
    </div>

    <input
      type="number"
      ref="input"
      :value="
        precision
          ? modelValue.toFixed(precision)
          : Math.round(modelValue).toString()
      "
      :disabled="disabled"
      @mousedown="handleMouseDown"
      @keydown.prevent.up="typing && incr()"
      @keydown.prevent.up.shift="typing && incr(0.01)"
      @keydown.prevent.down="typing && decr()"
      @keydown.prevent.down.shift="typing && decr(0.01)"
      @keydown.enter="confirmTyping"
      @keydown.prevent.esc="cancelTyping"
    />

    <div
      class="incr button"
      @click.stop="incr()"
      :class="{ disabled: modelValue >= max }"
    >
      <ChevronRightIcon />
    </div>
  </div>
</template>

<style lang="scss">
._number-input {
  input[type='number'] {
    -moz-appearance: textfield;
    &::-webkit-outer-spin-button {
      margin: 0;
      -webkit-appearance: none;
    }
  }

  .number {
    display: flex;
    flex-direction: row;
    align-items: center;
    border-radius: $br;
  }

  &.disabled {
    opacity: 0.4;
    .input {
      background: $bg0 !important;
    }
    .button {
      opacity: 0 !important;
      pointer-events: none;
      cursor: default;
    }
    input {
      cursor: default;
      pointer-events: none;
    }
  }

  border-radius: $br;
  width: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: row;
  align-items: center;
  overflow: hidden;
  border: 1px solid $bg2;

  .button {
    width: 0.75em;
    &.incr {
      margin-left: -0.75em;
    }
    &.decr {
      margin-right: -0.75em;
    }

    height: 1.5em;
    opacity: 0;
    line-height: 0;
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  &:not(.disabled) {
    input {
      cursor: ew-resize;
    }
    &:hover {
      background: $bg1;

      .button {
        opacity: 0.6;
        &:hover {
          opacity: 0.9;
          background: $bg2;
        }
        &:focus {
          opacity: 1;
        }
      }
    }
  }

  input {
    border: none;
    text-align: center;
    padding: 0;
    background: transparent;
    flex: 1;
    padding: 0 0.75em;
    font-weight: inherit;
    font-size: 0.8rem;
    font-family: inherit;
    color: $fg0;
    &:focus {
      outline: none;
    }
  }

  &.typing {
    background: $bg1 !important;
    cursor: text;

    .button {
      opacity: 0 !important;
      pointer-events: none;
    }
    input {
      text-align: left;
      cursor: text;
      background: transparent;
    }
  }
  &.dragging {
    background: $bg1;
    .button {
      opacity: 0 !important;
      cursor: ew-resize;
    }
  }
}
</style>
