<template>
  <div class="max-w-screen-wrapper mx-auto px-6 flex min-h-screen flex-col pb-24 pt-8">

    <div>
      <h2 class="pb-8 text-3xl font-bold md:text-4xl">Markdown 编辑器</h2>

      <div class="mb-4 flex items-end">
        <div class="flex-1 mr-2">
          <label for="title" class="block text-lg font-medium">标题:</label>
          <input id="title" v-model="title" type="text"
            class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="输入标题" />
        </div>
        <div class="flex-1 mr-2">
          <label for="tags" class="block text-lg font-medium">标签 (用逗号分隔):</label>
          <input id="tags" v-model="tags" type="text"
            class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="输入标签" />
        </div>
        <button @click="uploadText" :disabled="loading" class="px-4 py-2 bg-blue-500 text-white rounded">
          上传
          <span v-if="loading" class="ml-2">Loading...</span>
        </button>
      </div>
    </div>

    <client-only>
      <MdEditor v-model="text" editorId="markdown-editor" />
    </client-only>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { MdEditor } from 'md-editor-v3';

const text = ref('# Hello World!');
const title = ref('');
const tags = ref('');
const isAdmin = ref(false);
const loading = ref(false);

interface UserResponse {
  is_admin: boolean;
  message: string;
}

interface UploadResponse {
  id: string;
  message: string;
}

const checkAdmin = async () => {
  try {
    const response = await $fetch('https://blogserver.exquisitecore.xyz/api/user/currentUser', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${useUserStore().getToken()}`
      }
    });

    const data = response as UserResponse;
    if (data.is_admin) {
      isAdmin.value = true;
    } else {
      alert('您不是管理员，无法上传');
    }
  } catch (error) {
    console.error('检查管理员权限错误:', error);
    alert('无法验证管理员权限，请重试');
  }
};

const uploadText = async () => {
  if (!isAdmin.value) {
    await checkAdmin();
    if (!isAdmin.value) return;
  }

  loading.value = true;

  try {
    const requestBody = JSON.stringify({
      Title: title.value,
      Content: text.value,
      Preview: "hover-css-preview",
      Tags: tags.value.split(',').map(tag => tag.trim())
    });

    const response = await $fetch('https://blogserver.exquisitecore.xyz/api/post/create', {
      method: 'POST',
      body: requestBody,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${useUserStore().getToken()}`
      }
    });

    const data = response as UploadResponse;
    console.log('上传成功:', data);
    alert('上传成功');
  } catch (error) {
    console.error('上传错误:', error);
    alert('上传失败，请重试');
    // 清空输入框
    title.value = '';
    tags.value = '';
    text.value = '# Hello World!';
  } finally {
    loading.value = false;
  }
};

onMounted(checkAdmin);

useHead({
  title: 'Markdown 编辑器'
})
</script>
