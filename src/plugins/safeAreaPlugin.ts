import { registerPlugin } from "@capacitor/core";

export interface SafeAreaInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface SafeAreaPlugin {
  getSafeAreaInsets(): Promise<SafeAreaInsets>;
}

const SafeArea = registerPlugin<SafeAreaPlugin>("SafeArea", {
  web: () => import("./safeAreaWebPlugin").then((m) => new m.SafeAreaWeb()),
});

export default SafeArea;
