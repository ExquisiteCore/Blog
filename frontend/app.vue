<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
useHead({
  meta: [
    { name: 'keywords', content: 'blog,vue,nuxt,rust,cpp,c++,golang,IT,IT技术,编程,技术博客,个人网站,前端,后端,全栈,计算机' },
    { name: 'author', content: 'EC' },
    { name: 'description', content: '我的神奇网站。' }
  ]
})
</script>