import {assert} from "chai";
import ListIndexedMap from "./ListIndexedMap";

describe("ListIndexedMap", ()=>{
    it ("`get` returns `undefined` if theres no entry", () => {
        const map = new ListIndexedMap<string>();
        assert.equal(map.get(), undefined);
        assert.equal(map.get("yo"), undefined);
        assert.equal(map.get("whatsup","yo"), undefined);
        assert.equal(map.get("hello","there","hi"), undefined);
    });
    it ("`get` returns the value if there is an entry", () => {
        const map = new ListIndexedMap<string>();
        assert.equal(map.get(), undefined);
        map.set("test");
        assert.equal(map.get(), "test");
        assert.equal(map.get("asdf"), undefined);
        map.set("blah", "asdf");
        assert.equal(map.get("asdf"), "blah");
        assert.equal(map.get("yo","whatsup"), undefined);
        map.set("apsoidjfa", "yo","whatsup");
        assert.equal(map.get("yo","whatsup"), "apsoidjfa");
        assert.equal(map.get("whatsup","yo"), undefined);
        map.set("foobar", "whatsup","yo");
        assert.equal(map.get("whatsup","yo"), "foobar");
        assert.equal(map.get("whatsup","yo","bye"), undefined);
        map.set("fubar", "whatsup","yo","bye");
        assert.equal(map.get("whatsup","yo","bye"), "fubar");
    });
    it("`get` returns the most recently-set value for a key", () => {
        const map = new ListIndexedMap<string>();
        assert.equal(map.get(), undefined);
        map.set("test");
        assert.equal(map.get(), "test");
        map.set("test2");
        assert.equal(map.get(), "test2");

        assert.equal(map.get("yo"), undefined);
        map.set("test", "yo");
        assert.equal(map.get("yo"), "test");
        map.set("test2", "yo");
        assert.equal(map.get("yo"), "test2");

        assert.equal(map.get("yo","whatsup"), undefined);
        map.set("test", "yo","whatsup");
        assert.equal(map.get("yo","whatsup"), "test");
        map.set("test2", "yo","whatsup");
        assert.equal(map.get("yo","whatsup"), "test2");

        assert.equal(map.get("whatsup","yo","bye"), undefined);
        map.set("test", "whatsup","yo","bye");
        assert.equal(map.get("whatsup","yo","bye"), "test");
        map.set("test2", "whatsup","yo","bye");
        assert.equal(map.get("whatsup","yo","bye"), "test2");
    });
    it("`entries` returns the entries in insertion order", ()=>{
        const map = new ListIndexedMap<string>();
        map.set("test");
        map.set("blah", "asdf");
        map.set("apsoidjfa", "yo","whatsup");
        map.set("foobar", "whatsup","yo");
        map.set("fubar", "whatsup","yo","bye");
        assert.deepEqual(map.entries(), [
            {
                key: [],
                value: "test"
            },
            {
                key:["asdf"],
                value:"blah"
            },
            {
                key: ["yo", "whatsup"],
                value: "apsoidjfa"
            },
            {
                key: ["whatsup", "yo"],
                value: "foobar"
            },
            {
                key: ["whatsup", "yo", "bye"],
                value: "fubar"
            }
        ]);
    });
    it("`has` returns true iff there is a corresponding entry", ()=>{
        const map = new ListIndexedMap<string>();
        assert.isFalse(map.has());
        map.set("test");
        assert.isTrue(map.has());
        map.set("test2");
        assert.isTrue(map.has());

        assert.isFalse(map.has("yo"));
        map.set("test", "yo");
        assert.isTrue(map.has("yo"));
        map.set("test2", "yo");
        assert.isTrue(map.has("yo"));

        assert.isFalse(map.has("yo", "whatsup"));
        map.set("test", "yo","whatsup");
        assert.isTrue(map.has("yo", "whatsup"));
        map.set("test2", "yo","whatsup");
        assert.isTrue(map.has("yo", "whatsup"));

        assert.isFalse(map.has("whatsup","yo","bye"));
        map.set("test", "whatsup","yo","bye");
        assert.isTrue(map.has("whatsup","yo","bye"));
        map.set("test2", "whatsup","yo","bye");
        assert.isTrue(map.has("whatsup","yo","bye"));
    });
});