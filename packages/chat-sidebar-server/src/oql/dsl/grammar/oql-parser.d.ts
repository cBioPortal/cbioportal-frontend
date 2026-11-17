export declare function parse(
    input: string,
    options?: Record<string, unknown>
): unknown;
export declare class SyntaxError extends Error {
    location: { start: { offset: number; line: number; column: number } };
}
