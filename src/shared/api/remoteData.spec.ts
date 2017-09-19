import {remoteData} from "./remoteData";
import * as seamlessImmutable from "seamless-immutable";
import {assert} from "chai";

describe("remoteData", ()=>{
    describe("immutable result behavior", ()=>{
        it("returns immutable object from invoke if it doesnt receive true as its third argument", (done)=>{
            remoteData({
                invoke: ()=>Promise.resolve({}),
                onResult:(result:Object)=>{
                    assert.isTrue(seamlessImmutable.isImmutable(result));
                    done();
                }
            });
        });

        it("returns immutable object as default if it doesnt receive true as its third argument", ()=>{
            const rd = remoteData({
                invoke: ()=>Promise.resolve({}),
                default: {}
            });
            assert.isTrue(seamlessImmutable.isImmutable(rd.result));
        });

        it("returns normal object from invoke if it receives true as its third argument", (done)=>{
            remoteData({
                invoke: ()=>Promise.resolve({}),
                onResult:(result:Object)=>{
                    assert.isFalse(seamlessImmutable.isImmutable(result));
                    done();
                }
            });
        });

        it("returns normal object as default if it receives true as its third argument", ()=>{
            const rd = remoteData({
                invoke: ()=>Promise.resolve({}),
            }, {}, true);
            assert.isFalse(seamlessImmutable.isImmutable(rd.result));
        });
    });
});