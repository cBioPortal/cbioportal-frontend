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

export function insertBetween<T>(elt:T, array:T[]):T[] {
    const newArray = [];
    for (let i=0; i<array.length; i++) {
        newArray.push(array[i]);
        if (i < array.length - 1) {
            newArray.push(elt);
        }
    }
    return newArray;
}