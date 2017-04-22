export function compareNumberLists(a:number[], b:number[]) {
    if (a.length !== b.length) {
        throw "Input lists must be same length";
    }
    let ret = 0;
    for (let i=0; i<a.length; i++) {
        const A = a[i];
        const B = b[i];
        const typeofA = typeof A;
        const typeofB = typeof B;
        if (typeofA === "undefined" && typeofB !== "undefined") {
            ret = -1;
            break;
        } else if (typeofA !== "undefined" && typeofB === "undefined") {
            ret = 1;
            break;
        } else if (typeofA !== "undefined" && typeofB !== "undefined") {
            if (A > B) {
                ret = 1;
                break;
            } else if (A < B) {
                ret = -1;
                break;
            }
        }
    }
    return ret;
};