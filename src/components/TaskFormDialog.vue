<script setup>
import { nextTick, onMounted, reactive, ref } from 'vue'
import { LIMITS, PRIORITIES, STATUSES, normalizeTags, validateTask } from '../domain/task.js'

const props = defineProps({
  // 传 task 表示编辑，不传表示新建
  task: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['submit', 'close'])

const isEdit = Boolean(props.task)

const form = reactive({
  title: props.task?.title ?? '',
  description: props.task?.description ?? '',
  priority: props.task?.priority ?? 'medium',
  status: props.task?.status ?? 'todo',
  tags: (props.task?.tags ?? []).join(', '),
  dueDate: props.task?.dueDate ?? '',
})

const errors = reactive({})
const titleInput = ref(null)
const panel = ref(null)

onMounted(() => titleInput.value?.focus())

// 用户开始修改某个字段时，立刻移除该字段的错误提示
function clearError(field) {
  delete errors[field]
}

function submit() {
  for (const key of Object.keys(errors)) delete errors[key]

  const payload = {
    title: form.title,
    description: form.description,
    priority: form.priority,
    status: form.status,
    tags: normalizeTags(form.tags),
    dueDate: form.dueDate || null,
  }

  const result = validateTask(payload)
  if (!result.valid) {
    Object.assign(errors, result.errors)
    // 焦点移到第一个出错的控件，键盘用户不用自己找
    nextTick(() => {
      panel.value?.querySelector('[aria-invalid="true"]')?.focus()
    })
    return
  }

  emit('submit', payload)
}
</script>

<template>
  <div class="backdrop" @click.self="emit('close')">
    <div
      ref="panel"
      class="panel"
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-form-title"
      @keydown.esc="emit('close')"
    >
      <h2 id="task-form-title" class="title">{{ isEdit ? '编辑任务' : '新建任务' }}</h2>

      <form class="form" novalidate @submit.prevent="submit">
        <label class="field">
          <span class="label">标题 <em class="required">*</em></span>
          <input
            ref="titleInput"
            v-model="form.title"
            class="input"
            type="text"
            :maxlength="LIMITS.title"
            :aria-invalid="errors.title ? 'true' : null"
            :aria-describedby="errors.title ? 'error-title' : null"
            @input="clearError('title')"
          />
          <span v-if="errors.title" id="error-title" class="error">{{ errors.title }}</span>
        </label>

        <label class="field">
          <span class="label">描述</span>
          <textarea
            v-model="form.description"
            class="input textarea"
            rows="3"
            :maxlength="LIMITS.description"
            :aria-invalid="errors.description ? 'true' : null"
            @input="clearError('description')"
          />
          <span v-if="errors.description" class="error">{{ errors.description }}</span>
        </label>

        <div class="row">
          <label class="field">
            <span class="label">优先级</span>
            <select v-model="form.priority" class="input" @change="clearError('priority')">
              <option v-for="item in PRIORITIES" :key="item.value" :value="item.value">
                {{ item.label }}
              </option>
            </select>
          </label>

          <label class="field">
            <span class="label">所在列</span>
            <select v-model="form.status" class="input" @change="clearError('status')">
              <option v-for="item in STATUSES" :key="item.value" :value="item.value">
                {{ item.label }}
              </option>
            </select>
          </label>
        </div>

        <label class="field">
          <span class="label">标签</span>
          <input
            v-model="form.tags"
            class="input"
            type="text"
            placeholder="用逗号分隔，最多 5 个"
            :aria-invalid="errors.tags ? 'true' : null"
            @input="clearError('tags')"
          />
          <span v-if="errors.tags" class="error">{{ errors.tags }}</span>
        </label>

        <label class="field">
          <span class="label">截止日期</span>
          <input
            v-model="form.dueDate"
            class="input"
            type="date"
            :aria-invalid="errors.dueDate ? 'true' : null"
            @input="clearError('dueDate')"
          />
          <span v-if="errors.dueDate" class="error">{{ errors.dueDate }}</span>
        </label>

        <div class="actions">
          <button class="btn" type="button" @click="emit('close')">取消</button>
          <button class="btn btn-primary" type="submit">{{ isEdit ? '保存' : '创建' }}</button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped src="./task-form.css"></style>
