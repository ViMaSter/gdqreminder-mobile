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
        `"${primary} (${
          props.fields.category
        })" run by "${props.runnerNames.join(", ")}"`
      );
    };

    const isTrackedRun = ref(reminder.value.includes(props.pk.toString()));
    const primary = props.fields.display_name.replaceAll("\\n", " ");
    const start = new Date(props.fields.starttime).toLocaleTimeString();
    const end = new Date(props.fields.endtime).toLocaleTimeString();
    const secondary = ref(
      `${props.runnerNames.join(", ")} - ${props.fields.category}`
    );

    return {
      toggleReminder,
      onFocus,
      className: () => {
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
      },
      start,
      end,
      secondary,
      primary,
      isTrackedRun,
    };
  },
});
</script>

<template>
  <mwc-list-item
    twoline
    @click="toggleReminder()"
    @focus="onFocus()"
    :class="className()"
    hasMeta
    :activated="isTrackedRun ? true : false"
  >
    <span class="left">{{ primary }}</span>
    <span class="left" slot="secondary"><mwc-icon>AccessTime</mwc-icon>{{ secondary }}<mwc-icon>Timer</mwc-icon><mwc-icon>Person</mwc-icon></span>
    <span slot="meta">
      <span class="start">{{ start }}</span>
      <span class="end">{{ end }}</span>
    </span>
  </mwc-list-item>
  <li v-if="!last" divider role="separator" padded></li>
</template>
<style scoped lang="scss">
mwc-list-item
{
  --mdc-typography-body2-font-size: 1em;
}

span {
  font-size: 1em !important;
}
span[slot="meta"] {
  display: flex;
  margin-left: calc(-60pt + 100%);
  text-align: right;
  width: 60pt !important;
  flex-direction: column;
  align-content: flex-end;
  justify-content: space-between;
  align-items: flex-end;
  flex-wrap: nowrap;
  height: 175%;
  margin-top: -45.5%;
}

span.left {
  display: inline-block;
  width: calc(100vw - (62.5pt + (32px + (60pt + 16px))));
  text-overflow: ellipsis;
  overflow: hidden;
}

mwc-list-item {
  border-radius: 13px;
  margin-bottom: 37px;
}

mwc-list-item {
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
  mwc-list-item {
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
  mwc-list-item {
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
  mwc-list-item {
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
    mwc-list-item {
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
    mwc-list-item {
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
