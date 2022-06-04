export interface GDQRunDataFields
{
  display_name : string
  category : string
  starttime : string
  endtime: string
  runners : number[]
}
export interface GDQRunData {
    pk : number
    fields : GDQRunDataFields
};