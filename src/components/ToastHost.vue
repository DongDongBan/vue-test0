<script setup>
defineProps({
  toasts: {
    type: Array,
    required: true,
  },
})

defineEmits(['dismiss'])
</script>

<template>
  <!-- 容器始终存在，屏幕阅读器才能持续监听新增内容 -->
  <div class="toast-host" aria-live="polite" aria-atomic="false">
    <TransitionGroup name="toast">
      <div v-for="toast in toasts" :key="toast.id" class="toast" role="status">
        <span class="message">{{ toast.message }}</span>
        <button
          class="close"
          type="button"
          aria-label="关闭提示"
          @click="$emit('dismiss', toast.id)"
        >
          ×
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-host {
  position: fixed;
  left: 50%;
  bottom: var(--space-5);
  z-index: 30;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  transform: translateX(-50%);
  pointer-events: none;
}

.toast {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  min-width: 220px;
  max-width: min(420px, 90vw);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  background: #1f2937;
  color: #ffffff;
  font-size: 13px;
  box-shadow: var(--shadow-lg);
  pointer-events: auto;
}

.message {
  flex: 1;
}

.close {
  border: 0;
  background: transparent;
  color: inherit;
  font-size: 16px;
  line-height: 1;
  opacity: 0.7;
}

.close:hover {
  opacity: 1;
}

.toast-enter-active,
.toast-leave-active {
  transition:
    opacity var(--duration) var(--easing),
    transform var(--duration) var(--easing);
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>
