<script setup lang="ts">
import { reactive, ref, UnwrapNestedRefs } from 'vue'
import ExamplesList from './components/ExamplesList.vue'
import OffsetGraph from './components/OffsetGraph.vue'
import SpeedoErrorGraph from './components/SpeedoErrorGraph.vue'
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
const width = ref(9)
const offset = ref(0)
</script>

<template>
  <main>
    <section class="_wheel" v-for="set in sets">
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
    </section>

    <section class="_wheels">
      <h2>Summary</h2>
      <div class="row">
        <WheelVisualizer
          :sets="sets"
          :sets-are-reactive="true"
          :rideheight="rideheight"
          :lines="[
            { label: 'Mounting Point', color: () => getCssVar('fg0'), x: 0 }
          ]"
          :scale="0.1"
        />

        <div class="speedo col">
          <h3>Speedo Error</h3>
          <SpeedoErrorGraph :sets="sets" />
          <p>
            A change in the outer diameter my result in the speedometer reading
            incorrectly. Assuming that the green line represents the readings
            from OEM tires, the blue represents new speedometer readings.
          </p>
        </div>
      </div>
    </section>

    <section class="graph">
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
      <p><a href="https://github.com/cjcarrick/wheel-size">Source</a></p>
    </div>
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
    border: 1px solid $bg2;
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
</style>
