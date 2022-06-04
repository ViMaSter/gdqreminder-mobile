<script lang="ts">
import { defineComponent, ref, inject, Ref } from "vue";
import { GDQRunDataFields } from "@/interfaces/GDQRun";
export default defineComponent({
  props: {
    pk: {
      type: String,
      required: true,
    },
    fields: {
      type: Object as () => GDQRunDataFields,
      required: true,
    },
    runnerNames: {
      type: Array as () => string[],
      required: true,
    },
  },
  setup(props) {
    let reminder = inject<Ref<string[]>>("reminder")!;
    const toggleReminder = () => {
      if (reminder.value.includes(props.pk.toString())) {
        reminder.value = reminder.value.filter((pk) => pk !== props.pk.toString());
        return false;
      }
      
      reminder.value.push(props.pk.toString());
      return true;
    };

    const isTrackedRun = ref(reminder.value.includes(props.pk.toString()));

    const start = new Date(props.fields.starttime).toLocaleTimeString();
    const end = new Date(props.fields.endtime).toLocaleTimeString();
    const secondary = ref(
      `${props.runnerNames.join(", ")} - ${props.fields.category}`
    );

    return {
      toggleReminder,
      start,
      end,
      secondary,
      display_name: props.fields.display_name,
      isTrackedRun
    };
  },
});
</script>

<template>
  <mwc-list-item twoline @click="toggleReminder()" hasMeta :activated="isTrackedRun ? true : false">
    <span class="left">{{ display_name }}</span>
    <span class="left" slot="secondary">{{ secondary }}</span>
    <span slot="meta">
      <span class="start">{{ start }}</span>
      <span class="end">{{ end }}</span>
    </span>
  </mwc-list-item>
  <li divider role="separator" padded></li>
</template>
<style lang="css">

span[slot="meta"] {
  display: flex;
  margin-left: calc(-60pt + 100%);
  text-align: right;
  width: 60pt !important;
  flex-direction: column;
  align-content: flex-end;
  justify-content: space-between;
  align-items: flex-end;
  flex-wrap: nowrap;
  height: 175%;
  margin-top: -45.5%;
}

span.left {
    display: inline-block;
    width: calc(100vw - (32px + (60pt + 16px)));
    text-overflow: ellipsis;
    overflow: hidden;
}
</style>
