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
  name: string; // fallback, as sometimes display_name is empty
  display_name: string;
  console: string;
  category: string;
  starttime: string;
  endtime: string;
  runners: GDQRunnerData[];
}
