<script setup lang="ts">
import { MDCSnackbar } from "@material/snackbar";
import { onMounted } from "vue";

let snackbar: MDCSnackbar | null = null;
onMounted(() => {
  snackbar = new MDCSnackbar(document.querySelector('.mdc-snackbar')!);
  snackbar.open();
});

const openSnackbar = () => {
  if (!snackbar) {
    console.warn("Snackbar is not initialized.");
    return;
  }

  snackbar.open();
};

import { ref, watch, onUnmounted } from "vue";

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
  actionButtonText: {
    type: String,
    default: "Retry",
  },
});

const isOpen = ref(false);
const timeoutMs = ref(props.timeoutMs);
const closeOnEscape = ref(props.closeOnEscape);
const labelText = ref(props.labelText);
const actionButtonText = ref(props.actionButtonText);

const open = () => {
  if (snackbar) snackbar.open();
};
const close = (reason?: string) => {
  if (snackbar) snackbar.close(reason);
};

const emit = defineEmits<{
  (e: "onOpening"): void;
  (e: "onOpened"): void;
  (e: "onClosing", payload: { reason?: string }): void;
  (e: "onClosed", payload: { reason?: string }): void;
}>();

const handleOpening = () => {
  isOpen.value = true;
  emit("onOpening");
};
const handleOpened = () => {
  emit("onOpened");
};
const handleClosing = (e: Event) => {
  isOpen.value = false;
  // @ts-ignore
  const reason = e.detail?.reason;
  emit("onClosing", { reason });
};
const handleClosed = (e: Event) => {
  // @ts-ignore
  const reason = e.detail?.reason;
  emit("onClosed", { reason });
};

onMounted(() => {
  if (!snackbar) return;
  snackbar.timeoutMs = timeoutMs.value;
  snackbar.closeOnEscape = closeOnEscape.value;
  snackbar.labelText = labelText.value;
  snackbar.actionButtonText = actionButtonText.value;

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
watch(actionButtonText, (val) => {
  if (snackbar) snackbar.actionButtonText = val;
});

defineExpose({
  isOpen,
  timeoutMs,
  closeOnEscape,
  labelText,
  actionButtonText,
  open,
  close,
});
</script>
<template>
  <aside class="mdc-snackbar">
    <div class="mdc-snackbar__surface" role="status" aria-relevant="additions">
      <div class="mdc-snackbar__label" aria-atomic="false">
      </div>
      <div class="mdc-snackbar__actions" aria-atomic="true">
        <div type="button" class="mdc-button mdc-snackbar__action">
          <div class="mdc-button__ripple"></div>
          <span class="mdc-button__label"></span>
        </div>
      </div>
    </div>
  </aside>
</template>
<style lang="scss">
@use "@material/snackbar/mdc-snackbar";

.mdc-snackbar__actions {
  margin-right: 16px;
}
</style>