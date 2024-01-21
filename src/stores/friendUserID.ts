import { defineStore } from 'pinia'

type FriendUserIDState = {
  friendUserID? : string
};
const key = 'userID';
const defaultValue : FriendUserIDState = {
  friendUserID: undefined
};

const useFriendUserIDStore = defineStore({
  id: key,
  state: () : FriendUserIDState => {
    const state = localStorage.getItem('piniaState-'+key);
    if (!state) {
      localStorage.setItem('piniaState-'+key, JSON.stringify(defaultValue));
      return defaultValue;
    }

    return JSON.parse(state);
  },
  getters: {
    currentFriendUserID: (state) => state.friendUserID
  },
  actions: {
    setFriendUserID(friendUserID : string) {
      this.$patch({friendUserID});
      localStorage.setItem('piniaState-'+key, JSON.stringify(this.$state));
    }
  }
})
export { useFriendUserIDStore as useUserIDStore };
export type { FriendUserIDState as FriendUserIDState };
