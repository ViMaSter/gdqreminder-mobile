<script setup lang="ts">
import { onBeforeMount, onUnmounted, Ref, ref } from 'vue';
import { AppLauncher } from "@capacitor/app-launcher";
import { MdDialog } from "@material/web/dialog/dialog";
import Version from "@/plugins/versionPlugin";
import PushNotificationHelper from '@/utilities/pushNotificationHelper';
import { MdSwitch } from '@material/web/switch/switch';
import { useI18n } from 'vue-i18n';
import { App } from "@capacitor/app";
const emit = defineEmits(['setVisibility']);
const { t } = useI18n();

const closeSettings = () => {
  emit('setVisibility', "settings", false);
  emit('setVisibility', "main", true);
}
window.addEventListener('popstate', closeSettings);  
onUnmounted(() => {  
  window.removeEventListener('popstate', closeSettings);  
});  

const languageDialog = ref<MdDialog>();
const openLanguageDialog = () => {
  languageDialog.value!.open = true;
};

onBeforeMount(() => {
  App.addListener("backButton", async () => {
    if (languageDialog.value!.open) {
      languageDialog.value!.open = false;
      return;
    }
    closeSettings();
  });
});

const visitTranslationPage = () => {
  AppLauncher.openUrl({
    url: "https://crowdin.com/project/gdqreminder",
  });
};


let eventAnnouncements = ref(await PushNotificationHelper.isSubscribedToEventAnnouncements());
let eventUpdates = ref(await PushNotificationHelper.isSubscribedToEventUpdates());

const eventAnnouncementsSwitch = ref<MdSwitch>();
const toggleEventAnnouncements = async () => {
  if (!eventAnnouncements.value) {
    eventAnnouncementsSwitch.value!.disabled = true;
    try {
      await PushNotificationHelper.subscribeToEventAnnouncements();
      eventAnnouncements.value = true;
      return;
    } catch (e) {
      eventAnnouncements.value = false;
      console.error("Failed to subscribe to event announcements:", e);
    } finally {
      eventAnnouncementsSwitch.value!.disabled = false;
      eventAnnouncementsSwitch.value!.selected = eventAnnouncements.value;
    }
    return;
  }

  eventAnnouncementsSwitch.value!.disabled = true;
  try {
    await PushNotificationHelper.unsubscribeFromEventAnnouncements();
    eventAnnouncements.value = false;
  } catch (e) {
    eventAnnouncements.value = true;
    console.error("Failed to unsubscribe from event announcements:", e);
  } finally {
    eventAnnouncementsSwitch.value!.disabled = false;
    eventAnnouncementsSwitch.value!.selected = eventAnnouncements.value;
  }
};

const eventUpdatesSwitch = ref<MdSwitch>();
const toggleEventUpdates = async () => {
  if (!eventUpdates.value) {
    eventUpdatesSwitch.value!.disabled = true;
    try {
      await PushNotificationHelper.subscribeToEventUpdates();
      eventUpdates.value = true;
      return;
    } catch (e) {
      eventUpdates.value = false;
      console.error("Failed to subscribe to event updates:", e);
    } finally {
      eventUpdatesSwitch.value!.disabled = false;
      eventUpdatesSwitch.value!.selected = eventUpdates.value;
    }
    return;
  }

  eventUpdatesSwitch.value!.disabled = true;
  try {
    await PushNotificationHelper.unsubscribeFromEventUpdates();
    eventUpdates.value = false;
  } catch (e) {
    eventUpdates.value = true;
    console.error("Failed to unsubscribe from event updates:", e);
  } finally {
    eventUpdatesSwitch.value!.disabled = false;
    eventUpdatesSwitch.value!.selected = eventUpdates.value;
  }
};

const { versionName, versionCode: versionCodeValue } = await Version.getCurrent();
const versionCode = `${versionName}.${versionCodeValue}`;

const languages = {
  'system': t('settings.option-systemDefault'),
  'english': t('settings.option-english'),
  'german': t('settings.option-german'),
};
type LanguageKey = keyof typeof languages;
const selectedLanguage : Ref<LanguageKey> = ref('system');
const overrideAppLanguage = (language: LanguageKey) => {
  selectedLanguage.value = language;
  location = location;
};
</script>
<template>
  <div class="container">
    <mwc-top-app-bar-fixed>
      <md-icon-button slot="navigationIcon" @click="closeSettings"><md-icon>arrow_back</md-icon></md-icon-button>
      <div slot="title">{{ $t('settings.headline') }}</div>
    </mwc-top-app-bar-fixed>
    <main class="mdc-top-app-bar--fixed-adjust">
      <md-list>
        <md-list-item>
          <div slot="supporting-text">{{ $t('settings.headline-generalNotifications') }}</div>
        </md-list-item>
        <md-divider></md-divider>

        <md-list-item type="button" @click="toggleEventAnnouncements">
          <div slot="headline">{{ $t('settings.label-eventAnnouncements') }}</div>
          <div slot="supporting-text">{{ $t('settings.description-eventAnnouncements') }}</div>
          <md-switch :selected="eventAnnouncements" @change="toggleEventAnnouncements" ref="eventAnnouncementsSwitch"
            slot="end"></md-switch>
        </md-list-item>
        <md-list-item><md-icon slot="start" @click="closeSettings">info</md-icon>
          <div slot="supporting-text">{{ $t('settings.info-eventAnnouncements') }}</div>
        </md-list-item>
        <md-divider></md-divider>

        <md-list-item type="button" @click="toggleEventUpdates">
          <div slot="headline">{{ $t('settings.label-eventUpdates') }}</div>
          <div slot="supporting-text">{{ $t('settings.description-eventUpdates') }}</div>
          <md-switch :selected="eventUpdates" @change="toggleEventUpdates" ref="eventUpdatesSwitch"
            slot="end"></md-switch>
        </md-list-item>
        <md-list-item><md-icon slot="start" @click="closeSettings">info</md-icon>
          <div slot="supporting-text">{{ $t('settings.info-eventUpdates') }}</div>
        </md-list-item>
        <md-list-item>
          <div slot="supporting-text">{{ $t('settings.headline-language') }}</div>
        </md-list-item>
        <md-divider></md-divider>

        <!-- <md-list-item type="button" @click="openLanguageDialog">
          <div slot="headline">{{ $t('settings.label-appLanguage') }}</div>
          <div slot="supporting-text">{{ languages[selectedLanguage] || 'N/A' }}</div>
        </md-list-item>
        <md-divider></md-divider> -->

        <md-list-item type="button" @click="visitTranslationPage">
          <div slot="headline">{{ $t('settings.label-helpTranslate') }}</div>
          <md-icon slot="end" @click="closeSettings">open_in_new</md-icon>
        </md-list-item>
        <md-list-item>
          <div slot="supporting-text">{{ $t('settings.headline-information') }}</div>
        </md-list-item>
        <md-divider></md-divider>
        
        <md-list-item>
          <div slot="headline">{{ $t('settings.label-version') }}</div>
          <div slot="supporting-text">{{ versionCode }}</div>
        </md-list-item>
      </md-list>
    </main>
    <md-dialog ref="languageDialog">
      <div slot="headline">{{ $t('settings.label-appLanguage') }}</div>
      <div slot="content">
        <md-list-item type="button" v-for="(lang, key) in languages" :key="key"
          @click="overrideAppLanguage(key as LanguageKey)">
          <label slot="headline"><md-radio :checked="selectedLanguage === key" slot="end"></md-radio> {{ lang }}</label>
        </md-list-item>
      </div>
    </md-dialog>
  </div>
</template>
<style lang="scss" scoped>
mwc-top-app-bar-fixed {
  background-color: var(--mdc-theme-primary);
  padding-top: var(--safe-area-inset-top);
  margin-top: calc(var(--safe-area-inset-top) * -1);
}

.container {
  font-family: Roboto;
  margin: 0;

  background: var(--md-sys-color-background);
  color: var(--md-sys-color-on-background);
  height: 100vh;
  width: 100vw;
}


md-dialog {
  --md-dialog-container-color: var(--mdc-theme-surface);
  --md-dialog-headline-color: var(--mdc-theme-on-surface);
  --md-dialog-supporting-text-color: var(--mdc-theme-on-surface);
  --md-filled-text-field-container-color: var(--mdc-theme-surface);
  --md-filled-text-field-focus-active-indicator-color: var(--mdc-theme-primary);
  --md-filled-text-field-label-text-color: var(--mdc-theme-on-surface);
  --md-filled-field-active-indicator-color: var(--mdc-theme-primary);

  md-filled-text-field {
    width: 100%;
  }

  md-filled-text-field.yourFriendCode {
    width: 85%;
  }

  md-icon-button {
    width: 15%;
  }

  width: 80%;
}
</style>