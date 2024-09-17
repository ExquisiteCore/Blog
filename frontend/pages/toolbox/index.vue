<template>
  <div class="max-w-screen-wrapper mx-auto px-6 flex min-h-screen flex-col pb-24 pt-8">
    <h2 class="pb-8 text-3xl font-bold md:text-4xl">Tools</h2>
    <!-- 栅格布局：一行最多3个 -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="tool in tools" :key="tool.ID"
        class="shadow-3xl bg-white shadow-lg rounded-lg overflow-hidden transform transition-transform hover:scale-105 duration-300 ease-in-out">
        <NuxtLink :to="'/toolbox/' + tool.link.toString()">
          <!-- 手动填写的工具箱项目 -->
          <img :src="tool.image" alt="tool preview" class="w-full h-48 object-cover">
          <div class="p-4">
            <!-- 工具名称 -->
            <h2 class="text-lg font-bold text-gray-800 mb-2">{{ tool.title }}</h2>

            <p class="text-gray-600 text-sm mb-4">{{ tool.description }}</p>
          </div>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

// 手动填写的工具数据
const tools = ref([
  {
    ID: 1,
    title: 'Markdown 编辑器',
    image: '/images/md.png',
    description: '一款功能强大的 Markdown 编辑器，支持语法高亮、实时预览、导出 HTML 等功能。',
    link: 'Markdown'
  }
])

useHead({
  title: '工具箱 - Blog',
  meta: [
    { name: 'description', content: 'Blog 工具箱，包含常用的工具，如 Markdown 编辑器、代码格式化工具等。' }
  ]
})
</script>

<style scoped>
/* 可根据需要定制样式 */
</style>
