<template>
  <div class="max-w-screen-wrapper mx-auto px-6 flex min-h-screen flex-col pb-24 pt-8">
    <h2 class="pb-8 text-3xl font-bold md:text-4xl">最新文章</h2>
    <!-- 栅格布局：一行最多3个 -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="post in sortedPosts" :key="post.ID"
        class="shadow-3xl bg-white shadow-lg rounded-lg overflow-hidden transform transition-transform hover:scale-105 duration-300 ease-in-out">
        <NuxtLink :to="'/blog/' + post.ID.toString()">
          <!-- 图片区域 -->
          <img :src="getPreviewImage(post.Preview)" alt="preview" class="w-full h-48 object-cover">

          <!-- 文章内容区域 -->
          <div class="p-4">
            <!-- 文章标题 -->
            <h2 class="text-lg font-bold text-gray-800 mb-2">{{ post.Title }}</h2>

            <!-- 创建和修改时间 -->
            <p class="text-gray-500 text-sm">更新时间 {{ formatDate(post.UpdatedAt) }}</p>
            <p class="text-gray-500 text-sm mb-2">创建时间 {{ formatDate(post.CreatedAt) }}</p>

            <!-- 标签区域 -->
            <div class="flex gap-2 mt-4">
              <span v-for="tag in post.Tags" :key="tag"
                class="text-xs font-medium text-white bg-purple-500 rounded-full px-2 py-1">
                {{ tag }}
              </span>
            </div>
          </div>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
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
  data: Post[]
  message: string
}
const posts = ref<any[]>([])
//使用 useFetch 从 API 获取文章数据
const { data, error } = await useFetch<FetchData>(`${useRuntimeConfig().public.api}/api/post/posts`)
// 检查是否有错误
if (error.value) {
  console.error('获取文章失败', error.value)
}
posts.value = data.value?.data || []



//const sortedPosts = ref(posts.value.sort((a, b) => b.ID - a.ID));
// 响应式排序
const sortedPosts = ref<Post[]>([])
watch(posts, (newPosts) => {
  sortedPosts.value = newPosts.sort((a, b) => b.ID - a.ID)
}, { immediate: true })
// 将 Preview 字段转换为图片路径的函数
const getPreviewImage = (preview: string) => {
  // 返回图片路径，假设 preview 是图片名
  return `/images/${preview}.png`
  //return '/images/al.png'
}

// 格式化日期的函数
const formatDate = (dateStr: string) => {
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }
  return new Date(dateStr).toLocaleDateString('zh-CN', options)
}

useHead({
  title: 'EC的博客 - 首页',
  meta: [
    { name: 'description', content: '博客首页' }
  ]
})
</script>

<style scoped>
/* 你可以根据需要定制一些样式 */
</style>
