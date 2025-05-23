export default class Base16
{
    public static encode(input: string) {
        if (input.trim() === "") {
            return "";
        }

        let hex = input
            .split("")
            .map((char) => char.charCodeAt(0).toString(16).padStart(2, "0"))
            .join("");
        // Pad with '0's to make length a multiple of 8
        if (hex.length % 8 !== 0) {
            hex = hex.padEnd(hex.length + (8 - (hex.length % 8)), "0");
        }
        return hex
            .match(/.{1,8}/g)!
            .join("-");
    }

    public static decode(input: string) {
        if (input.trim() === "") {
            return "";
        }

        if (input.split("-").some((part) => part.length !== 8)) {
            throw new Error("Each group needs to be exactly 8 characters long");
        }
        if (input.split("-").some((part) => part.match(/[^0-9a-f]/))) {
            throw new Error("Only hex characters are allowed");
        }
        const groupCount = input.split("-").length;
        // if there's more than 8 characters, each 9th needs to be a dash
        for (let i = 0; i < groupCount-1; i++) {
            if (input[i*9 + 8] !== "-") {
                throw new Error("Every 9th character needs to be a dash");
            }
        }

        input = input.replace(/(0{2})+$/g, "");
        
        return input
            .split("-")
            .join("")
            .match(/.{1,2}/g)!
            .map((hex) => String.fromCharCode(parseInt(hex, 16)))
            .join("");
    }
}