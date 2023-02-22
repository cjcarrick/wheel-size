import { mapRange, radians } from '.'
import CanvasController from './canvas'
import { SliderWithValue } from './dom'

export type LineDescriptor = {
  label: string | (() => string)
  color: string
} & (
    | { offsetEquation: (wheelWidth: number, rideHeight: number) => number }
    | { x: ((wheelWidth: number, offset: number) => number) | number }
  )

export type DataSet = {
  offset: SliderWithValue
  width: SliderWithValue
  spacer: SliderWithValue
  color: string
}

export default class OffsetGraph extends CanvasController {
  frozen: boolean
  private onFreezeListeners: (() => void)[]
  private hovered: undefined | { x: number; y: number }
  private onChangeListeners: ((
    width: number,
    offset: number,
    spacer: number
  ) => void)[]
  rideheight: number
  sets: DataSet[]
  lines: LineDescriptor[]

  constructor(
    canvas: HTMLCanvasElement,

    init: {
      rideheight: number
      sets: DataSet[]
      lines?: LineDescriptor[]
    },

    private examples: {
      [wheelWidth: string]: number[]
    }
  ) {
    super(canvas)
    this.onResize = this.update

    this.lines = init.lines ?? []
    this.examples = this.examples ?? {}

    this.sets = init.sets
    this.rideheight = init.rideheight

    this.onChangeListeners = []
    this.onFreezeListeners = []

    // Update values on mouse move
    this.canvas.addEventListener('mousemove', ev => {
      if (this.frozen) return

      this.hovered = {
        x: ev.x - this.canvas.getBoundingClientRect().left,
        y: ev.y - this.canvas.getBoundingClientRect().top
      }

      const newWidth = Math.round(this.canvasWidthValue(this.hovered.x) * 2) / 2
      const newOffset = Math.round(this.canvasOffsetValue(this.hovered.y))
      for (let i = 0; i < this.sets.length; i++) {
        const set = this.sets[i]
        if (newWidth !== set.width.val) {
          set.width.setValue(newWidth)
          this.brodcastChange(i)
        }
        if (newOffset !== set.offset.val) {
          set.offset.setValue(newOffset)
          this.brodcastChange(i)
        }
        if (set.spacer.val !== 0) {
          set.width.setValue(0)
          this.brodcastChange(i)
        }
      }

      this.update()
    })

    this.canvas.addEventListener('click', ev => {
      // Toggle freezing the crosshair on click
      this.frozen = !this.frozen

      if (!this.frozen) {
        this.canvas.classList.remove('frozen')

        // Move points to the cursor on click
        for (let i = 0; i < this.sets.length; i++) {
          const set = this.sets[i]
          set.width.setValue(
            this.canvasXPosition(
              ev.x - this.canvas.getBoundingClientRect().left
            )
          )
          set.offset.setValue(
            this.canvasYPosition(ev.y + this.canvas.getBoundingClientRect().top)
          )
        }
      } else {
        this.hovered = undefined
        this.canvas.classList.add('frozen')
        this.brodcastFreeze()
      }

      this.update()
    })

    this.canvas.addEventListener('mouseleave', () => {
      if (!this.frozen) {
        // this.width.val = this.width.max  0 this.width.min
        // this.update()
      }
    })
  }

  /** returns the y value on the graph that represents a certain offset value
   * eg: mm -> px */
  private canvasYPosition = (offset: number) =>
    mapRange(
      offset,
      Math.min(...this.sets.map(a => a.offset.min)),
      Math.max(...this.sets.map(a => a.offset.max)),
      this.canvas.getBoundingClientRect().height,
      0
    )

  /** returns the offset that a specific y value on the graph corresponds to
   * eg: px -> mm */
  private canvasOffsetValue = (y: number) =>
    mapRange(
      y,
      this.canvas.getBoundingClientRect().height,
      0,
      Math.min(...this.sets.map(a => a.offset.min)),
      Math.max(...this.sets.map(a => a.offset.max))
    )

  /** returns the x position on the graph that represents a certain wheel width:
   * eg: px -> in */
  private canvasXPosition = (width: number) =>
    mapRange(
      width,
      Math.min(...this.sets.map(a => a.width.min)),
      Math.max(...this.sets.map(a => a.width.max)),
      0,
      this.canvas.getBoundingClientRect().width
    )

  /** returns the width that a certain x value on the graph represents
   * eg: in -> px */
  private canvasWidthValue = (x: number) =>
    mapRange(
      x,
      0,
      this.canvas.getBoundingClientRect().width,
      Math.min(...this.sets.map(a => a.width.min)),
      Math.max(...this.sets.map(a => a.width.max))
    )

  addSet = (newSet: DataSet) => {
    newSet.width.onchange(this.update)
    newSet.offset.onchange(this.update)
    newSet.spacer.onchange(this.update)
    this.sets.push(newSet)
  }

  updateRideHeight = (val: number) => {
    this.rideheight = val
    this.update()
  }

  updateLines = (lines?: LineDescriptor[]) => {
    this.lines = lines ?? []
    this.update()
  }

  updateExamples = (
    newExamples?: { [wheelWidth: string]: number[] },
    clearOldExamples = true
  ) => {
    if (clearOldExamples) {
      this.examples = newExamples ?? {}
    } else if (newExamples) {
      for (let i = 0; i < Object.keys(newExamples).length; i++) {
        const k = Object.keys(newExamples)[i]
        this.examples[k] = [...(this.examples[k] ?? []), ...newExamples[k]]
      }
    }
    this.update()
  }

  private brodcastChange = (setNumber: number) => {
    // Fire event listeners
    const set = this.sets[setNumber]
    for (let i = 0; i < this.onChangeListeners.length; i++) {
      this.onChangeListeners[i](set.width.val, set.offset.val, set.spacer.val)
    }
  }

  /** fires only when values are internally changed. Eg: wont fire if you call
   * .setvalues() outside this class. */
  onChange = (fn: (typeof this.onChangeListeners)[number]) => {
    this.onChangeListeners.push(fn)
  }

  private brodcastFreeze = () => {
    // Fire event listeners
    for (let i = 0; i < this.onFreezeListeners.length; i++) {
      this.onFreezeListeners[i]()
    }
  }

  /** fires only when values are internally changed. Eg: wont fire if you call
   * .setvalues() outside this class. */
  onFreeze = (fn: (typeof this.onFreezeListeners)[number]) => {
    this.onFreezeListeners.push(fn)
  }

  update = () => {
    const { w, h, ctx } = this
    this.ctx.clearRect(0, 0, w, h)

    // draw vertical lines
    const verticalLines = 12
    for (let i = 1; i < verticalLines; i++) {
      this.verticalLine(i * (w / verticalLines), '#eee')
    }

    // Draw crosshair where the cursor is hovering
    if (this.hovered) {
      const set = this.sets[0]

      this.verticalLine(
        this.hovered.x,
        'black',
        undefined,
        this.canvasYPosition(set.offset.val + 1)
      ).verticalLine(
        this.hovered.x,
        'black',
        this.canvasYPosition(set.offset.val - 1)
      )

      this.horizontalLine(
        this.hovered.y +
        this.canvasYPosition(set.spacer.val) -
        this.canvasYPosition(0),
        'black',
        undefined,
        this.canvasXPosition(set.width.val - 0.25)
      ).horizontalLine(
        this.hovered.y +
        this.canvasYPosition(set.spacer.val) -
        this.canvasYPosition(0),
        'black',
        this.canvasXPosition(set.width.val + 0.25)
      )
    }

    // Draw a reticle for each of the sets on the graph
    for (let i = 0; i < this.sets.length; i++) {
      const set = this.sets[i]
      this.circle(
        this.canvasXPosition(set.width.val),
        this.canvasYPosition(set.offset.val + set.spacer.val),
        6,
        'outline',
        set.color
      )
    }

    // Draw dots for all the examples
    for (let i = 0; i < Object.keys(this.examples).length; i++) {
      const width = parseFloat(Object.keys(this.examples)[i])
      const offset = this.examples[width]

      for (let j = 0; j < offset.length; j++) {
        this.circle(
          this.canvasXPosition(width),
          this.canvasYPosition(offset[j]),
          3,
          'fill',
          'gray'
        )
      }
    }

    // Vertical axis label
    this.text('Wheel offset', 16, this.h / 2, {
      angle: radians(90),
      size: 16,
      align: 'center'
    })
    this.text(
      '<-- More Poke                                                                 More Suck -->',
      16,
      this.h / 2,
      {
        angle: radians(90),
        align: 'center'
      }
    )

    // Horizontal axis label
    this.text('Wheel Width', this.w / 2, this.h, {
      size: 16,
      align: 'center'
    })

    // Draw the lines on the graph

    for (let i = 0; i < this.lines.length; i++) {
      const line = this.lines[i]

      for (let j = 0; j < this.sets.length; j++) {
        const set = this.sets[j]

        // Hanle vertical lines
        if ('x' in line) {
          this.verticalLine(
            typeof line.x == 'function'
              ? line.x(set.width.val, set.offset.val)
              : line.x,
            line.color
          )
        }

        // Handle lines with custom equations
        else {
          let { offsetEquation: equation, color: color, label } = line
          if (typeof label == 'function') label = label()

          this.line(x => {
            const offset = this.canvasYPosition(
              line.offsetEquation(this.canvasWidthValue(x), this.rideheight)
            )

            return offset
          }, color)

          const msgsize = 8
          const msgpad = 4
          const msgx = this.canvasXPosition(set.width.min + 0.5) + msgpad
          const msgy =
            this.canvasYPosition(
              equation(set.width.min + 0.5, this.rideheight)
            ) +
            msgpad +
            msgsize +
            msgpad / 2 +
            msgsize / 2

          const msgAngle = Math.atan2(
            this.canvasYPosition(equation(set.width.max, this.rideheight)) -
            this.canvasYPosition(equation(set.width.min, this.rideheight)),

            this.canvasXPosition(set.width.max - set.width.min)
          )

          ctx.rotate(-msgAngle)
          ctx.beginPath()
          ctx.fillStyle = color
          const textWidth = ctx.measureText(label).width
          ctx.fillRect(
            msgx - msgpad,
            msgy - msgsize - msgpad,
            textWidth + msgpad * 2,
            msgsize + msgpad * 2
          )
          ctx.fill()
          ctx.closePath()

          ctx.beginPath()
          ctx.fillStyle = 'white'
          ctx.textAlign = 'left'
          ctx.fillText(label, msgx, msgy)
          ctx.fill()
          ctx.closePath()
          ctx.rotate(msgAngle)
        }
      }
    }
  }
}
