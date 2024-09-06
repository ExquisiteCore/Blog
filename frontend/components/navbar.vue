<template>
  <header :class="[
    'w-full sticky top-0 backdrop-blur transition-[background-color,border-width] border-x-0 flex justify-center z-10',
    scrollTop > 60 ? 'bg-background/50 border-b border-border/50' : ''
  ]">
    <div class="flex h-16 w-full items-center p-4 sm:p-8 md:max-w-screen-md 2xl:max-w-screen-xl">

      <NuxtLink to="/" class="mr-4 hidden sm:flex" aria-label="网站名称">
        <span class="ml-2 text-base font-semibold text-primary">
          网站名称
        </span>
      </NuxtLink>

    </div>
  </header>
</template>
<script setup>
import { ref, onMounted } from 'vue';
const scrollTop = ref(0);
const route = useRoute();
const handleScroll = () => {
  scrollTop.value = window.scrollY;
};

onMounted(() => {
  window.addEventListener('scroll', handleScroll);
});
</script>