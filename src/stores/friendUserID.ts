import { defineStore } from "pinia";

type FriendUserIDState = {
  friendUserID?: string;
};
const key = "piniaState-userID";
const defaultValue: FriendUserIDState = {
  friendUserID: undefined,
};

const useFriendUserIDStore = defineStore(key, {
  state: (): FriendUserIDState => {
    const state = localStorage.getItem(key);
    if (!state) {
      localStorage.setItem(key, JSON.stringify(defaultValue));
      return defaultValue;
    }

    return JSON.parse(state);
  },
  getters: {
    currentFriendUserID: (state) => state.friendUserID,
  },
  actions: {
    setFriendUserID(friendUserID: string) {
      this.$patch({ friendUserID });
      localStorage.setItem(key, JSON.stringify(this.$state));
    },
  },
});
export { useFriendUserIDStore as useUserIDStore };
export type { FriendUserIDState as FriendUserIDState };
