import {autorun, IObservableObject, observable, ObservableMap} from "mobx";

export default function trackPropertiesIndividually<T>(
    getObject:()=>(IObservableObject & T)
):ValueGetter<T> {
    const map:ObservableMap<T[keyof T]> = observable.map();
    const ret = {};

    function updateMap() {
        const object = getObject();
        for (const key of (Object.keys(object) as (string & keyof T)[])) {
            if (map.get(key) !== object[key as keyof T]) {
                // only update the value if it's changed
                map.set(key, object[key])
            }
        }
    }

    autorun(updateMap);

    return (property:keyof T)=>{
        return map.get(property as string);
    };
}

export type ValueGetter<T> = (prop:keyof T)=>T[keyof T]|undefined;