import { WebPlugin } from "@capacitor/core";

import type { SafeAreaInsets, SafeAreaPlugin } from "./safeAreaPlugin";

export class SafeAreaWeb extends WebPlugin implements SafeAreaPlugin {
  async getSafeAreaInsets(): Promise<SafeAreaInsets> {
    return {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    };
  }
}
