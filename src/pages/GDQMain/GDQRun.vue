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
import { GDQRunData } from "@/interfaces/GDQRun";
import PushNotificationHelper from "@/utilities/pushNotificationHelper";
import { useRunReminderStore } from "@/stores/runReminders";
import { DateProvider } from "@/interfaces/DateProvider";
import { useFriendRunReminderStore } from "@/stores/friendRuns";
import { useSettingsStore } from "@/stores/settings";
import "@m3e/web/icon";

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
    },
    matchingRunnerIndexes: {
      type: Array as () => number[],
      required: false,
      default: () => [],
    },
    searchTerms: {
      type: Array as () => string[],
      required: false,
      default: () => [],
    },
    isRunNameMatched: {
      type: Boolean,
      required: false,
      default: false,
    }
  },
  setup(props) {
    const reminder = useRunReminderStore();

    const showSnackbarHtml = inject<(html: string) => void>("showSnackbarHtml")!;
    const htmlEscapeElement = document.createElement("span");
    const escapeHtml = (text: string) => {
      htmlEscapeElement.textContent = text;
      return htmlEscapeElement.innerHTML;
    };

    const onFocus = () => {
      const safeRunName = escapeHtml(runName);
      const safeCategory = escapeHtml(props.runData.category);
      const safeRunnerNames = props.runnerNames
        .map((runnerName) => `<b>${escapeHtml(runnerName)}</b>`)
        .join(", ");

      showSnackbarHtml(
        `<b>${safeRunName}</b> - ${safeCategory} by ${safeRunnerNames}`,
      );
    };

    const hasActiveReminder = ref(
      reminder.allReminders.includes(props.pk.toString()),
    );

    const settingsStore = useSettingsStore();

    const runName = (props.runData.display_name.length == 0 ? props.runData.name : props.runData.display_name).replaceAll("\\n", " ");

    const buildHighlightedParts = (text: string, terms: string[]) => {
      const normalizedTerms = terms
        .map((term) => term.trim().toLowerCase())
        .filter((term) => term.length > 0);
      if (normalizedTerms.length === 0) {
        return [{ text, matched: false }];
      }

      const lowerText = text.toLowerCase();
      const ranges: Array<[number, number]> = [];
      for (const term of normalizedTerms) {
        let startIndex = 0;
        while (startIndex < lowerText.length) {
          const foundAt = lowerText.indexOf(term, startIndex);
          if (foundAt === -1) {
            break;
          }
          ranges.push([foundAt, foundAt + term.length]);
          startIndex = foundAt + 1;
        }
      }

      if (ranges.length === 0) {
        return [{ text, matched: false }];
      }

      ranges.sort((a, b) => a[0] - b[0]);
      const merged: Array<[number, number]> = [];
      for (const [start, end] of ranges) {
        if (merged.length === 0 || start > merged[merged.length - 1][1]) {
          merged.push([start, end]);
          continue;
        }
        merged[merged.length - 1][1] = Math.max(merged[merged.length - 1][1], end);
      }

      const parts: Array<{ text: string; matched: boolean }> = [];
      let cursor = 0;
      for (const [start, end] of merged) {
        if (cursor < start) {
          parts.push({ text: text.slice(cursor, start), matched: false });
        }
        parts.push({ text: text.slice(start, end), matched: true });
        cursor = end;
      }
      if (cursor < text.length) {
        parts.push({ text: text.slice(cursor), matched: false });
      }

      return parts.filter((part) => part.text.length > 0);
    };

    const runNameParts = computed(() => buildHighlightedParts(runName, props.searchTerms));
    const start = ref(new Date(props.runData.starttime));
    const end = new Date(props.runData.endtime);
    const duration = new Date(end.getTime() - start.value.getTime());
    const startString = ref(
      start.value.toLocaleTimeString(settingsStore.currentLanguage, {
        hour: "numeric",
        minute: "numeric",
      })
    );

    const time = ref<HTMLSpanElement>();

    watchEffect(() => {
      const newValue = new Date(props.runData.starttime).toLocaleTimeString(settingsStore.currentLanguage, {
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
    const runnerMatchSet = computed(() => new Set(props.matchingRunnerIndexes));
    const runnersWithHighlight = computed(() => {
      const runners = props.runnerNames.map((runnerName, index) => ({
        name: runnerName,
        isMatched: runnerMatchSet.value.has(index),
        index,
        parts: buildHighlightedParts(runnerName, props.searchTerms),
      }));

      // Keep stable order inside each group while showing matched runners first.
      return runners.sort((a, b) => {
        if (a.isMatched === b.isMatched) {
          return a.index - b.index;
        }
        return a.isMatched ? -1 : 1;
      });
    });

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
      if (props.runData.console == "TwitchCon") {
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
      runnersWithHighlight,
      runNameParts,
      isRunNameMatched: props.isRunNameMatched,
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
        PushNotificationHelper.startOfRun.unsubscribe(this.pk.toString());
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
      PushNotificationHelper.startOfRun.subscribe(this.pk.toString());
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
      <span class="runName">
        <template v-for="(part, partIndex) in runNameParts" :key="part.text + partIndex">
          <span :class="['highlightPart', { matched: part.matched }]">{{ part.text }}</span>
        </template>
      </span>
      <span class="meta">
          <span class="meta-entry schedule"
              ><m3e-icon name="schedule"></m3e-icon><span class="time" ref="time">{{ startString }}</span></span
          >
        <span class="meta-entry timer"
            ><m3e-icon name="timer" filled></m3e-icon>{{ durationHMMSS }}</span
        >
        <span class="meta-entry person"
            ><m3e-icon name="person" filled></m3e-icon>
          <template v-for="(runner, index) in runnersWithHighlight" :key="runner.name + index">
            <span class="runnerName">
              <template v-for="(part, partIndex) in runner.parts" :key="runner.name + part.text + partIndex">
                <span :class="['highlightPart', { matched: part.matched }]">{{ part.text }}</span>
              </template>
            </span><template v-if="index < runnersWithHighlight.length - 1">, </template>
          </template>
        </span
        >
      </span>
    </div>
    <div :class="reminderClasses">
      <div class="alarm">
        <m3e-icon name="alarm"></m3e-icon>
      </div>
      <div class="friend">
        <m3e-icon name="group" filled></m3e-icon>
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

  m3e-icon[filled] {
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

        .runnerName {
          display: inline;
          white-space: nowrap;
        }
      }
    }

    .highlightPart {
      display: inline;

      &.matched {
        text-decoration: underline;
        text-decoration-thickness: 0.12em;
        text-underline-offset: 0.08em;
      }
    }

    m3e-icon {
      font-size: 14px;
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

    &.is-set .alarm m3e-icon,
    &.with-friend .friend m3e-icon {
      margin-left: 0px;
      transition: 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) margin-left;
      transform: rotateZ(0deg);
      transition: 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) transform;
    }

    .friend m3e-icon {
      margin-bottom: -3px;
      font-size: 44px;
      margin-right: 3px;
    }

    m3e-icon {
      margin-left: 50px;
      transition: 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) margin-left;
      transform: rotateZ(90deg);
      transition: 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) transform;

      transform-origin: bottom center;
      font-size: 39px;
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
