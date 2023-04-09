<script setup lang="ts">
import Dropdown from './Dropdown.vue'
import NumberInput from './NumberInput.vue'

defineProps<{ vehicle: string; rideheight: number }>()
defineEmits(['update:vehicle', 'update:rideheight'])

const res = await fetch('/wheel-size/examples/index.json')
const examplesIndex = (await res.json()) as {
  [car: string]: { [wheelWidth: string]: number[] }
}
</script>

<template>
  <table class="_examples">
    <tr>
      <th>Vehicle</th>
      <td>
        <Dropdown
        class="dropdown"
          :choices="Object.keys(examplesIndex)"
          :model-value="vehicle"
          @update:model-value="a => $emit('update:vehicle', a)"
        />
      </td>
    </tr>

    <!-- <tr> -->
    <!--   <th>Ride Height Modification (Inches)</th> -->
    <!--   <td> -->
    <!--     <NumberInput -->
    <!--       :min="-6" -->
    <!--       :max="12" -->
    <!--       :default-value="0" -->
    <!--       :step="0.25" -->
    <!--       :model-value="rideheight" -->
    <!--       :precision="2" -->
    <!--       @update:modelValue="a => $emit('update:rideheight', a)" -->
    <!--     /> -->
    <!--   </td> -->
    <!-- </tr> -->
  </table>
</template>

<style lang="scss">
._examples {
  width: 100%;
  border-spacing: 0 $pad;

  .dropdown {
    min-width: 4rem;
  }

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
