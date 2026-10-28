/**
 * 看板操作：增、删、改。
 * 全部是不可变操作：返回新数组，绝不修改入参数组或其中的任务对象。
 */
import { TaskValidationError, createTask, validateTask } from './task.js'

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
    status: merged.status,
    priority: merged.priority,
    // 空字符串与 null 都表示“没有截止日”，统一归一成 null
    dueDate: merged.dueDate || null,
    completedAt: resolveCompletedAt(merged.status, current, now),
    updatedAt: now.toISOString(),
  }

  // 只复制数组外壳，未修改的任务对象保持引用不变，减少渲染 diff
  const nextTasks = tasks.slice()
  nextTasks[index] = nextTask
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
 * completedAt 派生规则（BR-03）：
 * - 进入 done：写入当前时间
 * - 一直在 done：保留原完成时间，不能因为改标题就重置
 * - 离开 done：置空
 */
function resolveCompletedAt(status, current, now) {
  if (status !== 'done') return null
  if (current.status === 'done' && current.completedAt) return current.completedAt
  return now.toISOString()
}
