<script setup>
import BoardColumn from './components/BoardColumn.vue'
import { useBoard } from './composables/useBoard.js'

// 状态层只在这里创建一次，向下通过 props 传递
const { columns, stats } = useBoard()
</script>

<template>
  <div class="app">
    <header class="app-header">
      <div>
        <h1 class="app-title">任务看板</h1>
        <p class="app-subtitle">
          共 {{ stats.total }} 个任务
          <span v-if="stats.total > 0"> · 完成率 {{ stats.completionRate }}%</span>
          <span v-if="stats.overdue > 0"> · 逾期 {{ stats.overdue }}</span>
        </p>
      </div>
      <button class="btn-create" type="button">新建任务</button>
    </header>

    <main class="board">
      <BoardColumn v-for="column in columns" :key="column.value" :column="column" />
    </main>
  </div>
</template>

<style scoped>
.app {
  max-width: 1280px;
  margin: 0 auto;
  padding: var(--space-5);
}

.app-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
  margin-bottom: var(--space-5);
}

.app-title {
  font-size: 24px;
  font-weight: 600;
  line-height: 1.3;
}

.app-subtitle {
  margin-top: var(--space-1);
  color: var(--text-muted);
  font-size: 14px;
}

.btn-create {
  flex-shrink: 0;
  padding: var(--space-2) var(--space-4);
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  background: var(--primary);
  color: var(--text-inverse);
  font-size: 14px;
  font-weight: 500;
  transition: background var(--duration) var(--easing);
}

.btn-create:hover {
  background: var(--primary-hover);
}

.board {
  display: grid;
  /* minmax(0, 1fr)：允许列被压缩，避免长内容撑破网格 */
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-4);
  align-items: start;
}

@media (max-width: 1023px) {
  .board {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 767px) {
  .app {
    padding: var(--space-4);
  }

  .board {
    grid-template-columns: 1fr;
  }
}
</style>
