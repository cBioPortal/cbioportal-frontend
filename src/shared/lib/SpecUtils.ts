import {default as chai, expect} from "chai";
import deepEqualInAnyOrder from "deep-equal-in-any-order";
chai.use(deepEqualInAnyOrder);

export function assertDeepEqualInAnyOrder(actual:any, expected:any, message?:string) {
    (expect(actual).to.deep as any).equalInAnyOrder(expected, message);
}