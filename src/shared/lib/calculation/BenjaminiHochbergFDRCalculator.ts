export function calculateQValues(sortedPValues: number[]): number[] {
    let cachedElement : number;
    const dataLength = sortedPValues.length;
    const reversedQValues = sortedPValues.reverse().map((currentElement, index) => {
        if (cachedElement) {
            const calculatedValue = Math.min(cachedElement, currentElement * dataLength / (dataLength - index));
            cachedElement = calculatedValue;
            return calculatedValue;
        }
        cachedElement = currentElement;
        return currentElement;
    });

    return reversedQValues.reverse();
}