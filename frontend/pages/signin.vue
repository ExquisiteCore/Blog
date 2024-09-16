<template>

  <div class="shell">
    <!-- 注册表单 -->
    <div :class="['container', 'a-container', { 'is-txl': isSignUp }]" id="a-container">
      <form @submit.prevent="handleRegister" class="form" id="a-form">
        <h2 class="form_title title">创建账号</h2>
        <span class="form_span">选择注册方式或电子邮箱注册</span>
        <input v-model="registerForm.username" type="text" class="form_input" placeholder="用户名">
        <input v-model="registerForm.password" type="password" class="form_input" placeholder="密码">
        <button class="form_button button submit" :disabled="isLoading">{{ isLoading ? '注册中...' : '注册' }}</button>
      </form>
    </div>

    <!-- 登录表单 -->
    <div :class="['container', 'b-container', { 'is-txl': isSignUp, 'is-z': isSignUp }]" id="b-container">
      <form @submit.prevent="handleLogin" class="form" id="b-form">
        <h2 class="form_title title">登入账号</h2>
        <span class="form_span">选择登录方式或电子邮箱登录</span>
        <input v-model="loginForm.username" type="text" class="form_input" placeholder="用户名">
        <input v-model="loginForm.password" type="password" class="form_input" placeholder="密码">
        <button class="form_button button submit" :disabled="isLoading">{{ isLoading ? '登录中...' : '登录' }}</button>
      </form>
    </div>

    <div :class="['switch', { 'is-txr': isSignUp }]" id="switch-cnt">
      <div :class="['switch_circle', { 'is-txr': isSignUp }]"></div>
      <div :class="['switch_circle', 'switch_circle-t', { 'is-txr': isSignUp }]"></div>
      <div :class="['switch_container', { 'is-hidden': isSignUp }]" id="switch-c1">
        <h2 class="switch_title title" style="letter-spacing: 0;">欢迎回来！</h2>
        <p class="switch_description description">已经有账号了吗，去登入账号来进入奇妙世界吧！！！</p>
        <button @click="toggleForm" class="switch_button button switch-btn">登录</button>
      </div>

      <div :class="['switch_container', { 'is-hidden': !isSignUp }]" id="switch-c2">
        <h2 class="switch_title title" style="letter-spacing: 0;">你好，朋友！</h2>
        <p class="switch_description description">去注册一个账号，成为尊贵的粉丝会员，让我们踏入奇妙的旅途！</p>
        <button @click="toggleForm" class="switch_button button switch-btn">注册</button>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
const isSignUp = ref(false)
const isLoading = ref(false)

const loginForm = reactive({
  username: '',
  password: ''
})

const registerForm = reactive({
  username: '',
  password: '',
  role: 1
})


const toggleForm = () => {
  isSignUp.value = !isSignUp.value
  nextTick(() => {
    const switchCtn = document.querySelector("#switch-cnt")
    switchCtn.classList.add("is-gx")
    setTimeout(() => {
      switchCtn.classList.remove("is-gx")
    }, 1500)
  })
}

const handleLogin = async () => {
  isLoading.value = true
  try {
    const data = await $fetch('http://rack1.raincs.cc:56394/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(loginForm),
      headers: {
        'Content-Type': 'application/json',
      }
    })
    useUserStore().setToken(data.token)
    useUserStore().setUsername(data.username)
    //console.log(useUserStore().isLoggedIn)
    useRouter().push('/')
  } catch (error) {
    console.error('登录错误:', error)
    alert('登录失败，请重试')
  } finally {
    isLoading.value = false
  }
}

const handleRegister = async () => {
  isLoading.value = true
  try {
    // 确保 registerForm 是一个包含必要数据的对象
    const requestBody = JSON.stringify(registerForm);

    // 配置请求选项
    const response = await $fetch('http://rack1.raincs.cc:56394/api/auth/register', {
      method: 'POST',
      body: requestBody, // 转换为 JSON 字符串
      headers: {
        'Content-Type': 'application/json',
      }
    });
    // 注册成功后的逻辑
    loginForm.username = registerForm.username;
    loginForm.password = registerForm.password;
    await handleLogin();
  } catch (error) {
    console.error('注册错误:', error);
    alert('注册失败，请重试');
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  /* 字体无法选中 */
  user-select: none;
}

body {
  width: 100%;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 12px;
  background-color: #ecf0f3;
  color: #a0a5a8;
}

.shell {
  position: absolute;
  /* 改为 absolute，便于相对于屏幕进行居中 */
  top: 50%;
  /* 垂直方向居中 */
  left: 50%;
  /* 水平方向居中 */
  transform: translate(-50%, -50%);
  /* 使用 transform 将其真正居中 */
  width: 1000px;
  min-width: 1000px;
  min-height: 600px;
  height: 600px;
  padding: 25px;
  background-color: #ecf0f3;
  box-shadow: 10px 10px 10px #d1d9e6, -10px -10px 10px #f9f9f9;
  border-radius: 12px;
  overflow: hidden;
}

/* 设置响应式 */
@media (max-width: 1200px) {
  .shell {
    transform: scale(0.7);
  }
}

@media (max-width: 1000px) {
  .shell {
    transform: scale(0.6);
  }
}

@media (max-width: 800px) {
  .shell {
    transform: scale(0.5);
  }
}

@media (max-width: 600px) {
  .shell {
    transform: scale(0.4);
  }
}

.container {
  display: flex;
  justify-content: center;
  align-items: center;
  position: absolute;
  top: 0;
  width: 600px;
  height: 100%;
  padding: 25px;
  background-color: #ecf0f3;
  transition: 1.25s;
}

.form {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  width: 100%;
  height: 100%;
}

.iconfont {
  margin: 0 5px;
  border: rgba(0, 0, 0, 0.5) 2px solid;
  border-radius: 50%;
  font-size: 25px;
  padding: 3px;
  opacity: 0.5;
  transition: 0.1s;
}

.iconfont:hover {
  opacity: 1;
  transition: 0.15s;
  cursor: pointer;
}

.form_input {
  width: 350px;
  height: 40px;
  margin: 4px 0;
  padding-left: 25px;
  font-size: 13px;
  letter-spacing: 0.15px;
  border: none;
  outline: none;
  background-color: #ecf0f3;
  transition: 0.25s ease;
  border-radius: 8px;
  box-shadow: inset 2px 2px 4px #d1d9e6, inset -2px -2px 4px #f9f9f9;
}

.form_input:focus {
  box-shadow: inset 4px 4px 4px #d1d9e6, inset -4px -4px 4px #f9f9f9;
}

.form_span {
  margin-top: 30px;
  margin-bottom: 12px;
}

.form_link {
  color: #181818;
  font-size: 15px;
  margin-top: 25px;
  border-bottom: 1px solid #a0a5a8;
  line-height: 2;
}

.title {
  font-size: 34px;
  font-weight: 700;
  line-height: 3;
  color: #181818;
  letter-spacing: 10px;
}

.description {
  font-size: 14px;
  letter-spacing: 0.25px;
  text-align: center;
  line-height: 1.6;
}

.button {
  width: 180px;
  height: 50px;
  border-radius: 25px;
  margin-top: 50px;
  font-weight: 700;
  font-size: 14px;
  letter-spacing: 1.15px;
  background-color: #4B70E2;
  color: #f9f9f9;
  box-shadow: 8px 8px 16px #d1d9e6, -8px -8px 16px #f9f9f9;
  border: none;
  outline: none;
}

.a-container {
  z-index: 100;
  left: calc(100% - 600px);
}

.b-container {
  left: calc(100% - 600px);
  z-index: 0;
}

.switch {
  display: flex;
  justify-content: center;
  align-items: center;
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 400px;
  padding: 50px;
  z-index: 200;
  transition: 1.25s;
  background-color: #ecf0f3;
  overflow: hidden;
  box-shadow: 4px 4px 10px #d1d9e6, -4px -4px 10px #d1d9e6;
}

.switch_circle {
  position: absolute;
  width: 500px;
  height: 500px;
  border-radius: 50%;
  background-color: #ecf0f3;
  box-shadow: inset 8px 8px 12px #b8bec7, inset -8px -8px 12px #fff;
  bottom: -60%;
  left: -60%;
  transition: 1.25s;
}

.switch_circle-t {
  top: -30%;
  left: 60%;
  width: 300px;
  height: 300px;
}

.switch_container {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  position: absolute;
  width: 400px;
  padding: 50px 55px;
  transition: 1.25s;
}

.switch_button {
  cursor: pointer;
}

.switch_button:hover,
.submit:hover {
  box-shadow: 6px 6px 10px #d1d9e6, -6px -6px 10px #f9f9f9;
  transform: scale(0.985);
  transition: 0.25s;
}

.switch_button:active,
.switch_button:focus {
  box-shadow: 2px 2px 6px #d1d9e6, -2px -2px 6px #f9f9f9;
  transform: scale(0.97);
  transition: 0.25s;
}

.is-txr {
  left: calc(100% - 400px);
  transition: 1.25s;
  transform-origin: left;
}

.is-txl {
  left: 0;
  transition: 1.25s;
  transform-origin: right;
}

.is-z {
  z-index: 200;
  transition: 1.25s;
}

.is-hidden {
  visibility: hidden;
  opacity: 0;
  position: absolute;
  transition: 1.25s;
}

.is-gx {
  animation: is-gx 1.25s;
}

@keyframes is-gx {

  0%,
  10%,
  100% {
    width: 400px;
  }

  30%,
  50% {
    width: 500px;
  }
}
</style>