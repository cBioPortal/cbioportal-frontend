function getProbability(a: number, b: number, c: number, d: number, logFactorial: number[]): number {

    const n: number = a + b + c + d;
    const p: number = (logFactorial[a + b] + logFactorial[c + d] + logFactorial[a + c] + logFactorial[b + d]) -
        (logFactorial[a] + logFactorial[b] + logFactorial[c] + logFactorial[d] + logFactorial[n]);
    return Math.exp(p);
}

export function getCumulativePValue(a: number, b: number, c: number, d: number): number {

    let min: number, i: number;
    const n: number = a + b + c + d;
    let p: number = 0;
    let logFactorial: number[] = new Array(n + 1);
    logFactorial[0] = 0.0;

    for (let j: number = 1; j <= n; j++) {
        logFactorial[j] = logFactorial[j - 1] + Math.log(j);
    }

    p += getProbability(a, b, c, d, logFactorial);
    if ((a * d) >= (b * c)) {
        min = (c < b) ? c : b;
        for (i = 0; i < min; i++) {
            p += getProbability(++a, --b, --c, ++d, logFactorial);
        }
    }

    if ((a * d) < (b * c)) {
        min = (a < d) ? a : d;
        for (i = 0; i < min; i++) {
            p += getProbability(--a, ++b, ++c, --d, logFactorial);
        }
    }
    return p;
}
