import {assert} from "chai";
import invertIncreasingFunction from "./invertIncreasingFunction";

describe("invertIncreasingFunction", () => {
    it("correctly inverts square", ()=>{
        for (let i=1; i<10; i+= 1) {
            assert.isTrue(Math.abs(invertIncreasingFunction(x=>x*x, i, [0, i]) - Math.sqrt(i)) < 0.001);
        }
    });
});