<script lang="ts">
import { defineComponent, ref, inject, onMounted, watchEffect, computed, Ref } from "vue";
import "../utilities/pushNotificationHelper";
import { GDQRunDataFields } from "@/interfaces/GDQRun";
import PushNotificationHelper from "../utilities/pushNotificationHelper";
import "@material/mwc-icon";
import { useRunReminderStore } from "@/stores/runReminders";
import { DateProvider } from "@/interfaces/DateProvider";

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
  setup(props) {
    let reminder = useRunReminderStore();
    const showSnackbar = inject<(text: string) => void>("showSnackbar")!;
    const onFocus = () => {
      showSnackbar(
        `"${runName} (${
          props.fields.category
        })" run by "${props.runnerNames.join(", ")}"`
      );
    };

    const hasActiveReminder = ref(
      reminder.allReminders.includes(props.pk.toString())
    );

    const runName = props.fields.display_name.replaceAll("\\n", " ");
    const start = new Date(props.fields.starttime);
    const end = new Date(props.fields.endtime);
    const duration = new Date(end.getTime() - start.getTime());
    const startString = start.toLocaleTimeString(
      navigator.language,
      {
        hour: "numeric",
        minute: "numeric"
      }
    );
    const durationHMMSS = `${duration.getUTCHours()}:${duration
      .getUTCMinutes()
      .toString()
      .padStart(2, "0")}:${duration
      .getUTCSeconds()
      .toString()
      .padStart(2, "0")}`;
    const runners = ref(`${props.runnerNames.join(", ")}`);

    let reminderClasses = ref("");
    watchEffect(() => {
      reminderClasses.value =
        "reminder " + (hasActiveReminder.value ? "is-set" : "");
    });

    const generateRunTypeClassName = () => {
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
    const scrollRunContainerBy = inject<(x: number, y: number) => void>(
      "scrollRunContainerBy"
    );

    const timeProvider = inject<DateProvider>("dateProvider")!;
    const now = timeProvider.getCurrent();
    const run = ref<HTMLDivElement>();
    const isActive = ref(start < now && now < end);
    let currentRun : Ref<[HTMLDivElement, GDQRunDataFields]> | null = null;
    onMounted(() => {
      if (start < now && now < end) {
        run.value!.scrollIntoView(true);
        scrollRunContainerBy!(0, -50);
      }
      currentRun = inject<Ref<[HTMLDivElement, GDQRunDataFields]>>("currentRun")!;
      if (isActive.value)
      {
        currentRun.value = [run.value!, props.fields];
      }
    });
    const isInThePast = ref(end < now);
    const generateIsOverClassName = computed(() => `run ${generateRunTypeClassName()} ${isInThePast.value ?  "is-over" : ""}`);

    let interval = setInterval(() => {
      const now = timeProvider.getCurrent();
      isInThePast.value = end < now;
      isActive.value = start < now && now < end;

      if (isActive.value)
      {
        if (!run.value)
        {
          clearInterval(interval);
        }
        currentRun!.value = [run.value!, props.fields];
      }
    }, 200);

    const jumpToTwitch = inject<()=>void>("jumpToTwitch")!;
    const jumpToYouTube = inject<(runName: string, runnerNames: string[])=>void>("jumpToYouTube")!;

    return {
      pk: props.pk,
      onFocus,
      className: generateIsOverClassName,
      reminderClasses,
      startString,
      durationHMMSS,
      runners,
      runName,
      hasActiveReminder,
      run,
      isActive,
      isInThePast,
      jumpToTwitch,
      jumpToYouTube
    };
  },
  methods: {
    toggleReminder: async function () {
      if (this.isActive)
      {
          this.jumpToTwitch();
          return;
      }
      
      if (this.isInThePast)
      {
          this.jumpToYouTube(this.runName, this.runnerNames);
          return;
      }
      const reminderStore = useRunReminderStore();
      if (reminderStore.allReminders.includes(this.pk.toString())) {
        reminderStore.remove(this.pk.toString());
        PushNotificationHelper.unsubscribeFromStartOfRun(this.pk.toString());
        this.hasActiveReminder = false;
        return false;
      }

      reminderStore.add(this.pk.toString());
      PushNotificationHelper.subscribeToStartOfRun(this.pk.toString());
      this.hasActiveReminder = true;
      return true;
    },
  },
});
</script>

<template>
  <div
    @click="toggleReminder()"
    @focus="onFocus()"
    tabindex="0"
    :class="className"
    ref="run"
  >
    <div class="content">
      <span class="runName">{{ runName }}</span>
      <span class="meta">
        <span class="meta-entry schedule"
          ><mwc-icon>schedule</mwc-icon>{{ startString }}</span
        >
        <span class="meta-entry timer"
          ><mwc-icon>timer</mwc-icon>{{ durationHMMSS }}</span
        >
        <span class="meta-entry person"
          ><mwc-icon>person</mwc-icon> {{ runners }}</span
        >
      </span>
    </div>
    <div :class="reminderClasses"><mwc-icon>alarm</mwc-icon></div>
  </div>
</template>
<style scoped lang="scss">
// layout
.run {
  position: relative;

  display: flex;
  flex-direction: row;
  justify-content: stretch;

  border-radius: 11px;
  margin-bottom: 14px;
  overflow: hidden;

  &.is-over {
    .content {
      text-decoration: line-through;
      opacity: 0.5;
    }
    .reminder {
      opacity: 0.5;
    }
  }

  .content {
    display: flex;
    flex-direction: column;
    justify-content: center;
    overflow: hidden;

    flex-grow: 1;
    flex-shrink: 1;
  }

  span {
    $text-size: 14px;

    display: block;
    font-size: $text-size;

    &.runName,
    &.meta {
      margin: 0.1em 0.75em;
      flex-shrink: 1;
    }

    &.runName {
      font-weight: 500;
      text-overflow: ellipsis;
      overflow-x: hidden;
      white-space: nowrap;
    }

    &.meta {
      display: flex;
      flex-shrink: 1;
    }

    &.meta-entry {
      display: inline-block;
      vertical-align: top;
      text-align: left;
      white-space: nowrap;
      overflow-x: hidden;

      &.schedule {
        flex: 0 0 100px;
      }
      &.timer {
        flex: 0 0 90px;
      }
      &.person {
        text-overflow: ellipsis;
        overflow-x: hidden;
        white-space: nowrap;
        flex-grow: 1;
      }
    }

    mwc-icon {
      vertical-align: middle;
      margin-top: -2px;
      margin-right: 4px;
      --mdc-icon-size: $text-size;
    }
  }

  .reminder {
    .is-over & {
      text-decoration: none;
    }
    &.is-set {
      transition: 0.15s ease-out all;
      margin-right: 0px;
    }

    display: flex;
    transition: 0.35s cubic-bezier(0.16, 1, 0.3, 1) all;
    margin-right: -50px;

    justify-content: center;
    align-items: center;

    height: 100%;
    flex: 0 0 auto;
    aspect-ratio: 1/1;

    background: var(--background-alarm);

    &.is-set mwc-icon {
      margin-left: 0px;
      transition: 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) margin-left;
      transform: rotateZ(0deg);
      transition: 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) transform;
    }

    mwc-icon {
      margin-left: 50px;
      transition: 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) margin-left;
      transform: rotateZ(90deg);
      transition: 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) transform;

      transform-origin: bottom center;
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
