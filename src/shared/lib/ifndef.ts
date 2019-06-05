const type_of_undefined = typeof undefined;

export default function ifndef<T>(target:T, fallback:T) {
    if (typeof target === type_of_undefined) {
        return fallback;
    } else {
        return target;
    }
}