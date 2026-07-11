<script setup lang="ts">
import { MDCSnackbar, MDCSnackbarCloseEvent } from "@material/snackbar";
import { PropType, computed, onMounted, onUnmounted, ref, watch } from "vue";

type SnackbarAction = {
  label: string;
  callback: () => void;
};

let snackbar: MDCSnackbar | null = null;

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
});

const isOpen = ref(false);
const timeoutMs = ref(props.timeoutMs);
const closeOnEscape = ref(props.closeOnEscape);
const labelText = ref(props.labelText);
const action = ref<SnackbarAction | null>(props.action);
const hasAction = computed(() => {
  return !!action.value?.label;
});

const syncActionLabel = () => {
  if (!snackbar) {
    return;
  }

  snackbar.actionButtonText = hasAction.value ? action.value!.label : "";
};

const setAction = (newAction: SnackbarAction | null) => {
  action.value = newAction;
};

const open = () => {
  if (!snackbar) {
    return;
  }

  snackbar.open();
};
const close = (reason?: string) => {
  if (!snackbar) {
    return;
  }

  snackbar.close(reason);
};

const emit = defineEmits<{
  (e: "onOpening"): void;
  (e: "onOpened"): void;
  (e: "onClosing", reason: string): void;
  (e: "onClosed", reason: string): void;
}>();

const handleOpening = () => {
  isOpen.value = true;
  emit("onOpening");
};
const handleOpened = () => {
  isOpen.value = true;
  emit("onOpened");
};
const handleClosing = (e: MDCSnackbarCloseEvent) => {
  isOpen.value = false;
  const reason = e.detail.reason || "";
  if (reason == "action" && action.value?.callback) {
    action.value.callback();
  }
  emit("onClosing", reason);
};
const handleClosed = (e: MDCSnackbarCloseEvent) => {
  isOpen.value = false;
  emit("onClosed", e.detail.reason || "");
};

onMounted(() => {
  snackbar = new MDCSnackbar(document.querySelector('.mdc-snackbar')!);
  snackbar.timeoutMs = timeoutMs.value;
  snackbar.closeOnEscape = closeOnEscape.value;
  snackbar.labelText = labelText.value;
  syncActionLabel();

  snackbar.listen("MDCSnackbar:opening", handleOpening);
  snackbar.listen("MDCSnackbar:opened", handleOpened);
  snackbar.listen("MDCSnackbar:closing", handleClosing);
  snackbar.listen("MDCSnackbar:closed", handleClosed);
});

onUnmounted(() => {
  if (!snackbar) return;
  snackbar.unlisten("MDCSnackbar:opening", handleOpening);
  snackbar.unlisten("MDCSnackbar:opened", handleOpened);
  snackbar.unlisten("MDCSnackbar:closing", handleClosing);
  snackbar.unlisten("MDCSnackbar:closed", handleClosed);
  snackbar.destroy();
  snackbar = null;
});

watch(timeoutMs, (val) => {
  if (snackbar) snackbar.timeoutMs = val;
});
watch(closeOnEscape, (val) => {
  if (snackbar) snackbar.closeOnEscape = val;
});
watch(labelText, (val) => {
  if (snackbar) snackbar.labelText = val;
});
watch(action, () => {
  syncActionLabel();
}, { deep: true });
watch(() => props.action, (val) => {
  setAction(val);
}, { deep: true });
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
  action,
  setAction,
  open,
  close,
});
</script>
<template>
  <aside class="mdc-snackbar">
    <div class="mdc-snackbar__surface" role="status" aria-relevant="additions">
      <div class="mdc-snackbar__label" aria-atomic="false">
      </div>
      <div class="mdc-snackbar__actions" aria-atomic="true" v-show="hasAction">
        <button class="mdc-button mdc-snackbar__action" :disabled="!hasAction">
          <div class="mdc-button__ripple"></div>
          <span class="mdc-button__label"></span>
        </button>
      </div>
    </div>
  </aside>
</template>
<style lang="scss">
@use "@material/snackbar/mdc-snackbar";

.mdc-snackbar__actions {
  margin-right: 16px;
}
.mdc-snackbar {
  bottom: var(--safe-area-inset-bottom) !important;
}
.mdc-button {
  font-size: var(--mdc-typography-body2-font-size, 0.875rem);
}
</style>