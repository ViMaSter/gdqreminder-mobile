<script lang="ts">
import ky from 'ky';
import {Ref, onMounted, ref} from 'vue';
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
};

export default {
  async setup(props : {}, {emit} : SetupContext) {
    onMounted(() => {
      const container = drawer!.value!.parentNode;
      container!.addEventListener('MDCTopAppBar:nav', () => {
          drawer.value!.open = !drawer.value!.open;
      });
    });

    const eventData = await (await ky.get("https://gamesdonequick.com/tracker/api/v1/search/?type=event")).json();
    const eventShorthands = ref(eventData.filter((a : GDQEventData) => a.fields.short.toLowerCase().includes("gdq")).sort((a : GDQEventData, b : GDQEventData) => {
      return new Date(b.fields.datetime).getTime() - new Date(a.fields.datetime).getTime();
      }).map((singleEvent : GDQEventData) => singleEvent.fields.short.toUpperCase()));
    const drawer = ref<TopAppBarFixedWithOpen>();
    return {
      propagateChange: (event : Event) => {
        emit('eventChanged', (event.target as HTMLSelectElement).value);
      },
      runs: eventShorthands,
      drawer
    };
  },
}
</script>

<template>
  <div>
    <mwc-drawer hasHeader type="dismissible" ref="drawer">
        <span slot="title">Available runs</span>
        <mwc-list>
          <mwc-list-item v-for="run in runs" :key="run">{{run}}</mwc-list-item>
        </mwc-list>
        <div slot="appContent">
            <mwc-top-app-bar-fixed>
                <mwc-icon-button slot="navigationIcon" icon="menu"></mwc-icon-button>
                <div slot="title">Title</div>
            </mwc-top-app-bar-fixed>
            <div>
                <p>Main Content!</p>
            </div>
        </div>
    </mwc-drawer>
  </div>
<!-- <mwc-top-app-bar-fixed>
    <mwc-icon-button icon="menu" slot="navigationIcon"></mwc-icon-button>
    <div class="right" >
      <select class="form-control" ref="eventSelector" @change="propagateChange($event)">
        <option value="AGDQ2020">AGDQ2020</option>
        <option value="SGDQ2020">SGDQ2020</option>
        <option value="AGDQ2021">AGDQ2021</option>
        <option value="SGDQ2021">SGDQ2021</option>
        <option value="AGDQ2022">AGDQ2022</option>
      </select>
    </div>
</mwc-top-app-bar-fixed> -->
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
</style>