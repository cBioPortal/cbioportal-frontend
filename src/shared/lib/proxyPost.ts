import getBrowserWindow from "./getBrowserWindow";

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

const postCacheStore:any = {};

getBrowserWindow().postCacheStore = postCacheStore;

export function proxyPost(targetObj:any, methodName:string){

    const oldMethod = targetObj[methodName];

    //prepare store with entry for this method
    postCacheStore[methodName] = {};
    const storeNode = postCacheStore[methodName];

    targetObj[methodName] = function(arg:any){
        //console.log('posted data',arg);
        const hash = getHash(arg);
        if ( hash in storeNode ) {
            console.log(`using POST cache for ${methodName}`);
            return Promise.resolve(storeNode[hash]);
        } else {
            return oldMethod.apply(this,arguments).then((data:any)=>{
                storeNode[hash] = data;
                return data;
            });
        }
    }
}

export function proxyAllPostMethodsOnClient(obj:any){
    const postMethods = Object.getOwnPropertyNames( obj.prototype ).filter((methodName)=>/UsingPOST$/.test(methodName));
    postMethods.forEach((n)=>proxyPost(obj.prototype, n));
}