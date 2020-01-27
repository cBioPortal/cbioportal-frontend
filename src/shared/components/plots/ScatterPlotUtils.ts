import regression from 'regression';

export function getRegressionComputations(
    data: [number, number][] //x,y
): {
    predict: (x: number) => [number, number]; // x => [x,y]
    string: string; // "y = mx + b"
    r2: number; // R^2 value
} {
    return regression.linear(data);
}
