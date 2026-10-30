/**
 * Toast 队列：只负责增删与自动消失，不关心文案含义。
 */
import { ref } from 'vue'

export function useToast(duration = 3000) {
  const toasts = ref([])
  let seq = 0

  // 重复关闭同一个 id 是安全的：filter 找不到就返回原数组
  function dismiss(id) {
    toasts.value = toasts.value.filter((toast) => toast.id !== id)
  }

  function push(message) {
    const id = ++seq
    toasts.value = [...toasts.value, { id, message }]
    setTimeout(() => dismiss(id), duration)
  }

  return { toasts, push, dismiss }
}
