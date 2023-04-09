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
  <TextInput v-model="filter" placeholder="Filter">
    <MagnifyingGlassIcon />
  </TextInput>

  <div class="_list">
    <table v-if="dat.length">
      <thead>
        <tr>
          <th></th>
          <th colspan="2">Front</th>
          <th colspan="2">Rear</th>
        </tr>
      </thead>

      <tbody>
        <template v-for="(isStaggered, i) in staggers">
          <tr v-show="rowVisible[i]" :class="{ staggered: isStaggered }">
            <th>
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
            </th>

            <td class="wheel front">
              <h4>
                <FuzzyResults
                  :query="filter"
                  :sliced-results="rows.slices[2 + i * 10]"
                />
              </h4>
              <p>
                <FuzzyResults
                  :query="filter"
                  :sliced-results="rows.slices[3 + i * 10]"
                />
              </p>
            </td>

            <td class="visualizer front" rowspan="2">
              <WheelVisualizer
                :sets="[
                  {
                    wheel: dat[i].wheel.front,
                    tire: dat[i].tire.front,
                    color: getCssVar('fg0')
                  }
                ]"
                :sets-are-reactive="false"
                :height="150"
                :width="60"
                :watch="false"
                position="top-left"
              />
            </td>

            <td class="wheel" :class="{ back: !filter }">
              <h4>
                <FuzzyResults
                  :query="filter"
                  :sliced-results="rows.slices[6 + i * 10]"
                />
              </h4>
              <p>
                <FuzzyResults
                  :query="filter"
                  :sliced-results="rows.slices[7 + i * 10]"
                />
              </p>
            </td>

            <td class="visualizer" rowspan="2" :class="{ back: !filter }">
              <WheelVisualizer
                :sets="[
                  {
                    wheel: dat[i].wheel.front,
                    tire: dat[i].tire.front,
                    color: getCssVar('fg0')
                  }
                ]"
                :sets-are-reactive="false"
                :height="150"
                :width="60"
                :watch="false"
                position="top-left"
              />
            </td>
          </tr>

          <tr v-show="rowVisible[i]">
            <th>
              <h3>
                <FuzzyResults
                  :query="filter"
                  :sliced-results="rows.slices[1 + i * 10]"
                />
              </h3>
            </th>

            <td class="tire front">
              <h4>
                <FuzzyResults
                  :query="filter"
                  :sliced-results="rows.slices[4 + i * 10]"
                />
              </h4>
              <p>
                <FuzzyResults
                  :query="filter"
                  :sliced-results="rows.slices[5 + i * 10]"
                />
              </p>
            </td>

            <td class="tire" :class="{ back: !filter }">
              <h4>
                <FuzzyResults
                  :query="filter"
                  :sliced-results="rows.slices[8 + i * 10]"
                />
              </h4>
              <p>
                <FuzzyResults
                  :query="filter"
                  :sliced-results="rows.slices[9 + i * 10]"
                />
              </p>
            </td>
          </tr>
        </template>
      </tbody>
    </table>

    <p v-else class="no-results">No results.</p>
  </div>
</template>

<style lang="scss">
._list {
  position: relative;
  width: 100%;

  .no-results {
    font-style: italic;
    text-align: center;
    opacity: 0.666;
  }

  table {
    max-width: calc($pad * 2 + 100%);
    overflow-x: auto;
    display: block;
    border-spacing: 0;
    margin: $pad -1 * $pad 0 -1 * $pad;
  }
  td {
    padding: 0;
  }

  thead {
    th {
      background: $bg1;
      padding: 1rem;
    }
  }

  // fake "border spacing"
  td,
  th {
    box-sizing: border-box;
    &:nth-child(1) {
      padding-left: 1rem;
    }
    &:nth-child(1),
    &:nth-child(2n + 1) {
      padding-right: 2rem;
    }
  }

  tbody {
    td {
      width: 16rem;
      max-width: 16rem;
    }
    th {
      width: 20rem;
      max-width: 20rem;
      text-align: left;
    }

    h3,
    p,
    h4 {
      line-height: 1em;
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;
      margin: 0;
    }
    h4 {
      font-size: 0.8rem;
      text-transform: uppercase;
      padding: 0.5rem 1rem 0.25rem 0;
    }
    p {
      font-size: 1.25rem;
      padding: 0 1rem 0.5rem 0;
    }

    tr:not(.staggered) {
      td.back {
        opacity: 0.2;
      }
    }

    tr:nth-child(1n) {
      td,
      th {
        vertical-align: bottom;
      }
    }
    tr:nth-child(2n) {
      td,
      th {
        vertical-align: top;
      }
    }
  }

  .no-match {
    opacity: 0.2;
  }
}

._inputs {
  th {
    font-size: 0.75rem;
    color: $fg0;
    text-transform: uppercase;
    text-align: left;
    font-weight: normal;
  }

  td {
    max-width: 20rem;
  }
}
</style>
