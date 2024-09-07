<template>
  <div class="text-2xl tracking-widest md:text-5xl">{{ text }}</div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const text = ref('');
const strings = ['C++应属于文学', 'Hello World'];
const typingSpeed = 100;
const delayBetweenStrings = 1000;
const loop = true;

let currentStringIndex = 0;
let charIndex = 0;

const type = () => {
  if (charIndex < strings[currentStringIndex].length) {
    text.value += strings[currentStringIndex][charIndex];
    charIndex++;
    setTimeout(type, typingSpeed);
  } else {
    setTimeout(() => {
      charIndex = 0;
      text.value = '';
      currentStringIndex = (currentStringIndex + 1) % strings.length;
      type();
    }, delayBetweenStrings);
  }
};

onMounted(() => {
  type();
});
</script>

<style scoped>
.text-2xl {
  font-size: 1.5rem;
}

.tracking-widest {
  letter-spacing: 0.1em;
}

.md\:text-5xl {
  font-size: 3rem;
}
</style>
