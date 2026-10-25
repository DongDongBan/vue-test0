<script setup>
import HelloWorld from './components/HelloWorld.vue'
import TheWelcome from './components/TheWelcome.vue'
import Counter from './components/Counter.vue'
</script>

<template>
  <header>
    <div class="plogo">
      <img alt="Vue logo" class="logo" src="./assets/logo.svg" width="125" height="125" />
      <Counter />
    </div>
    

    <div class="wrapper">
      <HelloWorld msg="真的成了！" name="测试名"/>
    </div>
  </header>

  <main>
    <TheWelcome />
  </main>
</template>

<style scoped>
header {
  line-height: 1.5;
}

.logo {
  display: block;
  margin: 0 auto;
}
.plogo {
  display: block;
  margin: 0 auto 2rem;
}

@media (min-width: 1024px) {
  header {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }

  .plogo {
    margin: 0 2rem 0 0;
  }

  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  }
}
</style>
