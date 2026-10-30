<script setup>
import { computed, onMounted, provide, ref, watch } from 'vue'
import BoardColumn from './components/BoardColumn.vue'
import ConfirmDialog from './components/ConfirmDialog.vue'
import TaskFormDialog from './components/TaskFormDialog.vue'
import ToastHost from './components/ToastHost.vue'
import { useBoard } from './composables/useBoard.js'
import { DRAG_KEY, useDragDrop } from './composables/useDragDrop.js'
import { useToast } from './composables/useToast.js'

const {
  columns,
  stats,
  filterActive,
  loadStatus,
  saveStatus,
  addTask,
  updateTask,
  removeTask,
  moveTask,
} = useBoard()

const { toasts, push: pushToast, dismiss: dismissToast } = useToast()

const formOpen = ref(false)
const editingTask = ref(null)
const pendingDelete = ref(null)

const deleteMessage = computed(() =>
  pendingDelete.value ? '确定删除「' + pendingDelete.value.title + '」吗？此操作不可撤销。' : '',
)

// 拖拽只上报“谁落到哪一列的哪个下标”，写数据仍然走 useBoard 的命令
const drag = useDragDrop({
  onDrop({ id, status, index }) {
    moveTask(id, status, index)
    pushToast('任务已移动')
  },
})
provide(DRAG_KEY, drag)

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
          <span v-if="filterActive"> · 筛选时不可拖拽</span>
        </p>
      </div>
      <button class="btn-create" type="button" @click="openCreate">新建任务</button>
    </header>

    <main class="board">
      <BoardColumn
        v-for="column in columns"
        :key="column.value"
        :column="column"
        :draggable="!filterActive"
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

<style scoped src="./styles/app.css"></style>
