<script lang="ts">
import { App } from "@capacitor/app";
import { onMounted, ref, Ref, provide, defineComponent, watch, inject, computed } from "vue";
import { AppLauncher } from "@capacitor/app-launcher";
import "@m3e/web/drawer-container";
import "@m3e/web/icon";
import "@m3e/web/icon-button";
import { Theme, useThemeStore } from "@/stores/theme";
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

type DrawerContainerElement = HTMLElement & { start: boolean };

export default defineComponent({
  async setup() {
    const { t } = useI18n()
    const searchQuery = ref("");
    const searchActive = ref(false);
    const searchPlaceholder = computed(() => t("search.placeholder"));

    const scrollable = ref<HTMLDivElement>();
    const wrapper = ref<HTMLDivElement>();
    provide<(x: number, y: number) => void>(
      "scrollRunContainerBy",
      (x: number, y: number) => {
        scrollable.value!.querySelector("#runs")!.scrollBy(x, y);
        wrapper.value!.scrollTop = 0;
      },
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
    const showSnackbar = (text: string) => {
      if (snackbar.value!.actionButtonText == t("onboarding.settings.callToAction") && 
          snackbar.value!.isOpen) {
        return;
      }
      snackbar.value!.labelText = text;
      snackbar.value!.actionButtonText = null;
      snackbar.value!.timeoutMs = 10000;
      snackbar.value!.open();
    };
    provide<(text: string) => void>("showSnackbar", showSnackbar);

    const addBackButtonHook = inject<(id: string, hook: () => void) => void>("addBackButtonHook")!;
    const removeBackButtonHook = inject<(id: string) => void>("removeBackButtonHook")!;
    onMounted(() => {
      const navigationEntry = performance
        .getEntriesByType("navigation")
        .at(0) as PerformanceNavigationTiming | undefined;
      const shouldShowOnboardingToast = navigationEntry?.type !== "reload";
      if (shouldShowOnboardingToast) {
        // Defer open to ensure the snackbar service is available.
        setTimeout(() => {
          snackbar.value?.open();
        }, 0);
      }

      if (!useSettingsStore().initialized) {
        useSettingsStore().setDefaults();
      }
      addBackButtonHook(
        "drawer",
        () => {
          drawer.value!.start = true;
        },
      );
      drawer.value!.addEventListener("change", () => {
        if (drawer.value!.start) {
          removeBackButtonHook("drawer");
          return;
        }
        addBackButtonHook("drawer", () => {
          drawer.value!.start = true;
        });
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

      friendUserIDInput.value!.addEventListener("input", updateFriendID);
    });
    const setupSwipeLogic = (drawer: DrawerContainerElement) => {
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
        if (!drawer.start) {
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
        drawer.start = calculatedVelocity > 0;
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
        const runnerIndexes = runnerNames
          .map((runnerName, index) => ({ runnerName, index }))
          .filter(({ runnerName }) => runnerName.includes(term))
          .map(({ index }) => index);

        if (!inRunName && runnerIndexes.length === 0) {
          return {
            matches: false,
            matchingRunnerIndexes: [],
            isRunNameMatched: false,
          };
        }

        runnerIndexes.forEach((index) => matchingRunnerIndexes.add(index));
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
        drawer.value.start = false;
      }

      refreshRuns();
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
      const firstEventID = Object.keys(eventsByIDs.value)[0];
      if (firstEventID) {
        await loadRuns(parseInt(firstEventID));
      }
    };

    const doneLoading = ref(false);

    const getSortedEventsByDate = () => {
      return Object.values(eventsByIDs.value).sort(
        (a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime(),
      );
    };

    const isEventWithRuns = (event: GDQEventData) => {
      return !!runsByEventID.value[event.id] && runsByEventID.value[event.id].length > 0;
    };

    const pickInitialEvent = (eventList: GDQEventData[]) => {
      const nowMs = now.getTime();
      const eventsWithRuns = eventList.filter((event) => isEventWithRuns(event));

      const running = eventsWithRuns.find((event) => {
        const orderedRuns = runsByEventID.value[event.id];
        return orderedRuns.some(([, run]) => {
          const startMs = new Date(run.starttime).getTime();
          const endMs = new Date(run.endtime).getTime();
          return startMs <= nowMs && nowMs <= endMs;
        });
      });
      if (running) {
        return running;
      }

      const upcoming = [...eventsWithRuns]
        .filter((event) => new Date(event.datetime).getTime() > nowMs)
        .sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime())[0];
      if (upcoming) {
        return upcoming;
      }

      return [...eventsWithRuns].sort(
        (a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime(),
      )[0];
    };

    {
      const roughly8MonthsAgo = dateProvider.getCurrent();
      roughly8MonthsAgo.setFullYear(
        roughly8MonthsAgo.getFullYear(),
        roughly8MonthsAgo.getMonth() - 8,
        1,
      );

      void (async () => {
        await loadEventsAndRuns(roughly8MonthsAgo);

        const initialEvent = pickInitialEvent(getSortedEventsByDate());
        if (initialEvent) {
          await updateCurrentEvent(initialEvent);
        }

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
      })();
    }

    const determineLatestEventWithRuns = (eventList: GDQEventData[]) => {
      // return if true if shorthand is not part of eventsWithoutRuns
      const eventWithRuns = eventList.find(
        (event) => !eventsWithoutRuns.includes(event.id.toString()),
      );
      if (eventWithRuns) {
        return eventWithRuns;
      }

      throw new Error("No event with runs found");
    };

    const drawer = ref<DrawerContainerElement>()!;

    if (Object.keys(runsByDay.value).length === 0) {
      runsByDay.value = {};
    }

    const updateCurrentEventToNewest = async () => {
      const descendingEventList = getSortedEventsByDate();
      if (descendingEventList.length <= 0) {
        await new Promise((resolve) => {
          const interval = setInterval(() => {
            if (doneLoading.value) {
              clearInterval(interval);
              resolve(null);
            }
          }, 100);
        });
      }

      const newestEvent = determineLatestEventWithRuns(descendingEventList);
      if (newestEvent.short.toUpperCase() == currentEventName.value) {
        return;
      }
      await updateCurrentEvent(newestEvent);
    };

    const openFriendMenu = () => {
      addBackButtonHook(
        "friendCode",
        () => {
          dialog.value!.close("cancel");
        },
      );
      dialog.value!.showModal();
    };

    const toggleDrawer = () => {
      drawer.value!.start = true;
    };

    const toggleSearch = () => {
      if (searchActive.value) {
        const hadQuery = searchQuery.value.trim().length > 0;
        searchQuery.value = "";
        searchActive.value = false;
        if (hadQuery) {
          refreshRuns();
        }
        const activeEl = document.activeElement as HTMLElement | null;
        activeEl?.blur();
        document.body.focus();
        return;
      }
      searchActive.value = true;
    };

    const updateSearchQuery = (value: string) => {
      searchQuery.value = value;
      refreshRuns();
    };

    const searchInputBlurred = (_value: string) => {
      // Keep blur side-effect free; close/open is controlled by explicit toggle action.
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

    const filterTypes = ["", "friend+alert", "alert"] as const;
    type RunFilter = (typeof filterTypes)[number];
    const activeFilter = ref<RunFilter>("");
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
    const activeSearchTerms = computed(() => parseSearchKeywords(searchQuery.value));

    function refreshRuns() {
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
        const {
          matches,
          matchingRunnerIndexes: matchedRunnerIndexes,
          isRunNameMatched,
        } = getSearchMatchForRun(runData);

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
    }

    const userIDStorage = useUserIDStore();
    const encodedFriendUserID = ref(Base16.encode(userIDStorage.friendUserID?.trim() ?? ""));
    const friendUserIDInput = ref<HTMLInputElement>();
    const apply = ref<HTMLButtonElement>();

    const updateFriendID = () => {
      encodedFriendUserID.value = friendUserIDInput.value!.value.trim();
    };

    watch(encodedFriendUserID, (newValue) => {
      try {
        Base16.decode(newValue.trim());
        apply.value!.disabled = false;
        friendUserIDInput.value!.setCustomValidity("");
      } catch (e) {
        apply.value!.disabled = true;
        friendUserIDInput.value!.setCustomValidity(t('friendCodes.error-friendCode'));
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
    const dialog = ref<HTMLDialogElement>();

    let userID = ref("");
    const base16EncodedUserID = ref("");
    watch(userID, (newUserID) => {
        base16EncodedUserID.value = Base16.encode(newUserID);
    });
    getFirebaseAuth().then(async (auth) => {
      try {
        userID.value = (await signInAnonymously(auth)).user!.uid;
      } catch {
        userID.value = localStorage.getItem("firebaseUserID") ?? "web-offline-user";
      }
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
      activeFilterLabel,
      searchQuery,
      searchActive,
      searchPlaceholder,
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
      toggleDrawer,
      toggleSearch,
      updateSearchQuery,
      searchInputBlurred,
      toggleFilter,
      toggleDarkMode,
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
  ],
  methods: {
    showSettings(data : string) {
      this.$emit('setVisibility', "settings", data);

      const addBackButtonHook = this.addBackButtonHook! as ((id: string, hook: () => void) => void);
      addBackButtonHook("settings", () => {
        this.$emit('setVisibility', "main");
      });
    },
    snackbarAction (action: string) {
      if (action == "action")  {
        this.showSettings(ONBOARDING_DATA);
      }
    }
  }
});
</script>

<template>
  <div ref="wrapper" :class="generateContainerClassNames()">
    <dialog ref="dialog" class="friendCodeDialog" data-test="friend-dialog">
      <h2>{{$t('friendCodes.headline')}}</h2>
      <div class="dialogContent">
        {{$t('friendCodes.content-yourCode')}}
        <br />
        <br />
        <input
          class="yourFriendCode"
          :aria-label="$t('friendCodes.label-yourCode')"
          :value="base16EncodedUserID"
          disabled
        /><m3e-icon-button @click="copyID"><m3e-icon name="content_copy"></m3e-icon></m3e-icon-button>
        <br />
        <br />
        <hr />
        <br />
        <form id="form" method="dialog">
          {{$t('friendCodes.content-friendCode')}}<br /><br />
          <b>{{$t('note')}}:</b> {{$t('friendCodes.note-friendCode')}}
          <br />
          <br />
          <input
            class="friendCodeInput"
            :aria-label="$t('friendCodes.label-friendCode')"
            placeholder="xxxxxxxx-xxxxxxxx-xxxxxxxx-xxxxxxxx-xxxxxxxx-xxxxxxxx-xxxxxxxx-xxxxxxxx"
            :value="encodedFriendUserID"
            ref="friendUserIDInput"
          />
        </form>
      </div>
      <div class="dialogActions">
        <button type="submit" form="form" value="cancel" class="dialogButton">{{$t("cancel")}}</button>
        <button type="submit" form="form" ref="apply" value="apply" class="dialogButton">{{$t("apply")}}</button>
      </div>
    </dialog>
    <Snackbar
      ref="snackbar"
      :labelText="$t('onboarding.settings.label')"
      :actionButtonText="$t('onboarding.settings.callToAction')"
      :timeoutMs="-1"
      @onClosing="snackbarAction"
    />
    <m3e-drawer-container ref="drawer" start-mode="over">
      <div slot="start" class="sidebarPane">
        <span ref="eventHeader" class="sidebarTitle">{{ $t('sidebar.headline') }}</span>
        <GDQSidebar
          :doneLoading="doneLoading"
          :eventsByIDs="eventsByIDs"
          @onUpdateCurrentEvent="updateCurrentEvent"
        ></GDQSidebar>
      </div>
      <div id="appContent" ref="scrollable">
        <GDQHeader
          @openFriendMenu="openFriendMenu"
          @toggleDarkMode="toggleDarkMode"
          @toggleFilter="toggleFilter"
          @toggleDrawer="toggleDrawer"
          @toggleSearch="toggleSearch"
          @updateSearchQuery="updateSearchQuery"
          @searchInputBlurred="searchInputBlurred"
          @showSettings="showSettings"
          :currentEventName="currentEventName"
          :searchQuery="searchQuery"
          :searchPlaceholder="searchPlaceholder"
          :searchActive="searchActive"
        ></GDQHeader>

        <div class="top-bar-adjust" id="runs">
          <div :class="['activeFilterBar', { hidden: activeFilter === '' }]">
            <span class="activeFilterBarContent" data-test="active-filter-label">{{ activeFilterLabel }}</span>
          </div>
          <div class="transition"></div>
          <template
            v-for="(runs, day, index) in runsByDay"
            :key="runs.join('') + '|' + activeSearchTerms.join('|')"
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
    </m3e-drawer-container>
  </div>
</template>

<style lang="scss" scoped>
m3e-drawer-container {
  padding-top: var(--safe-area-inset-top);
}

m3e-drawer-container > * {
  color: var(--mdc-theme-on-surface);
}

.friendCodeDialog {
  width: min(42rem, 90vw);
  border: 1px solid rgba(0, 0, 0, 0.18);
  border-radius: 1rem;
  color: var(--mdc-theme-on-surface);
  background: var(--mdc-theme-surface);
}

.dialogContent {
  input {
    width: 100%;
    box-sizing: border-box;
    border: 1px solid rgba(128, 128, 128, 0.5);
    border-radius: 0.6rem;
    padding: 0.65rem;
    color: inherit;
    background: transparent;
  }

  .yourFriendCode {
    width: calc(100% - 3.5rem);
  }
}

.dialogActions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.dialogButton {
  border: 0;
  background: transparent;
  color: var(--mdc-theme-primary);
  font-weight: 600;
  padding: 0.4rem 0.7rem;
  border-radius: 0.5rem;
}

.dialogButton:hover {
  background: color-mix(in srgb, var(--mdc-theme-primary) 14%, transparent);
}

.sidebarPane {
  padding-top: var(--safe-area-inset-top);
}

.sidebarTitle {
  display: block;
  padding: 1rem;
  font-weight: 700;
}

.top-bar-adjust {
  padding-top: 0.5rem;
}

.padding {
  height: 16em;
}
.dark-mode {
  .transition {
    --from: hsla(var(--md-sys-color-primary), 1);
    --to: hsla(var(--md-sys-color-primary), 0);
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
