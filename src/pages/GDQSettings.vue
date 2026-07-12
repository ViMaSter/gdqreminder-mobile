<script setup lang="ts">
import { onBeforeMount, onMounted, watch, computed, ref, inject } from 'vue';
import { AppLauncher } from "@capacitor/app-launcher";
import Version from "@/plugins/versionPlugin";
import "@m3e/web/app-bar";
import "@m3e/web/icon";
import "@m3e/web/icon-button";
import "@m3e/web/list";
import "@m3e/web/divider";
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

const languageDialog = ref<HTMLDialogElement>();
const openLanguageDialog = () => {
  addBackButtonHook("settings-language-dialog", () => {
    languageDialog.value?.close();
  });
  languageDialog.value?.showModal();
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

    dialog!.addEventListener('close', () => {
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

const eventAnnouncementsSwitch = ref<HTMLInputElement>();
const toggleEventAnnouncements = async () => {
  if (!eventAnnouncements.value) {
    eventAnnouncementsSwitch.value!.disabled = true;
    try {
      await settingsStore.setSubscriptionToEventAnnouncements(true);
      return;
    } catch (e) {
      console.error(e);
    } finally {
      eventAnnouncementsSwitch.value!.disabled = false;
      eventAnnouncementsSwitch.value!.checked = eventAnnouncements.value;
    }
    return;
  }

  eventAnnouncementsSwitch.value!.disabled = true;
  try {
      await settingsStore.setSubscriptionToEventAnnouncements(false);
  } catch (e) {
    console.error(e);
  } finally {
    eventAnnouncementsSwitch.value!.disabled = false;
    eventAnnouncementsSwitch.value!.checked = eventAnnouncements.value;
  }
};

const eventUpdatesSwitch = ref<HTMLInputElement>();
const toggleEventUpdates = async () => {
  if (!eventUpdates.value) {
    eventUpdatesSwitch.value!.disabled = true;
    try {
      await settingsStore.setSubscriptionToEventUpdates(true);
      return;
    } catch (e) {
      console.error(e);
    } finally {
      eventUpdatesSwitch.value!.disabled = false;
      eventUpdatesSwitch.value!.checked = eventUpdates.value;
      return;
    }
  }

  eventUpdatesSwitch.value!.disabled = true;
  try {
    await settingsStore.setSubscriptionToEventUpdates(false);
  } catch (e) {
    console.error(e);
  } finally {
    eventUpdatesSwitch.value!.disabled = false;
    eventUpdatesSwitch.value!.checked = eventUpdates.value;
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
      <m3e-list>
        <m3e-list-item ref="highlighted">
          <div>{{ $t('settings.headline-generalNotifications') }}</div>
        </m3e-list-item>
        <m3e-divider></m3e-divider>

        <m3e-list-item class="interactive" @click="toggleEventAnnouncements">
          <div class="headline">{{ $t('settings.label-eventAnnouncements') }}</div>
          <div class="supporting">{{ $t('settings.description-eventAnnouncements') }}</div>
          <input type="checkbox" class="switch" :checked="eventAnnouncements" ref="eventAnnouncementsSwitch" />
        </m3e-list-item>
        <m3e-list-item><m3e-icon name="info"></m3e-icon>
          <div class="supporting">{{ $t('settings.info-eventAnnouncements') }}</div>
        </m3e-list-item>
        <m3e-divider></m3e-divider>

        <m3e-list-item class="interactive" @click="toggleEventUpdates">
          <div class="headline">{{ $t('settings.label-eventUpdates') }}</div>
          <div class="supporting">{{ $t('settings.description-eventUpdates') }}</div>
          <input type="checkbox" class="switch" :checked="eventUpdates" ref="eventUpdatesSwitch" />
        </m3e-list-item>
        <m3e-list-item ref="highlightedEnd"><m3e-icon name="info"></m3e-icon>
          <div class="supporting">{{ $t('settings.info-eventUpdates') }}</div>
        </m3e-list-item>
        <m3e-list-item>
          <div>{{ $t('settings.headline-language') }}</div>
        </m3e-list-item>
        <m3e-divider></m3e-divider>

        <m3e-list-item class="interactive" @click="openLanguageDialog" data-test="open-language-dialog">
          <div class="headline">{{ $t('settings.label-appLanguage') }}</div>
          <div class="supporting">{{ $t('settings.option-'+selectedLanguage) || 'N/A' }}</div>
        </m3e-list-item>
        <m3e-divider></m3e-divider>

        <m3e-list-item class="interactive" @click="visitTranslationPage">
          <div class="headline">{{ $t('settings.label-helpTranslate') }}</div>
          <m3e-icon name="open_in_new"></m3e-icon>
        </m3e-list-item>
        <m3e-list-item>
          <div>{{ $t('settings.headline-information') }}</div>
        </m3e-list-item>
        <m3e-divider></m3e-divider>
        
        <m3e-list-item>
          <div class="headline">{{ $t('settings.label-version') }}</div>
          <div class="supporting">{{ versionCode }}</div>
        </m3e-list-item>
      </m3e-list>
    </main>
    <dialog ref="languageDialog" data-test="language-dialog" class="languageDialog">
      <div class="languageTitle">{{ $t('settings.label-appLanguage') }}</div>
      <div class="languageOptions">
        <button type="button" class="languageOption" v-for="(_, key) in languages" :key="key" :data-test="'language-option-'+key"
          @click="settingsStore.setLanguage(key); languageDialog?.close();">
          <input type="radio" :checked="selectedLanguage === key" /> {{ t('settings.option-'+key) }}
        </button>
      </div>
    </dialog>
  </div>
</template>
<style lang="scss" scoped>
m3e-app-bar {
  background-color: var(--mdc-theme-primary);
  padding-top: var(--safe-area-inset-top);
}

.top-bar-adjust {
  padding-top: 1rem;
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
  font-weight: 600;
}

.supporting {
  opacity: 0.8;
  font-size: 0.9rem;
}

.switch {
  margin-left: auto;
}

.languageDialog {
  width: min(28rem, 90vw);
  border: 1px solid rgba(0, 0, 0, 0.15);
  border-radius: 1rem;
  padding: 1rem;
  background: var(--mdc-theme-surface);
  color: var(--mdc-theme-on-surface);
}

.languageTitle {
  font-size: 1rem;
  font-weight: 700;
  margin-bottom: 0.75rem;
}

.languageOptions {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.languageOption {
  background: transparent;
  color: inherit;
  border: 0;
  text-align: left;
  padding: 0.5rem 0.35rem;
  border-radius: 0.5rem;
}

.languageOption:hover {
  background: color-mix(in srgb, var(--mdc-theme-primary) 14%, transparent);
}
</style>