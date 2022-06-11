<script lang="ts">
import {defineComponent} from 'vue';
import GDQRun from './GDQRun.vue';
import GDQDayDivider from './GDQDayDivider.vue';
import {GDQRunDataFields} from '../interfaces/GDQRun'
import {GDQRunnerDataFields} from '../interfaces/GDQRunner'

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
      return {...props};
    },
    components: {
      GDQRun, GDQDayDivider
    }
});
</script>

<template>
  <div class="day" :id="'run-for-'+day">
      <GDQDayDivider class="dd" :day="day" />
      <template v-for="(runPK, index) in runsIDsInOrder" :key="runPK">   
          <GDQRun class="r" v-if="index == (Object.keys(runsIDsInOrder).length - 1)" :last="true"  :pk="runPK" :fields="runsByID[runPK]" :runner-names="runsByID[runPK].runners.map((runner)=>runners[runner].public)" @showSnackbar="showSnackbar" />
          <GDQRun class="r" v-if="index != (Object.keys(runsIDsInOrder).length - 1)" :last="false" :pk="runPK" :fields="runsByID[runPK]" :runner-names="runsByID[runPK].runners.map((runner)=>runners[runner].public)" @showSnackbar="showSnackbar" />
      </template>
      <span></span>
  </div>
</template>

<style lang="css" scoped>
span {
  display: block;
  clear: both;
}
.day
{
    margin-top: 14px;
    margin-bottom: 12px;
    padding-right: 10px;
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