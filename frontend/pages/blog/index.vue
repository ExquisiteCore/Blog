<template>
  <div class="max-w-screen-wrapper mx-auto px-6 flex min-h-screen flex-col px-6 pb-24 pt-8">
    <h2 class="pb-8 text-3xl font-bold md:text-4xl">最新文章</h2>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">{{ count.data.value }}</div>
  </div>
</template>

<script setup lang="ts">
const count = await useFetch('http://localhost:8080/api/test')
</script>