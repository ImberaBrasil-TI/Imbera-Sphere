<script setup>
defineProps({
  title: String,
  subtitle: String
})
</script>

<template>
  <header class="mb-8">
    <h1 class="text-3xl font-extrabold text-gray-900 tracking-tight">{{ title }}</h1>
    <p v-if="subtitle" class="mt-2 text-lg text-gray-600">{{ subtitle }}</p>
  </header>
</template>
