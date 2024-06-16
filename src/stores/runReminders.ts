import { defineStore } from 'pinia'
import { store } from '../utilities/firebaseConfig';
import { setDoc, doc } from 'firebase/firestore'
import Calendar from '@/plugins/calendarPlugin';
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
    async add(pk : string, title : string, start : Date, end : Date, description : string) : Promise<boolean> {
      const calendarError = await Calendar.upsertEvent({
        sync_id: pk,
        title: title,
        notes: description,
        location: "https://twitch.tv/gamesdonequick",
        startDate: start,
        endDate: end
      });
      if (calendarError.error)
      {
        console.error("Failed to add run reminder to calendar:" + calendarError.error);
        return false;
      }
      this.$state.runs.push(pk);
      localStorage.setItem('piniaState-'+key, JSON.stringify(this.$state));

      reflectInFirestore(this.$state.runs);

      return true;
    },
    async remove(pk : string) : Promise<boolean> {
      this.$state.runs = this.$state.runs.filter(run => run !== pk);
      const calendarError = await Calendar.cleanupEvents({sync_ids: Array.from(this.$state.runs)});
      if (calendarError.error)
      {
        console.error("Failed to remove run reminder from calendar:" + calendarError.error);
        return false;
      }

      localStorage.setItem('piniaState-'+key, JSON.stringify(this.$state));

      reflectInFirestore(this.$state.runs);

      return true;
    }
  }
})
