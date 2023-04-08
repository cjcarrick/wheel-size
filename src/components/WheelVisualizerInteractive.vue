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

/** The radius of an imaginary square around each clickable area */
const buttonPad = 8

type Hover = {
  /** the orientation of the line that the user is hovering over, or `point` if
   * they're hovering over a point */
  orientation: 'point' | 'vertical' | 'horizontal'
  side: number
  object: 'wheel' | 'tire'
  set: number
}
function overInteractiveArea(
  canvas: HTMLCanvasElement,
  sets: DataSet[],
  hover: {
    x: number
    y: number
  }
): Hover | undefined {
  if (mouseDown.value) return hov.value

  for (let i = 0; i < sets.length; i++) {
    const set = sets[i]

    const { x, y, w, h, a, b, c } = getCtxPoints(canvas, set)
    let check: number

    type CornersDescriptor = readonly [number, number][]

    function checkCorners(n: CornersDescriptor) {
      let i = 0
      for (let [x, y] of n) {
        if (
          hover.x < x + buttonPad &&
          hover.x > x - buttonPad &&
          hover.y < y + buttonPad &&
          hover.y > y - buttonPad
        ) {
          return i
        }
        i++
      }
      return -1
    }

    type HorizontalLineDescriptor = readonly [[number, number], number][]
    /**
     * checks if the cursor is over the line at `y`, and between the x values
     * specified by `lowerBound` and `upperBound`
     *
     * @param n
     * [
     *   [lowerBound, upperBound],
     *   y
     * ]
     */
    function checkHorizontalLine(n: HorizontalLineDescriptor) {
      let i = 0
      for (let [[lowerBound, upperBound], y] of n) {
        if (
          hover.x < upperBound + buttonPad &&
          hover.x > lowerBound - buttonPad &&
          hover.y < y + buttonPad &&
          hover.y > y - buttonPad
        ) {
          return i
        }
        i++
      }
      return -1
    }

    type VerticalLineDescriptor = readonly [number, [number, number]][]
    /**
     * checks if the cursor is over the line at `x`, and between the y values
     * specified by `lowerBound` and `upperBound`
     *
     * @param n
     * [
     *   x,
     *   [lowerBound, upperBound]
     * ]
     */
    function checkVerticalLine(n: VerticalLineDescriptor) {
      let i = 0
      for (let [x, [lowerBound, upperBound]] of n) {
        if (
          hover.y < upperBound + buttonPad &&
          hover.y > lowerBound - buttonPad &&
          hover.x < x + buttonPad &&
          hover.x > x - buttonPad
        ) {
          return i
        }
        i++
      }
      return -1
    }

    // Check if hovered over the wheel corners
    check = checkCorners([
      [x, y],
      [x + w, y],
      [x, y + h],
      [x + w, y + h]
    ])
    if (check + 1) {
      return { set: i, side: check, object: 'wheel', orientation: 'point' }
    }

    // Then tire corners
    check = checkCorners([
      [x + a, y - b],
      [x + w - a, y - b]
    ])
    if (check + 1) {
      return { set: i, side: check, object: 'tire', orientation: 'point' }
    }

    // Then vertical wheel edges
    check = checkVerticalLine([
      [x, [y, y + h]],
      [x + w, [y, y + h]]
    ])
    if (check + 1) {
      return { set: i, side: check, object: 'wheel', orientation: 'vertical' }
    }

    // Then horizontal wheel edges
    check = checkHorizontalLine([
      [[x, x + w], y],
      [[y, y + h], y + h]
    ])
    if (check + 1) {
      return { set: i, side: check, object: 'wheel', orientation: 'horizontal' }
    }
  }
}

const getCtxPoints = (canvas: HTMLCanvasElement, set: DataSet) => {
  let { offset, width: wheelWidth, diameter } = set.wheel
  wheelWidth *= 25.4
  diameter *= 25.4

  const { aspect, width: tireWidth } = set.tire

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

  return {
    x,
    y,
    w,
    h,
    a,
    b,
    c
  }
}

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
    let diameter = mm(set.wheel.diameter)
    let wheelWidth = mm(set.wheel.width)

    // Draw each wheel/tire set

    const { x, y, w, h, a, b, c } = getCtxPoints(canvas, set)

    // Draw the wheel, centered on the canvas, and shifted over to the left or
    // right based on the width and offset
    ctx.beginPath()
    ctx.strokeStyle = set.color
    ctx.fillStyle = set.color
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
    ctx.globalAlpha = 0.2
    ctx.fill()
    ctx.fillRect(x, y, w, h)
    ctx.globalAlpha = 1
    ctx.stroke()
    ctx.strokeRect(x, y, w, h)
    ctx.closePath()
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
      const color = typeof line.color == 'string' ? line.color : line.color()

      for (let j = 0; j < props.sets.length; j++) {
        ctxCmp.verticalLine({
          x: XPosition(line, props.sets[j].wheel),
          color
        })
      }
    }

    // Draw labels after drawing lines, so that labels are on top of the lines
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const text = typeof line.label == 'string' ? line.label : line.label()
      const color = typeof line.color == 'string' ? line.color : line.color()

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
          background: color,
          backgroundPad: 3
        })
      }
    }
  }
}

const hov = ref<Hover | undefined>(undefined)
const mouseDown = ref<MouseEvent | undefined>(undefined)
onMounted(() => {
  const canvas = canvasEl.value!
  // const ctx = canvasEl.value?.getContext('2d') as CanvasRenderingContext2D

  canvas.addEventListener('mousemove', ev => {
    const x = ev.x - canvas.getBoundingClientRect().left
    const y = ev.y - canvas.getBoundingClientRect().top
    hov.value = overInteractiveArea(canvas, props.sets, { x, y })

    if (hov.value && mouseDown.value) {
      const set = props.sets[hov.value.set]

      if (hov.value.object == 'wheel') {
        function updateWidth() {
          let a = mouseDown.value!.x - ev.x
          set.wheel.width -= a / scale / 25.4
          set.wheel.offset -= a / scale / 25.4
        }
        function updateDiameter() {
          let a = ev.y - mouseDown.value!.y
          set.wheel.diameter -= (a / 25.4 / scale) * 2
        }

        if (hov.value.orientation == 'vertical') {
          updateWidth()
        }
        if (hov.value.orientation == 'horizontal') {
          updateDiameter()
        }
        if (hov.value.orientation == 'point') {
          updateWidth()
          updateDiameter()
        }
      } else if (hov.value.object == 'tire') {
        function updateAspect() {
          let b = (set.wheel.width * 25.4 - set.tire.width) / 2
          let c = set.tire.aspect
          let a = (c ** 2 - b ** 2) ** 0.5

          a -= (ev.y - mouseDown.value!.y) / scale / 2

          c = (a ** 2 + b ** 2) ** 0.5
          if (isNaN(c)) return

          set.tire.aspect = c
        }
        function updateWidth() {
          let poke = (set.wheel.width * 25.4 - set.tire.width) / 2

          // The actual outer height of the tire will change a bit, so correct
          // it by changing the aspect ratio to maintain the same outer height
          // as before

          let outerHeight = (set.tire.aspect ** 2 - poke ** 2) ** 0.5

          // Calculate new poke
          poke += (ev.x - mouseDown.value!.x) / scale

          // Adjust the aspect
          set.tire.aspect = (outerHeight ** 2 + poke ** 2) ** 0.5

          // Set the new tire width
          set.tire.width = poke * 2 + set.wheel.width * 25.4
        }

        if (hov.value.orientation == 'horizontal') {
          // updateAspect()
        }
        if (hov.value.orientation == 'point') {
          updateWidth()
          // updateAspect()
        }
      }
      mouseDown.value = ev
      update(canvas)
    }
  })

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
  <canvas
    ref="canvasEl"
    @mousedown="e => (mouseDown = e)"
    @mouseup="mouseDown = undefined"
    :class="{
      'hov-h': hov?.orientation == 'horizontal',
      'hov-v': hov?.orientation == 'vertical',
      'hov-p': hov?.orientation == 'point'
    }"
  ></canvas>
</template>

<style scoped lang="scss">
.hov-h {
  cursor: ns-resize;
}
.hov-v {
  cursor: ew-resize;
}
.hov-p {
  cursor: grab;
}
</style>
