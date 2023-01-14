<script lang="ts">
import ky from 'ky';
import {onMounted, ref, Ref, provide, defineComponent} from 'vue';
import { AppLauncher } from '@capacitor/app-launcher';
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
            const header = scrollable.value!.parentElement!.shadowRoot!.querySelector(".mdc-drawer-app-content")!;
            header.scrollTo(0, 0);
            header.addEventListener("scroll", function () { header.scrollTo(0, 0); });

            scrollable.value!.querySelector("#runs")!.scrollBy(x, y);
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

        const reminder = ref<string[]>([]);
        onMounted(() => {
            provide("reminder", reminder);
            
            const container = drawer.value!.parentNode;
            container!.addEventListener("MDCTopAppBar:nav", () => {
                drawer.value!.open = !drawer.value!.open;
            });
            setupSwipeLogic(drawer.value!);
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
        const now = dateProvider.getCurrent();

        const eventByShorthands : Ref<{[key: string] : GDQEventDataFields}> = ref({});

        const loadEvents = async (eventsAfter : Date) => {
            const eventData = await (await ky.get("https://gamesdonequick.com/tracker/api/v1/search/?type=event&datetime_gte="+eventsAfter.toISOString())).json<GDQEventData[]>();
            eventByShorthands.value = {...eventByShorthands.value, ...Object.fromEntries(eventData
            .filter((a) => a.fields.short.toLowerCase().includes("gdq"))
            .sort((a, b) => new Date(b.fields.datetime).getTime() - new Date(a.fields.datetime).getTime())
            .map((singleEvent) : [string, GDQEventDataFields] => [singleEvent.fields.short.toUpperCase(), singleEvent.fields]))};
        };

        const doneLoading = ref(false);

        {
            const roughly6MonthsAgo = dateProvider.getCurrent();
            roughly6MonthsAgo.setTime(roughly6MonthsAgo.getTime()-1000 * 60 * 60 * 24 * 30 * 6);
            await loadEvents(roughly6MonthsAgo);
            setTimeout(async () => {
                await loadEvents(new Date("2000-01-01"));
                doneLoading.value = true;
            }, 2000);
        }

        const drawer = ref<TopAppBarFixedWithOpen>()!;

        const lastEvent = Object.values(eventByShorthands.value).sort((a, b)=>new Date(a.datetime).getTime() - new Date(b.datetime).getTime()).at(-1)!;
        await loadRuns(lastEvent.short);
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
            doneLoading,
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
    components: { GDQRun, GDQDay, GDQDayDivider, GDQHeader, GDQSidebar, GDQTimeIndicator }
});
</script>

<template>
  <div :class="generateContainerClassNames()">
    <mwc-snackbar ref="snackbar" timeoutMs="10000">
    </mwc-snackbar>
    <mwc-drawer hasHeader type="dismissible" ref="drawer">
        <span slot="title">Available events</span>
        <GDQSidebar :doneLoading="doneLoading" :eventsByShorthand="eventByShorthands" @onUpdateCurrentEvent="updateCurrentEvent"></GDQSidebar>
        <div id="appContent" slot="appContent" ref="scrollable">
            <GDQHeader @toggleDarkMode="toggleDarkMode" :currentEventName="currentEventName"></GDQHeader>
            <div id="runs">
                <div class="transition"></div>
                <template v-for="(runs, day, index) in runsByDay" :key="day">
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
    .padding
    {
        height: 8em;
    }
    .dark-mode
    {
        .transition
        {
            --mdc-theme-primary: 281, 100%, 10.2%;
            --from: hsla(var(--mdc-theme-primary), 1);
            --to: hsla(var(--mdc-theme-primary), 0);
        }

        .agdq .transition
        {
            --mdc-theme-primary: 180, 100%, 5%;
            --from: hsla(var(--mdc-theme-primary), 1);
            --to: hsla(var(--mdc-theme-primary), 0);
        }

        .sgdq .transition
        {
            --mdc-theme-primary: 347, 89%, 10.4%;
            --from: hsla(var(--mdc-theme-primary), 1);
            --to: hsla(var(--mdc-theme-primary), 0);
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

        overflow-x: hidden;
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