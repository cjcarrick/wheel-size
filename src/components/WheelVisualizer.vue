<script setup lang="ts">
import { ref, UnwrapNestedRefs, watch } from 'vue'
import { LineDescriptor, TireDescriptor, WheelDescriptor } from '../lib/types'

type DataSet = UnwrapNestedRefs<{
  wheel: WheelDescriptor
  tire: TireDescriptor
  color: string
}>

const props = defineProps<{
  sets: DataSet[]
  lines?: LineDescriptor[]
  rideheight?: number
  /** when scale = 1, 1mm = 1px */
  scale?: number
  width?: number
  /** makes the wheel look 3d */
  depth?: number
  height?: number
  position?: 'center' | 'top-left'

  /** whether to update the visualizer on props changes. If the props won't
   * change or if they aren't refs, make sure to set this to false
   * @default true */
  watch?: boolean
}>()

const width = props.width ?? 256
const height = props.height ?? 384

const scale = 0.4

const wheelData = ref<
  {
    /** general descriptors for the shape and position of the wheel */
    x: number
    y: number
    w: number
    h: number

    /** How far the outermost x coordinate is from the x coordinate specified above */
    tireOffsetX: number
    /** How far the outermost y coordinate is from the y coordinate specified above */
    tireOffsetY: number

    color: string
  }[]
>([])

const linesData = ref<{ color: string; x: number; label: string }[]>([])

// 1mm = 1px on the canvas
const mm = (inches: number) => inches * 25.4

// draw guide lines

createSvgData()
watch(props.sets, createSvgData)

createLinesData()
watch(() => props.lines, createLinesData)

function createSvgData() {
  wheelData.value = []

  for (let i = 0; i < props.sets.length; i++) {
    const set = props.sets[i]
    let offset = set.wheel.offset
    let diameter = mm(set.wheel.diameter)
    let wheelWidth = mm(set.wheel.width)

    // Draw each wheel/tire set

    let tireWidth = set.tire.width
    let aspect = set.tire.aspect

    // Draw the wheel, centered on the canvas, and shifted over to the left or
    // right based on the width and offset

    let x = width / 2 - (wheelWidth / 2 + offset) * scale,
      y = (height - diameter * scale) / 2,
      w = wheelWidth * scale,
      h = diameter * scale

    if (props.position == 'top-left') {
      x = width / 2
      y = height / 2
    }

    // calculate where the cursor will need to move to draw the tire stretch
    // appropriately
    let c = (aspect / 100) * tireWidth
    let a = (wheelWidth - tireWidth) / 2
    let b = (c ** 2 - a ** 2) ** 0.5

    c *= scale
    a *= scale
    b *= scale

    wheelData.value.push({
      x,
      y,
      w,
      h,
      color: set.color,
      tireOffsetX: a,
      tireOffsetY: b
    })
  }
}

function createLinesData() {
  const lines = props.lines ?? []

  const XPosition = (
    line: LineDescriptor,
    wheel: { width: number; offset: number }
  ) => {
    let x = 0
    if ('x' in line) {
      x =
        typeof line.x == 'function' ? line.x(wheel.width, wheel.offset) : line.x

      x = width / 2 - x * scale
    } else {
      x =
        width / 2 -
        (mm(wheel.width) * 0.5 +
          line.offsetEquation(wheel.width, props.rideheight ?? 0)) *
          scale
    }
    return x
  }

  linesData.value = []
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    const color = typeof line.color == 'string' ? line.color : line.color()
    const label = typeof line.label == 'string' ? line.label : line.label()

    for (let j = 0; j < props.sets.length; j++) {
      linesData.value.push({
        x: XPosition(line, props.sets[j].wheel),
        color,
        label
      })
    }
  }
}

const fontSize = 0.8
const pad = 3
</script>

<template>
  <svg :width="width" :height="height" :viewBox="`0 0 ${width} ${height}`">
    <!-- Wheel visualizations for each set -->
    <g
      v-for="s in wheelData"
      stroke-width="2px"
      :stroke="s.color"
      :fill="s.color + (50).toString(16)"
    >
      <!-- Wheel -->
      <rect :x="s.x" :y="s.y" :width="s.w" :height="s.h" />

      <!-- Top half of tire -->
      <path
        :d="`
        M ${s.x},                           ${s.y}
        L ${s.x + s.tireOffsetX},           ${s.y - s.tireOffsetY} 
          ${s.x + s.w - s.tireOffsetX},     ${s.y - s.tireOffsetY}
          ${s.x + s.w},                     ${s.y}
      `"
      />

      <!-- Bottom half of tire -->
      <path
        :d="`
        M ${s.x},                           ${s.y + s.h}
        L ${s.x + s.tireOffsetX},           ${s.y + s.h + s.tireOffsetY} 
          ${s.x + s.w - s.tireOffsetX},     ${s.y + s.h + s.tireOffsetY}
          ${s.x + s.w},                     ${s.y + s.h}
      `"
      />
    </g>

    <!-- Guide lines -->
    <g v-for="l in linesData">
      <line
        :x1="l.x"
        :x2="l.x"
        y1="0"
        :y2="height"
        stroke-width="2px"
        :stroke="l.color"
      />
    </g>
  </svg>
</template>

