// const setDimensions = () => {
//   canvas.width = this.canvas.width = this.canvas.getBoundingClientRect().width
//   canvas.height = this.canvas.height = 512
// }
// setDimensions()

const ctxFx = (canvas: HTMLCanvasElement) => ({
  onResize: (cb: () => void) => {
    new ResizeObserver(cb).observe(canvas)
    return ctxFx(canvas)
  },

  text: (opts: {
    text: string
    x: number
    y: number
    color?: string
    align?: CanvasTextAlign
    /** in radians */
    angle?: number
    size?: number
    background?: string
    backgroundPad?: number
  }) => {
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
    const {
      text,
      x,
      y,
      angle = 0,
      color = 'black',
      align = 'left',
      size = 10,
      background,
      backgroundPad = 0
    } = opts

    // Translate so that the rotation origin remains at the top left of the text
    // box
    ctx.translate(x - backgroundPad, y - backgroundPad)
    ctx.rotate(-angle)

    if (background) {
      ctx.beginPath()

      ctx.fillStyle = background
      const height =
        ctx.measureText(text).actualBoundingBoxAscent + backgroundPad * 2
      ctx.fillRect(
        0,
        0,
        ctx.measureText(text).actualBoundingBoxRight + backgroundPad * 2,
        height
      )
      ctx.translate(backgroundPad, height - backgroundPad)
      ctx.closePath()
    }

    ctx.beginPath()

    ctx.font = `${size}px sans-serif`
    ctx.fillStyle = color
    ctx.textAlign = align

    ctx.fillText(text, 0, 0)

    // Reset transforms
    ctx.resetTransform()

    ctx.closePath()

    return ctxFx(canvas)
  },

  line: (opts: {
    equation: (x: number) => number
    color?: string
    weight?: number
    from?: number
    to?: number
  }) => {
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
    const {
      equation,
      color = 'black',
      weight = 1,
      from = 0,
      to = canvas.width
    } = opts
    ctx.strokeStyle = color
    ctx.lineWidth = weight
    ctx.beginPath()
    ctx.moveTo(from, equation(from))
    ctx.lineTo(to, equation(to))
    ctx.stroke()
    ctx.closePath()
    return ctxFx(canvas)
  },

  verticalLine: (opts: {
    x: number
    color?: string
    from?: number
    to?: number
    weight?: number
  }) => {
    const {
      x,
      weight = 1,
      color = 'black',
      from = 0,
      to = canvas.height
    } = opts
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
    ctx.beginPath()
    ctx.lineWidth = weight
    ctx.strokeStyle = color
    ctx.moveTo(x, from)
    ctx.lineTo(x, to)
    ctx.stroke()
    ctx.closePath()
    return ctxFx(canvas)
  },

  horizontalLine: (opts: {
    y: number
    color?: string
    from?: number
    to?: number
    weight?: number
  }) => {
    const { y, weight = 0, color = 'black', from = 0, to = canvas.width } = opts
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
    ctx.lineWidth = weight
    ctx.beginPath()
    ctx.strokeStyle = color
    ctx.moveTo(from, y)
    ctx.lineTo(to, y)
    ctx.stroke()
    ctx.closePath()
    return ctxFx(canvas)
  },

  circle: (opts: {
    x: number
    y: number
    radius: number
    radiusX?: number
    /** 0 = fill
     *
     * @default 0*/
    stroke?: number
    color?: string
  }) => {
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
    const { x, y, radius, radiusX = radius, stroke = 0, color = 'black' } = opts

    ctx.beginPath()
    ctx.strokeStyle = color
    ctx.fillStyle = color
    ctx.ellipse(x, y, radiusX, radius, 0, 0, Math.PI * 2)

    if (!stroke) {
      ctx.fill()
    } else {
      ctx.lineWidth = stroke
      ctx.stroke()
    }

    ctx.closePath()

    return ctxFx(canvas)
  }
})

export default ctxFx
