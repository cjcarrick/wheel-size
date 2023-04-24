export type LineDescriptor = {
  label: string | (() => string)
  color: () => string
} & (
    | { offsetEquation: (wheelWidth: number, rideHeight: number) => number }
    | { x: ((wheelWidth: number, offset: number) => number) | number }
  )

export type ExamplesIndex = {
  [vehicle: string]: {
    /** an array of avalible offsets at this width */
    [wheelWidth: number]: {
      [offset: number]: number
    }
  }
}

export type VehicleDescriptor = {
  stock: RequiredFitmentDescriptor
}

export type TireDescriptor = {
  width: number
  aspect: number
  make?: string
  model?: string
}

export type WheelDescriptor = {
  width: number
  offset: number
  diameter: number
  make?: string
  model?: string
  weight?: number
}

export type FitmentDescriptor = {
  source: string
  images: string[]
  link: string
  description: string
  rideheight?: number
  suspension?: string

  front?: {
    camber?: number
    toe?: number
    caster?: number
  }
  rear?: {
    camber?: number
    toe?: number
    caster?: number
  }

  wheel: WheelDescriptor | { front: WheelDescriptor; back: WheelDescriptor }
  tire: TireDescriptor | { front: TireDescriptor; back: TireDescriptor }
}

export type RequiredFitmentDescriptor = {
  source: string
  images: string[]
  link: string
  description: string
  rideheight: number
  suspension: string
  wheel: { front: WheelDescriptor; back: WheelDescriptor }
  tire: { front: TireDescriptor; back: TireDescriptor }
  front: { camber: number; caster: number; toe: number }
  back: { camber: number; caster: number; toe: number }
}
