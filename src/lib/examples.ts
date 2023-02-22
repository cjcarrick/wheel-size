import { LineDescriptor } from './offsetGraph'

const res = await fetch('./examples/index.json')
export const examplesIndex = (await res.json()) as {
  [car: string]: { [wheelWidth: string]: number[] }
}

export async function fetchExamples(
  car: string,
  width: number,
  offset: number
): Promise<RequiredFitmentDescriptor[]> {
  console.log(examplesIndex)
  console.log({ car, width, offset })
  // If this car, width, and offset aren't in the index, we don't have it.
  if (!examplesIndex[car]?.[width]?.includes(offset)) {
    console.warn('car not in index')
    return []
  }

  // Try to make the fetch, and if it fails, return an empty array
  const res = await fetch(
    `./examples/${encodeURIComponent(car)}/${encodeURIComponent(
      width
    )}/${encodeURIComponent(offset)}.json`
  )

  if (!res.ok) {
    console.warn(res.statusText)
    return []
  }

  try {
    return await res.json()
  } catch {
    console.warn('Could not parse JSON')
    return []
  }
}

/** fills default fields and returns a predictably structured object */
export const parseWheelDescriptor = (
  descriptor: FitmentDescriptor,
  stock: RequiredFitmentDescriptor
): RequiredFitmentDescriptor => {
  const frontWheel =
    'front' in descriptor.wheel ? descriptor.wheel.front : descriptor.wheel

  const frontTire =
    'front' in descriptor.tire ? descriptor.tire.front : descriptor.tire

  const backWheel =
    'back' in descriptor.wheel ? descriptor.wheel.back : descriptor.wheel

  const backTire =
    'back' in descriptor.tire ? descriptor.tire.front : descriptor.tire

  return {
    source: descriptor.source,
    images: descriptor.images,
    link: descriptor.link,
    description: descriptor.description,

    rideheight: descriptor.rideheight ?? stock.rideheight,
    suspension: descriptor.suspension ?? stock.suspension,

    wheel: { front: frontWheel, back: backWheel },
    tire: { front: frontTire, back: backTire },

    front: {
      spacer: descriptor.front?.spacer ?? stock.front.spacer,
      camber: descriptor.front?.camber ?? stock.front.camber,
      toe: descriptor.front?.toe ?? stock.front.toe,
      caster: descriptor.front?.caster ?? stock.front.caster
    },
    back: {
      spacer: descriptor.rear?.spacer ?? stock.back.spacer,
      camber: descriptor.rear?.camber ?? stock.back.camber,
      toe: descriptor.rear?.toe ?? stock.back.toe,
      caster: descriptor.rear?.caster ?? stock.back.caster
    }
  }
}

const examples: {
  [vehicle: string]: {
    stock: RequiredFitmentDescriptor
    guides: LineDescriptor[]
  }
} = {
  'Subaru BRZ, Toyota 86, Scion FR-S (13-20)': {
    guides: [
      {
        label: 'Perfect Front Flushness',
        color: 'red',
        offsetEquation: (wheelWidth, rideheight) =>
          // +12.7 mm per 1 inch of wheel width
          12.7 * wheelWidth -
          // -64.3 as the base
          64.3 -
          // -2 mm per 1 inch drop
          2 * rideheight
      },
      {
        label: 'Perfect Rear Flushness',
        color: 'green',
        offsetEquation: (wheelWidth, rideHeight) =>
          // +12.7 mm per 1 inch of wheel width
          12.7 * wheelWidth -
          // -64.3 as the base
          71.1 -
          // -5 mm per 1 inch drop
          5 * rideHeight
      }
    ],

    stock: {
      suspension: 'None',
      rideheight: 0,
      source: 'ft86club',
      images: ['http://i26.photobucket.com/albums/c135/BimmerR/17.jpg'],
      link: 'https://www.ft86club.com/forums/showpost.php?p=231439&postcount=3',
      description: 'The stock layout for this car.',
      wheel: {
        front: { diameter: 17, width: 7, offset: 48 },
        back: { diameter: 17, width: 7, offset: 48 }
      },
      tire: {
        back: { width: 215, aspect: 45, make: 'Michelin', model: 'Primacy HP' },
        front: { width: 215, aspect: 45, make: 'Michelin', model: 'Primacy HP' }
      },
      front: { camber: 0, caster: 0, toe: 0, spacer: 0 },
      back: { camber: 0, caster: 0, toe: 0, spacer: 0 }
    }
  }
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
    spacer?: number
    camber?: number
    toe?: number
    caster?: number
  }
  rear?: {
    spacer?: number
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
  front: { spacer: number; camber: number; caster: number; toe: number }
  back: { spacer: number; camber: number; caster: number; toe: number }
}

export default examples
