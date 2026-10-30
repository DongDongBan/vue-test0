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
  // 当前是否处于筛选状态，决定空状态的文案
  filtered: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['edit', 'remove', 'move', 'status'])

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
  // 焦点在卡片内部按钮/下拉上时，让控件自己处理
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
          @status="emit('status', { id: task.id, status: $event })"
        />
      </li>
    </ul>
    <p v-else class="column-empty">
      {{ filtered ? '没有匹配的任务' : '暂无任务' }}
    </p>
  </section>
</template>

<style scoped src="./board-column.css"></style>
