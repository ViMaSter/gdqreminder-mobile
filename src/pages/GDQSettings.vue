<script setup lang="ts">
import { onBeforeMount, onMounted, watch, computed, ref, inject } from 'vue';
import { AppLauncher } from "@capacitor/app-launcher";
import Version from "@/plugins/versionPlugin";
import "@m3e/web/app-bar";
import "@m3e/web/heading";
import "@m3e/web/icon";
import "@m3e/web/icon-button";
import "@m3e/web/list";
import "@m3e/web/divider";
import "@m3e/web/dialog";
import "@m3e/web/switch";
import { useI18n } from 'vue-i18n';
import { languages, useSettingsStore } from '@/stores/settings';
const emit = defineEmits(['setVisibility']);
const { t } = useI18n();

const addBackButtonHook = inject<(id: string, hook: () => void) => void>("addBackButtonHook")!;
const removeBackButtonHook = inject<(id: string) => void>("removeBackButtonHook")!;

const closeSettings = () => {
  emit('setVisibility', "main");
  removeBackButtonHook("settings");
};

type M3EDialogElement = HTMLElement & {
  open: boolean;
  show: () => Promise<void>;
  hide: () => Promise<void>;
};

const languageDialog = ref<M3EDialogElement>();
const openLanguageDialog = async () => {
  addBackButtonHook("settings-language-dialog", () => {
    void languageDialog.value?.hide();
  });
  if (languageDialog.value) {
    await languageDialog.value.show();
  }
};

const highlighted = ref<HTMLElement | null>(null);
const highlightedEnd = ref<HTMLElement | null>(null);

const props = defineProps<{ isVisible: boolean }>();

const highlightElement = inject<(el: (HTMLElement | null)[] | HTMLElement | null) => void>("highlightElement")!;
const requireOnboarding = inject<() => boolean>("requireOnboarding")!;

onMounted(() => {
  watch(
    () => props.isVisible,
    (visible) => {
      if (visible) {
        if (requireOnboarding()) {
          setTimeout(() => {
            highlightElement([highlighted.value, highlightedEnd.value]);
          }, 300);
        }
      }
    }
  );
});
onBeforeMount(() => {

  watch(languageDialog, (dialog) => {
    if (!dialog) {
      return;
    }

    dialog!.addEventListener('closed', () => {
      removeBackButtonHook("settings-language-dialog");
    });
  });
});

const visitTranslationPage = () => {
  AppLauncher.openUrl({
    url: "https://crowdin.com/project/gdqreminder",
  });
};

const settingsStore = useSettingsStore();

let eventAnnouncements = computed(() => settingsStore.subscribedToEventAnnouncements);
let eventUpdates = computed(() => settingsStore.subscribedToEventUpdates);

type M3ESwitchElement = HTMLElement & {
  checked: boolean;
  disabled: boolean;
};

const eventAnnouncementsSwitch = ref<M3ESwitchElement>();
const forwardClickToEventAnnouncementsSwitch = (event: MouseEvent) => {
  const switchElement = eventAnnouncementsSwitch.value;
  if (!switchElement || switchElement.disabled) {
    return;
  }

  if (event.composedPath().includes(switchElement)) {
    return;
  }

  switchElement.click();
};

const toggleEventAnnouncements = async (event: Event) => {
  event.preventDefault();
  event.stopPropagation();

  const switchElement = eventAnnouncementsSwitch.value;
  if (!switchElement || switchElement.disabled) {
    return;
  }

  switchElement.disabled = true;
  try {
    await settingsStore.setSubscriptionToEventAnnouncements(!eventAnnouncements.value);
  } catch (e) {
    console.error(e);
  } finally {
    switchElement.checked = eventAnnouncements.value;
    switchElement.disabled = false;
  }
};

const eventUpdatesSwitch = ref<M3ESwitchElement>();
const forwardClickToEventUpdatesSwitch = (event: MouseEvent) => {
  const switchElement = eventUpdatesSwitch.value;
  if (!switchElement || switchElement.disabled) {
    return;
  }

  if (event.composedPath().includes(switchElement)) {
    return;
  }

  switchElement.click();
};

const toggleEventUpdates = async (event: Event) => {
  event.preventDefault();
  event.stopPropagation();

  const switchElement = eventUpdatesSwitch.value;
  if (!switchElement || switchElement.disabled) {
    return;
  }

  switchElement.disabled = true;
  try {
    await settingsStore.setSubscriptionToEventUpdates(!eventUpdates.value);
  } catch (e) {
    console.error(e);
  } finally {
    switchElement.checked = eventUpdates.value;
    switchElement.disabled = false;
  }
};

const { versionName, versionCode: versionCodeValue } = await Version.getCurrent();
const versionCode = `${versionName}.${versionCodeValue}`;

const selectedLanguage = computed(() => settingsStore.selectedLanguage);
</script>
<template>
  <div class="container">
    <m3e-app-bar>
      <m3e-icon-button slot="leading" @click="closeSettings"><m3e-icon name="arrow_back"></m3e-icon></m3e-icon-button>
      <div slot="title">{{ $t('settings.headline') }}</div>
    </m3e-app-bar>
    <main class="top-bar-adjust">
      <m3e-action-list>
        <m3e-list-action ref="highlighted" disabled>
          <div>{{ $t('settings.headline-generalNotifications') }}</div>
        </m3e-list-action>
        <m3e-divider></m3e-divider>

        <m3e-list-action class="interactive" @click="forwardClickToEventAnnouncementsSwitch">
          <div class="headline">{{ $t('settings.label-eventAnnouncements') }}</div>
          <div slot="supporting-text" class="supporting">{{ $t('settings.description-eventAnnouncements') }}</div>
          <m3e-switch slot="trailing" class="switch" :checked="eventAnnouncements" ref="eventAnnouncementsSwitch" @beforeinput="toggleEventAnnouncements"></m3e-switch>
        </m3e-list-action>
        <m3e-list-action disabled>
          <div class="info-content">
            <m3e-icon class="info-icon" name="info"></m3e-icon>
            <div class="supporting">{{ $t('settings.info-eventAnnouncements') }}</div>
          </div>
        </m3e-list-action>
        <m3e-divider></m3e-divider>

        <m3e-list-action class="interactive" @click="forwardClickToEventUpdatesSwitch">
          <div class="headline">{{ $t('settings.label-eventUpdates') }}</div>
          <div slot="supporting-text" class="supporting">{{ $t('settings.description-eventUpdates') }}</div>
          <m3e-switch slot="trailing" class="switch" :checked="eventUpdates" ref="eventUpdatesSwitch" @beforeinput="toggleEventUpdates"></m3e-switch>
        </m3e-list-action>
        <m3e-list-action ref="highlightedEnd" disabled>
          <div class="info-content">
            <m3e-icon class="info-icon" name="info"></m3e-icon>
            <div class="supporting">{{ $t('settings.info-eventUpdates') }}</div>
          </div>
        </m3e-list-action>
        <m3e-list-action disabled>
          <div>{{ $t('settings.headline-language') }}</div>
        </m3e-list-action>
        <m3e-divider></m3e-divider>

        <m3e-list-action class="interactive" @click="openLanguageDialog" data-test="open-language-dialog">
          <div class="headline">{{ $t('settings.label-appLanguage') }}</div>
          <div slot="supporting-text" class="supporting">{{ $t('settings.option-'+selectedLanguage) || 'N/A' }}</div>
          <m3e-icon slot="trailing" name="arrow_right"></m3e-icon>
        </m3e-list-action>
        <m3e-divider></m3e-divider>

        <m3e-list-action class="interactive" @click="visitTranslationPage">
          <div class="headline">{{ $t('settings.label-helpTranslate') }}</div>
          <m3e-icon slot="trailing" name="open_in_new"></m3e-icon>
        </m3e-list-action>
        <m3e-list-action disabled>
          <div>{{ $t('settings.headline-information') }}</div>
        </m3e-list-action>
        <m3e-divider></m3e-divider>
        
        <m3e-list-action disabled>
          <div class="headline">{{ $t('settings.label-version') }}</div>
          <div slot="supporting-text" class="supporting">{{ versionCode }}</div>
        </m3e-list-action>
      </m3e-action-list>
    </main>
    <m3e-dialog id="dlg" ref="languageDialog" data-test="language-dialog" class="languageDialog" dismissible>
      <span slot="header">{{ $t('settings.label-appLanguage') }}</span>
      <m3e-selection-list hide-selection-indicator @change="(e: Event) => { settingsStore.setLanguage((e.target as HTMLElement & { value: string }).value as any); languageDialog?.hide(); }">
        <m3e-list-option v-for="(_, key) in languages" :key="key" :data-test="'language-option-'+key" :value="key" :selected="selectedLanguage === key">
          <m3e-pseudo-radio slot="leading" :checked="selectedLanguage === key"></m3e-pseudo-radio>
          {{ t('settings.option-'+key) }}
        </m3e-list-option>
      </m3e-selection-list>
    </m3e-dialog>
  </div>
</template>
<style lang="scss" scoped>
m3e-list-action {
  --m3e-list-item-one-line-top-space: 0.75rem;
  --m3e-list-item-one-line-bottom-space: 0.75rem;
}

m3e-list-action[disabled] {
  --m3e-list-item-font-size: 0.9rem;
  --m3e-list-item-disabled-label-text-color: var(--m3e-list-item-label-text-color, var(--md-sys-color-on-surface, #1d1b20));
  --m3e-list-item-disabled-label-text-opacity: 100%;
  --m3e-list-item-disabled-supporting-text-color: var(--m3e-list-item-supporting-text-color, var(--md-sys-color-on-surface-variant, #49454f));
  --m3e-list-item-disabled-supporting-text-opacity: 100%;
  --m3e-list-item-disabled-leading-color: var(--m3e-list-item-leading-color, var(--md-sys-color-on-surface-variant, #49454f));
  --m3e-list-item-disabled-leading-opacity: 100%;
  --m3e-list-item-disabled-trailing-color: var(--m3e-list-item-trailing-color, var(--md-sys-color-on-surface-variant, #49454f));
  --m3e-list-item-disabled-trailing-opacity: 100%;
}

m3e-app-bar {
  background-color: var(--mdc-theme-primary);
  padding-top: var(--safe-area-inset-top);
}

.top-bar-adjust {
  padding-top: 0.5rem;
}

.container {
  font-family: Roboto;
  margin: 0;

  background: var(--md-sys-color-background);
  color: var(--md-sys-color-on-background);
  min-height: 100vh;
  height: 100vh;
  width: 100vw;
}


.interactive {
  cursor: pointer;
}

.headline {
  font-weight: 400;
  line-height: 1.5rem;
  letter-spacing: normal;
}

.supporting {
  opacity: 1;
  font-size: 0.875rem;
  line-height: 1.25rem;
  letter-spacing: normal;
}

.switch {
  margin-left: auto;
}

.info-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.info-icon {
  flex: 0 0 auto;
}

m3e-dialog {
  --m3e-dialog-min-width: min(28rem, 90vw);
  border: 1px solid rgba(0, 0, 0, 0.15);
  border-radius: 1rem;
  padding: 1rem;
  --m3e-dialog-container-color: var(--mdc-theme-surface);
  color: var(--mdc-theme-on-surface);
}

.languageTitle {
  font-size: 1rem;
  font-weight: 400;
  line-height: 1.5rem;
  letter-spacing: normal;
  margin-bottom: 0.75rem;
}


</style>