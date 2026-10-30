/**
 * 单列的拖拽交互：把 DOM 事件翻译成“落在哪个槽位”。
 * 抽成组合式函数，避免 BoardColumn 同时承担渲染、拖拽和键盘。
 */
import { inject, ref } from 'vue'
import { DRAG_KEY, toMoveIndex } from './useDragDrop.js'

export function useColumnDrag(props) {
  const drag = inject(DRAG_KEY, null)

  // 先解构成顶层绑定，模板里才会自动解包 ref
  const draggingId = drag ? drag.draggingId : ref(null)
  const target = drag ? drag.target : ref({ status: null, slot: null })
  const isDragging = drag ? drag.isDragging : ref(false)

  function onDragStart(event, task) {
    if (!props.draggable || !drag) {
      event.preventDefault()
      return
    }
    drag.start(task, event)
  }

  function onDragEnd() {
    drag?.end()
  }

  function onCardDragOver(event, index) {
    if (!isDragging.value || !drag) return
    const rect = event.currentTarget.getBoundingClientRect()
    const after = event.clientY > rect.top + rect.height / 2
    drag.hover(props.column.value, index + (after ? 1 : 0))
  }

  function onColumnDragOver(event) {
    if (!isDragging.value || !drag) return
    const items = event.currentTarget.querySelectorAll('.task-item')
    if (items.length === 0) {
      drag.hover(props.column.value, 0)
      return
    }
    const last = items[items.length - 1].getBoundingClientRect()
    if (event.clientY > last.bottom) {
      drag.hover(props.column.value, props.column.tasks.length)
    }
  }

  function onDrop() {
    if (!drag) return
    const slot = target.value.slot ?? props.column.tasks.length
    const fromIndex = props.column.tasks.findIndex((task) => task.id === draggingId.value)
    drag.drop(props.column.value, toMoveIndex(fromIndex, slot))
  }

  function isSlot(index) {
    return (
      isDragging.value &&
      target.value.status === props.column.value &&
      target.value.slot === index
    )
  }

  return {
    draggingId,
    target,
    isDragging,
    onDragStart,
    onDragEnd,
    onCardDragOver,
    onColumnDragOver,
    onDrop,
    isSlot,
  }
}
