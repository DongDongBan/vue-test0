<script setup>
// S1：只搭骨架，数据与交互在后续步骤接入
const columns = [
  { status: 'todo', title: '待办' },
  { status: 'doing', title: '进行中' },
  { status: 'done', title: '已完成' },
]
</script>

<template>
  <div class="app">
    <header class="app-header">
      <div>
        <h1 class="app-title">任务看板</h1>
        <p class="app-subtitle">用三列管理任务的流转</p>
      </div>
      <button class="btn-create" type="button">新建任务</button>
    </header>

    <main class="board">
      <section v-for="column in columns" :key="column.status" class="column">
        <header class="column-header">
          <h2 class="column-title">{{ column.title }}</h2>
          <span class="column-count">0</span>
        </header>
        <p class="column-empty">暂无任务</p>
      </section>
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

.column {
  min-height: 240px;
  padding: var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--surface-muted);
}

.column-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: 0 var(--space-1) var(--space-3);
}

.column-title {
  font-size: 15px;
  font-weight: 600;
}

.column-count {
  min-width: 20px;
  padding: 0 6px;
  border-radius: 999px;
  background: var(--surface);
  color: var(--text-muted);
  font-size: 12px;
  text-align: center;
}

.column-empty {
  padding: var(--space-4);
  border: 1px dashed var(--border-strong);
  border-radius: var(--radius-md);
  color: var(--text-muted);
  font-size: 13px;
  text-align: center;
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
