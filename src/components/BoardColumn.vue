<script setup>
defineProps({
  // 列数据由父组件组装：{ value, label, tasks }
  column: {
    type: Object,
    required: true,
  },
})
</script>

<template>
  <section class="column" :aria-labelledby="'column-title-' + column.value">
    <header class="column-header">
      <h2 :id="'column-title-' + column.value" class="column-title">
        {{ column.label }}
      </h2>
      <span class="column-count">{{ column.tasks.length }}</span>
    </header>

    <ul v-if="column.tasks.length > 0" class="task-list">
      <li v-for="task in column.tasks" :key="task.id" class="task-placeholder">
        {{ task.title }}
      </li>
    </ul>
    <p v-else class="column-empty">暂无任务</p>
  </section>
</template>

<style scoped>
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

.task-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

/* S8 的占位卡片，S9 会被 TaskCard 组件替换 */
.task-placeholder {
  padding: var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface);
  font-size: 14px;
}

.column-empty {
  padding: var(--space-4);
  border: 1px dashed var(--border-strong);
  border-radius: var(--radius-md);
  color: var(--text-muted);
  font-size: 13px;
  text-align: center;
}
</style>
