import { TireDescriptor, WheelDescriptor } from '../lib/examples'
import CanvasController from './canvas'
import { LineDescriptor } from './offsetGraph'

type DataSet = {
  wheel: WheelDescriptor
  tire: TireDescriptor
  spacer: number
  color: string
}

export default class WheelVisualizer extends CanvasController {
  sets: DataSet[]
  lines: LineDescriptor[]

  rideheight: number

  spacer: number

  /** when scale = 1, 1mm = 1px */
  scale: number

  constructor(
    canvas: HTMLCanvasElement,
    init: {
      sets: DataSet[]
      lines?: LineDescriptor[]
      rideheight: number
    }
  ) {
    super(canvas)
    this.sets = init.sets
    this.lines = init.lines ?? []
    this.rideheight = init.rideheight
    this.scale = 0.333
    this.update()
    this.onResize = this.update
  }

  addSet = (newSet: DataSet) => {
    this.sets.push(newSet)
    this.update()
  }

  updateLines = (lines?: LineDescriptor[]) => {
    console.log({ lines })
    this.lines = lines ?? []
    this.update()
  }

  updateRideHeight = (val: number) => {
    this.rideheight = val
    this.update()
  }

  updateSet = (
    index: number,
    newValues: {
      tire?: Partial<TireDescriptor>
      wheel?: Partial<WheelDescriptor>
      rideheight?: number
      spacer?: number
    }
  ) => {
    this.sets[index].wheel.width =
      newValues.wheel?.width ?? this.sets[index].wheel.width
    this.sets[index].wheel.offset =
      newValues.wheel?.offset ?? this.sets[index].wheel.offset
    this.sets[index].wheel.diameter =
      newValues.wheel?.diameter ?? this.sets[index].wheel.diameter

    this.sets[index].tire.width =
      newValues.tire?.width ?? this.sets[index].tire.width
    this.sets[index].tire.aspect =
      newValues.tire?.aspect ?? this.sets[index].tire.aspect

    this.rideheight = newValues.rideheight ?? this.rideheight

    this.spacer = newValues.spacer ?? this.spacer

    this.update()
  }

  private update = () => {
    const { ctx } = this
    ctx.clearRect(0, 0, this.w, this.h)

    // 1mm = 1px on the canvas
    const mm = (inches: number) => inches * 25.4

    // draw guide lines
    this.drawGuideLines()

    // Draw each wheel/tire set
    for (let i = 0; i < this.sets.length; i++) {
      const set = this.sets[i]
      let offset = set.wheel.offset * this.scale
      let diameter = mm(set.wheel.diameter)
      let wheelWidth = mm(set.wheel.width)

      let tireWidth = set.tire.width
      let aspect = set.tire.aspect

      let spacer = this.spacer

      // Draw the wheel, centered on the canvas, and shifted over to the left or
      // right based on the width and offset
      ctx.beginPath()
      ctx.strokeStyle = set.color
      ctx.fillStyle = set.color

      let x = this.w / 2 - (wheelWidth / 2 + offset - spacer) * this.scale,
        y = (this.h - diameter * this.scale) / 2,
        w = wheelWidth * this.scale,
        h = diameter * this.scale

      // calculate where the cursor will need to move to draw the tire stretch
      // appropriately
      let c = (aspect / 100) * tireWidth
      let a = (wheelWidth - tireWidth) / 2
      let b = (c ** 2 - a ** 2) ** 0.5

      c *= this.scale
      a *= this.scale
      b *= this.scale

      ctx.beginPath()

      // Stroke top half of tire
      ctx.moveTo(x, y)
      ctx.lineTo(x + a, y - b)
      ctx.lineTo(x + (w - a), y - b)
      ctx.lineTo(x + w, y)

      // Stroke bottom half of the tire
      ctx.moveTo(x, y + diameter * this.scale)
      ctx.lineTo(x + a, y + diameter * this.scale + b)
      ctx.lineTo(x + wheelWidth * this.scale - a, y + diameter * this.scale + b)
      ctx.lineTo(x + wheelWidth * this.scale, y + diameter * this.scale)

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

  private drawGuideLines = () => {
    const { ctx } = this

    const lines = [
      { label: 'Mounting Point', color: 'black', x: 0 },
      ...this.lines
    ]

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

        x = this.w / 2 - x * this.scale
      } else {
        x = this.w / 2 + line.offsetEquation(0, this.rideheight) * this.scale
      }
      return x
    }

    // Draw vertical guide lines
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]

      for (let j = 0; j < this.sets.length; j++) {
        this.verticalLine(XPosition(line, this.sets[j].wheel), line.color)
      }
    }

    // Draw labels after drawing lines, so that labels are on top of the lines
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const label = typeof line.label == 'function' ? line.label() : line.label

      // Draw lines
      for (let j = 0; j < this.sets.length; j++) {
        const { wheel } = this.sets[j]
        const x = XPosition(line, wheel)
        const y = this.h - pad - i * (pad * 3 + textSize)

        ctx.beginPath()
        ctx.fillStyle = line.color
        const height = pad * 2 + textSize
        ctx.fillRect(
          x,
          y - height,
          ctx.measureText(label).width + pad * 2,
          height
        )
        ctx.fill()
        ctx.closePath()

        ctx.beginPath()
        ctx.fillStyle = 'white'
        ctx.fillText(label, x + pad, y - pad)
        ctx.fill()
        ctx.closePath()
      }
    }
  }
}
