<template>
  <header :class="[
    'w-full sticky top-0 backdrop-blur transition-[background-color,border-width] border-x-0 flex justify-center z-10',
    scrollY.value > 60 ? 'bg-background/50 border-b border-border/50' : ''
  ]">
  </header>
</template>