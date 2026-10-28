/**
 * 持久化：序列化、版本校验、损坏数据兜底。
 * localStorage 中的所有数据都视为“不可信输入”，读取时必须逐项校验。
 */
import { LIMITS, PRIORITY_VALUES, STATUS_VALUES, isValidDateString } from './task.js'

export const STORAGE_KEY = 'vue-kanban:board'
export const SCHEMA_VERSION = 1

const asString = (value) => (typeof value === 'string' ? value : '')
const isTimestamp = (value) => typeof value === 'string' && !Number.isNaN(Date.parse(value))

/**
 * 浏览器 localStorage 的可用性探测。
 * 隐私模式、被策略禁用、已满都可能抛错，所以必须 try/catch。
 */
export function getDefaultStorage() {
  try {
    if (typeof localStorage === 'undefined') return null
    const probe = `${STORAGE_KEY}:probe`
    localStorage.setItem(probe, '1')
    localStorage.removeItem(probe)
    return localStorage
  } catch {
    return null
  }
}

/** 内存版 storage，接口与 localStorage 相同；持久化失败时降级用它 */
export function createMemoryStorage() {
  const map = new Map()
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => {
      map.set(key, String(value))
    },
    removeItem: (key) => {
      map.delete(key)
    },
  }
}

/** 任务数组 → 带版本号的 JSON 字符串 */
export function serializeBoard(tasks) {
  return JSON.stringify({ schemaVersion: SCHEMA_VERSION, tasks })
}

/**
 * 单条任务的重建与清洗。
 * 返回 null 表示这条数据不可用，调用方负责丢弃。
 */
export function rehydrateTask(raw, now = new Date()) {
  if (!raw || typeof raw !== 'object') return null

  const id = asString(raw.id)
  const title = asString(raw.title).trim()
  if (!id || !title) return null
  if (!STATUS_VALUES.includes(raw.status)) return null
  if (!PRIORITY_VALUES.includes(raw.priority)) return null

  const tags = Array.isArray(raw.tags)
    ? raw.tags
        .filter((tag) => typeof tag === 'string')
        .map((tag) => tag.trim())
        .filter(Boolean)
        .slice(0, LIMITS.tags)
    : []

  const createdAt = isTimestamp(raw.createdAt) ? raw.createdAt : now.toISOString()
  const updatedAt = isTimestamp(raw.updatedAt) ? raw.updatedAt : createdAt
  const completedAt =
    raw.status === 'done' && isTimestamp(raw.completedAt) ? raw.completedAt : null

  return {
    id,
    title,
    description: asString(raw.description).trim(),
    status: raw.status,
    priority: raw.priority,
    tags,
    assignee: asString(raw.assignee).trim(),
    dueDate: isValidDateString(raw.dueDate) ? raw.dueDate : null,
    createdAt,
    updatedAt,
    completedAt,
  }
}

/**
 * 校验外层结构并（预留）版本迁移。
 * 结构不对、版本未知一律返回 null，交给上层按“损坏”处理。
 */
export function migrate(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null

  const version = Number(raw.schemaVersion)
  if (!Number.isInteger(version) || version > SCHEMA_VERSION) return null
  if (!Array.isArray(raw.tasks)) return null

  // 目前只有 v1。将来加 v2 时，在这里按 version 逐级升级数据
  if (version !== SCHEMA_VERSION) return null

  return { tasks: raw.tasks }
}

/**
 * 读取看板。
 * status 取值：
 *   ok         正常
 *   empty      没有存过数据（不是错误）
 *   corrupted  JSON 坏了、结构不对、版本未知
 *   partial    部分任务不合法，已丢弃
 *   unavailable 存储不可用
 */
export function loadBoard(storage = getDefaultStorage(), now = new Date()) {
  if (!storage) return { tasks: [], status: 'unavailable' }

  let raw = null
  try {
    raw = storage.getItem(STORAGE_KEY)
  } catch {
    return { tasks: [], status: 'unavailable' }
  }

  if (!raw) return { tasks: [], status: 'empty' }

  let parsed = null
  try {
    parsed = JSON.parse(raw)
  } catch {
    return { tasks: [], status: 'corrupted' }
  }

  const migrated = migrate(parsed)
  if (!migrated) return { tasks: [], status: 'corrupted' }

  const tasks = []
  for (const item of migrated.tasks) {
    const task = rehydrateTask(item, now)
    if (task) tasks.push(task)
  }

  if (tasks.length !== migrated.tasks.length) {
    return {
      tasks,
      status: tasks.length === 0 ? 'corrupted' : 'partial',
    }
  }

  return { tasks, status: 'ok' }
}

/**
 * 写入看板。
 * 返回 { ok, reason }：reason 为 'quota'（空间不足）或 'unavailable'（不可用）。
 */
export function saveBoard(tasks, storage = getDefaultStorage()) {
  if (!storage) return { ok: false, reason: 'unavailable' }

  try {
    storage.setItem(STORAGE_KEY, serializeBoard(tasks))
    return { ok: true, reason: null }
  } catch (error) {
    return { ok: false, reason: isQuotaError(error) ? 'quota' : 'unavailable' }
  }
}

/** 清空看板数据（暂未在 UI 中使用，保留给“重置”能力） */
export function clearBoard(storage = getDefaultStorage()) {
  if (!storage) return { ok: false, reason: 'unavailable' }
  try {
    storage.removeItem(STORAGE_KEY)
    return { ok: true, reason: null }
  } catch {
    return { ok: false, reason: 'unavailable' }
  }
}

/** Safari 的配额错误继承自 DOMException，name/code 与 Chrome 不完全一致 */
function isQuotaError(error) {
  if (!error) return false
  return (
    error.name === 'QuotaExceededError' ||
    error.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
    error.code === 22 ||
    error.code === 1014
  )
}
