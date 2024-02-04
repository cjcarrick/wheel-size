<script setup lang="ts">
defineProps<{
  query: string
  slicedResults?: { text: string; matched: boolean }[]
}>()
</script>

<template>
  <span v-if="!slicedResults"> unknown </span>

  <template v-else v-for="m in slicedResults">
    <span :class="{ match: query ? m.matched : undefined }">
      {{ m.text }}
    </span>
  </template>
</template>

<style scoped lang="scss">
.match {
	background: yellow;
}
</style>
