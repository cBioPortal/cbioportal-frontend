import client from "./shared/api/cbioportalClientInstance";
import Sinon from "sinon";
import CBioPortalAPI from "./shared/api/generated/CBioPortalAPI";

let clientStubs:any[];
before(()=>{
    clientStubs = stubClient();
});

after(()=>{
    for (const stub of clientStubs) {
        stub.restore();
    }
});

function stubClient():any[] {
    // returns stubs
    const stubs:any[] = [];
    const methodNames:(keyof CBioPortalAPI)[] = (Object.keys(client) as (keyof CBioPortalAPI)[]).filter(m=>(typeof (client as any)[m]) === "function");
    for (const methodName of methodNames) {
        stubs.push(Sinon.stub(client, methodName).callsFake(()=>new Promise((resolve, reject)=>{
            console.log(`Warning: calling stubbed method cbioportalClient.${methodName}, which returns a promise that never resolves.`);
        })));
    }
    return stubs;
}