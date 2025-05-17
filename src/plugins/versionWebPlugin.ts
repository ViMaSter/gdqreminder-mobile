import { WebPlugin } from "@capacitor/core";

import type { VersionInfo, VersionPlugin } from "./versionPlugin";

export class VersionWeb extends WebPlugin implements VersionPlugin {
  async getCurrent(): Promise<VersionInfo> {
    return {
      versionCode: -1,
      versionName: "WEB",
    };
  }
}
