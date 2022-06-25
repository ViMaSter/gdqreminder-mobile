import { DateProvider } from "@/interfaces/DateProvider"

export class FakeDateProvider implements DateProvider
{
    #date;
    constructor(date : Date)
    {
        this.#date = date;
    }
    getCurrent(): Date {
        return this.#date;
    }
}