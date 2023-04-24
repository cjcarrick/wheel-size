<script setup lang="ts">
import { ref, UnwrapNestedRefs, watch } from 'vue'
import { mapRange, speedoError } from '../lib/'
import { TireDescriptor, WheelDescriptor } from '../lib/types'

type DataSet = UnwrapNestedRefs<{
  wheel: WheelDescriptor
  tire: TireDescriptor
  color: () => string
}>

const props = defineProps<{
  sets: DataSet[]
  width?: number
  height?: number
}>()

const scale = 2

const width = props.width ?? 256
const height = props.height ?? 256

const speedMin = 0

const max = 120
// The last point won't actually be visible
const points = 4

const error = ref(1)
const setError = () => (error.value = speedoError(props.sets[0], props.sets[1]))
setError()
watch(props.sets, setError)

/** returns the y value on the graph that represents a certain offset value
 * eg: mm -> px */
function yPos(offset: number): number {
  return mapRange(
    offset,
    speedMin,
    max,
    svg.value?.getBoundingClientRect()?.height ?? 0,
    0
  )
}

/** returns the offset that a specific y value on the graph corresponds to
 * eg: px -> mm */
function yVal(y: number): number {
  return mapRange(
    y,
    svg.value?.getBoundingClientRect().height ?? 0,
    0,
    speedMin,
    max
  )
}

/** returns the width that a certain x value on the graph represents
 * eg: in -> px */
function xPos(width: number): number {
  return mapRange(
    width,
    speedMin,
    max + 0.5,
    0,
    svg.value?.getBoundingClientRect().width ?? 0
  )
}

/** returns the x position on the graph that represents a certain wheel width:
 * eg: px -> in */
function xVal(x: number): number {
  return mapRange(
    x,
    0,
    svg.value?.getBoundingClientRect().width ?? 0,
    speedMin,
    max + 0.5
  )
}

const svg = ref<null | HTMLElement>()
</script>

<template>
  <svg
    ref="svg"
    :width="width"
    :height="height"
    :viewBox="`0 0 ${max * scale} ${max * scale}`"
  >
    <line
      x1="0"
      :y1="max * scale"
      :x2="max * scale"
      :y2="max * scale * error"
      :stroke="props.sets[0].color()"
      stroke-width="1px"
    />

    <line
      x1="0"
      :y1="max * scale"
      :x2="max * scale"
      y2="0"
      :stroke="props.sets[1].color()"
      stroke-width="1px"
    />

    <template v-for="i in points">
      <circle
        :cx="(max * scale * i) / points"
        :cy="max * scale * (1 - i / points)"
        :fill="props.sets[1].color()"
        r="2"
      />

      <text
        :x="(max * scale * i) / points + 6"
        :y="max * scale * (1 - i / points) + 3"
        font-size="12"
        stroke-width="3"
        stroke="var(--bg0)"
      >
        {{ (i / points) * max }} MPH
      </text>

      <text
        :x="(max * scale * i) / points + 6"
        :y="max * scale * (1 - i / points) + 3"
        font-size="12"
      >
        {{ (i / points) * max }} MPH
      </text>

      <circle
        :cx="max * scale * (i / points)"
        :cy="max * scale - max * scale * (i / points) * (1 - error)"
        :fill="props.sets[0].color()"
        r="2"
      />

      <text
        :x="max * scale * (i / points) + 6"
        :y="max * scale - max * scale * (i / points) * (1 - error) + 3"
        font-size="12"
        stroke-width="3"
        stroke="var(--bg0)"
      >
        {{ (i / points) * max }} MPH
      </text>

      <text
        :x="max * scale * (i / points) + 6"
        :y="max * scale - max * scale * (i / points) * (1 - error) + 3"
        font-size="12"
      >
        {{ (max * (i / points) * (1 - error)).toFixed(1) }} MPH
      </text>
    </template>
  </svg>
</template>
