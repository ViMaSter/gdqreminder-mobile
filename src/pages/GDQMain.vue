<script lang="ts">
import { App } from "@capacitor/app";
import { onMounted, ref, Ref, provide, defineComponent, watch, inject, computed } from "vue";
import { AppLauncher } from "@capacitor/app-launcher";
import "@material/mwc-drawer";
import { MdDialog } from "@material/web/dialog/dialog";
import { MdFilledTextField } from "@material/web/textfield/filled-text-field";
import { MdTextButton } from "@material/web/button/text-button";
import { Theme, useThemeStore } from "@/stores/theme";
import { TopAppBarFixed } from "@material/mwc-top-app-bar-fixed";
import Snackbar from "../components/Snackbar.vue";
import { GDQEventData } from "../interfaces/GDQEvent";
import { GDQRunData } from "../interfaces/GDQRun";
import Version from "@/plugins/versionPlugin";
import GDQDay from "./GDQMain/GDQDay.vue";
import GDQHeader from "./GDQMain/GDQHeader.vue";
import GDQSidebar from "./GDQMain/GDQSidebar.vue";
import GDQTimeIndicator from "./GDQMain/GDQTimeIndicator.vue";
import { DateProvider } from "@/interfaces/DateProvider";
import { RealDateProvider } from "@/services/RealDateProvider";
import { FakeDateProvider } from "@/services/FakeDateProvider";
import { LocationHashParameters } from "@/services/LocationHashParameters";
import { EventsData } from "@/utilities/eventsData";
import { CapacitorHttp } from "@capacitor/core";
import { useUserIDStore } from "@/stores/friendUserID";
import { getApp } from "firebase/app";
import { Capacitor } from "@capacitor/core";
import { useFriendRunReminderStore } from "@/stores/friendRuns";
import { useRunReminderStore } from "@/stores/runReminders";
import Base16 from "@/utilities/base16";
import { useI18n } from 'vue-i18n'
import { selectDefaultEvent } from "@/utilities/eventSelection";

import {
  getAuth,
  indexedDBLocalPersistence,
  initializeAuth,
  signInAnonymously,
} from "firebase/auth";
import { reflectColor } from "@/utilities/colorHelper";
import { useSettingsStore } from "@/stores/settings";
import { ONBOARDING_DATA } from "@/utilities/onboardingConstants";

const getFirebaseAuth = async () => {
  if (Capacitor.isNativePlatform()) {
    return initializeAuth(getApp(), {
      persistence: indexedDBLocalPersistence,
    });
  }

  return getAuth();
};

interface TopAppBarFixedWithOpen extends TopAppBarFixed {
  open: boolean;
}

export default defineComponent({
  async setup(_, { emit }) {
    const { t } = useI18n()

    const scrollable = ref<HTMLDivElement>();
    const wrapper = ref<HTMLDivElement>();
    provide<(x: number, y: number) => void>(
      "scrollRunContainerBy",
      (x: number, y: number) => {
        const header =
          scrollable.value!.parentElement!.shadowRoot!.querySelector(
            ".mdc-drawer-app-content",
          )! as HTMLElement;
        header.scrollTo(0, 0);
        header.addEventListener("scroll", function () {
          header.scrollTo(0, 0);
        });
        header.style.overflow = "visible";

        scrollable.value!.querySelector("#runs")!.scrollBy(x, y);
        wrapper.value!.scrollTop = 0;
      },
    );

    watch(
      scrollable,
      (newValue) => {
        if (newValue) {
          const header = newValue.parentElement!.shadowRoot!.querySelector(
            ".mdc-drawer-app-content",
          )! as HTMLElement;
          header.style.overflow = "visible";
        }
      },
      { immediate: true },
    );

    const currentRun: Ref<[HTMLDivElement, GDQRunData] | null> =
      ref(null);
    provide("currentRun", currentRun)!;

    const parameters = new LocationHashParameters();
    const date = parameters.getKey("date");
    let dateProvider = new RealDateProvider();
    if (date) {
      dateProvider = new FakeDateProvider(new Date(decodeURIComponent(date)));
    }
    provide<DateProvider>("dateProvider", dateProvider);

    const jumpToYouTube = async (runName: string, runnerNames: string[], youtubeLink : string) => {
      if (youtubeLink) {
        const { completed } = await AppLauncher.openUrl({ url: youtubeLink });
        if (completed) {
          return;
        }
      }
      const ytSearchQuery = `${currentEventName.value} ${runName} "${runnerNames.join('" "')}"`;
      const urls = [
        "https://www.youtube.com/c/gamesdonequick/search?query=" +
          encodeURIComponent(ytSearchQuery),
      ];
      for (const url of urls) {
        const { completed } = await AppLauncher.openUrl({ url });
        if (completed) {
          return;
        }
      }

      throw new Error("Neither the YouTube app nor a web browser is installed");
    };
    provide("jumpToYouTube", jumpToYouTube);

    const snackbar = ref<typeof Snackbar>();
    const showSettings = (data?: string) => {
      emit('setVisibility', "settings", data);

      addBackButtonHook("settings", () => {
        emit('setVisibility', "main");
      });
    };
    const onboardingSnackbarAction = computed(() => ({
      label: t("onboarding.settings.callToAction"),
      callback: () => {
        showSettings(ONBOARDING_DATA);
      },
    }));
    const showSnackbar = (text: string) => {
      if (snackbar.value!.hasAction &&
          snackbar.value!.isOpen) {
        return;
      }
      snackbar.value!.setLabelText(text);
      snackbar.value!.setAction(null);
      snackbar.value!.timeoutMs = 10000;
      snackbar.value!.open();
    };
    provide<(text: string) => void>("showSnackbar", showSnackbar);
    const showSnackbarHtml = (html: string) => {
      if (snackbar.value!.hasAction &&
          snackbar.value!.isOpen) {
        return;
      }
      snackbar.value!.setLabelHtml(html);
      snackbar.value!.setAction(null);
      snackbar.value!.timeoutMs = 10000;
      snackbar.value!.open();
    };
    provide<(html: string) => void>("showSnackbarHtml", showSnackbarHtml);

    const addBackButtonHook = inject<(id: string, hook: () => void) => void>("addBackButtonHook")!;
    const removeBackButtonHook = inject<(id: string) => void>("removeBackButtonHook")!;
    onMounted(() => {
      if (!useSettingsStore().initialized)
      {
        useSettingsStore().setDefaults();
        snackbar.value!.setLabelText(t('onboarding.settings.label'));
        snackbar.value!.open();
      }
      addBackButtonHook(
        "drawer",
        () => {
          drawer.value!.open = true;
        },
      );
      drawer.value!.addEventListener("MDCDrawer:closed", () => {
        addBackButtonHook("drawer", () => {
          drawer.value!.open = true;
        });
      });
      drawer.value!.addEventListener("MDCDrawer:opened", () => {
        removeBackButtonHook("drawer");
      });

      const container = drawer.value!.parentNode;
      container!.addEventListener("MDCTopAppBar:nav", () => {
        drawer.value!.open = !drawer.value!.open;
      });
      setupSwipeLogic(drawer.value!);

      dialog.value?.addEventListener("close", async () => {
        removeBackButtonHook("friendCode");
        if (dialog.value!.returnValue == "cancel") {
          return;
        }
        if (dialog.value!.returnValue == "apply") {
          userIDStorage.setFriendUserID(Base16.decode(encodedFriendUserID.value.trim()));
        }
      });

      friendUserIDInput.value!.addEventListener("input", () => {
        updateFriendID();
      });
    });
    const setupSwipeLogic = (drawer: TopAppBarFixedWithOpen) => {
      let touchIdentifier = -1;
      const veloEstimate = 10;
      const clientXThreshold = 20;
      let velocity: Touch[] = [];
      const updateVelocity = (touch: Touch) => {
        if (velocity.length >= veloEstimate) {
          velocity.splice(0, 1);
        }
        velocity.push(touch);
      };
      const calculateVelocity = () => {
        let averageX = 0;
        let averageY = 0;
        if (velocity.length == 1) {
          return averageX;
        }
        for (let i: number = 1; i < velocity.length; i++) {
          averageX += velocity[i].clientX - velocity[i - 1].clientX;
          averageY += velocity[i].clientY - velocity[i - 1].clientY;
        }
        averageX /= velocity.length;
        averageY /= velocity.length;
        if (Math.abs(averageY) > Math.abs(averageX)) {
          return null;
        }
        return averageX;
      };
      window.addEventListener("touchstart", (touchStartEvent) => {
        if (touchIdentifier != -1) {
          return;
        }
        if (!touchStartEvent.touches[0]) {
          return;
        }
        if (!drawer.open) {
          if (touchStartEvent.touches[0].clientX > clientXThreshold) {
            return;
          }
        }
        touchIdentifier = touchStartEvent.touches[0].identifier;
      });
      window.addEventListener("touchmove", (touchMoveEvent) => {
        const touchUpdate = Array.from(touchMoveEvent.touches).find(
          (touch) => touch.identifier == touchIdentifier,
        );
        if (!touchUpdate) {
          return;
        }
        updateVelocity(touchUpdate);
      });
      window.addEventListener("touchend", (touchEndEvent) => {
        if (touchIdentifier == -1) {
          return;
        }
        if (
          Array.from(touchEndEvent.touches).find(
            (touch) => touch.identifier == touchIdentifier,
          )
        ) {
          return;
        }
        const calculatedVelocity = calculateVelocity();
        if (calculatedVelocity == null) {
          return;
        }
        drawer.open = calculatedVelocity > 0;
        velocity = [];
        touchIdentifier = -1;
      });
    };
    const currentEventName = ref(
      `${(await Version.getCurrent()).versionName}.${(await Version.getCurrent()).versionCode}`,
    );
    const currentEventID = ref(-1);
    const runsByID = ref<{
      [pk: string]: GDQRunData;
    }>({});
    const runsByEventID = ref<{
      [eventShort: string]: [string, GDQRunData][];
    }>({});
    const orderedDays = ref<string[]>([]);
    const runIDsInOrder = ref<string[]>([]);
    const runsByDay = ref<{ [day: string]: string[] }>({});
    const matchingRunnerIndexesByRunID = ref<{ [runID: string]: number[] }>({});
    const matchingRunNamesByRunID = ref<{ [runID: string]: boolean }>({});

    const filterTypes = ["", "friend+alert", "alert"] as const;
    type RunFilter = (typeof filterTypes)[number];
    const activeFilter = ref<RunFilter>("");
    const searchActive = ref(false);
    const searchQuery = ref("");

    const parseSearchKeywords = (query: string): string[] => {
      const matches = query.match(/"([^"]+)"|(\S+)/g) ?? [];
      return matches
        .map((part) => part.replace(/^"|"$/g, "").trim().toLowerCase())
        .filter((part) => part.length > 0);
    };

    const getSearchMatchForRun = (run: GDQRunData) => {
      const terms = parseSearchKeywords(searchQuery.value);
      if (terms.length === 0) {
        return {
          matches: true,
          matchingRunnerIndexes: [],
          isRunNameMatched: false,
        };
      }

      const runName = (run.display_name.length == 0 ? run.name : run.display_name)
        .replaceAll("\\n", " ")
        .toLowerCase();
      const runnerNames = run.runners.map((runner) => runner.name.toLowerCase());

      const matchingRunnerIndexes = new Set<number>();
      let isRunNameMatched = false;
      for (const term of terms) {
        const inRunName = runName.includes(term);
        const runnerIndex = runnerNames.findIndex((runnerName) => runnerName.includes(term));

        if (!inRunName && runnerIndex === -1) {
          return {
            matches: false,
            matchingRunnerIndexes: [],
          };
        }

        if (runnerIndex !== -1) {
          matchingRunnerIndexes.add(runnerIndex);
        }
        if (inRunName) {
          isRunNameMatched = true;
        }
      }

      return {
        matches: true,
        matchingRunnerIndexes: Array.from(matchingRunnerIndexes).sort((a, b) => a - b),
        isRunNameMatched,
      };
    };
  
    // returns true if there are runs for this event already
    // returns false if there are no runs for this event yet
    // Helper to process and set runs data
    const processRuns = (
      eventID: number,
      runs: GDQRunData[]
    ) => {
      const orderedRuns: [string, GDQRunData][] = runs
      .sort(
        (a, b) =>
        new Date(a.starttime).getTime() -
        new Date(b.starttime).getTime(),
      )
      .map((run): [string, GDQRunData] => [
        run.id.toString(),
        run,
      ]);
      if (orderedRuns.length > 0) {
        runsByID.value = {
          ...runsByID.value,
          ...Object.fromEntries<GDQRunData>(orderedRuns),
        };
        orderedDays.value = [
          ...new Set<string>(
          orderedRuns.map(([, run]: [string, GDQRunData]) =>
            new Date(run.starttime).toLocaleDateString(),
          ),
          ),
        ];
        runIDsInOrder.value = [
          ...new Set<string>([
          ...runIDsInOrder.value,
          ...orderedRuns.map(([pk]) => pk),
          ]),
        ];
        runsByEventID.value[eventID] = orderedRuns;
      }
      return orderedRuns;
    };

    const loadRuns = async (eventID: number) => {
      const cacheKey = `gdq_runs_${eventID}`;
      let orderedRuns: [string, GDQRunData][] = [];

      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          const parsed = JSON.parse(cached) as GDQRunData[];
          orderedRuns = processRuns(eventID, parsed);
        } catch (e) {
          // ignore cache parse errors
        }
      }

      const fetchAndProcessRuns = async () => {
        try {
          const response = await CapacitorHttp.get({
            url: `https://tracker.gamesdonequick.com/tracker/api/v2/events/${eventID}/runs/`,
            headers: {
              'User-Agent': `GDQReminderClient/${(await Version.getCurrent()).versionName}`
            },
          });
          if (response.status === 200 && response.data?.results) {
            const freshRuns = response.data.results as GDQRunData[];
            if (freshRuns.length > 0) {
              localStorage.setItem(cacheKey, JSON.stringify(freshRuns));
              return processRuns(eventID, freshRuns);
            }
          }
        } catch (e) {
          // ignore fetch errors
        }
        return [];
      };

      // If we already have data cached, fetch in the background
      // If not, await initial loading
      if (orderedRuns.length > 0) {
        fetchAndProcessRuns();
      } else {
        orderedRuns = await fetchAndProcessRuns();
      }

      // Return true if we have runs (from cache or will be set async)
      return orderedRuns.length > 0;
    };
    const updateCurrentEvent = async (newEvent: GDQEventData) => {
      if (!runsByEventID.value[newEvent.id]) {
        if (!(await loadRuns(newEvent.id))) {
          throw new Error("No runs for this event");
        }
      }

      scrollable.value?.querySelector("#runs")!.scrollTo(0, 0);

      currentEventName.value = newEvent.short.toUpperCase();
      currentEventID.value = newEvent.id;
      reflectColor(currentEventName.value, document.body.classList.contains("dark-mode"));
      if (drawer.value) {
        drawer.value.open = false;
      }

      const orderedRuns = runsByEventID.value[newEvent.id];
      runsByDay.value = {};
      matchingRunnerIndexesByRunID.value = {};
      matchingRunNamesByRunID.value = {};
      orderedRuns.forEach(([runID]) => {
        const runData = runsByID.value[runID];
        const { matches, matchingRunnerIndexes, isRunNameMatched } = getSearchMatchForRun(runData);
        if (!matches) {
          return;
        }

        const timeOfRun = new Date(runData.starttime);
        timeOfRun.setHours(0, 0, 0, 0);
        const dayOfRun = timeOfRun.getTime();
        if (!Object.keys(runsByDay.value).includes(dayOfRun.toString())) {
          runsByDay.value[dayOfRun] = [];
        }
        runsByDay.value[dayOfRun].push(runID);
        matchingRunnerIndexesByRunID.value[runID] = matchingRunnerIndexes;
        matchingRunNamesByRunID.value[runID] = isRunNameMatched;
      });
      queueMicrotask(() => {
        refreshRuns();
      });
    };
    const now = dateProvider.getCurrent();

    const eventsWithoutRuns: string[] = [];
    const filterEventsWithoutRuns = (events: {
      [key: string]: GDQEventData;
    }) => {
      return Object.entries(events)
        .filter(([key]) => !eventsWithoutRuns.includes(key))
        .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {});
    };

    const eventsByIDs: Ref<{ [id: number]: GDQEventData }> = ref(
      {},
    );
    const loadEventsAndRuns = async (eventsAfter: Date) => {
      const eventData = await EventsData.getEventsData(eventsAfter);
      const newEventsByID = Object.fromEntries(
        eventData
          .filter((a) => a.short.toLowerCase().includes("gdq"))
          .filter((a) => !a.short.toLowerCase().includes("cgdq"))
          .sort(
            (a, b) =>
              new Date(b.datetime).getTime() -
              new Date(a.datetime).getTime(),
          )
          .map((singleEvent): [number, GDQEventData] => [
            singleEvent.id,
            singleEvent,
          ]),
      );

      for (const eventID of Object.keys(newEventsByID)) {
        if (await loadRuns(parseInt(eventID))) {
          continue;
        }

        if (eventsWithoutRuns.includes(eventID)) {
          continue;
        }
        eventsWithoutRuns.push(eventID);
      }
      eventsByIDs.value = filterEventsWithoutRuns({
        ...eventsByIDs.value,
        ...newEventsByID,
      });
    };

    const doneLoading = ref(false);

    {
      const roughly8MonthsAgo = dateProvider.getCurrent();
      roughly8MonthsAgo.setFullYear(
        roughly8MonthsAgo.getFullYear(),
        roughly8MonthsAgo.getMonth() - 8,
        1,
      );
      await loadEventsAndRuns(roughly8MonthsAgo);
      setTimeout(async () => {
        const eventData = await EventsData.getEventsData(new Date("2011-01-01"));
        const newEventsByID = Object.fromEntries(
          eventData
            .filter((a) => a.short.toLowerCase().includes("gdq"))
            .filter((a) => !a.short.toLowerCase().includes("cgdq"))
            .sort(
              (a, b) =>
                new Date(b.datetime).getTime() -
                new Date(a.datetime).getTime(),
            )
            .map((singleEvent): [number, GDQEventData] => [
              singleEvent.id,
              singleEvent,
            ]),
        );
        eventsByIDs.value = filterEventsWithoutRuns({
          ...eventsByIDs.value,
          ...newEventsByID,
        });
        doneLoading.value = true;
      }, 2000);
    }

    const eventsWithRuns = () => {
      return Object.values(eventsByIDs.value)
        .map((event) => ({
          event,
          runs:
            runsByEventID.value[event.id]?.map(([, run]) => run) ?? [],
        }))
        .filter(({ runs }) => runs.length > 0);
    };

    const drawer = ref<TopAppBarFixedWithOpen>()!;

    const startupEvent = selectDefaultEvent(eventsWithRuns(), now);
    if (startupEvent) {
      await updateCurrentEvent(startupEvent);
    } else {
      runsByDay.value = {};
    }

    const updateCurrentEventToNewest = async () => {
      if (eventsWithRuns().length <= 0) {
        await new Promise((resolve) => {
          const interval = setInterval(() => {
            if (doneLoading.value) {
              clearInterval(interval);
              resolve(null);
            }
          }, 100);
        });
      }

      const defaultEvent = selectDefaultEvent(
        eventsWithRuns(),
        dateProvider.getCurrent(),
      );
      if (!defaultEvent) {
        throw new Error("No event with runs found");
      }

      if (defaultEvent.short.toUpperCase() == currentEventName.value) {
        return;
      }
      await updateCurrentEvent(defaultEvent);
    };

    const openFriendMenu = () => {
      addBackButtonHook(
        "friendCode",
        () => {
          dialog.value!.open = false;
        },
      );
      dialog.value!.open = true;
    };

    const toggleDarkMode = () => {
      const themeStore = useThemeStore();
      document.body.classList.toggle("dark-mode");
      themeStore.override(
        document.body.classList.contains("dark-mode")
          ? Theme.Dark
          : Theme.Light,
      );
      reflectColor(
        currentEventName.value,
        document.body.classList.contains("dark-mode"),
      );
    };

    const activeFilterLabel = computed(() => {
      if (activeFilter.value == "friend+alert") {
        return t("filters.friendsAndYourRuns");
      }
      if (activeFilter.value == "alert") {
        return t("filters.yourRuns");
      }
      return "";
    });

    const reminder = useRunReminderStore();
    const friendRunStore = useFriendRunReminderStore();

    const activeSearchLabel = computed(() => {
      if (!searchQuery.value.trim()) {
        return "";
      }
      return t("search.active", {
        query: searchQuery.value.trim(),
      });
    });

    const activeSearchTerms = computed(() => parseSearchKeywords(searchQuery.value));

    const activeFilterAndSearchLabel = computed(() => {
      const labels = [activeFilterLabel.value, activeSearchLabel.value].filter(
        (label) => label.length > 0,
      );
      return labels.join(" • ");
    });

    const refreshRuns = () => {
      const orderedRuns = runsByEventID.value[currentEventID.value];
      const runs: { [day: string]: string[] } = {};
      const matchingRunnerIndexes: { [runID: string]: number[] } = {};
      const matchingRunNames: { [runID: string]: boolean } = {};

      if (!orderedRuns) {
        runsByDay.value = {};
        matchingRunnerIndexesByRunID.value = {};
        matchingRunNamesByRunID.value = {};
        return;
      }

      orderedRuns.forEach(([runID]) => {
        const hasAlert = reminder.allReminders.includes(runID);
        const inFriendRuns = friendRunStore.allReminders.includes(runID);
        const runData = runsByID.value[runID];
        const { matches, matchingRunnerIndexes: matchedRunnerIndexes, isRunNameMatched } = getSearchMatchForRun(runData);

        if (activeFilter.value == "friend+alert" && !inFriendRuns && !hasAlert) {
          return;
        }
        if (activeFilter.value == "alert" && !hasAlert) {
          return;
        }
        if (!matches) {
          return;
        }

        const timeOfRun = new Date(runData.starttime);
        timeOfRun.setHours(0, 0, 0, 0);
        const dayOfRun = timeOfRun.getTime();
        if (!Object.keys(runs).includes(dayOfRun.toString())) {
          runs[dayOfRun] = [];
        }
        runs[dayOfRun].push(runID);
        matchingRunnerIndexes[runID] = matchedRunnerIndexes;
        matchingRunNames[runID] = isRunNameMatched;
      });
      runsByDay.value = runs;
      matchingRunnerIndexesByRunID.value = matchingRunnerIndexes;
      matchingRunNamesByRunID.value = matchingRunNames;
      console.log(
        Object.entries(runsByDay.value)
          .map(
            ([day, runs]) =>
              `${new Date(parseInt(day)).toLocaleDateString()}: ${runs.length}`,
          )
          .join("\n"),
      );
    };

    const userIDStorage = useUserIDStore();
    const encodedFriendUserID = ref(Base16.encode(userIDStorage.friendUserID?.trim() ?? ""));
    const friendUserIDInput = ref<MdFilledTextField>();
    const apply = ref<MdTextButton>();

    const updateFriendID = () => {
      encodedFriendUserID.value = friendUserIDInput.value!.value.trim();
    };

    const updateSearchQuery = (newQuery: string) => {
      searchQuery.value = newQuery;
      refreshRuns();
    };

    let ignoreNextSearchBlur = false;
    let enableSearchBlockedUntil = 0;
    const searchReenableDelayMs = 100;

    const onSearchInputBlurred = (queryOnBlur: string) => {
      if (ignoreNextSearchBlur) {
        ignoreNextSearchBlur = false;
        return;
      }
      searchQuery.value = queryOnBlur;
      if (queryOnBlur.trim().length > 0 || !searchActive.value) {
        return;
      }
      toggleSearch();
    };

    const closeSearch = () => {
      searchActive.value = false;
      enableSearchBlockedUntil = Date.now() + searchReenableDelayMs;

      const hasActiveQuery = searchQuery.value.trim().length > 0;
      searchQuery.value = "";
      if (hasActiveQuery) {
        refreshRuns();
      }

      // Ensure focus does not remain on the close button after search is dismissed.
      queueMicrotask(() => {
        (document.activeElement as HTMLElement | null)?.blur();
      });
    };

    const toggleSearch = () => {
      const now = Date.now();
      if (!searchActive.value && now < enableSearchBlockedUntil) {
        return;
      }

      if (searchActive.value) {
        ignoreNextSearchBlur = true;
        closeSearch();
        return;
      }
      searchActive.value = true;
    };

    watch(encodedFriendUserID, (newValue) => {
      try {
        Base16.decode(newValue.trim());
        apply.value!.disabled = false;
        friendUserIDInput.value!.error = false;
        friendUserIDInput.value!.errorText = "";
      } catch (e) {
        apply.value!.disabled = true;
        friendUserIDInput.value!.error = true;
        friendUserIDInput.value!.errorText = t('friendCodes.error-friendCode');
      }
    });

    const toggleFilter = () => {
      activeFilter.value =
        filterTypes[
          (filterTypes.indexOf(activeFilter.value) + 1) % filterTypes.length
        ];
      if (activeFilter.value == "friend+alert" && !encodedFriendUserID.value) {
        activeFilter.value =
          filterTypes[
            (filterTypes.indexOf(activeFilter.value) + 1) % filterTypes.length
          ];
      }
      refreshRuns();
      return;
    };

    // refresh runs when friend runs change
    friendRunStore.$subscribe(() => {
      refreshRuns();
    });

    const eventHeader = ref<HTMLSpanElement>();
    const dialog = ref<MdDialog>();

    let userID = ref("");
    const base16EncodedUserID = ref("");
    watch(userID, (newUserID) => {
        base16EncodedUserID.value = Base16.encode(newUserID);
    });
    getFirebaseAuth().then(async (auth) => {
      userID.value = (await signInAnonymously(auth)).user!.uid;
      localStorage.setItem("firebaseUserID", userID.value);
    });

    const copyID = async () => {
      navigator.clipboard.writeText(base16EncodedUserID.value);
      showSnackbar("Copied your user ID to clipboard:");
    };

    reflectColor(
      currentEventName.value,
      document.body.classList.contains("dark-mode"),
    );

    return {
      encodedFriendUserID,
      apply,
      friendUserIDInput,
      base16EncodedUserID,
      copyID,
      dialog,
      eventHeader,
      doneLoading,
      eventsByIDs,
      drawer,
      snackbar,
      orderedDays,
      currentEventName,
      currentEventID,
      activeFilter,
      activeFilterAndSearchLabel,
      loadRuns,
      updateCurrentEvent,
      updateCurrentEventToNewest,
      runsByID,
      runIDsInOrder,
      runsByDay,
      matchingRunnerIndexesByRunID,
      matchingRunNamesByRunID,
      activeSearchTerms,
      reminder,
      scrollable,
      updateFriendID,
      wrapper,
      openFriendMenu,
      updateSearchQuery,
      onSearchInputBlurred,
      toggleSearch,
      searchActive,
      searchQuery,
      toggleFilter,
      toggleDarkMode,
      showSettings,
      onboardingSnackbarAction,
      userID,
      generateContainerClassNames: () => {
        const classNames = ["container"];
        if (currentEventName.value.startsWith("SGDQ")) {
          classNames.push("sgdq");
        }
        if (currentEventName.value.startsWith("AGDQ")) {
          classNames.push("agdq");
        }
        return classNames.join(" ");
      },
    };
  },
  emits: ['setVisibility'],
  components: {
    GDQDay,
    GDQHeader,
    GDQSidebar,
    GDQTimeIndicator,
    Snackbar
  },
  inject: [
    "addBackButtonHook",
    "removeBackButtonHook"
  ]
});
</script>

<template>
  <div ref="wrapper" :class="generateContainerClassNames()">
    <!-- eslint-disable vue/no-deprecated-slot-attribute false positive: -->
    <!-- google uses 'slot' as a prop name, so we need to disable this rule, as it's a false positive -->
    <md-dialog ref="dialog">
      <div slot="headline">{{$t('friendCodes.headline')}}</div>
      <div slot="content">
        {{$t('friendCodes.content-yourCode')}}
        <br />
        <br />
        <md-filled-text-field
          class="yourFriendCode"
          :label="$t('friendCodes.label-yourCode')"
          :value="base16EncodedUserID"
          disabled
        ></md-filled-text-field><md-icon-button @click="copyID"><md-icon>content_copy</md-icon></md-icon-button>
        <br />
        <br />
        <hr />
        <br />
        <form id="form" method="dialog">
          {{$t('friendCodes.content-friendCode')}}<br /><br />
          <b>{{$t('note')}}:</b> {{$t('friendCodes.note-friendCode')}}
          <br />
          <br />
          <md-filled-text-field
          :label="$t('friendCodes.label-friendCode')"
            placeholder="xxxxxxxx-xxxxxxxx-xxxxxxxx-xxxxxxxx-xxxxxxxx-xxxxxxxx-xxxxxxxx-xxxxxxxx"
            :value="encodedFriendUserID"
            ref="friendUserIDInput"
          ></md-filled-text-field>
        </form>
      </div>
      <div slot="actions">
        <md-text-button form="form" value="cancel">{{$t("cancel")}}</md-text-button>
        <md-text-button form="form" ref="apply" value="apply">{{$t("apply")}}</md-text-button>
      </div>
    </md-dialog>
    <Snackbar
      ref="snackbar"
      :labelText="$t('onboarding.settings.label')"
      :action="onboardingSnackbarAction"
      :timeoutMs="-1"
    />
    <mwc-drawer hasHeader type="dismissible" ref="drawer">
      <span ref="eventHeader" slot="title">{{ $t('sidebar.headline') }}</span>
      <GDQSidebar
        :doneLoading="doneLoading"
        :eventsByIDs="eventsByIDs"
        @onUpdateCurrentEvent="updateCurrentEvent"
      ></GDQSidebar>
      <div id="appContent" slot="appContent" ref="scrollable">
        <GDQHeader
          @openFriendMenu="openFriendMenu"
          @toggleDarkMode="toggleDarkMode"
          @toggleFilter="toggleFilter"
          @toggleSearch="toggleSearch"
          @updateSearchQuery="updateSearchQuery"
          @searchInputBlurred="onSearchInputBlurred"
          @showSettings="showSettings"
          :currentEventName="currentEventName"
          :searchQuery="searchQuery"
          :searchActive="searchActive"
          :searchPlaceholder="$t('search.placeholder')"
        ></GDQHeader>

        <div class="mdc-top-app-bar--fixed-adjust" id="runs">
          <div :class="['activeFilterBar', { hidden: activeFilterAndSearchLabel === '' }]">
            <span class="activeFilterBarContent" data-test="active-filter-label">{{ activeFilterAndSearchLabel }}</span>
          </div>
          <div class="transition"></div>
          <template
            v-for="(runs, day, index) in runsByDay"
            :key="runs.join('')"
          >
            <GDQDay
              class="gdqday"
              :runsByID="runsByID"
              :runsIDsInOrder="runs"
              :matchingRunnerIndexesByRunID="matchingRunnerIndexesByRunID"
              :matchingRunNamesByRunID="matchingRunNamesByRunID"
              :searchTerms="activeSearchTerms"
              :day="day as string"
            ></GDQDay>
            <div
              class="padding"
              v-if="index == Object.keys(runsByDay).length - 1"
            ></div>
          </template>
          <GDQTimeIndicator></GDQTimeIndicator>
        </div>
      </div>
    </mwc-drawer>
    <!-- eslint-enable vue/no-deprecated-slot-attribute -->
  </div>
</template>

<style lang="scss" scoped>
mwc-drawer {
  padding-top: var(--safe-area-inset-top);
}

mwc-drawer > * {
  color: var(--mdc-theme-on-surface);
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

.padding {
  height: 16em;
}
.dark-mode {
  .transition {
    --from: hsla(var(--md-sys-color-primary), 1);
    --to: hsla(var(--mmd-sys-color-primary), 0);
  }

  .agdq .transition {
    --from: hsla(var(--md-sys-color-primary), 1);
    --to: hsla(var(--md-sys-color-primary), 0);
  }

  .sgdq .transition {
    --from: hsla(var(--md-sys-color-primary), 1);
    --to: hsla(var(--md-sys-color-primary), 0);
  }
}

.transition {
  position: sticky;
  top: 0;
  left: 0;
  height: 1em;
  width: 100vw;
  background: linear-gradient(180deg, var(--from) 0%, var(--to) 100%);
  z-index: 1000;
}

.activeFilterBar {
  position: sticky;
  top: 0;
  z-index: 1001;
  width: 100%;
  height: 2.25em;
  font-size: 0.9em;
  margin-bottom: -1.75em;
  overflow: hidden;

  .activeFilterBarContent {
    width: 100%;
    height: 100%;
    padding: 0 1em;
    background-color: rgba(128, 128, 128, 0.25);
    color: var(--mdc-theme-on-surface);
    display: flex;
    align-items: center;
    opacity: 1;
    justify-content: center;
    transform: translateY(0);
    transition: opacity 200ms ease, transform 200ms ease;
  }

  &.hidden {
    .activeFilterBarContent {
      opacity: 0;
      transform: translateY(-100%);
    }
  }
}

#appContent {
  width: 100vw;
}

#appContent,
#runs {
  height: 100%;
}

#runs {
  position: relative;
  overflow-x: hidden;
}

.container {
  width: 100vw;
  height: 100vh;

  overflow: hidden;
}
</style>
