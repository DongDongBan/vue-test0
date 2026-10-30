<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import BoardColumn from './components/BoardColumn.vue'
import ConfirmDialog from './components/ConfirmDialog.vue'
import TaskFormDialog from './components/TaskFormDialog.vue'
import ToastHost from './components/ToastHost.vue'
import { useBoard } from './composables/useBoard.js'

const { columns, stats, loadStatus, saveStatus, addTask, updateTask, removeTask } = useBoard()

const formOpen = ref(false)
const editingTask = ref(null)
const pendingDelete = ref(null)
const toasts = ref([])
let toastId = 0

const deleteMessage = computed(() =>
  pendingDelete.value ? '确定删除「' + pendingDelete.value.title + '」吗？此操作不可撤销。' : '',
)

function pushToast(message) {
  const id = ++toastId
  toasts.value = [...toasts.value, { id, message }]
  setTimeout(() => dismissToast(id), 3000)
}

function dismissToast(id) {
  toasts.value = toasts.value.filter((toast) => toast.id !== id)
}

function openCreate() {
  editingTask.value = null
  formOpen.value = true
}

function openEdit(task) {
  editingTask.value = task
  formOpen.value = true
}

function closeForm() {
  formOpen.value = false
  editingTask.value = null
}

function handleSubmit(payload) {
  if (editingTask.value) {
    updateTask(editingTask.value.id, payload)
    pushToast('修改已保存')
  } else {
    addTask(payload)
    pushToast('任务已创建')
  }
  closeForm()
}

function askDelete(task) {
  pendingDelete.value = task
}

function confirmDelete() {
  if (!pendingDelete.value) return
  removeTask(pendingDelete.value.id)
  pendingDelete.value = null
  pushToast('任务已删除')
}

// 读取异常只在启动时提示一次
onMounted(() => {
  if (loadStatus.value === 'corrupted') pushToast('本地数据读取失败，已重置为空看板')
  if (loadStatus.value === 'partial') pushToast('部分任务数据无法读取，已忽略')
  if (loadStatus.value === 'unavailable') pushToast('浏览器存储不可用，本次修改不会被保存')
})

// 写入异常随时可能发生（例如配额满）
watch(saveStatus, (status) => {
  if (status === 'quota') pushToast('存储空间不足，本次修改未保存')
  if (status === 'unavailable') pushToast('存储不可用，本次修改未保存')
})
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
      <button class="btn-create" type="button" @click="openCreate">新建任务</button>
    </header>

    <main class="board">
      <BoardColumn
        v-for="column in columns"
        :key="column.value"
        :column="column"
        @edit="openEdit"
        @remove="askDelete"
      />
    </main>

    <TaskFormDialog
      v-if="formOpen"
      :task="editingTask"
      @submit="handleSubmit"
      @close="closeForm"
    />

    <ConfirmDialog
      v-if="pendingDelete"
      title="删除任务"
      :message="deleteMessage"
      confirm-label="删除"
      danger
      @confirm="confirmDelete"
      @cancel="pendingDelete = null"
    />

    <ToastHost :toasts="toasts" @dismiss="dismissToast" />
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
