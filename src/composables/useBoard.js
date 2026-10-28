/**
 * 看板状态层：唯一的响应式状态源。
 * 组件只读这里的数据，所有修改都通过返回的 action 进入 domain 纯函数。
 */
import { computed, readonly, ref, watch } from 'vue'
import {
  addTask as addTaskIn,
  moveTask as moveTaskIn,
  removeTask as removeTaskIn,
  reorderTask as reorderTaskIn,
  updateTask as updateTaskIn,
} from '../domain/board.js'
import { createFilter, filterTasks, isFilterActive } from '../domain/filter.js'
import { summarize } from '../domain/stats.js'
import { createMemoryStorage, getDefaultStorage, loadBoard, saveBoard } from '../domain/storage.js'
import { STATUSES } from '../domain/task.js'

/**
 * @param {object} [options]
 * @param {object} [options.storage]      注入存储实现（默认用 localStorage，不可用则内存）
 * @param {Array}  [options.initialTasks] 跳过读取，直接给定初始任务（调试用）
 */
export function useBoard(options = {}) {
  const detectedStorage = options.storage ?? getDefaultStorage()
  const storage = detectedStorage ?? createMemoryStorage()
  const isPersistent = Boolean(detectedStorage)

  const initial = options.initialTasks
    ? { tasks: options.initialTasks, status: 'ok' }
    : loadBoard(storage)

  const tasks = ref(initial.tasks)
  const filter = ref(createFilter())

  /** 读取结果：ok / empty / corrupted / partial / unavailable */
  const loadStatus = ref(initial.status)
  /** 最近一次写入结果：idle / ok / quota / unavailable */
  const saveStatus = ref('idle')

  const visibleTasks = computed(() => filterTasks(tasks.value, filter.value))

  /** 三列数据：列定义来自 STATUSES，任务按状态分组，顺序沿用数组顺序 */
  const columns = computed(() =>
    STATUSES.map((status) => ({
      ...status,
      tasks: visibleTasks.value.filter((task) => task.status === status.value),
    })),
  )

  /** 统计只针对“当前可见”的任务，满足 FR-08 的计数随筛选变化 */
  const stats = computed(() => summarize(visibleTasks.value))

  const filterActive = computed(() => isFilterActive(filter.value))

  // 任何一次改动都会替换 tasks 的引用，监听壳即可；多次同步修改会被合并成一次写入
  watch(tasks, (value) => {
    const result = saveBoard(value, storage)
    saveStatus.value = result.ok ? 'ok' : result.reason
  })

  function addTask(input) {
    tasks.value = addTaskIn(tasks.value, input)
  }

  function updateTask(id, patch) {
    tasks.value = updateTaskIn(tasks.value, id, patch)
  }

  function removeTask(id) {
    tasks.value = removeTaskIn(tasks.value, id)
  }

  function moveTask(id, toStatus, toIndex) {
    tasks.value = moveTaskIn(tasks.value, id, toStatus, toIndex)
  }

  function reorderTask(id, toIndex) {
    tasks.value = reorderTaskIn(tasks.value, id, toIndex)
  }

  function setFilter(patch) {
    filter.value = { ...filter.value, ...patch }
  }

  function setKeyword(keyword) {
    setFilter({ keyword })
  }

  function togglePriority(priority) {
    const current = filter.value.priorities
    setFilter({
      priorities: current.includes(priority)
        ? current.filter((item) => item !== priority)
        : [...current, priority],
    })
  }

  function setDue(due) {
    setFilter({ due })
  }

  function clearFilter() {
    filter.value = createFilter()
  }

  return {
    // 只读状态
    tasks: readonly(tasks),
    filter: readonly(filter),
    visibleTasks,
    columns,
    stats,
    filterActive,
    loadStatus: readonly(loadStatus),
    saveStatus: readonly(saveStatus),
    isPersistent,

    // 命令
    addTask,
    updateTask,
    removeTask,
    moveTask,
    reorderTask,

    // 筛选
    setKeyword,
    togglePriority,
    setDue,
    clearFilter,
  }
}
