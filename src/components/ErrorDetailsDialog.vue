<script setup lang="ts">
import { inject, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import "@material/web/dialog/dialog.js";
import "@material/web/button/text-button.js";
import type { MdDialog } from "@material/web/dialog/dialog";

const { t } = useI18n();
const addBackButtonHook = inject<(id: string, hook: () => void) => void>("addBackButtonHook")!;
const removeBackButtonHook = inject<(id: string) => void>("removeBackButtonHook")!;

const dialog = ref<MdDialog>();
const report = ref("");
const copied = ref(false);
let copiedTimeout: ReturnType<typeof setTimeout> | undefined;

const show = (markdownReport: string) => {
  report.value = markdownReport;
  copied.value = false;
  addBackButtonHook("errorDetails", () => {
    dialog.value!.open = false;
  });
  dialog.value!.open = true;
};

const copy = async () => {
  try {
    await navigator.clipboard.writeText(report.value);
  } catch (e) {
    console.warn("Copying the error details failed", e);
    return;
  }
  copied.value = true;
  clearTimeout(copiedTimeout);
  copiedTimeout = setTimeout(() => {
    copied.value = false;
  }, 2000);
};

onMounted(() => {
  dialog.value!.addEventListener("close", () => {
    removeBackButtonHook("errorDetails");
  });
});

defineExpose({ show });
</script>

<template>
  <!-- eslint-disable vue/no-deprecated-slot-attribute false positive: md-dialog uses 'slot' -->
  <md-dialog ref="dialog" class="errorDetails" data-test="error-details-dialog">
    <div slot="headline">{{ t("errorDetails.headline") }}</div>
    <div slot="content">
      <p>{{ t("errorDetails.description") }}</p>
      <pre data-test="error-details-report">{{ report }}</pre>
    </div>
    <div slot="actions">
      <md-text-button @click="copy" data-test="error-details-copy">
        {{ copied ? t("errorDetails.copied") : t("errorDetails.copy") }}
      </md-text-button>
      <md-text-button @click="dialog!.open = false">{{ t("close") }}</md-text-button>
    </div>
  </md-dialog>
  <!-- eslint-enable vue/no-deprecated-slot-attribute -->
</template>

<style lang="scss" scoped>
md-dialog {
  --md-dialog-container-color: var(--mdc-theme-surface);
  --md-dialog-headline-color: var(--mdc-theme-on-surface);
  --md-dialog-supporting-text-color: var(--mdc-theme-on-surface);
}

pre {
  margin: 0;
  padding: 12px;
  border-radius: 8px;
  background: var(--md-sys-color-surface-container-highest, rgba(127, 127, 127, 0.15));
  font-size: 0.75rem;
  line-height: 1.4;
  white-space: pre-wrap;
  word-break: break-word;
  user-select: text;
}
</style>
