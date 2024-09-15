import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useUserStore = defineStore('userStore', () => {
  // 确保在客户端执行时初始化 token
  const token = ref('');
  const username = ref('');
  // 在客户端获取 token
  onMounted(() => {
    token.value = localStorage.getItem('userStore:token') || '';
    username.value = localStorage.getItem('userStore:username') || '';
  });

  const isLoggedIn = computed(() => !!token.value); // 计算属性，token 不为空则表示已登录
  // 设置 token，并将其存储到 localStorage
  const setToken = (value: string) => {
    token.value = value;
    try {
      localStorage.setItem('userStore:token', value);
    } catch (error) {
      console.error('保存 token 到 localStorage 失败:', error);
    }
  };

  // 获取 token
  const getToken = () => token.value;

  // 设置 username localStorage
  const setUsername = (value: string) => {
    username.value = value;
    try {
      localStorage.setItem('userStore:username', value);
    } catch (error) {
      console.error('保存 username 到 localStorage 失败:', error);
    }
  };

  const getUsername = () => username.value;


  return { token, username, isLoggedIn, setUsername, getUsername, setToken, getToken };
});
