import { defineStore } from 'pinia'

type FriendRunReminderState = {
  runs : string[]
};
const key = 'FriendRunReminder';

export const useFriendRunReminderStore = defineStore({
  id: key,
  state: () : FriendRunReminderState => {
    return {runs: []};
  },
  getters: {
    allReminders: (state) => state.runs
  },
  actions: {
    set(runs : string[]) {
      this.$state.runs = runs;
    }
  }
})
