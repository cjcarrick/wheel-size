<script setup lang="ts">
import { nextTick, onMounted, ref, type UnwrapNestedRefs } from 'vue'
import { distToLine, mapRange } from '../lib'
import { examplesIndex } from '../lib/examples'
import {
  type LineDescriptor,
  type TireDescriptor,
  type WheelDescriptor
} from '../lib/types'

type DataSet = UnwrapNestedRefs<{
  wheel: WheelDescriptor
  tire: TireDescriptor
  color: string | (() => string)
  locked: boolean
}>

const props = defineProps<{
  sets: DataSet[]
  lines: LineDescriptor[]
  rideheight: number

  // Focusedd values
  width: number
  offset: number

  /** when scale = 1, 1mm = 1px */
  vehicle: string
}>()
const emit = defineEmits(['update:width', 'update:offset'])

const examples = await examplesIndex()

// TODO: Make sure these values are always updated
const wheelWidthMin = 6,
  wheelWidthMax = 13,
  offsetMin = -50,
  offsetMax = 50

const frozen = ref(true)
const hovered = ref<{ x: number; y: number } | undefined>(undefined)
const initialClick = ref<{ x: number; y: number } | undefined>(undefined)
const snapX = ref(false)
const snapY = ref(false)
const snapAngle = ref(false)

const getVehiclePoints = () => {
  const result: { x: number; y: number; opacity: number }[] = []

  for (let i = 0; i < Object.keys(examples[props.vehicle]).length; i++) {
    const width = parseFloat(Object.keys(examples[props.vehicle])[i])
    const offsets = examples[props.vehicle][width]

    for (let j = 0; j < Object.keys(offsets).length; j++) {
      const offset = parseFloat(Object.keys(offsets)[j])
      const count = offsets[offset]

      result.push({
        opacity: Math.min(100, 15 * count),
        x: xPos(width),
        y: yPos(offset)
      })
    }
  }

  return result
}

/** returns the y value on the graph that represents a certain offset value
 * eg: mm -> px */
function yPos(offset: number): number {
  return mapRange(
    offset,
    offsetMin,
    offsetMax,
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
    offsetMin,
    offsetMax
  )
}

onMounted(() => {
  nextTick(() => {
    console.log(svg.value)
    console.log(svg.value?.getBoundingClientRect().width)
    console.log(xVal(500), xPos(12))
  })
})

/** returns the width that a certain x value on the graph represents
 * eg: in -> px */
function xPos(width: number): number {
  console.log(svg.value?.getBoundingClientRect().width)
  return mapRange(
    width,
    wheelWidthMin,
    wheelWidthMax + 0.5,
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
    wheelWidthMin,
    wheelWidthMax + .5
  )
}

const svgHeight = ref(0)
const svgWidth = ref(0)
const svg = ref<null | HTMLElement>()

onMounted(() => {
  const el = svg.value
  if (!el) throw new Error('No svg element')

  svgWidth.value = el.parentElement?.clientWidth ?? 0
  svgHeight.value = el.parentElement?.clientHeight ?? 0
  const container = el.parentElement!

  const pad = parseInt(window.getComputedStyle(container).paddingTop, 10)
  // new ResizeObserver(([el]) => {
  //   svgWidth.value = el.contentRect.width ?? 0 - pad * 2
  //   svgHeight.value = el.contentRect.height ?? 0 - pad * 2
  // }).observe(container)
})

const onClick = (ev: MouseEvent) => {
  // Toggle freezing the crosshair on click
  frozen.value = !frozen.value

  const el = svg.value
  if (!el) throw new Error('No svg element')

  // For lazy updates, move the following few lines into the if statement
  const newWidth =
    Math.round(xVal(ev.x - el.getBoundingClientRect().left) * 2) / 2
  const newOffset = Math.round(yVal(ev.y - el.getBoundingClientRect().top))
  emit('update:width', newWidth)
  emit('update:offset', newOffset)

  if (frozen.value) {
    hovered.value = undefined
    initialClick.value = undefined
    snapY.value = false
    snapX.value = false
  }
}

const onMove = (ev: MouseEvent) => {
  if (frozen.value) return

  const el = svg.value
  if (!el) throw new Error('No svg element')

  const x = ev.x - el.getBoundingClientRect().left
  const y = ev.y - el.getBoundingClientRect().top

  if (initialClick.value && !ev.shiftKey) {
    initialClick.value = undefined
  }
  if (!initialClick.value && ev.shiftKey) {
    initialClick.value = { x, y }
  }

  if (!ev.shiftKey) {
    snapY.value = false
    snapX.value = false
    snapAngle.value = false
  }

  if (initialClick.value) {
    const initX = initialClick.value.x
    const initY = initialClick.value.y
    /** the slope of the diagonal line */
    const m = -yPos(offsetMax - 25.4 / 2) / xPos(wheelWidthMin + 1)

    if (
      ev.shiftKey &&
      !(snapX.value || snapY.value || snapAngle.value) &&
      initialClick.value
    ) {
      const dx = distToLine({ x, y }, { a: 0, b: 1, c: -initY })
      const dy = distToLine({ x, y }, { a: 1, b: 0, c: -initX })
      const da = distToLine({ x, y }, { a: -m, b: 1, c: initX * m - initY })

      const min = Math.min(dx, dy, da)

      if (Math.abs(min) > 10) {
        if (min == da) {
          snapAngle.value = true
        } else if (min == dx) {
          snapX.value = true
        } else if (min == dy) {
          snapY.value = true
        }
      }
    }

    if (snapX.value) {
      hovered.value = { x, y: initY }
    } else if (snapY.value) {
      hovered.value = { x: initX, y }
    } else if (snapAngle.value) {
      // Determine offset based on width in a way that maintains the same poke
      const offset = yVal(y)
      const width = xVal(x) * 25.4

      const pokePre = width / 2 - offset
      const offsetValue = -pokePre + width / 2
      console.log({ pokePre, offsetValue })

      hovered.value = { x: initX, y: yPos(offsetValue) }
    } else {
      hovered.value = { x, y }
    }
  } else {
    hovered.value = { x, y }
  }

  const newWidth = Math.round(xVal(hovered.value.x) * 2) / 2
  const newOffset = Math.round(yVal(hovered.value.y))
  for (let i = 0; i < props.sets.length; i++) {
    const set = props.sets[i]
    if (set.locked) continue

    if (newWidth !== set.wheel.width) {
      set.wheel.width = newWidth
    }
    if (newOffset !== set.wheel.width) {
      set.wheel.offset = newOffset
    }
  }
}
</script>

<template>
  <svg
    class="_graph"
    :height="svgHeight"
    :width="svgWidth"
    :viewBox="`0 0 ${svgWidth} ${svgHeight}`"
    ref="svg"
    :class="{ frozen, snap: snapX || snapY }"
    @click="onClick"
    @mousemove="onMove"
  >
    <!-- vertical grid lines -->
    <g>
      <template v-for="i in (wheelWidthMax - wheelWidthMin + 1) * 2">
        <line
          :x1="xPos((i - 1) * 0.5 + wheelWidthMin)"
          :x2="xPos((i - 1) * 0.5 + wheelWidthMin)"
          y1="0"
          :y2="svgHeight"
          stroke="var(--bg2)"
        />

        <text
          :x="xPos((i - 1) * 0.5 + wheelWidthMin)"
          :y="svgHeight"
          :fill="'#000000' + (80).toString(16)"
          font-size="10"
          font-style="italic"
        >
          {{ (wheelWidthMin + (i - 1) * 0.5).toFixed(1) }}
        </text>
      </template>
    </g>

    <!-- Points on the graph that represent vehicle examples -->
    <!-- The opacity of the point represents how many vehicles are at that point -->
    <g v-if="props.vehicle" fill="var(--fg0)">
      <circle
        v-for="p in getVehiclePoints()"
        r="3"
        :cx="p.x"
        :cy="p.y"
        :fill-opacity="`${p.opacity}%`"
      />
    </g>

    <!-- crosshair when hovered -->
    <g v-if="hovered" stroke-width="1">
      <g :stroke="snapX || snapY ? 'rgba(0,0,0,0.25)' : 'black'">
        <line
          :x1="0"
          :x2="xPos(Math.round((xVal(hovered.x) - 0.25) * 2) / 2) - 6"
          :y1="hovered.y"
          :y2="hovered.y"
        />
        <line
          :x1="xPos(Math.round((xVal(hovered.x) + 0.25) * 2) / 2) + 6"
          :x2="svgWidth"
          :y1="hovered.y"
          :y2="hovered.y"
        />
      </g>

      <g :stroke="snapX || snapY ? 'rgba(0,0,0,0.25)' : 'black'">
        <line
          :y1="0"
          :y2="yPos(Math.round(yVal(hovered.y))) - 6"
          :x1="hovered.x"
          :x2="hovered.x"
        />
        <line
          :y1="yPos(Math.round(yVal(hovered.y))) + 6"
          :y2="svgHeight"
          :x1="hovered.x"
          :x2="hovered.x"
        />
      </g>
    </g>

    <!-- Guide lines for when shift key is held -->
    <g v-if="initialClick" stroke-width="1">
      <line
        :stroke="snapY ? 'rgba(255,0,0,0.25)' : 'red'"
        x1="0"
        :x2="svgWidth"
        :y1="initialClick.y"
        :y2="initialClick.y"
      />

      <!-- This line is clculated using the point-slope formula, where the slope is -->
      <!-- 12.7mm/in -->
      <line
        :stroke="snapAngle ? 'rgba(0,255,0,0.25)' : 'green'"
        x1="0"
        :x2="svgWidth"
        :y1="
          -(yPos(offsetMax - 12.7) / xPos(wheelWidthMin + 1)) *
            (0 - initialClick.x) +
          initialClick.y
        "
        :y2="
          -(yPos(offsetMax - 12.7) / xPos(wheelWidthMin + 1)) *
            (svgWidth - initialClick.x) +
          initialClick.y
        "
      />

      <line
        :stroke="snapX ? 'rgba(255,0,0,0.25)' : 'red'"
        :x1="initialClick.x"
        :x2="initialClick.x"
        y1="0"
        :y2="svgHeight"
      />
    </g>

    <!-- Guide lines -->
    <g>
      <template v-for="l in lines">
        <line
          v-if="'offsetEquation' in l"
          :stroke="typeof l.color == 'string' ? l.color : l.color()"
          x1="0"
          :y1="yPos(l.offsetEquation(xVal(0), rideheight))"
          :x2="svgWidth"
          :y2="yPos(l.offsetEquation(xVal(svgWidth), rideheight))"
        />

        <g
          v-if="'offsetEquation' in l"
          :transform="`rotate(${
            (Math.atan2(
              yPos(l.offsetEquation(xVal(svgWidth), rideheight)) -
                yPos(l.offsetEquation(xVal(0), rideheight)),
              svgWidth
            ) *
              360) /
            2 /
            Math.PI
          } ${xPos(wheelWidthMin + 0.5)} ${yPos(
            l.offsetEquation(xVal(0), rideheight)
          )})`"
        >
          <text
            :x="xPos(wheelWidthMin + 0.5)"
            :y="yPos(l.offsetEquation(wheelWidthMin + 0.5, rideheight)) - 4"
            stroke="white"
            stroke-width="3px"
            font-size="12"
          >
            {{ typeof l.label == 'string' ? l.label : l.label() }}
          </text>

          <text
            :x="xPos(wheelWidthMin + 0.5)"
            :y="yPos(l.offsetEquation(wheelWidthMin + 0.5, rideheight)) - 4"
            :fill="typeof l.color == 'string' ? l.color : l.color()"
            font-size="12"
          >
            {{ typeof l.label == 'string' ? l.label : l.label() }}
          </text>
        </g>
      </template>
    </g>

    <!-- circles for the data sets -->
    <g v-for="s in sets">
      <circle
        :cx="xPos(s.wheel.width)"
        :cy="yPos(s.wheel.offset)"
        stroke-width="2"
        :stroke="typeof s.color == 'string' ? s.color : s.color()"
        fill="none"
        r="6"
      />
      <text
        :x="
          s.wheel.width > wheelWidthMin + (wheelWidthMax - wheelWidthMin) / 2
            ? xPos(s.wheel.width) - 6 - 6
            : xPos(s.wheel.width) + 6 + 6
        "
        :text-anchor="
          s.wheel.width > wheelWidthMin + (wheelWidthMax - wheelWidthMin) / 2
            ? 'end'
            : 'start'
        "
        :y="yPos(s.wheel.offset) + 6"
        font-size="14"
        stroke-width="4"
        stroke="var(--bg0)"
      >
        {{ s.wheel.diameter }}x{{ s.wheel.width }}
        {{ s.wheel.offset < 0 ? '' : '+' }}{{ s.wheel.offset }}
      </text>
      <text
        :x="
          s.wheel.width > wheelWidthMin + (wheelWidthMax - wheelWidthMin) / 2
            ? xPos(s.wheel.width) - 6 - 6
            : xPos(s.wheel.width) + 6 + 6
        "
        :text-anchor="
          s.wheel.width > wheelWidthMin + (wheelWidthMax - wheelWidthMin) / 2
            ? 'end'
            : 'start'
        "
        :y="yPos(s.wheel.offset) + 6"
        :font-size="14"
        :fill="typeof s.color == 'string' ? s.color : s.color()"
      >
        {{ s.wheel.diameter }}x{{ s.wheel.width }}
        {{ s.wheel.offset < 0 ? '' : '+' }}{{ s.wheel.offset }}
      </text>
    </g>
  </svg>
</template>

<style lang="scss">
._graph:not(.frozen):not(.snap) {
  cursor: none;
}
</style>
