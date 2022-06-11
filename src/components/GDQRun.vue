<script lang="ts">
import { defineComponent, ref, inject, Ref } from "vue";
import "../utilities/pushNotificationHelper";
import { GDQRunDataFields } from "@/interfaces/GDQRun";
import PushNotificationHelper from "../utilities/pushNotificationHelper";
import "@material/mwc-icon"
import { watch } from "fs";
export default defineComponent({
  props: {
    pk: {
      type: String,
      required: true,
    },
    fields: {
      type: Object as () => GDQRunDataFields,
      required: true,
    },
    runnerNames: {
      type: Array as () => string[],
      required: true,
    },
    last: {
      type: Boolean,
      required: true,
    },
  },
  setup(props, { emit }) {
    let reminder = inject<Ref<string[]>>("reminder")!;
    const toggleReminder = () => {
      if (reminder.value.includes(props.pk.toString())) {
        reminder.value = reminder.value.filter(
          (pk) => pk !== props.pk.toString()
        );
        PushNotificationHelper.unsubscribeFromStartOfRun(props.pk.toString());
        return false;
      }

      reminder.value.push(props.pk.toString());
      PushNotificationHelper.subscribeToStartOfRun(props.pk.toString());
      return true;
    };

    const hasActiveReminder = reminder.value.includes(props.pk.toString());
    const showSnackbar = inject<(text : string) => void>("showSnackbar")!;
    const onFocus = () => {
      showSnackbar(
        `"${runName} (${
          props.fields.category
        })" run by "${props.runnerNames.join(", ")}"`
      );
    };

    const isTrackedRun = ref(reminder.value.includes(props.pk.toString()));
    const runName = props.fields.display_name.replaceAll("\\n", " ");
    const start = new Date(props.fields.starttime);
    const end = new Date(props.fields.endtime);
    const duration = new Date(end.getTime() - start.getTime());
    const hours = start.getHours() > 12 ? start.getHours() - 12 : start.getHours();
    const ampm = start.getHours() > 12 ? "p.m." : "a.m.";
    const startString = hours+":"+start.getMinutes().toString().padStart(2, '0') + " " + ampm;
    const durationHMMSS = `${duration.getUTCHours()}:${duration.getUTCMinutes().toString().padStart(2, '0')}:${duration.getUTCSeconds().toString().padStart(2, '0')}`;
    const runners = ref(`${props.runnerNames.join(", ")}`);

    const generateClassName = () => {
      if (props.fields.display_name == "Pre-Show") {
        return "in-person";
      }
      if (props.runnerNames.join(", ") == "Tech Crew") {
        return "in-person";
      }
      if (props.fields.console == "SGDQ") {
        return "in-person";
      }
      if (props.fields.console == "AGDQ") {
        return "in-person";
      }
      if (props.fields.console == "Live") {
        return "in-person";
      }
      if (props.fields.console == "GDQ Stage") {
        return "in-person";
      }
      if (props.fields.display_name.toLowerCase().includes("bonus game")) {
        return "bonus-game";
      }
      return "";
    };

    const rand = Math.random()>0.5;
    console.log(rand)

    return {
      toggleReminder,
      onFocus,
      className: 'run ' + generateClassName(),
      reminderClasses: 'reminder ' + (Math.random() > 0.5 ? 'is-set' : ''),
      startString,
      durationHMMSS,
      runners,
      runName,
      isTrackedRun,
    };
  }
});
</script>

<template>
  <div
    @click="toggleReminder()"
    @focus="onFocus()"
    tabindex="0"
    :class="className"
    :activated="isTrackedRun ? true : false"
  >
    <div class="content">
      <span class="runName">{{ runName }}</span>
      <span class="meta">
        <span class="meta-entry schedule"><mwc-icon>schedule</mwc-icon>{{ startString }}</span>
        <span class="meta-entry timer"><mwc-icon>timer</mwc-icon>{{ durationHMMSS }}</span>
        <span class="meta-entry person"><mwc-icon>person</mwc-icon> {{runners}}</span>
      </span>
    </div>
    <div :class="reminderClasses"><mwc-icon>alarm</mwc-icon></div>
  </div>
</template>
<style scoped lang="scss">
// layout
.run
{
  position: relative;

  display: flex;
  flex-direction: row;
  justify-content: stretch;

  border-radius: 11px;
  margin-bottom: 14px;
  overflow: hidden;

  .content
  {
    display: flex;
    flex-direction: column;
    justify-content: center;
    overflow: hidden;
    
    flex-grow: 1;
    flex-shrink: 1;
  }

  span
  {
    $text-size: 14px;

    display: block;
    font-size: $text-size;

    &.runName, &.meta
    {
      margin: 0.1em 0.75em;
      flex-shrink: 1;
    }

    &.runName
    {
      font-weight: 500;
      text-overflow: ellipsis;
      overflow-x: hidden;
      white-space: nowrap;
    }

    &.meta
    {
      display: flex;
      flex-shrink: 1;
    }

    &.meta-entry
    {
      display: inline-block;
      vertical-align: top;
      text-align: left;
      white-space: nowrap;
      overflow-x: hidden;
      
      &.schedule
      {
        flex: 0 0 100px;
      }
      &.timer
      {
        flex: 0 0 90px;
      }
      &.person
      {
        text-overflow: ellipsis;
        overflow-x: hidden;
        white-space: nowrap;
        flex-grow: 1;
      }
    }

    mwc-icon
    {
      vertical-align: middle;
      margin-top: -2px;
      margin-right: 4px;
      --mdc-icon-size: $text-size;
    }
  }

  .reminder
  {
    &.is-set
    {
      display: flex;
    }

    display: none;
    justify-content: center;
    align-items: center;

    height: 100%;
    flex: 0 0 auto;
    aspect-ratio: 1/1;

    background: var(--background-alarm);
    
    mwc-icon
    {
      --mdc-icon-size: 32px;
    }
  }
}


// coloring
.content {
  background: var(--vote-purple);
  --mdc-theme-primary: color.adjust(var(--vote-purple, $lightness: +100%));
}
  .in-person .content {
    background: var(--vote-blue);
    --mdc-theme-primary: color.adjust(var(--vote-blue, $lightness: +100%));
  }
  .bonus-game .content {
    background: var(--vote-cyan);
    --mdc-theme-primary: color.adjust(var(--vote-cyan, $lightness: +100%));
  }
.agdq {
  .content {
    background: var(--vote-cyan);
    --mdc-theme-primary: color.adjust(var(--vote-cyan, $lightness: +100%));
  }
    .in-person .content {
        background: var(--vote-blue);
        --mdc-theme-primary: color.adjust(var(--vote-blue, $lightness: +100%));
    }
    .bonus-game .content {
        background: var(--vote-red);
        --mdc-theme-primary: color.adjust(var(--vote-red, $lightness: +100%));
    }
  }

.sgdq {
  .content {
    background: var(--vote-red);
    --mdc-theme-primary: color.adjust(var(--vote-red, $lightness: +100%));
  }
  .in-person .content {
      background: var(--vote-blue);
      --mdc-theme-primary: color.adjust(var(--vote-blue, $lightness: +100%));
  }
  .bonus-game .content {
      background: var(--vote-cyan);
      --mdc-theme-primary: color.adjust(var(--vote-cyan, $lightness: +100%));
  }
}

* {
  color: var(--primary-text);
}
</style>
