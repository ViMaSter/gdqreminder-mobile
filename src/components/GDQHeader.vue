<script lang="ts">
import ky from 'ky';
import {onMounted, ref} from 'vue';
import '@material/mwc-list';
import '@material/mwc-drawer';
import '@material/mwc-top-app-bar-fixed';
import {TopAppBarFixed} from '@material/mwc-top-app-bar-fixed';
import '@material/mwc-icon-button';
import { SetupContext } from '@vue/runtime-core';

interface TopAppBarFixedWithOpen extends TopAppBarFixed {
    open: boolean;
}

interface GDQEventDataFields
{
  short : string
  datetime : string
}
interface GDQEventData {
    fields : GDQEventDataFields
}
interface GDQRunDataFields
{
  display_name : string
  deprecated_runners : string
}
interface GDQRunData {
    pk : number
    fields : GDQRunDataFields
};

export default {
  async setup(props : {}, {emit} : SetupContext) {
    onMounted(() => {
      const container = drawer!.value!.parentNode;
      container!.addEventListener('MDCTopAppBar:nav', () => {
          drawer.value!.open = !drawer.value!.open;
      });
      setupSwipeLogic(drawer.value!);
    });

    const setupSwipeLogic = (drawer : TopAppBarFixedWithOpen) => {
      let touchIdentifier = -1;
      const veloEstimate = 10;
      const clientXThreshold = 20;
      let velocity : Touch[] = [];
      const updateVelocity = (touch : Touch) => {
          if(velocity.length >= veloEstimate)
          {
              velocity.splice(0,1);
          }
          velocity.push(touch);
          console.log(calculateVelocity())
      };
      const calculateVelocity = () => {
          let average = 0;
          if (velocity.length == 1)
          {
              return average;
          }
          for (let i : number = 1; i < velocity.length; i++)
          {
              average += velocity[i].clientX - velocity[i-1].clientX;
          }
          average /= velocity.length;
          return average;
      };
      window.addEventListener("touchstart", (touchStartEvent) => {
          if (touchIdentifier != -1)
          {
              return;
          }
          if (!touchStartEvent.touches[0])
          {
              return;
          }
          if (!drawer!.open)
          {
              if (touchStartEvent.touches[0].clientX > clientXThreshold)
              {
                  return;
              }
          }
          touchIdentifier = touchStartEvent.touches[0].identifier;
      });
      window.addEventListener("touchmove", (touchMoveEvent) => {
          const touchUpdate = Array.from(touchMoveEvent.touches).find(touch => touch.identifier == touchIdentifier);
          if (!touchUpdate)
          {
              return;
          }
          updateVelocity(touchUpdate);
      })
      window.addEventListener("touchend", (touchEndEvent) => {
          if (touchIdentifier == -1)
          {
              return;
          }
          if (Array.from(touchEndEvent.touches).find(touch => touch.identifier == touchIdentifier))
          {
              return;
          }
          drawer!.open = calculateVelocity() > 0
          velocity =[]
          touchIdentifier = -1;
      })
    };

    const currentEvent = ref("");
    const runs = ref<[pk : number, data : GDQRunData][]>([]);
    const reminder = ref<number[]>([]);
    const updateCurrentEvent = (newEvent : string) => {
      currentEvent.value = newEvent;
      drawer!.value!.open = false;
      const loadRuns = async (eventShort : string) => {
        runs.value = (await (await ky.get(`https://gamesdonequick.com/tracker/api/v1/search/?type=run&eventshort=${eventShort}`)).json()).map((run : GDQRunData) => [run.pk, run.fields]);
      };

      loadRuns(eventByShorthands.value[newEvent].short);
    }
    const toggleReminder = (runPK : number) => {
      const run = runs.value.find(([pk]) => pk === runPK);
      if (!run) {
        throw new Error(`Run with pk '${runPK}' not found`);
      }
      if (reminder.value.includes(runPK))
      {
        reminder.value = reminder.value.filter((pk) => pk !== runPK);
      }
      else
      {
        reminder.value.push(runPK);
      }
    };
    const eventData = await (await ky.get("https://gamesdonequick.com/tracker/api/v1/search/?type=event")).json();
    const eventByShorthands = ref(Object.fromEntries(
      eventData
      .filter((a : GDQEventData) => a.fields.short.toLowerCase().includes("gdq"))
      .sort((a : GDQEventData, b : GDQEventData) => new Date(b.fields.datetime).getTime() - new Date(a.fields.datetime).getTime())
      .map((singleEvent : GDQEventData) => [singleEvent.fields.short.toUpperCase(), singleEvent.fields])
    ));
    const generateClass = (runPK : number) => {
      if (reminder.value.includes(runPK))
      {
        return "hasReminder";
      }
      return "";
    };
    const generateAttributes = (runPK : number) => {
      if (reminder.value.includes(runPK))
      {
        return "selected";
      }
      return "";
    };
    const drawer = ref<TopAppBarFixedWithOpen>();
    return {
      propagateChange: (event : Event) => {
        emit('eventChanged', (event.target as HTMLSelectElement).value);
      },
      eventByShorthands,
      drawer,
      currentEvent,
      updateCurrentEvent,
      runs,
      generateClass,
      toggleReminder,
      generateAttributes
    };
  },
}
</script>

<template>
  <div>
    <mwc-drawer hasHeader type="dismissible" ref="drawer">
        <span slot="title">Available events</span>
        <mwc-list>
          <mwc-list-item v-for="[displayName, data] in Object.entries(eventByShorthands)" :key="displayName" @click="updateCurrentEvent(displayName)">{{displayName}}</mwc-list-item>
        </mwc-list>
        <div slot="appContent">
            <mwc-top-app-bar-fixed>
                <mwc-icon-button slot="navigationIcon" icon="menu"></mwc-icon-button>
                <div slot="title">{{currentEvent}}</div>
            </mwc-top-app-bar-fixed>
            <div>
              <mwc-list activatable multi>
                <template v-for="[runPK, runData] in runs" :key="runPK">
                  <mwc-list-item twoline @click="toggleReminder(runPK)">
                    <span>{{runData.fields.display_name}}</span>
                    <span slot="secondary">{{runData.fields.deprecated_runners}}</span>
                  </mwc-list-item>
                  <li divider role="separator" padded></li>
                </template>
              </mwc-list>
            </div>
        </div>
    </mwc-drawer>
  </div>
</template>

<style lang="scss" scoped>
    select
    {
      height: 100%;
      font-size: 32pt;
    }
    .right
    {
      display: flex;
      align-items: stretch;
      align-content: stretch;
    }
    header
    {
        overflow: hidden;
        display: flex;
        align-items: stretch;
        justify-content: space-between;
        width: 100%;
        background-color: var(--color-primary);
    }

    img
    {
        height: 48pt;
        width: 48pt;
    }
    
    .hasReminder {
      --mdc-theme-primary: blue;
      --mdc-list-vertical-padding: 0px;
      --mdc-list-side-padding: 30px;
      border-radius: 10px;
      overflow: hidden;
    }
</style>