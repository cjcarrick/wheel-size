<script setup lang="ts">
import { reactive } from 'vue'
import vehicles from '../lib/examples'
import { TireDescriptor, WheelDescriptor } from '../lib/types'
import Button from './Button.vue'
import NumberInput from './NumberInput.vue'

const props = defineProps<{
  wheel: WheelDescriptor
  tire: TireDescriptor
  vehicle: string
  locked: boolean
}>()

defineEmits(['update:locked'])

const wheel = reactive(props.wheel)
const tire = reactive(props.tire)

const reset = () => {
  if (!props.vehicle || !(props.vehicle in vehicles)) return
  let { stock } = vehicles[props.vehicle]
  wheel.offset = stock.wheel.front.offset
  wheel.width = stock.wheel.front.width
  wheel.diameter = stock.wheel.front.diameter

  tire.width = stock.tire.front.width
  tire.aspect = stock.tire.front.aspect
}
</script>

<template>
  <table class="_wheel-controls">
    <tr>
      <td colspan="2" class="setup">
        {{ wheel.diameter.toFixed(0) }}x{{ wheel.width.toFixed(1) }}
        {{ wheel.offset < 0 ? '' : '+' }}{{ wheel.offset.toFixed(0) }}
        {{ tire.width.toFixed(0) }}/{{ tire.aspect.toFixed(0) }}R{{
          wheel.diameter.toFixed(0)
        }}
      </td>
    </tr>
    <tr>
      <td>Wheel Diameter</td>
      <td>
        <NumberInput
          v-model="wheel.diameter"
          :min="14"
          :max="30"
          :step="1"
          :default-value="18"
          :disabled="locked"
        />
      </td>
    </tr>

    <tr>
      <td>Wheel Width</td>
      <td>
        <NumberInput
          v-model="wheel.width"
          :precision="1"
          :min="5"
          :max="12"
          :step="0.5"
          :default-value="9.5"
          :disabled="locked"
        />
      </td>
    </tr>
    <tr>
      <td>Wheel Offset</td>
      <td>
        <NumberInput
          v-model="wheel.offset"
          :min="-50"
          :max="50"
          :step="1"
          :default-value="0"
          :disabled="locked"
        />
      </td>
    </tr>

    <tr>
      <td>Tire Width</td>
      <td>
        <NumberInput
          v-model="tire.width"
          :min="55"
          :max="355"
          :step="5"
          :default-value="255"
          :disabled="locked"
        />
      </td>
    </tr>
    <tr>
      <td>Tire Aspect Ratio</td>
      <td>
        <NumberInput
          v-model="tire.aspect"
          :min="0"
          :max="100"
          :step="5"
          :default-value="35"
          :disabled="locked"
        />
      </td>
    </tr>

    <tr v-if="vehicle && vehicle in vehicles">
      <td colspan="2">
        <Button :disabled="locked" :onclick="reset">Reset to OE</Button>
      </td>
    </tr>

    <tr>
      <td colspan="2">
        <Button
          :checked="locked"
          @update:checked="a => $emit('update:locked', a)"
        >
          {{ locked ? 'Locked' : 'Lock' }}
        </Button>
      </td>
    </tr>
  </table>
</template>

<style lang="scss">
._wheel-controls {
  table {
    width: fit-content;
    max-width: 100%;
  }
  td {
    padding: 0.2rem 1rem;
  }

  .setup {
    text-align: center;
    font-size: 1.2rem;
    font-weight: bold;
    color: $fg1;
    padding: 1em;
    border-radius: $br;

    .highlighted {
      background: rgba($color: $col0, $alpha: 0.2);
    }
  }
}
</style>
