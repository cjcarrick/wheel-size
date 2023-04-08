<script setup lang="ts">
const props = defineProps<{
  disabled?: boolean
  /** when this is set, the button acts like a checkbox */
  checked?: boolean
  /** when this is set, the button acts like a normal button */
  onclick?: () => void
}>()
const emit = defineEmits(['update:checked'])

const handleClick = () => {
  if (props.disabled) return
  if (props.onclick) {
    props.onclick()
  } else if ('checked' in props) {
    emit('update:checked', !props.checked)
  }
}
</script>

<template>
  <div class="_button" :class="{ checked, disabled }" @click="handleClick">
    <slot />
  </div>
</template>

<style lang="scss">
._button {
  background: $bg0;
  border-radius: $br;
  border: 1px solid $bg2;
  cursor: pointer;
  width: 100%;
  padding: 0.375em 0;
  box-sizing: border-box;
  text-align: center;
  font-size: 0.8em;
  user-select: none;

  &.checked,
  &:hover:not(.disabled) {
    background: $bg1;
  }

  &.disabled {
    cursor: default;
    opacity: 0.6;
  }
}
</style>
