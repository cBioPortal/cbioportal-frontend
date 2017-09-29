import { assert } from 'chai';
import reactionWithPrev from "./reactionWithPrev";
import {IReactionDisposer, observable} from "mobx";

describe("reactionWithPrev", ()=>{
    let dispose:IReactionDisposer;

    it("passes through the correct arguments each time", (done)=>{
        let values = [0,3,5,7,7,7,8,10];
        let argumentIndex = observable(-1);
        let indexesWhereEffectCalled:{[index:number]:boolean} = {};

        let dataFn = ()=>values[argumentIndex.get()];
        let effectFn = (data:number, prevData?:number)=>{

            if (argumentIndex.get() === values.length) {
                assert.isTrue(indexesWhereEffectCalled[0], "0");
                assert.isTrue(indexesWhereEffectCalled[1], "1");
                assert.isTrue(indexesWhereEffectCalled[2], "2");
                assert.isTrue(indexesWhereEffectCalled[3], "3");
                assert.isTrue(!indexesWhereEffectCalled[4], "4");
                assert.isTrue(!indexesWhereEffectCalled[5], "5");
                assert.isTrue(indexesWhereEffectCalled[6], "6");
                assert.isTrue(indexesWhereEffectCalled[7], "7");
                done();
            } else {
                indexesWhereEffectCalled[argumentIndex.get()] = true;
                assert.equal(data, values[argumentIndex.get()]);
                if (argumentIndex.get() > 0) {
                    assert.equal(prevData, values[argumentIndex.get()-1]);
                }
            }
        };
        dispose = reactionWithPrev<number>(
            dataFn,
            effectFn
        );
        argumentIndex.set(0);
        argumentIndex.set(1);
        argumentIndex.set(2);
        argumentIndex.set(3);
        argumentIndex.set(4);
        argumentIndex.set(5);
        argumentIndex.set(6);
        argumentIndex.set(7);
        argumentIndex.set(8);
    });

});