<template>
  <VueTyper :text="['一名前端开发工程师 。', 'A Web <Developer /> .']" :repeat="Infinity" :shuffle="false" initial-delay="500"
    :pre-type-delay="1000" :type-delay="10" :pre-erase-delay="1000" :erase-delay="10" erase-style="backspace"
    :erase-on-complete="false" caret-animation="blink" class="text-2xl tracking-widest md:text-5xl" />
</template>

<script setup>
import { VueTyper } from 'vue3-typer'
import 'vue3-typer/dist/vue3-typer.css'
</script>

<style scoped>
/* 可以在这里添加任何特定的样式 */
.vue-typer .custom.char.typed {
  color: inherit;
}

.vue-typer .custom.caret {
  background-color: currentColor;
}
</style>