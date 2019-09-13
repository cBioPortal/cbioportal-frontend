import {autorun, IObservableObject, observable, ObservableMap} from "mobx";

export default function MobxObjectToMap<T>(getObject:()=>(IObservableObject & T)) {
    const map:ObservableMap<T[keyof T]> = observable.map();
    const ret = {};

    function updateMap() {
        const object = getObject();
        for (const key of (Object.keys(object) as (string & keyof T)[])) {
            if (map.get(key) !== object[key as keyof T]) {
                // only update the value if it's changed
                map.set(key, object[key])
            }

            // add getters
            if (!ret.hasOwnProperty(key)) {
                Object.defineProperty(ret, key, {
                    get: ()=>{
                        return map.get(key as string);
                    },
                    enumerable: true
                });
            }
        }
    }

    autorun(updateMap);

    return ret;
}