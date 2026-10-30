<script setup>
import { computed } from 'vue'
import { PRIORITY_LABELS, formatDate, isOverdue, toISODate } from '../domain/task.js'

const props = defineProps({
  task: {
    type: Object,
    required: true,
  },
})

// 只发事件、不直接改数据：删除/编辑由父级决定怎么处理
defineEmits(['edit', 'remove'])

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
    </footer>
  </article>
</template>

<style scoped>
.task-card {
  padding: var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface);
  box-shadow: var(--shadow-sm);
  transition:
    box-shadow var(--duration) var(--easing),
    border-color var(--duration) var(--easing);
}

.task-card:hover {
  border-color: var(--border-strong);
  box-shadow: var(--shadow-md);
}

.task-title {
  font-size: 14px;
  font-weight: 600;
  line-height: 1.4;
  overflow-wrap: anywhere;
}

.is-done .task-title {
  color: var(--text-muted);
  text-decoration: line-through;
}

.task-desc {
  margin-top: var(--space-1);
  color: var(--text-muted);
  font-size: 13px;
  line-height: 1.5;
  /* 描述最多两行，超出省略 */
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.task-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
  margin-top: var(--space-2);
  font-size: 12px;
}

.badge {
  padding: 1px 8px;
  border-radius: 999px;
  font-weight: 500;
}

.priority-high {
  color: var(--priority-high);
  background: var(--danger-soft);
}

.priority-medium {
  color: var(--priority-medium);
  background: rgba(181, 71, 8, 0.12);
}

.priority-low {
  color: var(--priority-low);
  background: var(--surface-muted);
}

.due {
  color: var(--text-muted);
}

.due.overdue {
  color: var(--danger);
  font-weight: 600;
}

.done-at {
  color: var(--success);
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
  margin-top: var(--space-2);
}

.tag {
  padding: 0 6px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  font-size: 11px;
}

.task-actions {
  display: flex;
  gap: var(--space-2);
  margin-top: var(--space-3);
  padding-top: var(--space-2);
  border-top: 1px solid var(--border);
}

.action {
  padding: 2px 8px;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-muted);
  font-size: 12px;
}

.action:hover {
  background: var(--surface-hover);
  color: var(--text);
}

.action-danger:hover {
  color: var(--danger);
  background: var(--danger-soft);
}
</style>
