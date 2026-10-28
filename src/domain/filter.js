/**
 * 搜索与筛选。
 * 纯函数：只决定“显示哪些”，绝不修改数据（BR-08）。
 */
import { isOverdue, toISODate } from './task.js'

/** 截止时间筛选项；label 直接给工具栏用，避免 UI 再写一份文案 */
export const DUE_FILTERS = [
  { value: 'all', label: '全部' },
  { value: 'overdue', label: '已逾期' },
  { value: 'today', label: '今天' },
  { value: 'week', label: '7 天内' },
]

/** 空筛选条件；后续 setFilter 也用它做“清空” */
export function createFilter(overrides = {}) {
  return {
    keyword: '',
    priorities: [],
    due: 'all',
    ...overrides,
  }
}

/** 是否处于“有筛选”状态：用于显示清空按钮、区分两种空状态 */
export function isFilterActive(filter) {
  if (!filter) return false
  return (
    Boolean(filter.keyword?.trim()) ||
    (filter.priorities?.length ?? 0) > 0 ||
    (filter.due ?? 'all') !== 'all'
  )
}

/** 关键词命中：标题、描述、标签、负责人；忽略大小写与首尾空格 */
export function matchesKeyword(task, keyword) {
  const query = String(keyword ?? '').trim().toLowerCase()
  if (!query) return true

  const fields = [task.title, task.description, task.assignee, ...(task.tags ?? [])]
  return fields.some((field) => String(field ?? '').toLowerCase().includes(query))
}

/**
 * 截止状态命中：
 * - overdue 排除已完成（BR-05：完成的任务不算逾期）
 * - today / week 只看日期，不区分状态（已完成的任务也可能“今天到期”）
 */
export function matchesDue(task, due = 'all', today = toISODate()) {
  if (!due || due === 'all') return true
  if (!task.dueDate) return false
  if (due === 'overdue') return isOverdue(task, today)
  if (due === 'today') return task.dueDate === today
  if (due === 'week') return task.dueDate >= today && task.dueDate <= addDays(today, 6)
  return true
}

/**
 * 筛选主入口。
 * 关键词内部是“或”（命中任一字段即可），多个条件之间是“与”。
 */
export function filterTasks(tasks, filter, today = toISODate()) {
  const keyword = filter?.keyword ?? ''
  const priorities = filter?.priorities ?? []
  const due = filter?.due ?? 'all'

  return tasks.filter((task) => {
    if (!matchesKeyword(task, keyword)) return false
    if (priorities.length > 0 && !priorities.includes(task.priority)) return false
    if (!matchesDue(task, due, today)) return false
    return true
  })
}

/** ISO 日期加天数；跨月、跨年交给 Date 处理 */
export function addDays(isoDate, days) {
  const [year, month, day] = isoDate.split('-').map(Number)
  return toISODate(new Date(year, month - 1, day + days))
}
