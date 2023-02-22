export function mapRange(
  number: number,
  fromMin: number,
  fromMax: number,
  toMin: number,
  toMax: number
) {
  return toMin + ((toMax - toMin) / (fromMax - fromMin)) * (number - fromMin)
}

export const radians = degrees => (degrees * Math.PI) / 180

export function objectsAreTheSame(a: any, b: any) {
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
