<script lang="ts">
import { defineComponent, ref, inject, Ref } from "vue";
import "../utilities/pushNotificationHelper";
import { GDQRunDataFields } from "@/interfaces/GDQRun";
import PushNotificationHelper from "../utilities/pushNotificationHelper";
import "@material/mwc-icon"
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

    return {
      toggleReminder,
      onFocus,
      className: generateClassName(),
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
    <span class="runName">{{ runName }}</span>
    <span class="meta">
      <span class="meta-entry schedule"><mwc-icon>schedule</mwc-icon>{{ startString }}</span>
      <span class="meta-entry timer"><mwc-icon>timer</mwc-icon>{{ durationHMMSS }}</span>
      <span class="meta-entry person"><mwc-icon>person</mwc-icon> {{runners}}</span>
    </span>
  </div>
</template>
<style scoped lang="scss">
// layout
div
{
  display: flex;
  flex-direction: column;
  justify-content: center;
  border-radius: 11px;
  margin-bottom: 14px;
  
  span
  {
    $text-size: 14px;

    display: block;
    font-size: $text-size;

    &.runName, &.meta
    {
      margin: 0.1em 0.75em;
    }

    &.runName
    {
      font-weight: 500;
      text-overflow: ellipsis;
      overflow-x: hidden;
      white-space: nowrap;
    }

    &.meta-entry
    {
      display: inline-block;
      vertical-align: top;
      text-align: left;
      &.schedule
      {
        width: 93px;
      }
      &.timer
      {
        width: 80px;
      }
      &.person
      {
        width: 120px;
        text-overflow: ellipsis;
        overflow-x: hidden;
        white-space: nowrap;
      }
    }

    mwc-icon
    {
      vertical-align: middle;
      margin-top: -2px;
      margin-right: 4px;
    }

    mwc-icon
    {
      --mdc-icon-size: $text-size;
    }
  }
}


// coloring
div {
  background: var(--vote-purple);
  --mdc-theme-primary: color.adjust(var(--vote-purple, $lightness: +100%));
  &.in-person {
    background: var(--vote-blue);
    --mdc-theme-primary: color.adjust(var(--vote-blue, $lightness: +100%));
  }
  &.bonus-game {
    background: var(--vote-cyan);
    --mdc-theme-primary: color.adjust(var(--vote-cyan, $lightness: +100%));
  }
}
.agdq {
  div {
    background: var(--vote-cyan);
    ;
    &.in-person {
        background: var(--vote-blue);
        --mdc-theme-primary: color.adjust(var(--vote-blue, $lightness: +100%));
    }
    &.bonus-game {
        background: var(--vote-red);
        --mdc-theme-primary: color.adjust(var(--vote-red, $lightness: +100%));
    }
  }
}

.sgdq {
  div {
    background: var(--vote-red);
    --mdc-theme-primary: color.adjust(var(--vote-red, $lightness: +100%));
    &.in-person {
        background: var(--vote-blue);
        --mdc-theme-primary: color.adjust(var(--vote-blue, $lightness: +100%));
    }
    &.bonus-game {
        background: var(--vote-cyan);
        --mdc-theme-primary: color.adjust(var(--vote-cyan, $lightness: +100%));
    }
  }
}

* {
  color: var(--primary-text);
}
</style>
