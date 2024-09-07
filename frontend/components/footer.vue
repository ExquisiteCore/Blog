<template>
  <footer class="px-6 py-12">

    <dl class="max-w-screen-wrapper mx-auto px-6 flex flex-col gap-3">
      <dt class="text-lg font-semibold text-primary">导航</dt>
      <dd v-for="el in navItems" :key="el.link">
        <NuxtLink :to="el.link" class="flex items-center transition-colors hover:font-semibold hover:text-primary">
          {{ el.label }}
        </NuxtLink>
      </dd>
    </dl>

    <div
      class="max-w-screen-wrapper mx-auto px-6 flex flex-col items-center justify-center space-y-1 pt-24 text-sm text-muted-foreground md:flex-row md:space-x-4 md:space-y-0">

      <div class="order-3">
        <NuxtLink to="https://github.com/exquisitecore/" target="_blank" title="https://github.com/exquisitecore/"
          aria-label="https://github.com/exquisitecore/">
          &copy; {{ new Date().getFullYear() }} 精致的芯 &nbsp;&nbsp;·&nbsp;&nbsp;
          ExqusiteCore
        </NuxtLink>
      </div>
    </div>


  </footer>
</template>

<script setup>


const navItems = [
  { label: '首页', link: '/' },
  { label: '博客', link: '/blog' },
  { label: '关于', link: '/about' }
];

</script>
