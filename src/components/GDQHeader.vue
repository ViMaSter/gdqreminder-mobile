<script lang="ts">
import ky from 'ky';
import {onMounted, ref, provide, defineComponent} from 'vue';
import '@material/mwc-list';
import '@material/mwc-snackbar';
import { Snackbar } from '@material/mwc-snackbar';
import '@material/mwc-drawer';
import '@material/mwc-top-app-bar-fixed';
import {TopAppBarFixed} from '@material/mwc-top-app-bar-fixed';
import '@material/mwc-icon-button';
import {GDQEventData} from '../interfaces/GDQEvent'
import {GDQRunData, GDQRunDataFields} from '../interfaces/GDQRun'
import {GDQRunnerData, GDQRunnerDataFields} from '../interfaces/GDQRunner'
import GDQRun from './GDQRun.vue';
import Version from '@/plugins/versionPlugin';
import GDQDayDivider from './GDQDayDivider.vue';
import GDQHeaderBar from './GDQHeaderBar.vue';

interface TopAppBarFixedWithOpen extends TopAppBarFixed {
    open: boolean;
}

export default defineComponent({
    async setup() {
        const reminder = ref<string[]>([]);
        provide('reminder', reminder)

        onMounted(() => {
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
                    console.log("y>x");
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
        const currentEvent = ref(`${(await Version.getCurrent()).versionName}.${(await Version.getCurrent()).versionCode}`);
        const runsByID = ref<{
            [pk: string]: GDQRunDataFields;
        }>({});
        const orderedDays = ref<string[]>([]);
        const runIDsInOrder = ref<string[]>([]);
        const runsByDay = ref<{[day : string] : string[]}>({});
        const runners = ref<{
            [pk: string]: GDQRunnerDataFields;
        }>({});
        const updateCurrentEvent = (newEvent: string) => {
            currentEvent.value = newEvent;
            drawer.value!.open = false;
            const loadRuns = async (eventShort: string) => {
                const orderedRuns = (await (await ky.get(`https://gamesdonequick.com/tracker/api/v1/search/?type=run&eventshort=${eventShort}`)).json())
                                    .sort((a : GDQRunData, b : GDQRunData) => new Date(a.fields.starttime).getTime() - new Date(b.fields.starttime).getTime())
                                    .map((run: GDQRunData) => [run.pk, run.fields]);
                const allRunners = orderedRuns.map((run: [
                    number,
                    GDQRunDataFields
                ]) => run[1].runners).flat();
                const uniqueRunner = [...new Set(allRunners)];
                const runnerDataForRunnersOfThisRun = Object.fromEntries((await (await ky.get(`https://gamesdonequick.com/tracker/api/v1/search/?type=runner&ids=${uniqueRunner.join(",")}`)).json()).map((runner: GDQRunnerData) => [runner.pk, runner.fields]));
                runners.value = { ...runners.value, ...runnerDataForRunnersOfThisRun };
                runsByID.value = { ...runsByID.value, ...Object.fromEntries<GDQRunDataFields>(orderedRuns)};
                runIDsInOrder.value = orderedRuns.map(([pk, _] : [string, undefined]) => pk);
                orderedDays.value = [...new Set<string>(orderedRuns.map(([, run] : [string, GDQRunDataFields]) => new Date(run.starttime).toLocaleDateString()))];
                runsByDay.value = {};
                runIDsInOrder.value.forEach(runID => {
                    const dayOfRun = new Date(runsByID.value[runID].starttime).toLocaleDateString();
                    if (!Object.keys(runsByDay.value).includes(dayOfRun))
                    {
                        runsByDay.value[dayOfRun] = [];
                    }
                    runsByDay.value[dayOfRun].push(runID);
                });
            };
            loadRuns(eventByShorthands.value[newEvent].short);
        };
        const eventData = await (await ky.get("https://gamesdonequick.com/tracker/api/v1/search/?type=event")).json();
        const eventByShorthands = ref(Object.fromEntries(eventData
            .filter((a: GDQEventData) => a.fields.short.toLowerCase().includes("gdq"))
            .sort((a: GDQEventData, b: GDQEventData) => new Date(b.fields.datetime).getTime() - new Date(a.fields.datetime).getTime())
            .map((singleEvent: GDQEventData) => [singleEvent.fields.short.toUpperCase(), singleEvent.fields])));
        const drawer = ref<TopAppBarFixedWithOpen>()!;

        const snackbar = ref<Snackbar>();
        const showSnackbar = (text : string) => {
          snackbar.value!.stacked = false;
          snackbar.value!.leading = false;
          snackbar.value!.open = true;
          snackbar.value!.labelText = text;
        };

        const toggleDarkMode = () => {
            document.body.classList.toggle('dark-mode');
        };

        return {
            eventByShorthands,
            drawer,
            snackbar,
            showSnackbar,
            currentEvent,
            updateCurrentEvent,
            runsByID,
            runIDsInOrder,
            runsByDay,
            runners,
            reminder,
            toggleDarkMode
        };
    },
    components: { GDQRun, GDQDayDivider, GDQHeaderBar }
});
</script>

<template>
  <div>
    <mwc-snackbar ref="snackbar" timeoutMs="10000">
    </mwc-snackbar>
    <mwc-drawer hasHeader type="dismissible" ref="drawer">
        <span slot="title">Available events</span>
        <mwc-list>
          <mwc-list-item v-for="[displayName] in (Object.entries(eventByShorthands))" :key="displayName" @click="updateCurrentEvent(displayName)">{{displayName}}</mwc-list-item>
        </mwc-list>
        <div slot="appContent">
            <GDQHeaderBar @toggleDarkMode="toggleDarkMode" :currentEvent="currentEvent"></GDQHeaderBar>
            <div>
              <mwc-list activatable multi>
                <template v-for="(runs, day, _) in runsByDay" :key="day">
                    <GDQDayDivider :day="(day as string)" />
                    <template v-for="(runPK, index) in runs" :key="runPK">   
                        <GDQRun v-if="index == (Object.keys(runs).length - 1)" :last="true"  :pk="runPK" :fields="runsByID[runPK]" :runner-names="runsByID[runPK].runners.map((runner)=>runners[runner].public)" @showSnackbar="showSnackbar" />
                        <GDQRun v-if="index != (Object.keys(runs).length - 1)" :last="false" :pk="runPK" :fields="runsByID[runPK]" :runner-names="runsByID[runPK].runners.map((runner)=>runners[runner].public)" @showSnackbar="showSnackbar" />
                    </template>
                </template>
              </mwc-list>
            </div>
        </div>
    </mwc-drawer>
  </div>
</template>

<style lang="scss" scoped>
    .dark-mode mwc-drawer
    {
      --mdc-theme-surface: black;
    }

    .dark-mode mwc-drawer *
    {
      color: white !important;
    }
</style>