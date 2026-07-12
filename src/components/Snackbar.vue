<script setup lang="ts">
import "@m3e/web/snackbar";
import { PropType, computed, ref, watch } from "vue";

type SnackbarAction = {
  label: string;
  callback: () => void;
};

declare global {
  interface Window {
    M3eSnackbar?: {
      open: (
        message: string,
        actionOrDismissibleOrOptions?: string | boolean | { duration?: number; actionCallback?: () => void },
        dismissibleOrOptions?: boolean | { duration?: number; actionCallback?: () => void },
        options?: { duration?: number; actionCallback?: () => void },
      ) => void;
      dismiss: () => void;
    };
  }
}

const props = defineProps({
  timeoutMs: {
    type: Number,
    default: 5000,
  },
  closeOnEscape: {
    type: Boolean,
    default: true,
  },
  labelText: {
    type: String,
    default: "Can't send photo. Retry in 5 seconds.",
  },
  action: {
    type: Object as PropType<SnackbarAction | null>,
    default: null,
  },
  actionButtonText: {
    type: String,
    default: "",
  },
});

const isOpen = ref(false);
const timeoutMs = ref(props.timeoutMs);
const closeOnEscape = ref(props.closeOnEscape);
const labelText = ref(props.labelText);
const labelHtml = ref<string | null>(null);
const action = ref<SnackbarAction | null>(props.action);
const actionButtonText = ref(props.actionButtonText);
const hasAction = computed(() => {
  return !!(action.value?.label || actionButtonText.value);
});

const setAction = (newAction: SnackbarAction | null) => {
  action.value = newAction;
};
const setLabelText = (newLabelText: string) => {
  labelHtml.value = null;
  labelText.value = newLabelText;
};
const setLabelHtml = (newLabelHtml: string | null) => {
  labelHtml.value = newLabelHtml;
};

const open = () => {
  if (!window.M3eSnackbar) {
    return;
  }

  isOpen.value = true;
  emit("onOpening");

  const message = labelHtml.value ?? labelText.value;
  const duration = timeoutMs.value < 0 ? 24 * 60 * 60 * 1000 : timeoutMs.value;

  if (hasAction.value) {
    const actionLabel = action.value?.label ?? actionButtonText.value;
    window.M3eSnackbar.open(message, actionLabel, closeOnEscape.value, {
      duration,
      actionCallback: () => {
        action.value?.callback();
        emit("onClosing", "action");
        emit("onClosed", "action");
        isOpen.value = false;
      },
    });
  } else {
    window.M3eSnackbar.open(message, closeOnEscape.value, {
      duration,
    });
  }

  emit("onOpened");
  if (timeoutMs.value >= 0) {
    setTimeout(() => {
      if (!isOpen.value) {
        return;
      }
      isOpen.value = false;
      emit("onClosing", "timeout");
      emit("onClosed", "timeout");
    }, duration + 10);
  }
};
const close = (reason?: string) => {
  if (!window.M3eSnackbar) {
    return;
  }
  window.M3eSnackbar.dismiss();
  isOpen.value = false;
  emit("onClosing", reason ?? "dismiss");
  emit("onClosed", reason ?? "dismiss");
};

const emit = defineEmits<{
  (e: "onOpening"): void;
  (e: "onOpened"): void;
  (e: "onClosing", reason: string): void;
  (e: "onClosed", reason: string): void;
}>();

watch(() => props.action, (val) => {
  setAction(val);
}, { deep: true });
watch(() => props.actionButtonText, (val) => {
  actionButtonText.value = val;
});
watch(() => props.labelText, (val) => {
  labelText.value = val;
});
watch(() => props.timeoutMs, (val) => {
  timeoutMs.value = val;
});
watch(() => props.closeOnEscape, (val) => {
  closeOnEscape.value = val;
});

defineExpose({
  isOpen,
  hasAction,
  timeoutMs,
  closeOnEscape,
  labelText,
  labelHtml,
  action,
  actionButtonText,
  setAction,
  setLabelText,
  setLabelHtml,
  open,
  close,
});
</script>
<template>
  <span class="snackbar-anchor" aria-hidden="true"></span>
</template>
<style lang="scss">
.snackbar-anchor {
  display: none;
}

m3e-snackbar {
  --m3e-snackbar-margin: calc(var(--safe-area-inset-bottom) + 0.75rem);
}
</style>