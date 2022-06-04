<script lang="ts">
import { defineComponent, ref, inject } from "vue";
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
    let reminder: string[] = inject("reminder")!;
    const toggleReminder = () => {
      if (reminder.includes(props.pk.toString())) {
        reminder = reminder.filter((pk) => pk !== props.pk.toString());
      } else {
        reminder.push(props.pk.toString());
      }
    };
    const generateClass = (runPK: string) => {
      if (reminder.includes(runPK)) {
        return "hasReminder";
      }
      return "";
    };
    const generateAttributes = (runPK: string) => {
      if (reminder.includes(runPK)) {
        return "selected";
      }
      return "";
    };

    const start = new Date(props.fields.starttime).toLocaleTimeString();
    const end = new Date(props.fields.endtime).toLocaleTimeString();
    const secondary = ref(
      `${props.runnerNames.join(", ")} - ${props.fields.category}`
    );

    return {
      generateClass,
      generateAttributes,
      toggleReminder,
      start,
      end,
      secondary,
      display_name: props.fields.display_name,
    };
  },
});
</script>

<template>
  <div>
    <mwc-list-item twoline @click="toggleReminder()" hasMeta>
      <span class="left">{{ display_name }}</span>
      <span class="left" slot="secondary">{{ secondary }}</span>
      <span slot="meta">
        <span class="start">{{ start }}</span>
        <span class="end">{{ end }}</span>
      </span>
    </mwc-list-item>
    <li divider role="separator" padded></li>
  </div>
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
