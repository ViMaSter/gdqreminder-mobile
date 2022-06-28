<script lang="ts">
import ky from 'ky';
import {onMounted, ref, Ref, provide, defineComponent, inject} from 'vue';
import '@material/mwc-list';
import '@material/mwc-snackbar';
import { Snackbar } from '@material/mwc-snackbar';
import '@material/mwc-drawer';
import '@material/mwc-top-app-bar-fixed';
import { Theme, useThemeStore } from '@/stores/theme';
import {TopAppBarFixed} from '@material/mwc-top-app-bar-fixed';
import '@material/mwc-icon-button';
import {GDQEventData, GDQEventDataFields} from '../interfaces/GDQEvent'
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

interface TopAppBarFixedWithOpen extends TopAppBarFixed {
    open: boolean;
}

export default defineComponent({
    async setup() {
        const scrollable = ref<HTMLDivElement>();
        provide<(x: number, y: number) => void>("scrollRunContainerBy", (x : number, y : number) => {
            scrollable.value!.parentElement!.shadowRoot!.querySelector(".mdc-drawer-app-content")!.scrollBy(x, y)
        });
        
        const currentRun : Ref<[HTMLDivElement, GDQRunDataFields] | null> = ref(null);
        provide("currentRun", currentRun)!;

        const parameters = new LocationHashParameters();
        const date = parameters.getKey("date");
        let dateProvider = new RealDateProvider();
        if (date)
        {
            dateProvider = new FakeDateProvider(new Date(decodeURIComponent(date)));
        }
        provide<DateProvider>("dateProvider", dateProvider);

        const reminder = ref<string[]>([]);
        onMounted(() => {
            provide("reminder", reminder);
            
            const container = drawer.value!.parentNode;
            container!.addEventListener("MDCTopAppBar:nav", () => {
                drawer.value!.open = !drawer.value!.open;
            });
            setupSwipeLogic(drawer.value!);
                
            const showSnackbar = (text : string) => {
                snackbar.value!.stacked = false;
                snackbar.value!.leading = false;
                snackbar.value!.open = true;
                snackbar.value!.labelText = text;
            };
            provide<(text : string) => void>("showSnackbar", showSnackbar);
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
                console.log(calculateVelocity());
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
        const orderedDays = ref<string[]>([]);
        const runIDsInOrder = ref<string[]>([]);
        const runsByDay = ref<{[day : string] : string[]}>({});
        const runners = ref<{
            [pk: string]: GDQRunnerDataFields;
        }>({});
        const loadRuns = async (eventShort: string) => {
            const orderedRuns = (await (await ky.get(`https://gamesdonequick.com/tracker/api/v1/search/?type=run&eventshort=${eventShort}`)).json<GDQRunData[]>())
                                .sort((a, b) => new Date(a.fields.starttime).getTime() - new Date(b.fields.starttime).getTime())
                                .map((run) : [string, GDQRunDataFields] => [run.pk.toString() , run.fields]);
            const allRunners = orderedRuns.map((run) => run[1].runners).flat();
            const uniqueRunner = [...new Set(allRunners)];
            const runnerDataForRunnersOfThisRun = Object.fromEntries((await (await ky.get(`https://gamesdonequick.com/tracker/api/v1/search/?type=runner&ids=${uniqueRunner.join(",")}`)).json<GDQRunnerData[]>()).map((runner) => [runner.pk, runner.fields]));
            runners.value = { ...runners.value, ...runnerDataForRunnersOfThisRun };
            runsByID.value = { ...runsByID.value, ...Object.fromEntries<GDQRunDataFields>(orderedRuns)};
            runIDsInOrder.value = orderedRuns.map(([pk, _]) => pk);
            orderedDays.value = [...new Set<string>(orderedRuns.map(([, run] : [string, GDQRunDataFields]) => new Date(run.starttime).toLocaleDateString()))];
            runsByDay.value = {};
            runIDsInOrder.value.forEach(runID => {
                const timeOfRun = new Date(runsByID.value[runID].starttime);
                timeOfRun.setHours(0, 0, 0, 0);
                const dayOfRun = timeOfRun.getTime();
                if (!Object.keys(runsByDay.value).includes(dayOfRun.toString()))
                {
                    runsByDay.value[dayOfRun] = [];
                }
                runsByDay.value[dayOfRun].push(runID);
            });
        };
        const updateCurrentEvent = async (newEvent: string) => {
            currentEventName.value = newEvent;
            if (drawer.value)
            {
                drawer.value.open = false;
            }
            await loadRuns(eventByShorthands.value[newEvent].short);
        };
        const eventData = await (await ky.get("https://gamesdonequick.com/tracker/api/v1/search/?type=event")).json<GDQEventData[]>();
        const eventByShorthands : Ref<{[key: string] : GDQEventDataFields}> = ref(Object.fromEntries(eventData
            .filter((a) => a.fields.short.toLowerCase().includes("gdq"))
            .sort((a, b) => new Date(b.fields.datetime).getTime() - new Date(a.fields.datetime).getTime())
            .map((singleEvent) : [string, GDQEventDataFields] => [singleEvent.fields.short.toUpperCase(), singleEvent.fields])));
        const drawer = ref<TopAppBarFixedWithOpen>()!;

        const lastEvent = Object.values(eventByShorthands.value).sort((a, b)=>new Date(a.datetime).getTime() - new Date(b.datetime).getTime()).at(-1)!;
        await loadRuns(lastEvent.short);
        const now = dateProvider.getCurrent();
        const lastEventEnd = new Date(runsByID.value[runIDsInOrder.value.at(-1)!].endtime);
        if (new Date(lastEvent.datetime) < now && now < lastEventEnd)
        {
            await updateCurrentEvent(lastEvent.short);
        }
        else
        {
            runsByDay.value = {};
        }

        const snackbar = ref<Snackbar>();

        const toggleDarkMode = () => {
            const themeStore = useThemeStore();
            document.body.classList.toggle('dark-mode');
            themeStore.override(document.body.classList.contains('dark-mode') ? Theme.Dark : Theme.Light);
        };

        return {
            eventByShorthands,
            drawer,
            snackbar,
            orderedDays,
            currentEventName,
            updateCurrentEvent,
            runsByID,
            runIDsInOrder,
            runsByDay,
            runners,
            reminder,
            scrollable,
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
    components: { GDQRun, GDQDay, GDQDayDivider, GDQHeader, GDQSidebar, GDQTimeIndicator },
    methods: {
        updateCurrentEvent: function(newEventName : string) {
            this.currentEventName = newEventName;
            this.drawer!.open = false;
            const loadRuns = async (eventShort : string) => {
                const orderedRuns = (await (await ky.get(`https://gamesdonequick.com/tracker/api/v1/search/?type=run&eventshort=${eventShort}`)).json<GDQRunData[]>())
                                    .sort((a, b) => new Date(a.fields.starttime).getTime() - new Date(b.fields.starttime).getTime())
                                    .map((run) : [string, GDQRunDataFields] => [run.pk.toString(), run.fields]);
                const allRunners = orderedRuns.map((run) => run[1].runners).flat();
                const uniqueRunner = [...new Set(allRunners)];
                const runnerDataForRunnersOfThisRun = Object.fromEntries((await (await ky.get(`https://gamesdonequick.com/tracker/api/v1/search/?type=runner&ids=${uniqueRunner.join(",")}`)).json<GDQRunnerData[]>()).map((runner) => [runner.pk, runner.fields]));
                this.runners = { ...this.runners, ...runnerDataForRunnersOfThisRun };
                this.runsByID = { ...this.runsByID, ...Object.fromEntries<GDQRunDataFields>(orderedRuns)};
                this.runIDsInOrder = orderedRuns.map(([pk, _] : [string, unknown]) => pk);
                this.orderedDays = [...new Set<string>(orderedRuns.map(([, run] : [string, GDQRunDataFields]) => new Date(run.starttime).toLocaleDateString()))];
                this.runsByDay = {};
                this.runIDsInOrder.forEach(runID => {
                    let timeOfRun = new Date(this.runsByID[runID].starttime);
                    timeOfRun.setHours(0,0,0,0);
                    const dayOfRun = timeOfRun.getTime();
                    if (!Object.keys(this.runsByDay).includes(dayOfRun.toString()))
                    {
                        this.runsByDay[dayOfRun] = [];
                    }
                    this.runsByDay[dayOfRun].push(runID);
                });
            };
            loadRuns(this.eventByShorthands[newEventName].short);
        }
    }
});
</script>

<template>
  <div :class="generateContainerClassNames()">
    <mwc-snackbar ref="snackbar" timeoutMs="10000">
    </mwc-snackbar>
    <mwc-drawer hasHeader type="dismissible" ref="drawer">
        <span slot="title">Available events</span>
        <GDQSidebar :eventsByShorthand="eventByShorthands" @onUpdateCurrentEvent="updateCurrentEvent"></GDQSidebar>
        <div slot="appContent" ref="scrollable">
            <GDQHeader @toggleDarkMode="toggleDarkMode" :currentEventName="currentEventName"></GDQHeader>
            <div id="runs">
                <template v-for="(runs, day, _) in runsByDay" :key="day">
                    <GDQDay :runners="runners" :runsByID="runsByID" :runsIDsInOrder="runs" :day="(day as string)"></GDQDay>
                </template>
                <GDQTimeIndicator></GDQTimeIndicator>
            </div>
        </div>
    </mwc-drawer>
  </div>
</template>

<style lang="scss" scoped>
    .container
    {
        height: 100vh;
    }

    .dark-mode {
        .container
        {
            background: hsla(281, 100%, 51%, 0.2);

            &.sgdq
            {
                background: hsla(347, 89%, 52%, 0.2);
            }

            &.agdq
            {
                background: hsla(180, 100%, 50%, 0.1);
            }
        }

        mwc-drawer
        {
            --mdc-theme-surface: black;
        }

        mwc-drawer *
        {
            color: hsl(0deg 0% 87%) !important;
        }
    }
</style>