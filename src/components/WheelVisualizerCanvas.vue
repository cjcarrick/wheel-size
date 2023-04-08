<script setup lang="ts">
import { onMounted, ref, UnwrapNestedRefs, watch } from 'vue'
import ctxCmpFactory from '../lib/canvas'
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

const canvasEl = ref<null | HTMLCanvasElement>(null)
const scale = 0.4

function update(canvas: HTMLCanvasElement) {
  const ctxCmp = ctxCmpFactory(canvas)
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D

  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // 1mm = 1px on the canvas
  const mm = (inches: number) => inches * 25.4

  // draw guide lines
  drawGuideLines()

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
    ctx.beginPath()
    ctx.strokeStyle = set.color
    ctx.fillStyle = set.color

    let x = canvas.width / 2 - (wheelWidth / 2 + offset) * scale,
      y = (canvas.height - diameter * scale) / 2,
      w = wheelWidth * scale,
      h = diameter * scale

    if (props.position == 'top-left') {
      x = canvas.width / 2
      y = canvas.height / 2
    }

    // calculate where the cursor will need to move to draw the tire stretch
    // appropriately
    let c = (aspect / 100) * tireWidth
    let a = (wheelWidth - tireWidth) / 2
    let b = (c ** 2 - a ** 2) ** 0.5

    c *= scale
    a *= scale
    b *= scale

    ctx.beginPath()

    // Stroke top half of tire
    ctx.moveTo(x, y)
    ctx.lineTo(x + a, y - b)
    ctx.lineTo(x + (w - a), y - b)
    ctx.lineTo(x + w, y)

    // Stroke bottom half of the tire
    ctx.moveTo(x, y + diameter * scale)
    ctx.lineTo(x + a, y + diameter * scale + b)
    ctx.lineTo(x + wheelWidth * scale - a, y + diameter * scale + b)
    ctx.lineTo(x + wheelWidth * scale, y + diameter * scale)

    // Draw the wheel and the tire at a lower opacity so that if there are
    // overlapping tires, you can still see it.
    if (props.depth) {
      ctx.globalAlpha = 0.2
      ctx.fill()
      ctxCmp
        .circle({
          radius: h / 2,
          y: y + h / 2,

          radiusX: (props.depth * h) / 2,
          x: x,

          color: set.color
        })
        .circle({
          y: y + h / 2,
          radius: h / 2,

          radiusX: (props.depth * h) / 2,
          x: x + w + (props.depth * h) / 2,

          color: set.color
        })

      ctx.globalAlpha = 1
      ctxCmp
        .circle({
          radius: h / 2,
          y: y + h / 2,

          radiusX: (props.depth * h) / 2,
          x: x,

          color: set.color,
          stroke: 1
        })
        .circle({
          radius: h / 2,
          y: y + h / 2,

          radiusX: (props.depth * h) / 2,
          x: x + w + (props.depth * h) / 2,

          color: set.color
        })

      ctx.closePath()
    } else {
      // Draw the wheel and the tire at a lower opacity so that if there are
      // overlapping tires, you can still see it.
      ctx.globalAlpha = 0.2
      ctx.fill()
      ctx.fillRect(x, y, w, h)
      ctx.globalAlpha = 1
      ctx.stroke()
      ctx.strokeRect(x, y, w, h)
      ctx.closePath()
    }
  }

  function drawGuideLines() {
    const lines = props.lines ?? []

    const pad = 3
    const textSize = 10

    const XPosition = (
      line: LineDescriptor,
      wheel: { width: number; offset: number }
    ) => {
      let x = 0
      if ('x' in line) {
        x =
          typeof line.x == 'function'
            ? line.x(wheel.width, wheel.offset)
            : line.x

        x = canvas.width / 2 - x * scale
      } else {
        x =
          canvas.width / 2 -
          (mm(wheel.width) * 0.5 +
            line.offsetEquation(wheel.width, props.rideheight ?? 0)) *
            scale
      }
      return x
    }

    // Draw vertical guide lines
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]

      for (let j = 0; j < props.sets.length; j++) {
        ctxCmp.verticalLine({
          x: XPosition(line, props.sets[j].wheel),
          color: line.color,
          from: 0,
          to: canvas.height
        })
      }
    }

    // Draw labels after drawing lines, so that labels are on top of the lines
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const text = typeof line.label == 'function' ? line.label() : line.label

      // Draw lines
      for (let j = 0; j < props.sets.length; j++) {
        const { wheel } = props.sets[j]
        const x = XPosition(line, wheel)
        const y = canvas.height - pad - i * (pad * 3 + textSize)

        ctxCmp.text({
          color: 'white',
          x,
          y,
          text,
          background: line.color,
          backgroundPad: 3
        })
      }
    }
  }
}

onMounted(() => {
  const canvas = canvasEl.value!
  // const ctx = canvasEl.value?.getContext('2d') as CanvasRenderingContext2D

  canvas.height = props.height ?? 384
  canvas.width = props.width ?? 256
  update(canvas)
  if (props.watch !== false) {
    watch(props.sets, () => update(canvas))
    watch(props.lines ?? [], () => update(canvas))
  }
})
</script>

<template>
  <canvas ref="canvasEl"></canvas>
</template>
