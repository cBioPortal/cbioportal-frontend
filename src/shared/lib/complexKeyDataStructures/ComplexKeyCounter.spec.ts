import {assert} from "chai";
import ComplexKeyCounter from "./ComplexKeyCounter";

describe("ComplexKeyCounter", () => {
    it("nonexisting keys start at 0", ()=>{
        const counter = new ComplexKeyCounter();
        assert.equal(counter.get({ k:"aaidsopjfap"}), 0);
        assert.equal(counter.get({ "kjaspdoijfp134u13!@@#$!$$":"sdf0913"}), 0);
    });
    it("after incrementing, the value with `get` changes appropriately", ()=>{
        const counter = new ComplexKeyCounter();
        assert.equal(counter.get({ k:"aaidsopjfap"}), 0);
        assert.equal(counter.get({ "kjaspdoijfp134u13!@@#$!$$":"sdf0913"}), 0);
        counter.increment({ k:"aaidsopjfap"});
        counter.increment({ k:"aaidsopjfap"});
        counter.increment({ k:"aaidsopjfap"});
        counter.increment({ k:"aaidsopjfap"});
        counter.increment({ k:"aaidsopjfap"});
        counter.increment({ "kjaspdoijfp134u13!@@#$!$$":"sdf0913"});
        counter.increment({ "kjaspdoijfp134u13!@@#$!$$":"sdf0913"});
        assert.equal(counter.get({ k:"aaidsopjfap"}), 5);
        assert.equal(counter.get({ "kjaspdoijfp134u13!@@#$!$$":"sdf0913"}), 2);
    });
    it("after clearing, all keys are back to 0", ()=>{
        const counter = new ComplexKeyCounter();
        counter.increment({ k:"aaidsopjfap"});
        counter.increment({ k:"aaidsopjfap"});
        counter.increment({ k:"aaidsopjfap"});
        counter.increment({ k:"aaidsopjfap"});
        counter.increment({ k:"aaidsopjfap"});
        counter.increment({ "kjaspdoijfp134u13!@@#$!$$":"sdf0913"});
        counter.increment({ "kjaspdoijfp134u13!@@#$!$$":"sdf0913"});
        assert.equal(counter.get({ k:"aaidsopjfap"}), 5);
        assert.equal(counter.get({ "kjaspdoijfp134u13!@@#$!$$":"sdf0913"}), 2);
        counter.clear();
        assert.equal(counter.get({ k:"aaidsopjfap"}), 0);
        assert.equal(counter.get({ "kjaspdoijfp134u13!@@#$!$$":"sdf0913"}), 0);
    });
});