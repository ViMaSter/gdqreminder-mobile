import { defineStore } from 'pinia'
import { store } from '../utilities/firebaseConfig';
import { setDoc, doc } from 'firebase/firestore'
type RunReminderState = {
  runs : string[]
};
const key = 'runReminder';
const defaultValue : RunReminderState = {
  runs: []
};

const reflectInFirestore = async (runs : string[]) => {

  const currentUserID = localStorage.getItem('firebaseUserID');
  if (!currentUserID) {
    console.warn(`Local save successful, but failed to update run reminder ${runs} to firestore; no current user. The user sign should have completed by now.`);
    return;
  }
  
  await setDoc(doc(store, "remindersByUserID", currentUserID), {
    runs
  });
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

      reflectInFirestore(this.$state.runs);
    },
    remove(pk : string) {
      this.$state.runs = this.$state.runs.filter(run => run !== pk);
      localStorage.setItem('piniaState-'+key, JSON.stringify(this.$state));

      reflectInFirestore(this.$state.runs);
    }
  }
})
