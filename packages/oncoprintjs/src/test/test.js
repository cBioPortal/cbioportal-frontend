var Oncoprint = require("../../dist/oncoprint.bundle.js");
var BucketSort = require("../js/bucketsort.js");
var binarySearch = require("../js/binarysearch.js");
var assert = require("chai").assert;

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
                BucketSort.bucketSort([], 3),
                []
            );
        });
        it("case: size 1 vectors", function() {
            assert.deepEqual(
                BucketSort.bucketSort([[3],[1],[2]], 1),
                [[1],[2],[3]]
            );
        });
        it("case: sorting with infinity", function() {
            assert.deepEqual(
                BucketSort.bucketSort([[Number.POSITIVE_INFINITY, 0], [0, 1]], 2),
                [[0,1],[Number.POSITIVE_INFINITY, 0]]
            );
            assert.deepEqual(
                BucketSort.bucketSort([[0, 0], [Number.NEGATIVE_INFINITY, 1]], 2),
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
                ], 4),
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
                ], 4),
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
                ], 4),
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
                ], 4),
                [
                    [0,1,-8,-24],
                    [0,6,11,4],
                    [0,10,-11,5],
                    [0,22,21,8],
                    [0, 23,-17,15]
                ]
            );
        });
        it("case: size 2 vectors with compareEquals on the sample id", function() {
            assert.deepEqual(
                BucketSort.bucketSort([
                        {sample:"D", vector:[13,8]},
                        {sample:"A", vector:[13,10]},
                        {sample:"C", vector:[12,10]}
                ], 2, function(d) { return d.vector; }, function(d1, d2) { return d1.sample.localeCompare(d2.sample); }),
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
                ], 2, function(d) { return d.vector; }, function(d1, d2) { return d1.sample.localeCompare(d2.sample); }),
                [
                    {sample:"C", vector:[12,10]},
                    {sample:"A", vector:[13,10]},
                    {sample:"D", vector:[13,10]}
                ]
            );
        });
        it("case: randomized tests", function() {
            function randInt(magnitude) {
                var ret = Math.round(Math.random()*magnitude - Math.random()*magnitude);
                if (ret === 0) {
                    // to deal w issues w negative zero
                    ret = 0;
                }
                return ret;
            }

            function generateVector(size) {
                var ret = [];
                for (var i=0; i<size; i++) {
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
                var sorted = BucketSort.bucketSort(vectors, size);
                vectors.sort(BucketSort.compare); // sort using equivalent comparator - resultant order should be same
                assert.deepEqual(sorted, vectors, "randomized test: vector size "+size);
            }
        });
        it("case: randomized tests, with compareEquals", function() {
            function randInt(magnitude) {
                var ret = Math.round(Math.random()*magnitude - Math.random()*magnitude);
                if (ret === 0) {
                    // to deal w issues w negative zero
                    ret = 0;
                }
                return ret;
            }

            function generateVector(size) {
                var ret = [];
                for (var i=0; i<size; i++) {
                    ret.push(randInt(3));
                }
                return ret;
            }

            var data;
            var names;
            var vector;
            var name;

            var getVector = function(d) { return d.vector; };
            var compareEquals = function(d1, d2) {return d1.name.localeCompare(d2.name);};

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
                var sorted = BucketSort.bucketSort(data, size, getVector, compareEquals);
                data.sort(function(d1, d2) { return BucketSort.compareFull(d1, d2, getVector, compareEquals); })// sort using equivalent comparator - resultant order should be same
                assert.deepEqual(sorted, data, "randomized test: vector size "+size);
            }
        });
    });
    describe("__bucketSortHelper", function() {
        it("case: size 1 vector", function() {
            assert.deepEqual(
                BucketSort.__bucketSortHelper(
                    [[3],[1],[2]], 1, function(x) { return x; }, 0, 3, 0
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
