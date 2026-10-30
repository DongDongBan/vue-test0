<script setup>
import { computed } from 'vue'
import {
  PRIORITY_LABELS,
  STATUSES,
  formatDate,
  isOverdue,
  toISODate,
} from '../domain/task.js'

const props = defineProps({
  task: {
    type: Object,
    required: true,
  },
})

// 只发事件、不直接改数据：删除/编辑/移动由父级决定怎么处理
defineEmits(['edit', 'remove', 'status'])

const priorityLabel = computed(() => PRIORITY_LABELS[props.task.priority] ?? props.task.priority)
const isDone = computed(() => props.task.status === 'done')
const overdue = computed(() => isOverdue(props.task))
const dueText = computed(() => (props.task.dueDate ? formatDate(props.task.dueDate) : ''))
// completedAt 是 ISO 时间戳，先转成本地日期再格式化，避免时区导致差一天
const completedText = computed(() =>
  props.task.completedAt ? formatDate(toISODate(new Date(props.task.completedAt))) : '',
)
</script>

<template>
  <article class="task-card" :class="{ 'is-done': isDone }">
    <h3 class="task-title">{{ task.title }}</h3>
    <p v-if="task.description" class="task-desc">{{ task.description }}</p>

    <div class="task-meta">
      <span class="badge" :class="'priority-' + task.priority">{{ priorityLabel }}</span>
      <span v-if="dueText" class="due" :class="{ overdue }">
        {{ overdue ? '逾期' : '截止' }} · {{ dueText }}
      </span>
      <span v-if="completedText" class="done-at">完成于 {{ completedText }}</span>
    </div>

    <ul v-if="task.tags.length > 0" class="tag-list">
      <li v-for="tag in task.tags" :key="tag" class="tag">{{ tag }}</li>
    </ul>

    <footer class="task-actions">
      <button
        class="action"
        type="button"
        :aria-label="'编辑任务：' + task.title"
        @click="$emit('edit', task)"
      >
        编辑
      </button>
      <button
        class="action action-danger"
        type="button"
        :aria-label="'删除任务：' + task.title"
        @click="$emit('remove', task)"
      >
        删除
      </button>
      <select
        class="move"
        title="移动到"
        :value="task.status"
        :aria-label="'移动任务：' + task.title"
        @change="$emit('status', $event.target.value)"
      >
        <option v-for="item in STATUSES" :key="item.value" :value="item.value">
          {{ item.label }}
        </option>
      </select>
    </footer>
  </article>
</template>

<style scoped src="./task-card.css"></style>
