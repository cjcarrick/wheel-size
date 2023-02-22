export default class CanvasController {
  ctx: CanvasRenderingContext2D
  h: number
  w: number
  public onResize?: () => void

  constructor(public canvas: HTMLCanvasElement) {
    this.ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D

    const setDimensions = () => {
      this.w = this.canvas.width = this.canvas.getBoundingClientRect().width
      this.h = this.canvas.height = 512
    }
    setDimensions()
    new ResizeObserver(() => {
      setDimensions()
      if (this.onResize) this.onResize()
    }).observe(this.canvas)
  }

  text = (
    text: string,
    x: number,
    y: number,
    opts?: {
      color?: string
      align?: CanvasTextAlign
      /** in radians */
      angle?: number
      size?: number
    }
  ) => {
    this.ctx.beginPath()

    // Translate so that the rotation origin remains at the top left of the text
    // box
    this.ctx.translate(x, y)
    this.ctx.rotate(-(opts?.angle ?? 0))

    this.ctx.font = `${opts?.size ?? 10}px sans-serif`
    this.ctx.fillStyle = opts?.color ?? 'black'
    this.ctx.textAlign = opts?.align ?? 'left'

    // The text should be at (0, 0) since we already moved
    this.ctx.fillText(text, 0, 0)

    // Reset transforms
    this.ctx.resetTransform()

    this.ctx.closePath()
  }

  line = (
    equation: (x: number) => number,
    color = 'black',
    from = 0,
    to = this.w
  ) => {
    this.ctx.beginPath()
    this.ctx.strokeStyle = color
    this.ctx.moveTo(from, equation(from))
    this.ctx.lineTo(to, equation(to))
    this.ctx.stroke()
    this.ctx.closePath()
    return this
  }

  verticalLine = (x: number, color = 'black', from = 0, to = this.h) => {
    this.ctx.beginPath()
    this.ctx.strokeStyle = color
    this.ctx.moveTo(x, from)
    this.ctx.lineTo(x, to)
    this.ctx.stroke()
    this.ctx.closePath()
    return this
  }

  horizontalLine = (y: number, color = 'black', from = 0, to = this.w) => {
    this.ctx.beginPath()
    this.ctx.strokeStyle = color
    this.ctx.moveTo(from, y)
    this.ctx.lineTo(to, y)
    this.ctx.stroke()
    this.ctx.closePath()
    return this
  }

  circle = (
    x: number,
    y: number,
    radius: number,
    style: 'fill' | 'outline' = 'fill',
    color = 'black'
  ) => {
    this.ctx.beginPath()
    this.ctx.strokeStyle = color
    this.ctx.fillStyle = color
    this.ctx.ellipse(x, y, radius, radius, 0, 0, Math.PI * 2)

    if (style == 'fill') {
      this.ctx.fill()
    } else {
      this.ctx.stroke()
    }

    this.ctx.closePath()

    return this
  }
}
