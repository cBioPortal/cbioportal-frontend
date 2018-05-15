export function getDeterministicRandomNumber(seed:number, range?:[number, number]) {
    // source: https://stackoverflow.com/a/23304189
    seed = Math.sin(seed)*10000;
    let r = seed - Math.floor(seed); // between 0 and 1
    if (range) {
        r = r*(range[1] - range[0]) + range[0];
    }
    return r;
}