function hash(str:string) {
    var hash = 0, i, chr;
    if (str.length === 0) return hash;
    for (i = 0; i < str.length; i++) {
        chr   = str.charCodeAt(i);
        hash  = ((hash << 5) - hash) + chr;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
};

function getHash(obj:any){
    return hash(JSON.stringify(obj));
}

const theStore:any = {};

export function proxyPost(targetObj:any, methodName:string){
    const oldMethod = targetObj[methodName];

    //prepare store with entry for this method
    theStore[methodName] = {};
    const storeNode = theStore[methodName];

    targetObj[methodName] = function(arg:any){
        const hash = getHash(arg);
        if ( hash in storeNode ) {
            console.log("using POST cache!");
            return Promise.resolve(storeNode[hash]);
        } else {
            return oldMethod.apply(this,arguments).then((data:any)=>{
                storeNode[hash] = data;
                return data;
            });
        }
    }
}