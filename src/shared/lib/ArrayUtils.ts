export function toggleIncluded<T>(elt:T, included:T[]):T[] {
    const index = included.indexOf(elt);
    if (index === -1) {
        return included.concat([elt]);
    } else {
        const toggled = included.slice();
        toggled.splice(index, 1);
        return toggled;
    }
}