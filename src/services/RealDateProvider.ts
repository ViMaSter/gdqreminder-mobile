import { DateProvider } from "@/interfaces/DateProvider"

export class RealDateProvider implements DateProvider
{
    getCurrent(): Date {
        return new Date();
    }
}