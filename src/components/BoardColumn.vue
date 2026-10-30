<script setup>
import { inject, ref } from 'vue'
import { DRAG_KEY, toMoveIndex } from '../composables/useDragDrop.js'
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

const emit = defineEmits(['edit', 'remove'])

// 拖拽是跨列共享的交互状态，用 provide/inject 注入，避免逐层传回调
const drag = inject(DRAG_KEY, null)
const draggingId = drag ? drag.draggingId : ref(null)
const target = drag ? drag.target : ref({ status: null, slot: null })
const isDragging = drag ? drag.isDragging : ref(false)

function onDragStart(event, task) {
  if (!props.draggable || !drag) {
    event.preventDefault()
    return
  }
  drag.start(task, event)
}

function onDragEnd() {
  drag?.end()
}

function onCardDragOver(event, index) {
  if (!isDragging.value || !drag) return
  const rect = event.currentTarget.getBoundingClientRect()
  const after = event.clientY > rect.top + rect.height / 2
  drag.hover(props.column.value, index + (after ? 1 : 0))
}

function onColumnDragOver(event) {
  if (!isDragging.value || !drag) return
  const items = event.currentTarget.querySelectorAll('.task-item')
  if (items.length === 0) {
    drag.hover(props.column.value, 0)
    return
  }
  const last = items[items.length - 1].getBoundingClientRect()
  if (event.clientY > last.bottom) {
    drag.hover(props.column.value, props.column.tasks.length)
  }
}

function onDrop() {
  if (!drag) return
  const slot = target.value.slot ?? props.column.tasks.length
  const fromIndex = props.column.tasks.findIndex((task) => task.id === draggingId.value)
  drag.drop(props.column.value, toMoveIndex(fromIndex, slot))
}

function isSlot(index) {
  return (
    isDragging.value &&
    target.value.status === props.column.value &&
    target.value.slot === index
  )
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
