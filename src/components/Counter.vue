<script setup>
import { ref } from 'vue'
const count = ref(0)
</script>

<template>
  <button @click="count++">点了 {{ count }} 次</button>
</template>

<style scoped>
button {
  display: block;   /* 行内元素变成块级，才能用 auto margin 居中 */
  margin: 0 auto;   /* 左右外边距自动均分 → 水平居中 */
}
</style>