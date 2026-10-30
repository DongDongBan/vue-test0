/**
 * 拖拽状态：只管理“谁在被拖、落在哪个槽位”，不碰业务数据。
 * 槽位 slot 指“插入到当前列显示列表的第几个位置之前”，取值 0..列长度。
 */
import { computed, ref } from 'vue'

export const DRAG_KEY = Symbol('kanban-drag')

/**
 * 槽位 → 移动下标的换算。
 * slot 是“当前显示列表中的插入位置”（0..列长度），
 * moveTask 需要“移除该任务之后的目标下标”，所以同列且原位置在落点之前时要减 1。
 */
export function toMoveIndex(fromIndex, slot) {
  return fromIndex !== -1 && fromIndex < slot ? slot - 1 : slot
}

export function useDragDrop({ onDrop } = {}) {
  const draggingId = ref(null)
  const target = ref({ status: null, slot: null })
  const isDragging = computed(() => draggingId.value !== null)

  function start(task, event) {
    draggingId.value = task.id
    target.value = { status: task.status, slot: null }

    if (event?.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move'
      // Firefox 必须写入数据，否则 dragstart 之后不会继续派发 drag 事件
      event.dataTransfer.setData('text/plain', task.id)
    }
  }

  function hover(status, slot) {
    if (draggingId.value === null) return
    target.value = { status, slot }
  }

  function end() {
    draggingId.value = null
    target.value = { status: null, slot: null }
  }

  function drop(status, index) {
    if (draggingId.value === null) return
    const payload = { id: draggingId.value, status, index }
    end()
    onDrop?.(payload)
  }

  return { draggingId, target, isDragging, start, hover, end, drop }
}
