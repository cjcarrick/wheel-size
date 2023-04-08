<script setup lang="ts">
import { reactive, ref, UnwrapNestedRefs } from 'vue'
import CalculatedResults from './components/CalculatedResults.vue'
import ExamplesList from './components/ExamplesList.vue'
import OffsetGraph from './components/OffsetGraph.vue'
import VehicleSelector from './components/VehicleSelector.vue'
import WheelControls from './components/WheelControls.vue'
import WheelVisualizerSvg from './components/WheelVisualizer.vue'
import { getCssVar } from './lib/dom'
import vehicles from './lib/examples'
import { TireDescriptor, WheelDescriptor } from './lib/types'

type ReactiveSet = UnwrapNestedRefs<{
  wheel: WheelDescriptor
  tire: TireDescriptor
  color: string
  locked: boolean
}>

let numSets = 0
function createSet(): ReactiveSet {
  const newSet = {
    wheel: {
      width: 9.5,
      diameter: 18,
      offset: 38
    },
    tire: { width: 255, aspect: 35 },
    color: getCssVar(`col${numSets++}`),
    locked: false
  }

  return reactive(newSet)
}

const sets: ReactiveSet[] = [createSet(), createSet()]

const vehicle = ref('')
const rideheight = ref(0)

// focused values
const width = ref(9)
const offset = ref(0)
</script>

<template>
  <nav>
    <h3>Wheel and Tire Size visualizer</h3>
  </nav>

  <section>
    <p class="constrain">
      It can be difficult to tell what size wheels and tires will fit your car,
      and what the result will look like. This tool aims to help visualize this,
      as well as present examples of what other people with that car are
      running.
    </p>

    <p class="constrain">
      Note that other sites exist that perform similar functionality, but they
      are usually trying first and foremost to sell wheels, and their
      visualizations and calculations are often incorrect. This site uses proper
      trignometric calculations to accurately determine figures like outer
      diameter, etc. Additionally, no other sites provide both visualizations
      and quick reference to setups from the community.
    </p>
  </section>

  <main>
    <section class="_wheel" v-for="set in sets">
      <WheelControls
        class="wheel-controls"
        :wheel="set.wheel"
        :tire="set.tire"
        :vehicle="vehicle"
        v-model:locked="set.locked"
      />

      <WheelVisualizerSvg
        :sets="[set]"
        :rideheight="0"
        :lines="[
          ...(vehicles[vehicle]?.guides ?? []),
          { label: 'Mounting Point', color: 'var(--fg0)', x: 0 }
        ]"
        :scale="0.1"
      />
    </section>

    <section class="_wheels">
      <CalculatedResults :set1="sets[0]" :set2="sets[1]" />

      <WheelVisualizerSvg
        :sets="sets"
        :rideheight="rideheight"
        :lines="[
          ...(vehicles[vehicle]?.guides ?? []),
          { label: 'Mounting Point', color: () => getCssVar('fg0'), x: 0 }
        ]"
        :scale="0.1"
      />
    </section>

    <section class="graph">
      <Suspense>
        <OffsetGraph
          :sets="sets"
          :lines="vehicles[vehicle]?.guides ?? []"
          :vehicle="vehicle"
          :rideheight="rideheight"
          v-model:offset="offset"
          v-model:width="width"
        />
      </Suspense>
    </section>

    <section class="list">
      <div class="constrain">
        <Suspense>
          <VehicleSelector
            v-model:vehicle="vehicle"
            v-model:rideheight="rideheight"
          />
        </Suspense>
      </div>

      <template v-if="vehicles[vehicle]">
        <h1>Gallery</h1>

        <Suspense>
          <ExamplesList :vehicle="vehicle" :width="width" :offset="offset" />
        </Suspense>
      </template>
    </section>
  </main>

  <footer>
    <div class="constrain">
      <p>
        This project is
        <a href="https://github.com/cjcarrick/wheel-size">open source</a> and
        contributions are welcome.
      </p>
    </div>
  </footer>
</template>

<style lang="scss">
@import './assets/index.scss';
</style>

<style lang="scss">
nav,
footer {
  background: $bg1;
}
nav {
  padding: 1rem $pad;
  h3 {
    margin: 0;
  }
}
footer {
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
    border: 1px solid $bg2;
    box-sizing: border-box;

    display: flex;
    align-items: center;
    justify-content: center;
  }
}

section {
  width: 100%;
  // box-sizing: border-box;
  max-width: $maxWidth;
  padding: $pad;
  margin: $pad * 0.5 auto;
}

.constrain {
  width: 100%;
  max-width: $textWidth;
  margin: 1rem auto;
}

._wheel,
._wheels {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
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
</style>
