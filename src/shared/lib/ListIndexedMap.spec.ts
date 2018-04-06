import {assert} from "chai";
import ListIndexedMap from "./ListIndexedMap";

describe("ListIndexedMap", ()=>{
    it ("`get` returns `undefined` if theres no entry", () => {
        const map = new ListIndexedMap<string>();
        assert.equal(map.get([]), undefined);
        assert.equal(map.get(["yo"]), undefined);
        assert.equal(map.get(["whatsup","yo"]), undefined);
        assert.equal(map.get(["hello","there","hi"]), undefined);
    });
    it ("`get` returns the value if there is an entry", () => {
        const map = new ListIndexedMap<string>();
        assert.equal(map.get([]), undefined);
        map.set([], "test");
        assert.equal(map.get([]), "test");
        assert.equal(map.get(["asdf"]), undefined);
        map.set(["asdf"], "blah");
        assert.equal(map.get(["asdf"]), "blah");
        assert.equal(map.get(["yo","whatsup"]), undefined);
        map.set(["yo","whatsup"], "apsoidjfa");
        assert.equal(map.get(["yo","whatsup"]), "apsoidjfa");
        assert.equal(map.get(["whatsup","yo"]), undefined);
        map.set(["whatsup","yo"], "foobar");
        assert.equal(map.get(["whatsup","yo"]), "foobar");
        assert.equal(map.get(["whatsup","yo","bye"]), undefined);
        map.set(["whatsup","yo","bye"], "fubar");
        assert.equal(map.get(["whatsup","yo","bye"]), "fubar");
    });
    it("`get` returns the most recently-set value for a key", () => {
        const map = new ListIndexedMap<string>();
        assert.equal(map.get([]), undefined);
        map.set([], "test");
        assert.equal(map.get([]), "test");
        map.set([], "test2");
        assert.equal(map.get([]), "test2");

        assert.equal(map.get(["yo"]), undefined);
        map.set(["yo"], "test");
        assert.equal(map.get(["yo"]), "test");
        map.set(["yo"], "test2");
        assert.equal(map.get(["yo"]), "test2");

        assert.equal(map.get(["yo","whatsup"]), undefined);
        map.set(["yo","whatsup"], "test");
        assert.equal(map.get(["yo","whatsup"]), "test");
        map.set(["yo","whatsup"], "test2");
        assert.equal(map.get(["yo","whatsup"]), "test2");

        assert.equal(map.get(["whatsup","yo","bye"]), undefined);
        map.set(["whatsup","yo","bye"], "test");
        assert.equal(map.get(["whatsup","yo","bye"]), "test");
        map.set(["whatsup","yo","bye"], "test2");
        assert.equal(map.get(["whatsup","yo","bye"]), "test2");
    });
});