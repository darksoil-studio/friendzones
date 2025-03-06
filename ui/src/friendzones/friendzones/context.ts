import { createContext } from "@lit/context";
import { FriendzonesStore } from "./friendzones-store.js";

export const friendzonesStoreContext = createContext<FriendzonesStore>(
  "friendzones/store",
);
