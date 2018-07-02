function logicalReduce(operator:(a:boolean, b:boolean)=>boolean, emptyValue:boolean, firstArg:boolean|boolean[], ...args:boolean[]) {
    const values = args.concat(firstArg);
    return values.reduce((acc:boolean, next:boolean)=>operator(acc, next), emptyValue);
}

export function logicalOr(firstArg:boolean|boolean[], ...args:boolean[]) {
    return logicalReduce((x,y)=>x||y, false, firstArg, ...args);
}

export function logicalAnd(firstArg:boolean|boolean[], ...args:boolean[]) {
    return logicalReduce((x,y)=>x&&y, true, firstArg, ...args);
}