import './index.scss'
import { SliderWithValue } from './lib/dom'
import vehicles, {
  examplesIndex,
  fetchExamples,
  parseWheelDescriptor
} from './lib/examples'
import OffsetGraph from './lib/offsetGraph'
import tr from './lib/table'
import WheelVisualizer from './lib/wheelVisualizer'

// Fill the dropdown menu with data from index.json
const guidesEl = document.querySelector('.guides') as HTMLSelectElement
let vehicle = guidesEl.value

for (let i = 0; i < Object.keys(vehicles).length; i++) {
  const v = Object.keys(vehicles)[i]
  const option = document.createElement('option')
  option.setAttribute('value', v)
  option.innerHTML = v
  guidesEl.appendChild(option)
}

guidesEl.addEventListener('input', () => {
  vehicle = guidesEl.value
})

guidesEl.addEventListener('input', async () => {
  combinedVisualizer.updateLines(vehicles[vehicle]?.guides)
  offsetGraph.updateLines(vehicles[vehicle]?.guides)
  offsetGraph.updateExamples(examplesIndex[vehicle])
})

// Watch ride height data. We use the same ride height for wheel A and B
const rideheight = new SliderWithValue(`.opt-group .height`)

const offsetGraph = new OffsetGraph(
  document.querySelector('.graph') as HTMLCanvasElement,
  {
    lines: vehicles[vehicle]?.guides,
    sets: [],
    rideheight: rideheight.val
  },
  examplesIndex[vehicle]
)

rideheight.onchange(offsetGraph.updateRideHeight)
offsetGraph.onFreeze(updateExamples)

const combinedVisualizerCanvas = document.querySelector(
  '.visualizers .ab'
) as HTMLCanvasElement

const combinedVisualizer = new WheelVisualizer(combinedVisualizerCanvas, {
  sets: [],
  lines: vehicles[vehicle]?.guides,
  rideheight: rideheight.val
})

// There are 2 wheels the user can mess around with, an orange one and a blue
// one. Set each wheel up in a for-loop

const sides = ['a', 'b'] as const
const colors = ['blue', 'red'] as const

const values = sides.reduce(
  (prev, side) => ({
    ...prev,
    [side]: {
      wheel: {
        offset: new SliderWithValue(`.controls.${side} .offset`),
        diameter: new SliderWithValue(`.controls.${side} .diameter`),
        width: new SliderWithValue(`.controls.${side} .wheelWidth`)
      },
      tire: {
        width: new SliderWithValue(`.controls.${side} .tireWidth`),
        aspect: new SliderWithValue(`.controls.${side} .aspect`)
      },
      spacer: new SliderWithValue(`.controls.${side} .spacer`)
    }
  }),
  {}
) as {
    [K in (typeof sides)[number]]: {
      wheel: {
        offset: SliderWithValue
        diameter: SliderWithValue
        width: SliderWithValue
      }
      tire: {
        width: SliderWithValue
        aspect: SliderWithValue
      }
      spacer: SliderWithValue
    }
  }

for (let i = 0; i < sides.length; i++) {
  const side = sides[i]
  const vals = values[side]

  // Add this wheel to the graph
  offsetGraph.addSet({
    width: vals.wheel.width,
    offset: vals.wheel.offset,
    spacer: vals.spacer,
    color: colors[i]
  })

  // Add this wheel to the combined visualizer
  combinedVisualizer.addSet({
    wheel: {
      width: vals.wheel.width.val,
      diameter: vals.wheel.diameter.val,
      offset: vals.wheel.offset.val
    },
    tire: { width: vals.tire.width.val, aspect: vals.tire.aspect.val },
    spacer: vals.spacer.val,
    color: colors[i]
  })

  offsetGraph.onChange((newWidth, newOffset, newSpacer) => {
    vals.wheel.width.setValue(newWidth)
    vals.wheel.offset.setValue(newOffset)
    vals.spacer.setValue(newSpacer)
  })

  // Draw the canvas

  const visualizerCanvas = document.querySelector(
    `.visualizers .${side} `
  ) as HTMLCanvasElement

  const visualizer = new WheelVisualizer(visualizerCanvas, {
    lines: vehicles[vehicle]?.guides,
    rideheight: rideheight.val,
    sets: [
      {
        wheel: {
          width: vals.wheel.width.val,
          offset: vals.wheel.offset.val,
          diameter: vals.wheel.diameter.val
        },

        tire: {
          width: vals.tire.width.val,
          aspect: vals.tire.aspect.val
        },
        spacer: vals.spacer.val,
        color: colors[i]
      }
    ]
  })

  // Redraw the visualizer on change
  guidesEl.addEventListener('input', () => {
    visualizer.updateLines(vehicles[vehicle]?.guides)
  })

  /** updates all necessary data sets */
  function update() {
    const wheel = {
      width: vals.wheel.width.val,
      offset: vals.wheel.offset.val,
      diameter: vals.wheel.diameter.val
    }
    const tire = {
      width: vals.tire.width.val,
      aspect: vals.tire.aspect.val
    }
    const spacer = vals.spacer.val

    visualizer.updateSet(0, { wheel, tire, spacer })
    combinedVisualizer.updateSet(i, { wheel, tire, spacer })
  }

  // Update graphs and visualizers on change
  vals.wheel.width.onchange(update)
  vals.wheel.offset.onchange(update)
  vals.wheel.diameter.onchange(update)
  vals.spacer.onchange(update)
  vals.tire.width.onchange(update)
  vals.tire.aspect.onchange(update)
  rideheight.onchange(visualizer.updateRideHeight)
  rideheight.onchange(combinedVisualizer.updateRideHeight)

  // Draw initial state of graphs and visualizers
  update()

  const reset = document.querySelector(`.${side} .reset`) as HTMLButtonElement

  reset.addEventListener('click', () => {
    vals.wheel.offset.setValue(
      parseWheelDescriptor(vehicles[vehicle].stock, vehicles[vehicle].stock)
        .wheel.front.offset
    )
    vals.wheel.width.setValue(
      parseWheelDescriptor(vehicles[vehicle].stock, vehicles[vehicle].stock)
        .wheel.front.width
    )
    rideheight.setValue(
      parseWheelDescriptor(vehicles[vehicle].stock, vehicles[vehicle].stock)
        .rideheight
    )
    vals.spacer.setValue(
      parseWheelDescriptor(vehicles[vehicle].stock, vehicles[vehicle].stock)
        .front.spacer
    )
    vals.tire.width.setValue(
      parseWheelDescriptor(vehicles[vehicle].stock, vehicles[vehicle].stock)
        .tire.front.width
    )
    vals.tire.aspect.setValue(
      parseWheelDescriptor(vehicles[vehicle].stock, vehicles[vehicle].stock)
        .tire.front.aspect
    )
    vals.wheel.diameter.setValue(
      parseWheelDescriptor(vehicles[vehicle].stock, vehicles[vehicle].stock)
        .wheel.front.diameter
    )
  })
}

async function updateExamples() {
  const { a, b } = values
  const container = document.querySelector('.examples') as HTMLDivElement
  container.innerHTML = ''

  console.log(vehicle)
  let exs = await fetchExamples(vehicle, a.wheel.width.val, a.wheel.offset.val)
  console.log(exs)

  const isStaggered = 'front' in exs
  a.wheel.offset.val !== b.wheel.offset.val ||
    a.wheel.width.val !== b.wheel.width.val ||
    a.wheel.diameter.val !== b.wheel.diameter.val ||
    a.tire.width.val !== b.tire.width.val ||
    a.tire.aspect.val !== b.tire.aspect.val ||
    a.spacer.val !== b.spacer.val

  if (isStaggered) {
    exs = [
      ...exs,
      ...(await fetchExamples(vehicle, b.wheel.width.val, b.wheel.offset.val))
    ]
  }

  for (let i = 0; i < exs.length; i++) {
    const example = parseWheelDescriptor(exs[i], vehicles[vehicle].stock)

    // Show this example if the wheels in the front or back match the current
    // query
    if (
      (example.wheel.front.width !== a.wheel.width.val ||
        example.wheel.front.offset !== a.wheel.offset.val) &&
      (example.wheel.back.width !== b.wheel.width.val ||
        example.wheel.back.offset !== b.wheel.offset.val)
    ) {
      continue
    }

    container.append(
      tr([
        `<a href = "${example.link}">${example.description}</a>`,
        '    ',
        'F: ',
        example.wheel.front.diameter,
        'x',
        example.wheel.front.width,
        ' ',
        `${example.wheel.front.offset < 0 ? '-' : '+'}${Math.abs(
          example.wheel.front.offset
        )}`,
        ' ' + example.wheel.front.make + ' ' + example.wheel.front.model,
        '    ',
        'Spacer: ',
        example.back.spacer,
        '    ',
        {
          data: '<input type="button" value="A" title="Apply this wheel to setup A"/>',
          onclick: () => {
            a.wheel.width.setValue(example.wheel.front.width)
            a.wheel.offset.setValue(example.wheel.front.offset)
            a.wheel.diameter.setValue(example.wheel.front.diameter)
            a.spacer.setValue(example.front.spacer)
          }
        },
        {
          data: '<input type="button" value="B" title="Apply wheel tire to setup B"/>',
          onclick: () => {
            b.wheel.width.setValue(example.wheel.front.width)
            b.wheel.offset.setValue(example.wheel.front.offset)
            b.wheel.diameter.setValue(example.wheel.front.diameter)
            b.spacer.setValue(example.front.spacer)
          }
        },
        '    ',
        example.tire.front.width,
        '/',
        example.tire.front.aspect,
        'R',
        example.wheel.front.diameter,
        ' ' + example.tire.front.make + ' ' + example.tire.front.model,
        '    ',
        {
          data: '<input type="button" value="A" title="Apply this tire to setup A"/>',
          onclick: () => {
            a.tire.width.setValue(example.tire.front.width)
            a.tire.aspect.setValue(example.tire.front.aspect)
          }
        },
        {
          data: '<input type="button" value="B" title="Apply this tire to setup B"/>',
          onclick: () => {
            b.tire.width.setValue(example.tire.front.width)
            b.tire.aspect.setValue(example.tire.front.aspect)
          }
        },
        '    '
      ]),
      tr([
        example.suspension +
        (example.rideheight ? ` (${example.rideheight}")` : ''),
        '    ',
        'R: ',
        example.wheel.back.diameter,
        'x',
        example.wheel.back.width,
        ' ',
        `${example.wheel.back.offset < 0 ? '-' : '+'}${Math.abs(
          example.wheel.back.offset
        )}`,
        ' ' + example.wheel.back.make + ' ' + example.wheel.back.model,
        '    ',
        'Spacer: ',
        example.back.spacer,
        '    ',
        {
          data: '<input type="button" value="A" title="Apply this wheel to setup A"/>',
          onclick: () => {
            a.wheel.width.setValue(example.wheel.back.width)
            a.wheel.offset.setValue(example.wheel.back.offset)
            a.wheel.diameter.setValue(example.wheel.back.diameter)
            a.spacer.setValue(example.back.spacer)
          }
        },
        {
          data: '<input type="button" value="B" title="Apply this wheel to setup B"/>',
          onclick: () => {
            b.wheel.width.setValue(example.wheel.back.width)
            b.wheel.offset.setValue(example.wheel.back.offset)
            b.wheel.diameter.setValue(example.wheel.back.diameter)
            b.spacer.setValue(example.back.spacer)
          }
        },
        '    ',
        example.tire.back.width,
        '/',
        example.tire.back.aspect,
        'R',
        example.wheel.back.diameter,
        ' ' + example.tire.back.make + ' ' + example.tire.back.model,
        '    ',
        {
          data: '<input type="button" value="A" title="Apply this tire to setup A" />',
          onclick: () => {
            a.tire.width.setValue(example.tire.back.width)
            a.tire.aspect.setValue(example.tire.back.aspect)
          }
        },
        {
          data: '<input type="button" value="B" title="Apply this tiree to setup B"/>',
          onclick: () => {
            b.tire.width.setValue(example.tire.back.width)
            b.tire.aspect.setValue(example.tire.back.aspect)
          }
        },
        '    '
      ])
    )
  }
}
