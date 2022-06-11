import { defineStore } from 'pinia'

type RunReminderState = {
  runs : string[]
};
const key = 'runReminder';
const defaultValue : RunReminderState = {
  runs: []
};

export const useRunReminderStore = defineStore({
  id: key,
  state: () : RunReminderState => {
    const state = localStorage.getItem('piniaState-'+key);
    if (!state) {
      return defaultValue;
    }

    return JSON.parse(state);
  },
  getters: {
    allReminders: (state) => state.runs
  },
  actions: {
    add(pk : string) {
      this.$state.runs.push(pk);
      localStorage.setItem('piniaState-'+key, JSON.stringify(this.$state));
    },
    remove(pk : string) {
      this.$state.runs = this.$state.runs.filter(run => run !== pk);
      localStorage.setItem('piniaState-'+key, JSON.stringify(this.$state));
    }
  }
})
