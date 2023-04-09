<script setup lang="ts">
import { computed, UnwrapNestedRefs } from 'vue'
import { WheelDescriptor, type TireDescriptor } from '../lib/types'

type ReactiveSet = UnwrapNestedRefs<{
  wheel: UnwrapNestedRefs<WheelDescriptor>
  tire: UnwrapNestedRefs<TireDescriptor>
  color: string
}>
const props = defineProps<{ set1: ReactiveSet; set2: ReactiveSet }>()

const mm = (inches: number) => inches * 25.4

const outerPoke = (set: ReactiveSet) => {
  return set.wheel.offset + mm(set.wheel.width)
}

const outerDiameter = (set: ReactiveSet) => {
  let c = set.tire.width * set.tire.aspect * 0.01
  let b = (mm(set.wheel.width) - set.tire.width) * 0.5
  let a = (c ** 2 - b ** 2) ** 0.5
  a = isNaN(a) ? 0 : a

  return a * 2 + mm(set.wheel.diameter)
}

const speedoError = computed(() => {
  const circumference1 = Math.PI * outerDiameter(props.set1)
  const circumference2 = Math.PI * outerDiameter(props.set2)
  const diff = (circumference2 - circumference1) / circumference1
  return diff
})
</script>

<template>
  <table class="_calculated">
    <tr>
      <td></td>

      <td>
        {{ set1.wheel.diameter }}x{{ set1.wheel.width }}
        {{ set1.wheel.offset < 0 ? '-' : '+' }}{{ set1.wheel.offset }}
        {{ set1.tire.width }}/{{ set1.tire.aspect }}R{{ set1.wheel.diameter }}
      </td>

      <td>
        {{ set2.wheel.diameter }}x{{ set2.wheel.width }}
        {{ set2.wheel.offset < 0 ? '-' : '+' }}{{ set2.wheel.offset }}
        {{ set2.tire.width }}/{{ set2.tire.aspect }}R{{ set2.wheel.diameter }}
      </td>

      <td></td>
    </tr>
    <tr>
      <td>Outer Diameter (mm)</td>
      <td>{{ outerDiameter(set1).toFixed(1) }}</td>
      <td>{{ outerDiameter(set2).toFixed(1) }}</td>
      <td>{{ (outerDiameter(set2) - outerDiameter(set1)).toFixed(1) }}</td>
    </tr>
    <tr>
      <td>Poke (mm)</td>
      <td>{{ outerPoke(set1).toFixed(1) }}</td>
      <td>{{ outerPoke(set2).toFixed(1) }}</td>
      <td>{{ (outerPoke(set2) - outerPoke(set1)).toFixed(1) }}</td>
    </tr>

    <tr>
      <td>30 MPH Will Read (mm)</td>
      <td>30.0</td>
      <td>{{ (30 - speedoError * 30).toFixed(1) }}</td>
      <td>{{ (-speedoError * 100).toFixed(1) }}%</td>
    </tr>

    <tr>
      <td>Ride Height Change (mm)</td>
      <td>--</td>
      <td>--</td>
      <td>
        {{ ((outerDiameter(set2) - outerDiameter(set1)) / 2).toFixed(1) }}
      </td>
    </tr>
  </table>
</template>

<style lang="scss">
._calculated {
  td {
    min-width: 5rem;
    padding: 0.25rem $pad;
    &:not(:first-child) {
      text-align: right;
      color: black;
    }

    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
  }

  table {
    border-spacing: 0 1pt;
  }

  @for $i from 0 through 10 {
    td:nth-child(#{$i}n + 1):not(:first-child):not(:last-child) {
      background: hsla($i * 30, 60%, 60%, 40%);
    }
  }
}
</style>
