const type_of_undefined = typeof undefined;

export default function ifndef(target:any, fallback:any) {
    if (typeof target === type_of_undefined) {
        return fallback;
    } else {
        return target;
    }
}