<script lang="ts">
import {
  defineComponent,
  ref,
  inject,
  onMounted,
  watchEffect,
  computed,
  Ref,
} from "vue";
import "../utilities/pushNotificationHelper";
import { GDQRunData } from "@/interfaces/GDQRun";
import PushNotificationHelper from "../utilities/pushNotificationHelper";
import { useRunReminderStore } from "@/stores/runReminders";
import { DateProvider } from "@/interfaces/DateProvider";
import { useFriendRunReminderStore } from "@/stores/friendRuns";
import "@material/web/all.js";

export default defineComponent({
  props: {
    pk: {
      type: String,
      required: true,
    },
    runData: {
      type: Object as () => GDQRunData,
      required: true,
    },
    runnerNames: {
      type: Array as () => string[],
      required: true,
    }
  },
  setup(props) {
    const reminder = useRunReminderStore();

    const showSnackbar = inject<(text: string) => void>("showSnackbar")!;
    const onFocus = () => {
      showSnackbar(
        `"${runName} (${
          props.runData.category
        })" run by "${props.runnerNames.join(", ")}"`,
      );
    };

    const hasActiveReminder = ref(
      reminder.allReminders.includes(props.pk.toString()),
    );

    const runName = (props.runData.display_name.length == 0 ? props.runData.name : props.runData.display_name).replaceAll("\\n", " ");
    const start = ref(new Date(props.runData.starttime));
    const end = new Date(props.runData.endtime);
    const duration = new Date(end.getTime() - start.value.getTime());
    const startString = ref(
      start.value.toLocaleTimeString(navigator.language, {
        hour: "numeric",
        minute: "numeric",
      })
    );

    const time = ref<HTMLSpanElement>();

    watchEffect(() => {
      const newValue = new Date(props.runData.starttime).toLocaleTimeString(navigator.language, {
        hour: "numeric",
        minute: "numeric",
      });
      // if the new value is different, fade time opacity to 0, then change the value, then fade opacity back to 1 with 1000ms
      if (startString.value !== newValue) {
        (async () => {
          if (time.value) {
            time.value.style.transition = "opacity 0.25s";
            time.value.style.opacity = "0";
            await new Promise((resolve) => setTimeout(resolve, 250));
            startString.value = newValue;
            time.value.style.opacity = "1";
          }
        })();
      }
    });

    const durationHMMSS = `${duration.getUTCHours()}:${duration
      .getUTCMinutes()
      .toString()
      .padStart(2, "0")}:${duration
      .getUTCSeconds()
      .toString()
      .padStart(2, "0")}`;
    const runners = ref(`${props.runnerNames.join(", ")}`);

    const reminderClasses = ref("");
    const savedByFriend = ref(false);

    const setFriendClass = (friendRuns: string[]) => {
      savedByFriend.value = friendRuns.includes(props.pk.toString());
    };
    const friendRunStore = useFriendRunReminderStore();
    setFriendClass(friendRunStore.allReminders);

    const generateRunTypeClassName = () => {
      if (props.runData.display_name == "Pre-Show") {
        return "in-person";
      }
      if (props.runData.display_name.includes("Daily Recap")) {
        return "in-person";
      }
      if (props.runnerNames.join(", ") == "Tech Crew") {
        return "in-person";
      }
      if (props.runData.console == "SGDQ") {
        return "in-person";
      }
      if (props.runData.console == "AGDQ") {
        return "in-person";
      }
      if (props.runData.console == "Live") {
        return "in-person";
      }
      if (props.runData.console == "GDQ Stage") {
        return "in-person";
      }
      if (props.runData.display_name.toLowerCase().includes("bonus game")) {
        return "bonus-game";
      }
      return "";
    };

    watchEffect(() => {
      const classes = ["reminder"];
      if (hasActiveReminder.value) {
        classes.push("is-set");
      }
      if (savedByFriend.value) {
        classes.push("with-friend");
      }

      classes.push(generateRunTypeClassName());
      reminderClasses.value = classes.join(" ");
    });
    friendRunStore.$subscribe((_, store) => {
      setFriendClass(store.runs);
    });
    const scrollRunContainerBy = inject<(x: number, y: number) => void>(
      "scrollRunContainerBy",
    );

    const timeProvider = inject<DateProvider>("dateProvider")!;
    const now = timeProvider.getCurrent();
    const run = ref<HTMLDivElement>();
    const isActive = ref(start.value < now && now < end);
    let currentRun: Ref<[HTMLDivElement, GDQRunData]> | null = null;
    onMounted(() => {
      if (start.value < now && now < end) {
        run.value!.scrollIntoView(true);
        scrollRunContainerBy!(0, -50);
      }
      currentRun =
        inject<Ref<[HTMLDivElement, GDQRunData]>>("currentRun")!;
      if (isActive.value) {
        currentRun.value = [run.value!, props.runData];
      }
    });
    const isInThePast = ref(end < now);
    const generateIsOverClassName = computed(
      () =>
        `run ${generateRunTypeClassName()} ${isInThePast.value ? "is-over" : ""}`,
    );

    const interval = setInterval(() => {
      const now = timeProvider.getCurrent();
      isInThePast.value = end < now;
      isActive.value = start.value < now && now < end;

      if (isActive.value) {
        if (!run.value) {
          clearInterval(interval);
        }
        currentRun!.value = [run.value!, props.runData];
      }
    }, 200);

    const jumpToTwitch = inject<() => void>("jumpToTwitch")!;
    const jumpToYouTube =
      inject<(runName: string, runnerNames: string[], youtubeLink : string | undefined) => void>(
        "jumpToYouTube",
      )!;

    return {
      pk: props.pk,
      onFocus,
      className: generateIsOverClassName,
      reminderClasses,
      start,
      end,
      time,
      startString,
      durationHMMSS,
      runners,
      runName,
      hasActiveReminder,
      run,
      isActive,
      isInThePast,
      jumpToTwitch,
      jumpToYouTube,
    };
  },
  methods: {
    toggleReminder: async function () {
      if (this.isActive) {
        this.jumpToTwitch();
        return;
      }

      if (this.isInThePast) {
        const youTubeLink = this.runData.video_links.find(
          (link) => link.link_type === "youtube",
        )?.url;
        this.jumpToYouTube(this.runName, this.runnerNames, youTubeLink);
        return;
      }
      const reminderStore = useRunReminderStore();
      if (reminderStore.allReminders.includes(this.pk.toString())) {
        if (!(await reminderStore.remove(this.pk.toString()))) {
          return;
        }
        PushNotificationHelper.unsubscribeFromStartOfRun(this.pk.toString());
        this.hasActiveReminder = false;
        return false;
      }

      if (
        !(await reminderStore.add(
          this.pk.toString(),
          this.runName,
          this.start,
          this.end,
          `Runner: ${this.runnerNames.join(", ")}\nCategory: ${this.runData.category}`,
        ))
      ) {
        return;
      }
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
            ><md-icon>schedule</md-icon><span class="time" ref="time">{{ startString }}</span></span
          >
        <span class="meta-entry timer"
          ><md-icon filled>timer</md-icon>{{ durationHMMSS }}</span
        >
        <span class="meta-entry person"
          ><md-icon filled>person</md-icon> {{ runners }}</span
        >
      </span>
    </div>
    <div :class="reminderClasses">
      <div class="alarm">
        <md-icon>alarm</md-icon>
      </div>
      <div class="friend">
        <md-icon filled>group</md-icon>
      </div>
    </div>
  </div>
</template>
<style scoped lang="scss">
.run {
  position: relative;

  display: flex;
  flex-direction: row;
  justify-content: stretch;

  border-radius: 11px;
  margin-bottom: 14px;
  overflow: hidden;

  md-icon[filled] {
    font-variation-settings: "FILL" 1;
  }

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

    flex-shrink: 1;
    width: 100%;
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

      .time {
        display: inline-block;
        transition: opacity 0.25s;
      }
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
      }
    }

    md-icon {
      --md-icon-size: 14px;
      vertical-align: middle;
      margin-top: -2px;
      margin-right: 4px;
    }
  }

  .reminder {
    display: flex;
    transition: 0.35s cubic-bezier(0.16, 1, 0.3, 1) margin-right;
    margin-right: -100%;

    justify-content: center;
    align-items: center;

    height: 100%;
    flex: 0 0 auto;

    & > * {
      height: 50px;
      width: 0px;
      text-align: center;
      display: flex;
      justify-content: center;
      align-items: center;
      overflow: hidden;
      transition: 0.15s ease-out all;
    }
    .is-over & {
      text-decoration: none;
    }

    &.is-set {
      transition: 0.15s ease-out all;
      margin-right: 0px;
      .alarm {
        transition: 0.15s ease-out all;
        width: 50px;
      }
    }
    &.with-friend {
      transition: 0.15s ease-out all;
      margin-right: 0px;
      .friend {
        transition: 0.15s ease-out all;
        width: 50px;
      }
    }
    &.is-set.with-friend {
      transition: 0.15s ease-out all;
      margin-right: 0px;
      .friend {
        width: 50px;
      }
      .alarm {
        width: 50px;
      }
    }

    .dark-mode & {
      color: var(--md-sys-color-primary-container);
      &.bonus-game {
        color: var(--md-sys-color-secondary-container);
      }
      &.in-person {
        color: var(--md-sys-color-tertiary-container);
      }

      .alarm {
        background: hsla(52, 76%, 41%, 1);
      }
      .friend {
        background: hsla(0, 0%, 74%, 1);
      }
    }

    &.is-set .alarm md-icon,
    &.with-friend .friend md-icon {
      margin-left: 0px;
      transition: 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) margin-left;
      transform: rotateZ(0deg);
      transition: 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) transform;
    }

    .friend md-icon {
      margin-bottom: -3px;
      --md-icon-size: 44px;
      margin-right: 3px;
    }

    md-icon {
      margin-left: 50px;
      transition: 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) margin-left;
      transform: rotateZ(90deg);
      transition: 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) transform;

      transform-origin: bottom center;
      --md-icon-size: 39px;
    }
  }
}

// coloring
.run {
  background: var(--md-sys-color-primary-container);
  color: var(--md-sys-color-on-primary-container);
}
.bonus-game.run {
  background: var(--md-sys-color-secondary-container);
  color: var(--md-sys-color-on-secondary-container);
}
.in-person.run {
  background: var(--md-sys-color-tertiary-container);
  color: var(--md-sys-color-on-tertiary-container);
}
</style>
