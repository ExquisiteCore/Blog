<template>
  <div>
    <div class="flex flex-col items-center max-w-screen-lg mx-auto px-6 py-12">
      <!-- 图片展示 -->
      <div class="flex justify-center mb-8">
        <img :src="getPreviewImage(postData?.Preview || '')" alt="文章图片"
          class="w-72 h-72 object-cover rounded-lg shadow-lg">
      </div>
      <!-- 文章标题 -->
      <h1 class="text-4xl font-bold text-center mb-4">{{ postData?.Title }}</h1>
      <!-- 显示文章数据 -->

      <!-- 标签和字数统计 -->
      <div class="flex justify-center items-center space-x-4 mb-8">
        Tags
        <span v-for="(tag, index) in postData?.Tags" :key="index"
          class="bg-orange-400 text-white px-3 py-1 rounded-full text-sm">
          {{ tag }}
        </span>
      </div>
    </div>
    <!-- 文章内容和目录 -->
    <div class="flex justify-between w-full">
      <div class="flex-1">
        <MdPreview v-model="renderedContent" previewTheme="arknights" :editorId="id" />
      </div>
      <!-- 竖线分隔符 -->
      <div class="w-px bg-gray-300 mx-4"></div>
      <div class="flex-none sticky top-20 h-screen overflow-auto">
        <MdCatalog :editorId="id" scrollElement="html" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';
import { MdPreview, MdCatalog } from 'md-editor-v3';

import '@vavt/cm-extension/dist/previewTheme/arknights.css';
const id = 'article-markdown-editor';

const route = useRoute();
const seq = route.query.seq || '';

const postData = ref<Post | null>(null) // 定义 ref 来存储文章数据

const renderedContent = ref()
// 定义接口以匹配 API 数据结构
interface Post {
  ID: number
  CreatedAt: string
  UpdatedAt: string
  DeletedAt: string | null
  Title: string
  Content: string
  Preview: string
  Tags: string[]
}

interface FetchData {
  data: Post
  message: string
}

const { data, error } = await useFetch<FetchData>(`${useRuntimeConfig().public.api}/api/post/${seq}`)
if (error.value) {
  console.error('获取文章失败', error.value)
}
if (data.value?.data) {
  postData.value = data.value.data // 仅在数据存在时赋值
  renderedContent.value = data.value.data.Content
}

// 将 Preview 字段转换为图片路径的函数
const getPreviewImage = (preview: string) => {
  // 返回图片路径，假设 preview 是图片名
  return `/images/${preview}.png`
  //return '/images/al.png'
}

useHead({
  title: `${postData.value?.Title} - EC的博客`,
  meta: [
    { name: 'description', content: `${postData.value?.Content.slice(0, 150)}...` },
    { name: 'keywords', content: postData.value?.Tags.join(',') }
  ]
})
</script>