<script setup>
import { DUE_FILTERS } from '../domain/filter.js'
import { PRIORITIES } from '../domain/task.js'

defineProps({
  filter: {
    type: Object,
    required: true,
  },
  // 是否处于“有筛选”状态，决定清空按钮是否可用
  active: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['keyword', 'toggle-priority', 'due', 'clear'])
</script>

<template>
  <div class="toolbar" role="search" aria-label="任务筛选">
    <label class="search">
      <span class="visually-hidden">搜索任务</span>
      <input
        class="input"
        type="search"
        placeholder="搜索标题、描述、标签…"
        :value="filter.keyword"
        @input="emit('keyword', $event.target.value)"
      />
    </label>

    <fieldset class="priorities">
      <legend class="visually-hidden">按优先级筛选</legend>
      <label
        v-for="item in PRIORITIES"
        :key="item.value"
        class="chip"
        :class="{ 'is-on': filter.priorities.includes(item.value) }"
      >
        <input
          type="checkbox"
          :checked="filter.priorities.includes(item.value)"
          @change="emit('toggle-priority', item.value)"
        />
        <span>{{ item.label }}</span>
      </label>
    </fieldset>

    <label class="due">
      <span class="visually-hidden">按截止时间筛选</span>
      <select class="input" :value="filter.due" @change="emit('due', $event.target.value)">
        <option v-for="item in DUE_FILTERS" :key="item.value" :value="item.value">
          {{ item.label }}
        </option>
      </select>
    </label>

    <button class="clear" type="button" :disabled="!active" @click="emit('clear')">
      清空筛选
    </button>
  </div>
</template>

<style scoped>
.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}

.search {
  flex: 1 1 220px;
}

.input {
  width: 100%;
  padding: var(--space-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface);
  color: var(--text);
  font-size: 14px;
}

.input:focus {
  border-color: var(--primary);
}

.priorities {
  display: flex;
  gap: var(--space-2);
  margin: 0;
  padding: 0;
  border: 0;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: 4px 10px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--surface);
  color: var(--text-muted);
  font-size: 13px;
  cursor: pointer;
}

.chip.is-on {
  border-color: var(--primary);
  background: var(--primary-soft);
  color: var(--primary);
}

.chip input {
  margin: 0;
}

.due .input {
  width: auto;
}

.clear {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--text-muted);
  font-size: 13px;
}

.clear:disabled {
  opacity: 0.5;
}

.clear:not(:disabled):hover {
  background: var(--surface-hover);
  color: var(--text);
}

@media (max-width: 767px) {
  .search {
    flex-basis: 100%;
  }
}
</style>
