<template>
  <div class="flex flex-col items-center p-4">
    <h1 class="text-2xl font-bold mb-4 text-center">你好，我是 ExquisiteCore 👋</h1>

    <h2 class="text-xl font-semibold mb-2 text-center">🎄 访客 🎄</h2>
    <img class="mb-4" src="https://moe-counter.glitch.me/get/@exquisitecore?theme=meborru" alt="访客">

    <ul class="list-disc list-inside mb-4 text-center">
      <li>一名热爱开源的中国学生</li>
      <li>动漫爱好者</li>
      <li>喜欢生电但不精通的Minecraft玩家</li>
      <li>
        喜欢的编程语言
        <span class="inline-flex space-x-2">
          <img class="w-20 h-10"
            src="https://img.shields.io/badge/-Csharp-purple?style=flat-square&logo=Csharp&logoColor=fff" alt="Csharp">
          <img class="w-20 h-10"
            src="https://img.shields.io/badge/-C++-blue?style=flat-square&logo=c%2B%2B&logoColor=fff" alt="C++">
          <img class="w-20 h-10" src="https://img.shields.io/badge/-Rust-tan?style=flat-square&logo=Rust&logoColor=fff"
            alt="Rust">
        </span>
      </li>
      <li>
        我的系统
        <span class="inline-flex space-x-2">
          <img class="w-20 h-10"
            src="https://img.shields.io/badge/-windows-blue?style=flat-square&logo=windows&logoColor=fff" alt="Windows">
          <img class="w-20 h-10"
            src="https://img.shields.io/badge/-ubuntu-orange?style=flat-square&logo=ubuntu&logoColor=fff" alt="Ubuntu">
        </span>
      </li>
    </ul>

    <p class="mb-4 text-center">喜欢写一些简单的代码和一些好玩的小东西</p>

    <h2 class="text-xl font-semibold mb-2 text-center">我的爱好</h2>
    <ul class="list-disc list-inside text-center">
      <li>喜欢尝试各种新鲜事物和折腾</li>
      <li>动漫 and 二刺螈</li>
      <li>水群</li>
      <li>来点 Music</li>
      <li>美味的东西</li>
      <li>打游戏</li>
      <li>喜欢计算机，目前主要是 C#、C++ 和 Rust。进一步的东西还在学习中。。。 </li>
      <li>刷机 (才不是大变活砖)</li>
      <li>目前正在写一些好玩的项目 (鸽子)，快来给我点 star</li>
    </ul>
  </div>
</template>

<script setup lang="ts">

useHead({
  title: '关于我 - ExquisiteCore',
  meta: [
    { name: 'description', content: '关于 ExquisiteCore 的介绍，包括我的爱好、我的系统、我的编程语言等。' },
    { name: 'keywords', content: 'ExquisiteCore, 关于我, 关于, 介绍, 爱好, 系统, 编程语言' }
  ]
})

</script>
