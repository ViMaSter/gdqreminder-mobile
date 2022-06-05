export interface VersionInfo {
    versionCode : number;
    versionName : string;
}
export interface VersionPlugin {
    getCurrent(): Promise<VersionInfo>;
}