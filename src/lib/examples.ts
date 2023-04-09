import {
  ExamplesIndex,
  FitmentDescriptor,
  RequiredFitmentDescriptor,
  VehicleDescriptor
} from './types'

export const examplesIndex = async () =>
  (await (await fetch('./examples/index.json')).json()) as ExamplesIndex

export function isStaggered(wheelDescriptor: RequiredFitmentDescriptor) {
  let wheel = false
  let tire = false

  for (let i = 0; i < Object.values(wheelDescriptor.wheel.front).length; i++) {
    const frontVal = Object.values(wheelDescriptor.wheel.front)[i]
    const backVal = Object.values(wheelDescriptor.wheel.back)[i]
    if (frontVal !== backVal) {
      wheel = true
      break
    }
  }

  for (let i = 0; i < Object.values(wheelDescriptor.tire.front).length; i++) {
    const frontVal = Object.values(wheelDescriptor.tire.front)[i]
    const backVal = Object.values(wheelDescriptor.tire.back)[i]
    if (frontVal !== backVal) {
      wheel = true
      break
    }
  }

  return { wheel, tire }
}

export async function fetchExamples(
  car: string,
  width: number,
  offset: number
): Promise<RequiredFitmentDescriptor[]> {
  const examples = await examplesIndex()
  // If this car, width, and offset aren't in the index, we don't have it.
  if (
    !(car in examples) ||
    !(width in examples[car]) ||
    !(offset in examples[car][width])
  ) {
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
      camber: descriptor.front?.camber ?? stock.front.camber,
      toe: descriptor.front?.toe ?? stock.front.toe,
      caster: descriptor.front?.caster ?? stock.front.caster
    },
    back: {
      camber: descriptor.rear?.camber ?? stock.back.camber,
      toe: descriptor.rear?.toe ?? stock.back.toe,
      caster: descriptor.rear?.caster ?? stock.back.caster
    }
  }
}

const vehicles: {
  [vehicle: string]: VehicleDescriptor
} = {
  'Subaru BRZ, Toyota 86, Scion FR-S (13-20)': {
    // guides: [
    //   {
    //     label: 'Perfect Front Flushness',
    //     color: 'red',
    //     offsetEquation: (wheelWidth, rideheight) =>
    //       // +12.7 mm per 1 inch of wheel width
    //       12.7 * wheelWidth -
    //       // -64.3 as the base
    //       64.3 -
    //       // -2 mm per 1 inch drop
    //       2 * rideheight
    //   },
    //   {
    //     label: 'Perfect Rear Flushness',
    //     color: 'green',
    //     offsetEquation: (wheelWidth, rideHeight) =>
    //       // +12.7 mm per 1 inch of wheel width
    //       12.7 * wheelWidth -
    //       // -64.3 as the base
    //       71.1 -
    //       // -5 mm per 1 inch drop
    //       5 * rideHeight
    //   }
    // ],

    stock: {
      suspension: 'None',
      rideheight: 0,
      source: 'ft86club',
      images: ['http://i26.photobucket.com/albums/c135/BimmerR/17.jpg'],
      link: 'https://www.ft86club.com/forums/showpost.php?p=231439&postcount=3',
      description: 'The stock layout for this car.',
      wheel: {
        front: { diameter: 17, width: 7, offset: 48, },
        back: { diameter: 17, width: 7, offset: 48, }
      },
      tire: {
        back: { width: 215, aspect: 45, make: 'Michelin', model: 'Primacy HP' },
        front: { width: 215, aspect: 45, make: 'Michelin', model: 'Primacy HP' }
      },
      front: { camber: 0, caster: 0, toe: 0, },
      back: { camber: 0, caster: 0, toe: 0, }
    }
  }
}
export default vehicles
