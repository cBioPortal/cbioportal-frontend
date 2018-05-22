export function logicalOr(firstArg:boolean|boolean[], ...args:boolean[]) {
    const values = args.concat(firstArg);
    return values.reduce((acc:boolean, next:boolean)=>(acc || next), false);
}