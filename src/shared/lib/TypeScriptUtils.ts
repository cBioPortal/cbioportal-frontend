export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

export type EnsureStringValued<T> = {
    [P in keyof T]:string | undefined;
}