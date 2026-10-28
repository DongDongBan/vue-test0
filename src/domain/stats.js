/**
 * 统计：只读派生数据，供页头与列头显示。
 * 不修改任务，也不依赖 Vue。
 */
import { STATUSES, isOverdue, toISODate } from './task.js'

/** 每个状态的任务数；没有任务的列也要返回 0，避免 UI 判空 */
export function countByStatus(tasks) {
  const counts = Object.fromEntries(STATUSES.map((status) => [status.value, 0]))
  for (const task of tasks) {
    counts[task.status] = (counts[task.status] ?? 0) + 1
  }
  return counts
}

/** 完成率：0–100 的整数；空列表返回 0 */
export function completionRate(tasks) {
  if (tasks.length === 0) return 0
  const done = tasks.filter((task) => task.status === 'done').length
  return Math.round((done / tasks.length) * 100)
}

/** 逾期数量；已完成的不算逾期（BR-05） */
export function countOverdue(tasks, today = toISODate()) {
  return tasks.filter((task) => isOverdue(task, today)).length
}

/** 页头一次取全：总数、分列计数、完成率、逾期数 */
export function summarize(tasks, today = toISODate()) {
  return {
    total: tasks.length,
    counts: countByStatus(tasks),
    completionRate: completionRate(tasks),
    overdue: countOverdue(tasks, today),
  }
}
