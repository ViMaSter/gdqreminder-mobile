export interface GDQRunnerData {
  type: string;
  id: number;
  name: string;
  stream: string;
  twitter: string;
  youtube: string;
  platform: string;
  pronouns: string;
}
export interface GDQRunData {
  id: number;
  display_name: string;
  console: string;
  category: string;
  starttime: string;
  endtime: string;
  runners: GDQRunnerData[];
}
