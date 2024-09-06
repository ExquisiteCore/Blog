<template>
  <div>
    <Navbar />
    <main className="min-h-[calc(100vh-190px)]">
      <slot />
    </main>
    <footer>脚</footer>
  </div>
</template>