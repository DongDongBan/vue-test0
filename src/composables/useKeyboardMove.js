/**
 * 键盘移动：把“方向”翻译成状态与下标，并负责移动后把焦点还给同一张卡片。
 * 抽出来的原因：这段逻辑横跨状态、领域换算和 DOM 焦点，不适合塞在组件的模板脚本里。
 */
import { nextTick } from 'vue'
import { STATUS_LABELS, STATUS_VALUES } from '../domain/task.js'
import { toMoveIndex } from './useDragDrop.js'

export function useKeyboardMove({ columns, moveTask, notify }) {
  function focusTask(id) {
    nextTick(() => {
      document.querySelector('[data-task-id="' + id + '"]')?.focus()
    })
  }

  function handleMove({ id, direction }) {
    const from = columns.value.find((column) => column.tasks.some((task) => task.id === id))
    if (!from) return

    const fromIndex = from.tasks.findIndex((task) => task.id === id)

    if (direction === 'up' || direction === 'down') {
      // 首/尾不再移动，避免“绕回去”带来的方向感丢失
      if (direction === 'up' && fromIndex === 0) return
      if (direction === 'down' && fromIndex === from.tasks.length - 1) return

      const slot = direction === 'up' ? fromIndex - 1 : fromIndex + 2
      moveTask(id, from.value, toMoveIndex(fromIndex, slot))
      notify('顺序已调整')
      focusTask(id)
      return
    }

    const currentIndex = STATUS_VALUES.indexOf(from.value)
    const nextStatus = STATUS_VALUES[currentIndex + (direction === 'left' ? -1 : 1)]
    if (!nextStatus) return

    const targetColumn = columns.value.find((column) => column.value === nextStatus)
    moveTask(id, nextStatus, targetColumn ? targetColumn.tasks.length : 0)
    notify('已移动到「' + STATUS_LABELS[nextStatus] + '」')
    focusTask(id)
  }

  return { handleMove }
}
