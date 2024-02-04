<script setup lang="ts">
import { reactive, ref, UnwrapNestedRefs } from 'vue'
import ExamplesList from './components/ExamplesList.vue'
import OffsetGraph from './components/OffsetGraph.vue'
import VehicleSelector from './components/VehicleSelector.vue'
import WheelControls from './components/WheelControls.vue'
import WheelVisualizer from './components/WheelVisualizer.vue'
import { getCssVar } from './lib'
import vehicles from './lib/examples'
import { TireDescriptor, WheelDescriptor } from './lib/types'

type ReactiveSet = UnwrapNestedRefs<{
  wheel: WheelDescriptor
  tire: TireDescriptor
  color: () => string
  locked: boolean
}>

function createSet(color: () => string): ReactiveSet {
  const newSet = {
    wheel: { width: 9.5, diameter: 18, offset: 38 },
    tire: { width: 255, aspect: 35 },
    color,
    locked: false
  }

  return reactive(newSet)
}

const sets: ReactiveSet[] = [
  createSet(() => getCssVar('col0')),
  createSet(() => getCssVar('col1'))
]

const vehicle = ref('')
const rideheight = ref(0)

// focused values
const width = ref(sets[0].wheel.width)
const offset = ref(sets[0].wheel.offset)
</script>

<template>
  <main>
    <section>
      <div class="constrain">
        <h1>Car Wheel and Tire Size Visualizer</h1>
        <p>
          Select a vehicle from the dropdown to use as a reference, or just use
          the green and blue tires below. You can see the difference between
          them in the "Comparison" section below.
        </p>
        <p>
          The graph will compare your wheel size with (if you've selected a
          vehicle) sizes that other people put on their car.
        </p>
        <p>
          You can click on a point on the graph to see the details of those
          cars, including what tires and suspension system they have. Click
          "Lock" button under the wheel settings to prevent a wheel from being
          modified when you click the graph.
        </p>
        <p>
          The source code for this project is avalable at
          <a href="https://github.com/cjcarrick/wheel-size">
            github.com/cjcarrick/wheel-size</a
          >.
        </p>
        <Suspense>
          <VehicleSelector
            v-model:vehicle="vehicle"
            v-model:rideheight="rideheight"
          />
        </Suspense>
      </div>
    </section>

    <section class="_wheel">
      <div v-for="set in sets">
        <WheelControls
          class="wheel-controls"
          :wheel="set.wheel"
          :tire="set.tire"
          :vehicle="vehicle"
          v-model:locked="set.locked"
        />

        <WheelVisualizer
          :sets="[set]"
          :sets-are-reactive="true"
          :rideheight="0"
          :lines="[
            { label: 'Mounting Point', color: () => getCssVar('fg0'), x: 0 }
          ]"
          :scale="0.1"
        />
      </div>
    </section>

    <section class="_wheels">
      <div>
        <h2>Comparison</h2>
        <WheelVisualizer
          :sets="sets"
          :sets-are-reactive="true"
          :rideheight="rideheight"
          :lines="[
            { label: 'Mounting Point', color: () => getCssVar('fg0'), x: 0 }
          ]"
          :scale="0.1"
        />
      </div>
      <div class="_graph">
        <Suspense>
          <OffsetGraph
            :sets="sets"
            :lines="[]"
            :vehicle="vehicle"
            :rideheight="rideheight"
            v-model:offset="offset"
            v-model:width="width"
          />
        </Suspense>
      </div>
    </section>

    <section class="list" v-if="vehicles[vehicle]">
      <Suspense>
        <ExamplesList
          :key="vehicle"
          :vehicle="vehicle"
          :width="width"
          :offset="offset"
        />
      </Suspense>
    </section>
  </main>

  <footer>
    <div class="constrain"></div>
  </footer>
</template>

<style lang="scss">
@import './assets/index.scss';
</style>

<style lang="scss">
footer {
  background: $bg1;
  margin-top: 8rem;
  padding: 6rem $pad 8rem $pad;
  p {
    text-align: center;
  }
}
main {
  display: flex;
  flex-direction: row;
  align-items: center;
  flex-wrap: wrap;
  padding: $pad;

  section {
    position: relative;
    border-radius: $br;
    padding: $pad;
    background: $bg1;
    box-sizing: border-box;

    // display: flex;
    // align-items: center;
    // justify-content: center;
  }
}

section {
  width: 100%;
  box-sizing: border-box;
  max-width: $maxWidth;
  padding: $pad;
  margin: $pad * 0.5 auto;
}

.constrain {
  width: 100%;
  max-width: $textWidth;
  margin: 1rem auto;
}

._wheel {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  > div {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
}

.graph {
  display: flex;
  flex: 1 1 auto;
  min-height: 40vh;

  canvas {
    flex: 1 1 auto;
    object-fit: none;
    object-position: top left;
  }
}

.list {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.row {
  display: flex;
  flex-direction: row;
  justify-content: center;
  flex-wrap: wrap;
  gap: $pad;
}
.col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $pad;
}

h2 {
  text-align: center;
}

.speedo {
  h3,
  p {
    margin: 0;
  }
  p {
    max-width: 512px;
  }
}
._wheels {
  display: flex;
  flex-direction: row;
  align-items: stretch;
  ._graph {
    flex: 1;
  }
  @media (max-width: 699px) {
    align-items: center;
    flex-direction: column;
    ._graph {
      align-self: stretch;
    }
  }
}
</style>
