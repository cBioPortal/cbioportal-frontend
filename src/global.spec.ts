import CBioPortalAPI from "./shared/api/generated/CBioPortalAPI";
import request from 'superagent';

let clientStubs:any[];

clientStubs = stubClient();

request.get = (function(){
    console.log(`Warning: calling stubbed method request.get, which returns a promise that never resolves.`);
    return new Promise(()=>{});
} as any);

request.post = (function(){
    console.log(`Warning: calling stubbed method request.post, which returns a promise that never resolves.`);
    return new Promise(()=>{});
} as any);


function stubClient():any[] {
    // returns stubs

    var target = CBioPortalAPI;

    const stubs:any[] = [];

    var arrObj = Object.getOwnPropertyNames(target.prototype);
    for( var funcKey in arrObj ) {
        var methodName = arrObj[funcKey];

        (CBioPortalAPI.prototype as any)[methodName] = function(){
            console.log(`Warning: calling stubbed method cbioportalClient.${methodName}, which returns a promise that never resolves.`);
        }
    }

    return stubs;
}