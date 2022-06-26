import { DateProvider } from "@/interfaces/DateProvider"

export class FakeDateProvider implements DateProvider
{
    #startAt;
    #date;
    constructor(date : Date)
    {
        this.#startAt = new Date().getTime();
        this.#date = date;
    }
    getCurrent(): Date {
        const offset = ((new Date().getTime() - this.#startAt) / 1000) * 1000 * 60 * 20;
        return new Date(this.#date.getTime() + offset);
    }
}