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

    const onFocus = () => {
      emit(
        "showSnackbar",
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
    :class="className"
    :activated="isTrackedRun ? true : false"
  >
    <span class="runName">{{ runName }}</span>
     

    <span class="meta"> <mwc-icon>schedule</mwc-icon>{{ startString }}<mwc-icon>timer</mwc-icon>{{ durationHMMSS }}<mwc-icon>person</mwc-icon> {{runners}} </span>
  </div>
</template>
<style scoped lang="scss">
div {
  background: hsla(272, 95%, 40%, 1);
  --mdc-theme-primary: hsla(180, 100%, 100%, 0.3);
  &.in-person {
    background: hsla(230, 95%, 40%, 1);
    --mdc-theme-primary: hsla(230, 100%, 100%, 0.3);
  }
  &.bonus-game {
  background: hsla(180, 95%, 40%, 1);
  --mdc-theme-primary: hsla(347, 89%, 100%, 0.3);
  }
}
.agdq {
  div {
    background: hsla(180, 95%, 40%, 1);
    --mdc-theme-primary: hsla(180, 100%, 100%, 0.3);
    &.in-person {
      background: hsla(230, 95%, 40%, 1);
      --mdc-theme-primary: hsla(230, 100%, 100%, 0.3);
    }
    &.bonus-game {
    background: hsla(343, 95%, 40%, 1);
    --mdc-theme-primary: hsla(347, 89%, 100%, 0.3);
    }
  }
}

.sgdq {
  div {
    background: hsla(343, 95%, 40%, 1);
    --mdc-theme-primary: hsla(347, 89%, 100%, 0.3);
    &.in-person {
      background: hsla(230, 95%, 40%, 1);
      --mdc-theme-primary: hsla(230, 100%, 100%, 0.3);
    }
    &.bonus-game {
      background: hsla(180, 95%, 40%, 1);
      --mdc-theme-primary: hsla(180, 100%, 100%, 0.3);
    }
  }
}

* {
  color: #FFF;
}

.dark-mode {
  div {
    background: hsla(265, 100%, 63%, 0.3);
    --mdc-theme-primary: hsla(180, 100%, 100%, 0.3);
    &.in-person {
      background: hsla(230, 100%, 50%, 0.3);
      --mdc-theme-primary: hsla(230, 100%, 100%, 0.3);
    }
    &.bonus-game {
    background: hsla(180, 100%, 50%, 0.3);
    --mdc-theme-primary: hsla(347, 89%, 100%, 0.3);
    }
  }
  .agdq {
    div {
      background: hsla(180, 100%, 50%, 0.3);
      --mdc-theme-primary: hsla(180, 100%, 100%, 0.3);
      &.in-person {
        background: hsla(230, 100%, 50%, 0.3);
        --mdc-theme-primary: hsla(230, 100%, 100%, 0.3);
      }
      &.bonus-game {
      background: hsla(347, 89%, 50%, 0.3);
      --mdc-theme-primary: hsla(347, 89%, 100%, 0.3);
      }
    }
  }
  
  .sgdq {
    div {
      background: hsla(347, 89%, 50%, 0.3);
      --mdc-theme-primary: hsla(347, 89%, 100%, 0.3);
      &.in-person {
        background: hsla(230, 100%, 50%, 0.3);
        --mdc-theme-primary: hsla(230, 100%, 100%, 0.3);
      }
      &.bonus-game {
        background: hsla(180, 100%, 50%, 0.3);
        --mdc-theme-primary: hsla(180, 100%, 100%, 0.3);
      }
    }
  }

  * {
    color: #FFF;
  }
}
</style>
