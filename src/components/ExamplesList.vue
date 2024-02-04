<script setup lang="ts">
import { MagnifyingGlassIcon } from '@heroicons/vue/20/solid'
import { ref, watch } from 'vue'
import { getCssVar } from '../lib'
import { fetchExamples, isStaggered } from '../lib/examples'
import fuzzyFind from '../lib/fuzzyFind'
import { RequiredFitmentDescriptor } from '../lib/types'
import FuzzyResults from './FuzzyResults.vue'
import TextInput from './TextInput.vue'
import WheelVisualizer from './WheelVisualizer.vue'

const props = defineProps<{
  vehicle: string
  width: number
  offset: number
}>()

const offsetStr = (offset: number) => `${offset < 0 ? '' : '+'}${offset}`

const filter = ref('')
let dat = ref<Awaited<ReturnType<typeof fetchExamples>>>([])

const staggers = ref<boolean[]>([])
const rowVisible = ref<boolean[]>([])

const getData = async () => {
  let res = await fetchExamples(props.vehicle, props.width, props.offset)
	if (res.length == 0) console.warn('message', props.vehicle, props.offset, props.width)
  dat.value = []
  staggers.value = []
  let used: string[] = []
  for (let i = 0; i < res.length; i++) {
    const setup = res[i]

    if (!used.includes(setup.link)) {
      used.push(setup.link)
      dat.value.push(setup)

      const staggered = isStaggered(setup)
      staggers.value.push(staggered.tire || staggered.wheel)
    }
  }
}

const rows = ref<{
  slices: {
    text: string
    matched: boolean
  }[][]
}>({ slices: [] })

getData()
watch([() => props.offset, () => props.width, () => props.vehicle], getData)

parseRow(filter.value, dat.value)
watch([filter, dat], () => parseRow(filter.value, dat.value))

function parseRow(query: string, setups: RequiredFitmentDescriptor[]) {
  const strings: string[] = []

  for (let i = 0; i < setups.length; i++) {
    const setup = setups[i]
    const { wheel, tire } = setup

    strings.push(setup.description)
    strings.push(setup.suspension)

    strings.push(`${wheel.front.make} ${wheel.front.model}`)
    strings.push(
      `${wheel.front.diameter}x${wheel.front.width} ${offsetStr(
        wheel.front.offset
      )}`
    )
    strings.push(`${tire.front.make} ${tire.front.model}`)
    strings.push(
      `${tire.front.width}/${tire.front.aspect}R${wheel.front.diameter}`
    )

    strings.push(`${wheel.back.make} ${wheel.back.model}`)
    strings.push(
      `${wheel.back.diameter}x${wheel.back.width} ${offsetStr(
        wheel.back.offset
      )}`
    )
    strings.push(`${tire.back.make} ${tire.back.model}`)
    strings.push(
      `${tire.back.width}/${tire.back.aspect}R${wheel.back.diameter}`
    )
  }

  if (!query) {
    rowVisible.value = setups.map(() => true)
    rows.value.slices = strings.map(text => [{ text, matched: true }])
    return
  }

  const res = new fuzzyFind(query, strings, { sortResults: false })
  const slices = res.slicedResults()

  rowVisible.value = []
  for (let i = 0; i < setups.length; i++) {
    const slicesSlice = slices.slice(i * 10, i * 10 + 10)

    // Determine if each row should be visible at all
    let isVisible = false
    outer: for (let j = 0; j < slicesSlice.length; j++) {
      const s = slicesSlice[j]
      for (let k = 0; k < s.length; k++) {
        const m = s[k]
        isVisible = !!m.text.length && m.matched
        if (isVisible) break outer
      }
    }
    rowVisible.value.push(isVisible)
  }

  rows.value.slices = slices
}
</script>

<template>
	<h2>Gallery ({{ dat.length }} Results)</h2>
  <div class="_list">
    <div class="search-bar-container">
      <TextInput class="search-bar" v-model="filter" placeholder="Filter">
        <MagnifyingGlassIcon />
      </TextInput>
      <p class="num-results">
        <template v-if="filter">
          Shown:
          {{
            rowVisible.reduce(
              (prev, curr) => prev + (curr as unknown as number),
              0
            )
          }}
          of {{ dat.length }} total results
        </template>
      </p>
    </div>

    <div v-if="dat.length">
      <template v-for="(isStaggered, i) in staggers">
        <div
          class="row"
          v-show="rowVisible[i]"
          :class="{ staggered: isStaggered }"
        >
          <h3>
            <a :href="dat[i].link">
              <h4>
                <FuzzyResults
                  :query="filter"
                  :sliced-results="rows.slices[0 + i * 10]"
                />
              </h4>
            </a>
          </h3>

          <h3>
            <FuzzyResults
              :query="filter"
              :sliced-results="rows.slices[1 + i * 10]"
            />
          </h3>

          <div>
            <p class="front-or-rear" v-if="isStaggered">Front</p>
            <div class="wheel-tire-container">
              <p class="wheel-name">
                <FuzzyResults
                  :query="filter"
                  :sliced-results="rows.slices[2 + i * 10]"
                />
              </p>
              <p class="wheel-size">
                <FuzzyResults
                  :query="filter"
                  :sliced-results="rows.slices[3 + i * 10]"
                />
              </p>

              <p class="tire-name">
                <FuzzyResults
                  :query="filter"
                  :sliced-results="rows.slices[4 + i * 10]"
                />
              </p>
              <p class="tire-size">
                <FuzzyResults
                  :query="filter"
                  :sliced-results="rows.slices[5 + i * 10]"
                />
              </p>

              <div class="visualizer front" rowspan="2">
                <WheelVisualizer
                  :sets="[
                    {
                      wheel: dat[i].wheel.front,
                      tire: dat[i].tire.front,
                      color: () => getCssVar('fg0')
                    }
                  ]"
                  :sets-are-reactive="false"
                  :height="150"
                  :width="60"
                  :watch="false"
                  position="top-left"
                />
              </div>
            </div>
          </div>

          <div v-if="isStaggered">
            <p class="front-or-rear" v-if="isStaggered">Rear</p>
            <div class="wheel-tire-container">
              <p class="wheel-name">
                <FuzzyResults
                  :query="filter"
                  :sliced-results="rows.slices[6 + i * 10]"
                />
              </p>
              <p class="wheel-size">
                <FuzzyResults
                  :query="filter"
                  :sliced-results="rows.slices[7 + i * 10]"
                />
              </p>

              <p class="tire-name">
                <FuzzyResults
                  :query="filter"
                  :sliced-results="rows.slices[8 + i * 10]"
                />
              </p>
              <span class="tire-size">
                <FuzzyResults
                  :query="filter"
                  :sliced-results="rows.slices[9 + i * 10]"
                />
              </span>

              <div class="visualizer back" rowspan="2" v-show="isStaggered">
                <WheelVisualizer
                  :sets="[
                    {
                      wheel: dat[i].wheel.front,
                      tire: dat[i].tire.front,
                      color: () => getCssVar('fg0')
                    }
                  ]"
                  :sets-are-reactive="false"
                  :height="150"
                  :width="60"
                  :watch="false"
                  position="top-left"
                />
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>

    <p v-else class="no-results">No results.</p>
  </div>
</template>

<style lang="scss">
.search-bar-container {
  max-width: 400pt;
  margin: 3rem auto;
  .num-results {
    font-size: 0.8rem;
    opacity: 0.5;
    margin-top: 0.2em;
  }
}

._list {
  position: relative;
  width: 100%;
  .no-results {
    font-style: italic;
    text-align: center;
    opacity: 0.666;
  }
  p,
  h3,
  h4 {
    margin: 0;
  }
  .row {
    display: grid;
    padding: 2rem 0;
    max-width: 700pt;
    margin: 0 auto;
    grid-template-rows: auto auto;
    grid-template-columns: 1fr 1fr;
    gap: 0 3rem;
    > h3 {
      grid-column: 1 / 3;
    }
    .wheel-tire-container {
      position: relative;
      min-height: 150px;
      .wheel-name {
        text-transform: uppercase;
        font-size: 0.8rem;
        margin-top: 1rem;
      }
      .wheel-size {
        font-size: 1.4rem;
      }
      .tire-name {
        text-transform: uppercase;
        font-size: 0.8rem;
        margin-top: 1rem;
      }
      .tire-size {
        font-size: 1.4rem;
      }
      .visualizer {
        position: absolute;
        right: 0;
        top: 0;
      }
    }
  }
}
</style>
