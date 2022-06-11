export interface GDQRunDataFields
{
  display_name : string
  console : string
  category : string
  starttime : string
  endtime: string
  runners : number[]
}
export interface GDQRunData {
    pk : number
    fields : GDQRunDataFields
};