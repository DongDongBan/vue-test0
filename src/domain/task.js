/**
 * 任务领域模型
 * 纯 JavaScript：不 import 'vue'，不访问 DOM，便于复用、推理和迁移。
 */

/** 三列看板的状态：value 存进数据，label 用于界面 */
export const STATUSES = [
  { value: 'todo', label: '待办' },
  { value: 'doing', label: '进行中' },
  { value: 'done', label: '已完成' },
]

export const STATUS_VALUES = STATUSES.map((status) => status.value)

export const STATUS_LABELS = Object.fromEntries(
  STATUSES.map((status) => [status.value, status.label]),
)

export const PRIORITIES = [
  { value: 'high', label: '高' },
  { value: 'medium', label: '中' },
  { value: 'low', label: '低' },
]

export const PRIORITY_VALUES = PRIORITIES.map((priority) => priority.value)

export const PRIORITY_LABELS = Object.fromEntries(
  PRIORITIES.map((priority) => [priority.value, priority.label]),
)

export const DEFAULT_STATUS = 'todo'
export const DEFAULT_PRIORITY = 'medium'

/** 字段上限：表单的 maxlength 与校验共用同一份数字 */
export const LIMITS = {
  title: 80,
  description: 500,
  tags: 5,
  tagLength: 12,
  assignee: 20,
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

const dateFormatter = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
})

/** 唯一 id：优先 crypto.randomUUID，旧环境降级为时间戳 + 随机串 */
export function createId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

/** Date → YYYY-MM-DD。用本地时区拼接，避免 toISOString 的时区偏移 */
export function toISODate(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** 校验日期字符串真实存在（排除 2026-02-30 这种） */
export function isValidDateString(value) {
  if (typeof value !== 'string' || !DATE_PATTERN.test(value)) return false
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  )
}

/** 展示用：2026-01-05 → 2026年1月5日 */
export function formatDate(value) {
  if (!isValidDateString(value)) return ''
  const [year, month, day] = value.split('-').map(Number)
  return dateFormatter.format(new Date(year, month - 1, day))
}

/** 逾期：有截止日、未完成、且日期早于今天（ISO 字符串可直接比较大小） */
export function isOverdue(task, today = toISODate()) {
  if (!task || !task.dueDate || task.status === 'done') return false
  return task.dueDate < today
}

/** 标签规范化：接受数组或逗号分隔字符串；去空、忽略大小写去重、保持顺序 */
export function normalizeTags(input) {
  const list = Array.isArray(input) ? input : String(input ?? '').split(',')
  const seen = new Set()
  const tags = []

  for (const raw of list) {
    const tag = String(raw ?? '').trim()
    if (!tag) continue

    const key = tag.toLowerCase()
    if (seen.has(key)) continue

    seen.add(key)
    tags.push(tag)
  }

  return tags
}

/**
 * 校验任务输入。
 * 返回 { valid, errors, value }：errors 的 key 与表单字段同名，value 是规范化后的值。
 */
export function validateTask(input = {}) {
  const errors = {}

  const title = String(input.title ?? '').trim()
  if (!title) {
    errors.title = '请输入任务标题'
  } else if (title.length > LIMITS.title) {
    errors.title = `标题不能超过 ${LIMITS.title} 个字符`
  }

  const description = String(input.description ?? '').trim()
  if (description.length > LIMITS.description) {
    errors.description = `描述不能超过 ${LIMITS.description} 个字符`
  }

  const tags = normalizeTags(input.tags)
  if (tags.length > LIMITS.tags) {
    errors.tags = `标签最多 ${LIMITS.tags} 个`
  } else {
    const longTag = tags.find((tag) => tag.length > LIMITS.tagLength)
    if (longTag) {
      errors.tags = `标签「${longTag}」不能超过 ${LIMITS.tagLength} 个字符`
    }
  }

  const assignee = String(input.assignee ?? '').trim()
  if (assignee.length > LIMITS.assignee) {
    errors.assignee = `负责人不能超过 ${LIMITS.assignee} 个字符`
  }

  if (input.dueDate && !isValidDateString(input.dueDate)) {
    errors.dueDate = '截止日期格式应为 YYYY-MM-DD'
  }

  if (input.status !== undefined && !STATUS_VALUES.includes(input.status)) {
    errors.status = '未知的任务状态'
  }

  if (input.priority !== undefined && !PRIORITY_VALUES.includes(input.priority)) {
    errors.priority = '未知的优先级'
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    value: { title, description, tags, assignee },
  }
}

/** 校验失败时抛出，携带字段级错误，便于表单展示 */
export class TaskValidationError extends Error {
  constructor(errors) {
    super('任务数据不合法')
    this.name = 'TaskValidationError'
    this.errors = errors
  }
}

/**
 * 由输入构造任务对象。
 * now 可注入，便于需要确定性时间时（例如导入/迁移）复用。
 */
export function createTask(input = {}, now = new Date()) {
  const { valid, errors, value } = validateTask(input)
  if (!valid) throw new TaskValidationError(errors)

  const timestamp = now.toISOString()
  const status = input.status ?? DEFAULT_STATUS
  const dueDate =
    typeof input.dueDate === 'string' && input.dueDate.trim() ? input.dueDate : null

  return {
    id: input.id ?? createId(),
    title: value.title,
    description: value.description,
    status,
    priority: input.priority ?? DEFAULT_PRIORITY,
    tags: value.tags,
    assignee: value.assignee,
    dueDate,
    createdAt: input.createdAt ?? timestamp,
    updatedAt: timestamp,
    completedAt: status === 'done' ? (input.completedAt ?? timestamp) : null,
  }
}
