<script setup>
import { onMounted, ref } from 'vue'

defineProps({
  title: {
    type: String,
    default: '请确认',
  },
  message: {
    type: String,
    default: '',
  },
  confirmLabel: {
    type: String,
    default: '确定',
  },
  danger: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['confirm', 'cancel'])

// 危险操作默认聚焦“取消”，避免回车误删
const cancelButton = ref(null)
onMounted(() => cancelButton.value?.focus())
</script>

<template>
  <div class="backdrop" @click.self="emit('cancel')">
    <div
      class="panel"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      aria-describedby="confirm-message"
      @keydown.esc="emit('cancel')"
    >
      <h2 id="confirm-title" class="title">{{ title }}</h2>
      <p id="confirm-message" class="message">{{ message }}</p>

      <div class="actions">
        <button ref="cancelButton" class="btn" type="button" @click="emit('cancel')">
          取消
        </button>
        <button
          class="btn"
          :class="danger ? 'btn-danger' : 'btn-primary'"
          type="button"
          @click="emit('confirm')"
        >
          {{ confirmLabel }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.backdrop {
  position: fixed;
  inset: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-4);
  background: rgba(16, 24, 40, 0.45);
}

.panel {
  width: min(400px, 100%);
  padding: var(--space-5);
  border-radius: var(--radius-lg);
  background: var(--surface);
  box-shadow: var(--shadow-lg);
}

.title {
  font-size: 17px;
  font-weight: 600;
}

.message {
  margin-top: var(--space-2);
  color: var(--text-muted);
  font-size: 14px;
  line-height: 1.6;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
  margin-top: var(--space-5);
}

.btn {
  padding: var(--space-2) var(--space-4);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface);
  color: var(--text);
  font-size: 14px;
}

.btn:hover {
  background: var(--surface-hover);
}

.btn-danger {
  border-color: transparent;
  background: var(--danger);
  color: var(--text-inverse);
}

.btn-primary {
  border-color: transparent;
  background: var(--primary);
  color: var(--text-inverse);
}

.btn-danger:hover {
  filter: brightness(0.95);
}
</style>
