import CBioPortalAPI from "./generated/CBioPortalAPI";
import {getCbioPortalApiUrl} from "./urls";

const client = new CBioPortalAPI(getCbioPortalApiUrl());
export default client;

// function proxyCall(client, methodName) {
//
//     let proxied = client[methodName];
//
//
//
//     client[methodName] = function(){
//
//         let ret;
//
//         let cachedData = localStorage.getItem(methodName);
//         if (cachedData) {
//             ret = Promise.resolve(JSON.parse(cachedData));
//         }
//
//         // let calledPromise = proxied.apply(this,arguments).then((data)=>{
//         //     localStorage.setItem(methodName, JSON.stringify(data))
//         //     return data;
//         // });
//
//         console.log(ret);
//
//         return ret || calledPromise;
//     }
//
// }
//
// proxyCall(client,'getAllStudiesUsingGET');