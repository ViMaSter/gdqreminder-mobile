export type NestedEventCallbacks = {[key : string] : Function | NestedEventCallbacks};
export class EventHandler
{
    static handleCustomEvent(fullPath : string, nestedEventCallbacks : NestedEventCallbacks) {
        // iterate over eventPath until function is found and call it with remaining eventPath items
        let eventPath = fullPath.split(".");
        let currentElement : string;
        do 
        {
            currentElement = eventPath.shift()!;
            if (typeof nestedEventCallbacks[currentElement] == "undefined")
            {
            break;
            }
            
            if (typeof nestedEventCallbacks[currentElement] == "function")
            {
            (nestedEventCallbacks[currentElement] as Function)(eventPath);
            return;
            }
            nestedEventCallbacks = nestedEventCallbacks[currentElement] as NestedEventCallbacks;
        } while (eventPath.length > 0);
        throw new Error("Unhandled event: " + fullPath);
    };
}
