export default function invertIncreasingFunction(
    func:(x:number)=>number,
    y: number,
    xRange:[number,number],
    iterations:number = 20
) {
    // tries to approximate the value x, within xRange, such that func(x) = targetOutput, assuming func is monotonic increasing
    let xMin = xRange[0];
    let xMax = xRange[1];
    let guess = (xMin + xMax) / 2;
    let iterationsLeft = iterations;
    while (iterationsLeft > 0 && func(guess) !== y) {
        if (func(guess) > y) {
            // too big
            xMax = guess;
        } else {
            // too small
            xMin = guess;
        }
        guess = (xMin + xMax) / 2;
        iterationsLeft -= 1;
    }
    return guess;
}