export function mapRange(
  number: number,
  fromMin: number,
  fromMax: number,
  toMin: number,
  toMax: number
) {
  return toMin + ((toMax - toMin) / (fromMax - fromMin)) * (number - fromMin)
}

/** calculates the shortest distance between a point and a line */
export function distToLine(
  point: { x: number; y: number },
  /**
   * where line is determine by the equation:
   * ax + by + c = 0
   */
  line: { a: number; b: number; c: number }
) {
  const n = Math.abs(line.a * point.x + line.b * point.y + line.c)
  const d = (line.a ** 2 + line.b ** 2) ** 0.5
  return n / d
}

export const radians = (degrees: number) => (degrees * Math.PI) / 180

export function objectsAreTheSame(
  a: Record<string, any>,
  b: Record<string, any>
): boolean {
  if (Object.keys(a).length !== Object.keys(b).length) {
    return false
  }

  for (let i = 0; i < Object.keys(a).length; i++) {
    const k = Object.keys(a)[i]

    if (!(k in b)) {
      return false
    }

    if (
      typeof a[k] == 'object' &&
      a[k] !== null &&
      typeof b[k] == 'object' &&
      b[k] !== null
    ) {
      return objectsAreTheSame(a[k], b[k])
    }

    if (a[k] !== b[k]) {
      return false
    }
  }

  return true
}
