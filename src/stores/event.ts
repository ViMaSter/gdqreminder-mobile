import { GDQEventDataFields } from '@/interfaces/GDQEvent';
import { defineStore } from 'pinia'

interface Content {
  [key: string]: GDQEventDataFields;
}

const key = 'event';
const defaultValue : Content = {
};

export const useEventStore = defineStore({
  id: key,
  state: () : Content => {
    const state = localStorage.getItem('piniaState-'+key);
    if (!state) {
      return defaultValue;
    }

    return JSON.parse(state);
  },
  getters: {
    state: (state) => {
      return state.$state;
    }
  },
  actions: {
    override(newEvent : Content) {
      this.$state = newEvent;
      localStorage.setItem('piniaState-'+key, JSON.stringify(this.$state));
    }
  }
})
