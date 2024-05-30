<script lang="ts">
import {defineComponent, inject} from 'vue';
import GDQRun from './GDQRun.vue';
import GDQDayDivider from './GDQDayDivider.vue';
import {GDQRunDataFields} from '../interfaces/GDQRun'
import {GDQRunnerDataFields} from '../interfaces/GDQRunner'
import { DateProvider } from "@/interfaces/DateProvider"

export default defineComponent({
    props: {
        day: {
            type: String,
            required: true,
        },
        runsIDsInOrder: {
            type: Array as () => string[],
            required: true,
        },
        runsByID: {
          type: Object as () => { [pk: string]: GDQRunDataFields; },
            required: true,
        },
        runners:
        {
          type: Object as () => { [pk: string]: GDQRunnerDataFields; },
          required: true,
        }
    },
    async setup(props) {
      const now = inject<DateProvider>("dateProvider")!.getCurrent();
      const endOfDay = new Date(parseInt(props.day) + 1 * 1000 * 60 * 60 * 24);
      const generateIsOverClassName = () => {
        const lastRunEndTime = props.runsIDsInOrder
          .map((runPK) => props.runsByID[runPK])
          .filter((run) => new Date(run.starttime) < endOfDay)
          .map((run) => new Date(run.endtime))
          .sort((a, b) => b.getTime() - a.getTime())[0];
        const isInThePast = lastRunEndTime < now;
        if (isInThePast)
        {
          return "is-over";
        }
        return "";
      };
      
      return {...props, generateIsOverClassName};
    },
    components: {
      GDQRun, GDQDayDivider
    }
});
</script>

<template>
  <div :class="'day ' + generateIsOverClassName()" :id="'run-for-'+day">
      <GDQDayDivider class="dd" :day="day" ></GDQDayDivider>
      <template v-for="(runPK, index) in runsIDsInOrder" :key="runPK">   
          <GDQRun class="r" v-if="index == (Object.keys(runsIDsInOrder).length - 1)" :last="true"  :pk="runPK" :fields="runsByID[runPK]" :runner-names="runsByID[runPK].runners.map((runner)=>runners[runner].public)" ></GDQRun>
          <GDQRun class="r" v-if="index != (Object.keys(runsIDsInOrder).length - 1)" :last="false" :pk="runPK" :fields="runsByID[runPK]" :runner-names="runsByID[runPK].runners.map((runner)=>runners[runner].public)" ></GDQRun>
      </template>
      <span></span>
  </div>
</template>

<style lang="scss">
.day
{
    margin-top: 14px;
    margin-bottom: 12px;
    padding-right: 10px;

    &.is-over .content
    {
      text-decoration: line-through;
      
      .day-divider
      {
        opacity: 0.5;
      }
    }
}
</style>

<style lang="scss" scoped>
span {
  display: block;
  clear: both;
}
.dd
{
  float: left;
  width: 64px;
  height: 50px;
}

.r
{
  float: right;
  width: calc(100% - 64px);
  height: 50px;
}

.dark-mode span
{
    color: hsl(0deg 0% 89%);
}
.dark-mode li[divider]
{
  border-bottom-color: rgba(255, 255, 255, 0.45) !important;
}
mwc-list-item
{
  justify-content: right;
  font-size: 1.5em;
}
mwc-list-item span
{
  color: #00aeef !important;
}
</style>