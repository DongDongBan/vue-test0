<script setup>
import { useColumnDrag } from '../composables/useColumnDrag.js'
import TaskCard from './TaskCard.vue'

const props = defineProps({
  column: {
    type: Object,
    required: true,
  },
  // 筛选状态下关闭拖拽：可见列表与真实列表顺序不一致，下标无法安全换算
  draggable: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['edit', 'remove', 'move'])

const {
  draggingId,
  target,
  isDragging,
  onDragStart,
  onDragEnd,
  onCardDragOver,
  onColumnDragOver,
  onDrop,
  isSlot,
} = useColumnDrag(props)

const DIRECTIONS = {
  ArrowLeft: 'left',
  ArrowRight: 'right',
  ArrowUp: 'up',
  ArrowDown: 'down',
}

// 键盘等价操作：Enter 编辑、Delete 删除、Ctrl/Command + 方向键移动
function onCardKeydown(event, task) {
  // 焦点在卡片内部按钮上时，让按钮自己处理
  if (event.target !== event.currentTarget) return

  if (event.key === 'Enter') {
    event.preventDefault()
    emit('edit', task)
    return
  }

  if (event.key === 'Delete') {
    event.preventDefault()
    emit('remove', task)
    return
  }

  const modifier = event.ctrlKey || event.metaKey
  const direction = DIRECTIONS[event.key]
  if (!modifier || !direction) return

  event.preventDefault()
  emit('move', { id: task.id, direction })
}
</script>

<template>
  <section
    class="column"
    :class="{ 'is-drop-target': isDragging && target.status === column.value }"
    :aria-labelledby="'column-title-' + column.value"
    @dragover.prevent="onColumnDragOver"
    @drop.prevent="onDrop"
  >
    <header class="column-header">
      <h2 :id="'column-title-' + column.value" class="column-title">
        {{ column.label }}
      </h2>
      <span class="column-count">{{ column.tasks.length }}</span>
    </header>

    <ul v-if="column.tasks.length > 0" class="task-list">
      <li
        v-for="(task, index) in column.tasks"
        :key="task.id"
        class="task-item"
        :class="{
          'is-dragging': draggingId === task.id,
          'is-drop-before': isSlot(index),
          'is-drop-after': isSlot(column.tasks.length) && index === column.tasks.length - 1,
        }"
        :draggable="draggable"
        tabindex="0"
        :data-task-id="task.id"
        @keydown="onCardKeydown($event, task)"
        @dragstart="onDragStart($event, task)"
        @dragend="onDragEnd"
        @dragover.prevent.stop="onCardDragOver($event, index)"
      >
        <TaskCard
          :task="task"
          @edit="emit('edit', $event)"
          @remove="emit('remove', $event)"
        />
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
  transition: border-color var(--duration) var(--easing);
}

.column.is-drop-target {
  border-color: var(--primary);
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

.task-item {
  position: relative;
  border-radius: var(--radius-md);
}

/* 键盘聚焦时给出明确的位置感（全局 :focus-visible 负责描边） */
.task-item:focus-visible {
  outline-offset: 3px;
}

/* 拖动中的卡片半透明，留出“它被拿起来了”的视觉暗示 */
.task-item.is-dragging {
  opacity: 0.45;
}

/* 落点指示线：画在卡片上方/下方的间隙里 */
.task-item.is-drop-before::before,
.task-item.is-drop-after::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  height: 2px;
  border-radius: 1px;
  background: var(--primary);
}

.task-item.is-drop-before::before {
  top: calc(var(--space-2) / -2 - 1px);
}

.task-item.is-drop-after::after {
  bottom: calc(var(--space-2) / -2 - 1px);
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
