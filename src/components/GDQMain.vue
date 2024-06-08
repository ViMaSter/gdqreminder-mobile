<script lang="ts">
import {onMounted, ref, Ref, provide, defineComponent, watch} from 'vue';
import { AppLauncher } from '@capacitor/app-launcher';
import { Snackbar } from '@material/mwc-snackbar';
import '@material/mwc-drawer';
import { MdDialog } from '@material/web/dialog/dialog';
import { Theme, useThemeStore } from '@/stores/theme';
import {TopAppBarFixed} from '@material/mwc-top-app-bar-fixed';
import {GDQEventDataFields} from '../interfaces/GDQEvent'
import {GDQRunData, GDQRunDataFields} from '../interfaces/GDQRun'
import {GDQRunnerData, GDQRunnerDataFields} from '../interfaces/GDQRunner'
import GDQRun from './GDQRun.vue';
import Version from '@/plugins/versionPlugin';
import GDQDay from './GDQDay.vue';
import GDQDayDivider from './GDQDayDivider.vue';
import GDQHeader from './GDQHeader.vue';
import GDQSidebar from './GDQSidebar.vue';
import GDQTimeIndicator from './GDQTimeIndicator.vue';
import { DateProvider } from '@/interfaces/DateProvider';
import { RealDateProvider } from '@/services/RealDateProvider';
import { FakeDateProvider } from '@/services/FakeDateProvider';
import { LocationHashParameters } from '@/services/LocationHashParameters';
import { EventsData } from '@/utilities/eventsData';
import { CapacitorHttp } from '@capacitor/core';
import { useUserIDStore } from '@/stores/friendUserID';
import { getApp } from 'firebase/app';
import { Capacitor } from '@capacitor/core';
import { useFriendRunReminderStore } from "@/stores/friendRuns";
import { useRunReminderStore } from "@/stores/runReminders";

import {
  getAuth,
  indexedDBLocalPersistence,
  initializeAuth,
  signInAnonymously,
} from 'firebase/auth';
import { reflectColor } from '@/utilities/colorHelper';

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
    async setup() {
        const scrollable = ref<HTMLDivElement>();
        provide<(x: number, y: number) => void>("scrollRunContainerBy", (x : number, y : number) => {
            const header = scrollable.value!.parentElement!.shadowRoot!.querySelector(".mdc-drawer-app-content")! as HTMLElement;
            header.scrollTo(0, 0);
            header.addEventListener("scroll", function () { header.scrollTo(0, 0); });
            header.style.overflow = "visible";

            scrollable.value!.querySelector("#runs")!.scrollBy(x, y);
        });

        watch(scrollable, (newValue) => {
            if (newValue) {
                const header = newValue.parentElement!.shadowRoot!.querySelector(".mdc-drawer-app-content")! as HTMLElement;
                header.style.overflow = "visible";
            }
        }, { immediate: true });
        
        const currentRun : Ref<[HTMLDivElement, GDQRunDataFields] | null> = ref(null);
        provide("currentRun", currentRun)!;

        const parameters = new LocationHashParameters();
        const date = parameters.getKey("date");
        let dateProvider = new RealDateProvider();
        if (date)
        {
            dateProvider = new FakeDateProvider(new Date(decodeURIComponent(date)));
        }
        const current = dateProvider.getCurrent();
        provide<DateProvider>("dateProvider", dateProvider);

        const jumpToYouTube = async (runName : string, runnerNames : string[]) => {
            const ytSearchQuery = `${currentEventName.value} ${runName} "${runnerNames.join('" "')}"`;
            const urls = [
                "https://www.youtube.com/c/gamesdonequick/search?query="+encodeURIComponent(ytSearchQuery)
            ];
            for (const url of urls) {
                const {completed} = await AppLauncher.openUrl({url});
                if (completed)
                {
                  return;
                }
            }

            throw new Error("Neither the YouTube app nor a web browser is installed");
        };
        provide("jumpToYouTube", jumpToYouTube);
                
        const showSnackbar = (text : string) => {
            snackbar.value!.stacked = false;
            snackbar.value!.leading = false;
            snackbar.value!.open = true;
            snackbar.value!.labelText = text;
        };
        provide<(text : string) => void>("showSnackbar", showSnackbar);

        onMounted(() => {
            const container = drawer.value!.parentNode;
            container!.addEventListener("MDCTopAppBar:nav", () => {
                drawer.value!.open = !drawer.value!.open;
            });
            setupSwipeLogic(drawer.value!);

            const onLongTouch = () => { 
                dialog.value!.open = true;
            };
            let timer : NodeJS.Timeout | null = null;
            const touchDuration = 500;
            eventHeader.value?.addEventListener("touchstart", () => { timer = setTimeout(onLongTouch, touchDuration);   });
            eventHeader.value?.addEventListener("mousedown", () => {  timer = setTimeout(onLongTouch, touchDuration);   });
            eventHeader.value?.addEventListener("touchend", () => {   if (timer) clearTimeout(timer);  });
            eventHeader.value?.addEventListener("mouseup", () => {    if (timer) clearTimeout(timer);  });
            dialog.value?.addEventListener("close", async () => {
                if (dialog.value!.returnValue == "apply")
                {
                    userIDStorage.setFriendUserID(friendUserID.value!);
                }
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
                if (Math.abs(averageY) > Math.abs(averageX))
                {
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
                const touchUpdate = Array.from(touchMoveEvent.touches).find(touch => touch.identifier == touchIdentifier);
                if (!touchUpdate) {
                    return;
                }
                updateVelocity(touchUpdate);
            });
            window.addEventListener("touchend", (touchEndEvent) => {
                if (touchIdentifier == -1) {
                    return;
                }
                if (Array.from(touchEndEvent.touches).find(touch => touch.identifier == touchIdentifier)) {
                    return;
                }
                let calculatedVelocity = calculateVelocity();
                if (calculatedVelocity == null)
                {
                    return;
                }
                drawer.open = calculatedVelocity > 0;
                velocity = [];
                touchIdentifier = -1;
            });
        };
        const currentEventName = ref(`${(await Version.getCurrent()).versionName}.${(await Version.getCurrent()).versionCode}`);
        const runsByID = ref<{
            [pk: string]: GDQRunDataFields;
        }>({});
        const runsByEventShort = ref<{
            [eventShort: string]: [string, GDQRunDataFields][]
        }>({});
        const orderedDays = ref<string[]>([]);
        const runIDsInOrder = ref<string[]>([]);
        const runsByDay = ref<{[day : string] : string[]}>({});
        const runners = ref<{
            [pk: string]: GDQRunnerDataFields;
        }>({});
        
        // returns true if there are runs for this event already
        // returns false if there are no runs for this event yet
        const loadRuns = async (eventShort: string) => {
            const orderedRuns = ((await CapacitorHttp.get({url: `https://gamesdonequick.com/tracker/api/v1/search/?type=run&eventshort=${eventShort}`})).data as GDQRunData[])
                                .sort((a, b) => new Date(a.fields.starttime).getTime() - new Date(b.fields.starttime).getTime())
                                .map((run) : [string, GDQRunDataFields] => [run.pk.toString() , run.fields]);
            if (orderedRuns.length <= 0)
            {
                return false;
            }
            const allRunners = orderedRuns.map((run) => run[1].runners).flat();
            const uniqueRunner = [...new Set(allRunners)];
            const runnerDataForRunnersOfThisRun = Object.fromEntries(((await CapacitorHttp.get({url: `https://gamesdonequick.com/tracker/api/v1/search/?type=runner&ids=${uniqueRunner.join(",")}`})).data as GDQRunnerData[]).map((runner) => [runner.pk, runner.fields]));
            runners.value = { ...runners.value, ...runnerDataForRunnersOfThisRun };
            runsByID.value = { ...runsByID.value, ...Object.fromEntries<GDQRunDataFields>(orderedRuns)};
            orderedDays.value = [...new Set<string>(orderedRuns.map(([, run] : [string, GDQRunDataFields]) => new Date(run.starttime).toLocaleDateString()))];
            runIDsInOrder.value = [...new Set<string>([...runIDsInOrder.value, ...orderedRuns.map(([pk, _]) => pk)])];
            runsByEventShort.value[eventShort] = orderedRuns;
            return true;
        };
        const updateCurrentEvent = async (newEvent: string) => {
            if (!runsByEventShort.value[newEvent])
            {
                if (!await loadRuns(newEvent))
                {
                    throw new Error("No runs for this event");
                }
            }

            scrollable.value?.querySelector("#runs")!.scrollTo(0, 0);

            currentEventName.value = newEvent;
            reflectColor(newEvent, document.body.classList.contains('dark-mode'));
            if (drawer.value)
            {
                drawer.value.open = false;
            }

            const orderedRuns = runsByEventShort.value[newEvent];
            runsByDay.value = {};
            orderedRuns.forEach(([runID, _]) => {
                const timeOfRun = new Date(runsByID.value[runID].starttime);
                timeOfRun.setHours(0, 0, 0, 0);
                const dayOfRun = timeOfRun.getTime();
                if (!Object.keys(runsByDay.value).includes(dayOfRun.toString()))
                {
                    runsByDay.value[dayOfRun] = [];
                }
                runsByDay.value[dayOfRun].push(runID);
            });

            console.log(Object.entries(runsByDay.value).map(([day, runs]) => `${new Date(parseInt(day)).toLocaleDateString()}: ${runs.length}`).join("\n"));
        };
        const now = dateProvider.getCurrent();

        let eventsWithoutRuns : string[] = [];
        const filterEventsWithoutRuns = (events : {[key: string] : GDQEventDataFields}) => {
            return Object.entries(events).filter(([key, value]) => !eventsWithoutRuns.includes(key)).reduce((obj, [key, value]) => ({...obj, [key]: value}), {});
        };

        const eventByShorthands : Ref<{[key: string] : GDQEventDataFields}> = ref({});
        const loadEventsAndRuns = async (eventsAfter : Date) => {
            const eventData = await EventsData.getEventsData(eventsAfter);
            const newEvents = Object.fromEntries(eventData
            .filter((a) => a.fields.short.toLowerCase().includes("gdq"))
            .filter((a) => !a.fields.short.toLowerCase().includes("cgdq"))
            .sort((a, b) => new Date(b.fields.datetime).getTime() - new Date(a.fields.datetime).getTime())
            .map((singleEvent) : [string, GDQEventDataFields] => [singleEvent.fields.short.toUpperCase(), singleEvent.fields]));
            
            for (const event of Object.keys(newEvents))
            {
                if (newEvents[event].locked)
                {
                    continue;
                }

                if (await loadRuns(event))
                {
                    continue;
                }

                if (eventsWithoutRuns.includes(event))
                {
                    continue;
                }
                eventsWithoutRuns.push(event);
            }
            eventByShorthands.value = filterEventsWithoutRuns({...eventByShorthands.value, ...newEvents});
            await loadRuns(Object.keys(eventByShorthands.value)[0]);
        };

        const doneLoading = ref(false);

        {
            const roughly12MonthsAgo = dateProvider.getCurrent();
            roughly12MonthsAgo.setFullYear(roughly12MonthsAgo.getFullYear() - 1, 0, 1);
            await loadEventsAndRuns(roughly12MonthsAgo);
            setTimeout(async () => {
                await loadEventsAndRuns(new Date("2011-02-01"));
                doneLoading.value = true;
            }, 2000);
        }

        const descendingEventList = Object.values(eventByShorthands.value).sort((a, b)=>new Date(b.datetime).getTime() - new Date(a.datetime).getTime());

        const determineLatestEventWithRuns = (eventList : GDQEventDataFields[]) => {
            // return if true if shorthand is not part of eventsWithoutRuns
            const eventWithRuns = eventList.find((event) => !eventsWithoutRuns.includes(event.short));
            if (eventWithRuns)
            {
                return eventWithRuns;
            }

            throw new Error("No event with runs found");
        };

        let lastEvent : GDQEventDataFields = determineLatestEventWithRuns(descendingEventList);

        const drawer = ref<TopAppBarFixedWithOpen>()!;
        const lastEventStart = new Date(lastEvent.datetime);
        const lastEventEnd = new Date(lastEvent.datetime);
        lastEventStart.setTime(lastEventStart.getTime() - 1000 * 60 * 60 * 24 * 60);
        lastEventEnd.setTime(lastEventEnd.getTime() + 1000 * 60 * 60 * 24 * 60);
        if (lastEventStart < now && now < lastEventEnd)
        {
            await updateCurrentEvent(lastEvent.short);
        }
        else
        {
            runsByDay.value = {};
        }

        const updateCurrentEventToNewest = async () => {
            const roughly12MonthsAgo = dateProvider.getCurrent();
            roughly12MonthsAgo.setFullYear(roughly12MonthsAgo.getFullYear() - 1, 0, 1);
            if (descendingEventList.length <= 0)
            {
                await new Promise((resolve) => {
                    const interval = setInterval(() => {
                        if (doneLoading.value)
                        {
                            clearInterval(interval);
                            resolve(null);
                        }
                    }, 100);
                });
            }

            const newestEvent = determineLatestEventWithRuns(descendingEventList);
            if (newestEvent.short == currentEventName.value)
            {
                return;
            }
            await updateCurrentEvent(newestEvent.short);
        };

        const snackbar = ref<Snackbar>();

        const toggleDarkMode = () => {
            const themeStore = useThemeStore();
            document.body.classList.toggle('dark-mode');
            themeStore.override(document.body.classList.contains('dark-mode') ? Theme.Dark : Theme.Light);
            reflectColor(currentEventName.value, document.body.classList.contains('dark-mode'));
        };

        const filterTypes = ["", "friend+alert", "alert"];
        let activeFilter = "";

        const reminder = useRunReminderStore(); 
        const friendRunStore = useFriendRunReminderStore();
        const refreshRuns = () => {
            const orderedRuns = runsByEventShort.value[currentEventName.value];
            let runs : {[day : string] : string[]} = {};
            orderedRuns.forEach(([runID, _]) => {
                const hasAlert = reminder.allReminders.includes(runID);
                const inFriendRuns = friendRunStore.allReminders.includes(runID);
                
                if (activeFilter == "friend+alert" && (!inFriendRuns && !hasAlert))
                {
                    return;
                }
                if (activeFilter == "alert" && !hasAlert)
                {
                    return;
                }

                const timeOfRun = new Date(runsByID.value[runID].starttime);
                timeOfRun.setHours(0, 0, 0, 0);
                const dayOfRun = timeOfRun.getTime();
                if (!Object.keys(runs).includes(dayOfRun.toString()))
                {
                    runs[dayOfRun] = [];
                }
                runs[dayOfRun].push(runID);
            });
            runsByDay.value = runs;
            console.log(Object.entries(runsByDay.value).map(([day, runs]) => `${new Date(parseInt(day)).toLocaleDateString()}: ${runs.length}`).join("\n"));
        }

        const userIDStorage = useUserIDStore();
        const friendUserID = ref(userIDStorage.friendUserID);

        const toggleFilter = (a : any, b : any) => {
            activeFilter = filterTypes[(filterTypes.indexOf(activeFilter) + 1) % filterTypes.length];
            if (activeFilter == "friend+alert" && !friendUserID.value)
            {
                activeFilter = filterTypes[(filterTypes.indexOf(activeFilter) + 1) % filterTypes.length];
            }
            refreshRuns();
            return;
        };

        // refresh runs when friend runs change
        friendRunStore.$subscribe((_, store) => {
            refreshRuns();
        });

        const eventHeader = ref<HTMLSpanElement>();
        const dialog = ref<MdDialog>();

        let userID = "";
        getFirebaseAuth().then(async (auth) => {
            userID = (await signInAnonymously(auth)).user!.uid;
            localStorage.setItem("firebaseUserID", userID);
        });

        const copyID = async () => {
            navigator.clipboard.writeText(userID);
            showSnackbar("Copied your user ID to clipboard:");
        };

        reflectColor(currentEventName.value, document.body.classList.contains('dark-mode'));

        return {
            friendUserID,
            copyID,
            dialog,
            eventHeader,
            doneLoading,
            eventByShorthands,
            drawer,
            snackbar,
            orderedDays,
            currentEventName,
            updateCurrentEvent,
            updateCurrentEventToNewest,
            runsByID,
            runIDsInOrder,
            runsByDay,
            runners,
            reminder,
            scrollable,
            toggleFilter,
            toggleDarkMode,
            generateContainerClassNames: () => {
                let classNames = ["container"];
                if (currentEventName.value.startsWith("SGDQ"))
                {
                    classNames.push("sgdq");
                }
                if (currentEventName.value.startsWith("AGDQ"))
                {
                    classNames.push("agdq");
                }
                return classNames.join(" ");
            }
        };
    },
    components: { GDQRun, GDQDay, GDQDayDivider, GDQHeader, GDQSidebar, GDQTimeIndicator }
});
</script>

<template>
  <div :class="generateContainerClassNames()">
    <md-dialog ref="dialog">
        <div slot="headline"><md-button @click="copyID">Copy your user ID</md-button></div>
        <form slot="content" id="form" method="dialog">
            <md-filled-text-field label="Friend's user ID" placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" v-model="friendUserID"></md-filled-text-field>
        </form>
        <div slot="actions">
            <md-text-button form="form" value="cancel">Cancel</md-text-button>
            <md-text-button form="form" value="apply">Apply</md-text-button>
        </div>
    </md-dialog>
    <mwc-snackbar ref="snackbar" timeoutMs="10000">
    </mwc-snackbar>
    <mwc-drawer hasHeader type="dismissible" ref="drawer">
        <span ref="eventHeader" slot="title">Available events</span>
        <GDQSidebar :doneLoading="doneLoading" :eventsByShorthand="eventByShorthands" @onUpdateCurrentEvent="updateCurrentEvent"></GDQSidebar>
        <div id="appContent" slot="appContent" ref="scrollable">
            <GDQHeader @toggleDarkMode="toggleDarkMode" @toggleFilter="toggleFilter" :currentEventName="currentEventName"></GDQHeader>
            
            <div class="mdc-top-app-bar--fixed-adjust" id="runs">
                <div class="transition"></div>
                <template v-for="(runs, day, index) in runsByDay" :key="runs.map((run) => run).join('')">
                    <GDQDay class="gdqday" :runners="runners" :runsByID="runsByID" :runsIDsInOrder="runs" :day="(day as string)"></GDQDay>
                    <div class="padding" v-if="index == Object.keys(runsByDay).length - 1"></div>
                </template>
                <GDQTimeIndicator></GDQTimeIndicator>
            </div>
        </div>
    </mwc-drawer>
  </div>
</template>

<style lang="scss" scoped>

mwc-drawer
{
  padding-top: var(--safe-area-inset-top);
}

mwc-drawer > *
{
    color: var(--mdc-theme-on-surface);
}
    md-dialog
    {
        --md-dialog-container-color: var(--mdc-theme-surface);
        --md-dialog-headline-color: var(--mdc-theme-on-surface);
        --md-dialog-supporting-text-color: var(--mdc-theme-on-surface);
        --md-filled-text-field-container-color: var(--mdc-theme-surface);
        --md-filled-text-field-focus-active-indicator-color: var(--mdc-theme-primary);
        --md-filled-text-field-label-text-color: var(--mdc-theme-on-surface);
        --md-filled-field-active-indicator-color: var(--mdc-theme-primary);

        md-filled-text-field
        {
            width: 100%;
        }
        width: 375px;
    }
    .padding
    {
        height: 8em;
    }
    .dark-mode
    {
        .transition
        {
            --from: hsla(var(--md-sys-color-primary), 1);
            --to: hsla(var(--mmd-sys-color-primary), 0);
        }

        .agdq .transition
        {
            --from: hsla(var(--md-sys-color-primary), 1);
            --to: hsla(var(--md-sys-color-primary), 0);
        }

        .sgdq .transition
        {
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

    #appContent, #runs
    {
        height: 100%;
    }

    #runs {
        position: relative;
        overflow-x: hidden;
    }

    .container
    {
        width: 100vw;
        height: 100vh;

        overflow: hidden;
    }
</style>