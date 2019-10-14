import Oncoprint from "../js/oncoprint";
import * as BucketSort from "../js/bucketsort";
import binarySearch from "../js/binarysearch";
import {assert} from "chai";
import {doesCellIntersectPixel} from "../js/utils";

describe("test", function() {
    it("should have oncoprint object", function() {
        assert.isDefined(Oncoprint);
    });
});

describe("binarySearch", function() {
    it("case: empty input", function() {
        assert.equal(binarySearch([], 0, function(x) { return x; }, true), -1);
    });

    it("case: key not found, return closest option false", function() {
        assert.equal(binarySearch([0,1,2], 1.5, function(x) { return x; }, false), -1);
    });

    it("case: key not found, return closest option true - should give the nearest smaller index", function() {
        assert.equal(binarySearch([0,1,2], -0.5, function(x) { return x; }, true), 0);
        assert.equal(binarySearch([0,1,2], 0.5, function(x) { return x; }, true), 0);
        assert.equal(binarySearch([0,1,2], 1.5, function(x) { return x; }, true), 1);
        assert.equal(binarySearch([0,1,2], 2.5, function(x) { return x; }, true), 2);
        assert.equal(binarySearch([0,1,2], 3.5, function(x) { return x; }, true), 2);

        assert.equal(binarySearch([0,1,2,3,4,5,6,7], -1.5, function(x) { return x; }, true), 0);
        assert.equal(binarySearch([0,1,2,3,4,5,6,7], -0.5, function(x) { return x; }, true), 0);
        assert.equal(binarySearch([0,1,2,3,4,5,6,7], 0.5, function(x) { return x; }, true), 0);
        assert.equal(binarySearch([0,1,2,3,4,5,6,7], 1.5, function(x) { return x; }, true), 1);
        assert.equal(binarySearch([0,1,2,3,4,5,6,7], 2.5, function(x) { return x; }, true), 2);
        assert.equal(binarySearch([0,1,2,3,4,5,6,7], 3.5, function(x) { return x; }, true), 3);
        assert.equal(binarySearch([0,1,2,3,4,5,6,7], 4.5, function(x) { return x; }, true), 4);
        assert.equal(binarySearch([0,1,2,3,4,5,6,7], 5.5, function(x) { return x; }, true), 5);
        assert.equal(binarySearch([0,1,2,3,4,5,6,7], 6.5, function(x) { return x; }, true), 6);
        assert.equal(binarySearch([0,1,2,3,4,5,6,7], 7.5, function(x) { return x; }, true), 7);
        assert.equal(binarySearch([0,1,2,3,4,5,6,7], 8.5, function(x) { return x; }, true), 7);
    });

    it("case: key found", function() {
        assert.equal(binarySearch([0,1,2], 0, function(x) { return x*x; }, true), 0);
        assert.equal(binarySearch([0,1,2], 1, function(x) { return x*x; }, true), 1);
        assert.equal(binarySearch([0,1,2], 4, function(x) { return x*x; }, true), 2);

        assert.equal(binarySearch([0,1,2,3,4,5,6,7], 0, function(x) { return x*x; }, true), 0);
        assert.equal(binarySearch([0,1,2,3,4,5,6,7], 1, function(x) { return x*x; }, true), 1);
        assert.equal(binarySearch([0,1,2,3,4,5,6,7], 4, function(x) { return x*x; }, true), 2);
        assert.equal(binarySearch([0,1,2,3,4,5,6,7], 9, function(x) { return x*x; }, true), 3);
        assert.equal(binarySearch([0,1,2,3,4,5,6,7], 16, function(x) { return x*x; }, true), 4);
        assert.equal(binarySearch([0,1,2,3,4,5,6,7], 25, function(x) { return x*x; }, true), 5);
        assert.equal(binarySearch([0,1,2,3,4,5,6,7], 36, function(x) { return x*x; }, true), 6);
        assert.equal(binarySearch([0,1,2,3,4,5,6,7], 49, function(x) { return x*x; }, true), 7);
    });
});

describe("bucketSort", function() {
    describe("bucketSort", function() {
        it("case: empty input", function() {
            assert.deepEqual(
                BucketSort.bucketSort([]),
                []
            );
        });
        it("case: size 1 vectors", function() {
            assert.deepEqual(
                BucketSort.bucketSort([[3],[1],[2]]),
                [[1],[2],[3]]
            );
        });
        it("case: sorting with infinity", function() {
            assert.deepEqual(
                BucketSort.bucketSort([[Number.POSITIVE_INFINITY, 0], [0, 1]]),
                [[0,1],[Number.POSITIVE_INFINITY, 0]]
            );
            assert.deepEqual(
                BucketSort.bucketSort([[0, 0], [Number.NEGATIVE_INFINITY, 1]]),
                [[Number.NEGATIVE_INFINITY,1],[0, 0]]
            );
        });
        it("case: simple size 4 vectors", function() {
            assert.deepEqual(
                BucketSort.bucketSort([
                    [3,3,3,3],
                    [0,0,0,0],
                    [2,2,2,2],
                    [1,1,1,1]
                ]),
                [
                    [0,0,0,0],
                    [1,1,1,1],
                    [2,2,2,2],
                    [3,3,3,3]
                ]
            );
        });
        it("case: general size 4 vectors", function() {
            assert.deepEqual(
                BucketSort.bucketSort([
                    [13,10,-11,5],
                    [-8,1,-8,-24],
                    [-12, 23,-17,15],
                    [-21,6,11,4],
                    [12,22,21,8]
                ]),
                [
                    [-21,6,11,4],
                    [-12, 23,-17,15],
                    [-8,1,-8,-24],
                    [12,22,21,8],
                    [13,10,-11,5]
                ]
            );

            assert.deepEqual(
                BucketSort.bucketSort([
                    [13,10,-11,5],
                    [13,1,-8,-24],
                    [-12, 23,-17,15],
                    [-12,6,11,4],
                    [12,22,21,8]
                ]),
                [
                    [-12,6,11,4],
                    [-12, 23,-17,15],
                    [12,22,21,8],
                    [13,1,-8,-24],
                    [13,10,-11,5]
                ]
            );
            assert.deepEqual(
                BucketSort.bucketSort([
                    [0,10,-11,5],
                    [0,1,-8,-24],
                    [0, 23,-17,15],
                    [0,6,11,4],
                    [0,22,21,8]
                ]),
                [
                    [0,1,-8,-24],
                    [0,6,11,4],
                    [0,10,-11,5],
                    [0,22,21,8],
                    [0, 23,-17,15]
                ]
            );
            assert.deepEqual(
                BucketSort.bucketSort([
                    [0,10,-11,5],
                    [0,10],
                    [0],
                    [0,10,-11]
                ]),
                [
                    [0],
                    [0,10],
                    [0,10,-11],
                    [0,10,-11,5]
                ]
            );
        });
        it("case: size 2 vectors with compareEquals on the sample id", function() {
            assert.deepEqual(
                BucketSort.bucketSort([
                        {sample:"D", vector:[13,8]},
                        {sample:"A", vector:[13,10]},
                        {sample:"C", vector:[12,10]}
                ], function(d) { return d.vector; }, function(d1, d2) { return d1.sample.localeCompare(d2.sample); }),
                [
                    {sample:"C", vector:[12,10]},
                    {sample:"D", vector:[13,8]},
                    {sample:"A", vector:[13,10]}
                ]
            );

            assert.deepEqual(
                BucketSort.bucketSort([
                    {sample:"D", vector:[13,10]},
                    {sample:"A", vector:[13,10]},
                    {sample:"C", vector:[12,10]}
                ], function(d) { return d.vector; }, function(d1, d2) { return d1.sample.localeCompare(d2.sample); }),
                [
                    {sample:"C", vector:[12,10]},
                    {sample:"A", vector:[13,10]},
                    {sample:"D", vector:[13,10]}
                ]
            );
        });
        it("case: randomized tests", function() {
            function randInt(magnitude:number) {
                var ret = Math.round(Math.random()*magnitude - Math.random()*magnitude);
                if (ret === 0) {
                    // to deal w issues w negative zero
                    ret = 0;
                }
                return ret;
            }

            function generateVector(size:number) {
                var ret = [];
                var vectorSize = size+Math.round(Math.random()*4);
                for (var i=0; i<vectorSize; i++) {
                    ret.push(randInt(3));
                }
                return ret;
            }

            var vectors;

            for (var size=0; size<20; size++) {
                vectors = [];
                for (var i=0; i<100; i++) {
                    vectors.push(generateVector(size));
                }
                var sorted = BucketSort.bucketSort(vectors);
                vectors.sort(BucketSort.compare); // sort using equivalent comparator - resultant order should be same
                assert.deepEqual(sorted, vectors, "randomized test: vector size "+size);
            }
        });
        it("case: randomized tests, with compareEquals", function() {
            function randInt(magnitude:number) {
                var ret = Math.round(Math.random()*magnitude - Math.random()*magnitude);
                if (ret === 0) {
                    // to deal w issues w negative zero
                    ret = 0;
                }
                return ret;
            }

            function generateVector(size:number) {
                var ret = [];
                var vectorSize = size+Math.round(Math.random()*4);
                for (var i=0; i<vectorSize; i++) {
                    ret.push(randInt(3));
                }
                return ret;
            }

            var data;
            var names;
            var vector;
            var name;

            var getVector = function(d:any) { return d.vector; };
            var compareEquals = function(d1:any, d2:any) {return d1.name.localeCompare(d2.name);};

            for (var size=0; size<20; size++) {
                names = [];
                for (var i=0; i<100; i++) {
                    names.push("TCGA-"+(i<10 ? "0" : "")+(i<100 ? "0" : "") + i);
                }
                data = [];
                for (var i=0; i<100; i++) {
                    vector = generateVector(size);
                    name = names.splice(Math.floor(Math.random()*names.length), 1)[0];
                    data.push({name:name, vector:vector});
                }
                var sorted = BucketSort.bucketSort(data, getVector, compareEquals);
                data.sort(function(d1, d2) { return BucketSort.compareFull(d1, d2, getVector, compareEquals); })// sort using equivalent comparator - resultant order should be same
                assert.deepEqual(sorted, data, "randomized test: vector size "+size);
            }
        });
        it("case: randomized tests, with strings", function() {
            var names:string[] = [];
            for (var i=0; i<100; i++) {
                names.push("TCGA-"+(i<10 ? "0" : "")+(i<100 ? "0" : "") + i);
            }

            function randInt(magnitude:number) {
                var ret = Math.round(Math.random()*magnitude - Math.random()*magnitude);
                if (ret === 0) {
                    // to deal w issues w negative zero
                    ret = 0;
                }
                return ret;
            }

            function generateVector(size:number) {
                var ret = [];
                var vectorSize = size+Math.round(Math.random()*4);
                for (var i=0; i<vectorSize; i++) {
                    if (i % 2) {
                        ret.push(randInt(3));
                    } else {
                        ret.push(Math.random() < 0.5 ? names[Math.floor(Math.random()*names.length)] : "");
                    }
                }
                return ret;
            }

            var vectors;

            for (var size=0; size<20; size++) {
                vectors = [];
                for (var i=0; i<100; i++) {
                    vectors.push(generateVector(size));
                }
                var sorted = BucketSort.bucketSort(vectors);
                vectors.sort(BucketSort.compare); // sort using equivalent comparator - resultant order should be same
                assert.deepEqual(sorted, vectors, "randomized test: vector size "+size);
            }
        });
    });
    describe("stringToVector", function() {
        it("creates the right vectors", function() {
            assert.deepEqual(
                BucketSort.stringToVector(""), []
            );
            assert.deepEqual(
                BucketSort.stringToVector("a"), [97]
            );
            assert.deepEqual(
                BucketSort.stringToVector("abc"), [97, 98, 99]
            );
            assert.deepEqual(
                BucketSort.stringToVector("abc123abc456c"), [97, 98, 99, 123, 97, 98, 99, 456, 99]
            );
            assert.deepEqual(
                BucketSort.stringToVector("abc123abc456"), [97, 98, 99, 123, 97, 98, 99, 456]
            );
            assert.deepEqual(
                BucketSort.stringToVector("000"), [0]
            );
            assert.deepEqual(
                BucketSort.stringToVector("1"), [1]
            );
        });
    });
    describe("stringSort", function() {
        it("sorts a list in right order", function(){
            assert.deepEqual(BucketSort.stringSort([
                "A20",
                "P20",
                "P04",
                "P2",
                "P13",
                "ABCDE"
            ]),[
                "A20",
                "ABCDE",
                "P2",
                "P04",
                "P13",
                "P20"
            ]);
        })
        it("sorts four tcga ids in right order", function() {
            assert.deepEqual(BucketSort.stringSort(
                ["TCGA-AA-A01I", "TCGA-AG-3599", "TCGA-AG-3605", "TCGA-AA-3556"]),
                ["TCGA-AA-A01I", "TCGA-AA-3556", "TCGA-AG-3599", "TCGA-AG-3605"]
            );
        });
        it("sorts a list of tcga ids in right order", function() {
            assert.deepEqual(BucketSort.stringSort(["TCGA-AG-3605","TCGA-AA-3680","TCGA-AA-3520","TCGA-AA-3854","TCGA-AA-3818","TCGA-AG-3575","TCGA-AA-3522","TCGA-AA-3814","TCGA-AA-3986","TCGA-AA-3696","TCGA-AA-A00Q","TCGA-AA-A00K","TCGA-AA-3561","TCGA-AF-2692","TCGA-AG-3901","TCGA-AA-3556","TCGA-AG-3580","TCGA-AA-3695","TCGA-AA-3930","TCGA-AG-3902","TCGA-AG-3727","TCGA-AA-A029","TCGA-A6-2683","TCGA-AG-3599","TCGA-AA-A01K","TCGA-AG-3878","TCGA-AA-3994","TCGA-AA-3979","TCGA-AG-3887","TCGA-AA-A01G","TCGA-AA-3560","TCGA-AA-3842","TCGA-AA-3837","TCGA-AG-3586","TCGA-AA-A01F","TCGA-AA-3870","TCGA-AA-3521","TCGA-AA-3673","TCGA-AA-A01I","TCGA-AF-2689","TCGA-AA-A02W","TCGA-AA-3681","TCGA-AG-3896","TCGA-AA-3851","TCGA-AA-3548","TCGA-AA-3852","TCGA-AA-3530","TCGA-AA-3939","TCGA-AG-3594","TCGA-AG-3909","TCGA-AA-3532","TCGA-AG-3581","TCGA-AG-3726","TCGA-AG-3611","TCGA-AA-3848","TCGA-AG-3583","TCGA-AG-3602"]),
                [
                    "TCGA-A6-2683",
                    "TCGA-AA-A00K",
                    "TCGA-AA-A00Q",
                    "TCGA-AA-A01F",
                    "TCGA-AA-A01G",
                    "TCGA-AA-A01I",
                    "TCGA-AA-A01K",
                    "TCGA-AA-A02W",
                    "TCGA-AA-A029",
                    "TCGA-AA-3520",
                    "TCGA-AA-3521",
                    "TCGA-AA-3522",
                    "TCGA-AA-3530",
                    "TCGA-AA-3532",
                    "TCGA-AA-3548",
                    "TCGA-AA-3556",
                    "TCGA-AA-3560",
                    "TCGA-AA-3561",
                    "TCGA-AA-3673",
                    "TCGA-AA-3680",
                    "TCGA-AA-3681",
                    "TCGA-AA-3695",
                    "TCGA-AA-3696",
                    "TCGA-AA-3814",
                    "TCGA-AA-3818",
                    "TCGA-AA-3837",
                    "TCGA-AA-3842",
                    "TCGA-AA-3848",
                    "TCGA-AA-3851",
                    "TCGA-AA-3852",
                    "TCGA-AA-3854",
                    "TCGA-AA-3870",
                    "TCGA-AA-3930",
                    "TCGA-AA-3939",
                    "TCGA-AA-3979",
                    "TCGA-AA-3986",
                    "TCGA-AA-3994",
                    "TCGA-AF-2689",
                    "TCGA-AF-2692",
                    "TCGA-AG-3575",
                    "TCGA-AG-3580",
                    "TCGA-AG-3581",
                    "TCGA-AG-3583",
                    "TCGA-AG-3586",
                    "TCGA-AG-3594",
                    "TCGA-AG-3599",
                    "TCGA-AG-3602",
                    "TCGA-AG-3605",
                    "TCGA-AG-3611",
                    "TCGA-AG-3726",
                    "TCGA-AG-3727",
                    "TCGA-AG-3878",
                    "TCGA-AG-3887",
                    "TCGA-AG-3896",
                    "TCGA-AG-3901",
                    "TCGA-AG-3902",
                    "TCGA-AG-3909"
                ]);
        });
    });
    describe("__bucketSortHelper", function() {
        it("case: size 1 vector", function() {
            assert.deepEqual(
                BucketSort.bucketSortHelper(
                    [[3],[1],[2]], function(x) { return x; }, 0, 3, 0, false
                ),
                {
                    sorted_array: [[1],[2],[3]],
                    bucket_ranges:[{lower_index_incl:0, upper_index_excl: 1},{lower_index_incl:1, upper_index_excl: 2},
                        {lower_index_incl:2, upper_index_excl: 3}]
                }
            );
        });
    });
});

describe("doesCellIntersectPixel", function() {
    it("returns false in case of no intersection on the left", function() {
        assert.isFalse(doesCellIntersectPixel([0,1], 2));
    });
    it("returns true in case of half intersection from the left", function() {
        assert.isTrue(doesCellIntersectPixel([0,2.5], 2));
    });
    it("returns true in case of inclusion inside pixel", function() {
        assert.isTrue(doesCellIntersectPixel([2,2.5], 2));
    });
    it("returns true in case of half intersection from the right", function() {
        assert.isTrue(doesCellIntersectPixel([2.5,6], 2));
    });
    it("returns false in case of no intersection on the right", function() {
        assert.isFalse(doesCellIntersectPixel([3,4], 2));
        assert.isFalse(doesCellIntersectPixel([4,6], 2));
    });
});
