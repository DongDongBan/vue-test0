/**
 * 看板操作：增、删、改、移动、重排。
 * 全部是不可变操作：返回新数组，绝不修改入参数组或其中的任务对象。
 */
import { STATUS_VALUES, TaskValidationError, createTask, validateTask } from './task.js'

/** 按 id 查找；找不到返回 null，比 undefined 更明确 */
export function findTask(tasks, id) {
  return tasks.find((task) => task.id === id) ?? null
}

/**
 * 新建任务并放到数组最前面。
 * 数组顺序 == 列内顺序，所以“放最前”就是“显示在所在列的顶部”。
 */
export function addTask(tasks, input, now = new Date()) {
  const task = createTask(input, now)
  return [task, ...tasks]
}

/**
 * 更新任务：合并补丁 → 重新校验 → 生成新对象。
 * - id 与 createdAt 是身份，不允许通过补丁修改
 * - completedAt 由状态派生，补丁里传了也会被忽略
 * - 找不到 id 时原样返回（幂等），避免竞态下抛出无意义的错误
 */
export function updateTask(tasks, id, patch, now = new Date()) {
  const index = tasks.findIndex((task) => task.id === id)
  if (index === -1) return tasks

  const current = tasks[index]
  const merged = {
    ...current,
    ...patch,
    id: current.id,
    createdAt: current.createdAt,
  }

  const { valid, errors, value } = validateTask(merged)
  if (!valid) throw new TaskValidationError(errors)

  const nextTask = {
    ...current,
    title: value.title,
    description: value.description,
    tags: value.tags,
    assignee: value.assignee,
    priority: merged.priority,
    // 空字符串与 null 都表示“没有截止日”，统一归一成 null
    dueDate: merged.dueDate || null,
  }

  // 只复制数组外壳，未修改的任务对象保持引用不变，减少渲染 diff
  const nextTasks = tasks.slice()
  nextTasks[index] = switchStatus(nextTask, merged.status, now)
  return nextTasks
}

/** 删除任务；id 不存在时返回原数组引用 */
export function removeTask(tasks, id) {
  const index = tasks.findIndex((task) => task.id === id)
  if (index === -1) return tasks

  const nextTasks = tasks.slice()
  nextTasks.splice(index, 1)
  return nextTasks
}

/**
 * 移动任务到目标列的指定位置。
 *
 * toIndex 的语义：**在目标列“移除该任务之后”的剩余任务中**的插入位置。
 *   0            → 列首
 *   列长度        → 列尾（也接受越界值，自动收敛到列尾）
 * 这样定义可以让同列、跨列共用一套计算，不必为“删除导致的索引位移”做特判。
 *
 * 同一列内移动就是列内排序，所以 FR-06 不需要另一个函数。
 */
export function moveTask(tasks, id, toStatus, toIndex, now = new Date()) {
  const current = findTask(tasks, id)
  if (!current) return tasks

  if (!STATUS_VALUES.includes(toStatus)) {
    throw new TaskValidationError({ status: '未知的任务状态' })
  }

  // 先移除，再在“剩余任务”里计算插入点
  const rest = tasks.filter((task) => task.id !== id)
  const columnIds = rest
    .filter((task) => task.status === toStatus)
    .map((task) => task.id)

  const targetIndex = Number.isInteger(toIndex)
    ? Math.min(Math.max(toIndex, 0), columnIds.length)
    : columnIds.length

  let insertAt
  if (columnIds.length === 0) {
    // 目标列为空：放到数组末尾即可，列内顺序仍是唯一的
    insertAt = rest.length
  } else if (targetIndex >= columnIds.length) {
    // 插到目标列最后一个任务之后
    insertAt = rest.findIndex((task) => task.id === columnIds[columnIds.length - 1]) + 1
  } else {
    // 插到目标列第 targetIndex 个任务之前
    insertAt = rest.findIndex((task) => task.id === columnIds[targetIndex])
  }

  const nextTasks = rest.slice()
  nextTasks.splice(insertAt, 0, switchStatus(current, toStatus, now))
  return nextTasks
}

/** 列内排序：保持原状态，只改位置。语义清晰，键盘上下移动会用到 */
export function reorderTask(tasks, id, toIndex, now = new Date()) {
  const current = findTask(tasks, id)
  if (!current) return tasks
  return moveTask(tasks, id, current.status, toIndex, now)
}

/** 切换任务状态，并同步 completedAt / updatedAt（唯一的状态写入口） */
export function switchStatus(task, status, now = new Date()) {
  return {
    ...task,
    status,
    completedAt: resolveCompletedAt(status, task, now),
    updatedAt: now.toISOString(),
  }
}

/**
 * completedAt 派生规则（BR-03）：
 * - 进入 done：写入当前时间
 * - 一直在 done：保留原完成时间，不能因为改标题或挪位置就重置
 * - 离开 done：置空
 */
function resolveCompletedAt(status, current, now) {
  if (status !== 'done') return null
  if (current.status === 'done' && current.completedAt) return current.completedAt
  return now.toISOString()
}
