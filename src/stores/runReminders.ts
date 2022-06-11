import { defineStore } from 'pinia'

type RunReminderState = {
  runs : string[]
};
const key = 'runReminder';

export const useRunReminderStore = defineStore({
  id: key,
  state: () : RunReminderState => {
    const state = localStorage.getItem('piniaState');
    if (!state) {
      return {
        runs: []
      };
    }
    return JSON.parse(state)[key];
  },
  getters: {
    allReminders: (state) => state.runs
  },
  actions: {
    add(pk : string) {
      this.$state.runs.push(pk);
    },
    remove(pk : string) {
      this.$state.runs = this.$state.runs.filter(run => run !== pk);
    }
  }
})
