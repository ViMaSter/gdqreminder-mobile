import { registerPlugin } from "@capacitor/core";

export interface VersionInfo {
  versionCode: number;
  versionName: string;
}
export interface VersionPlugin {
  getCurrent(): Promise<VersionInfo>;
}

const Version = registerPlugin<VersionPlugin>("Version", {
  web: () => import("./versionWebPlugin").then((m) => new m.VersionWeb()),
});

export default Version;
