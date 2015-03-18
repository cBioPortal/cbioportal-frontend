"use strict";

var sorting = require('../../src/js/sorting.js');

var indexers = [function(d) { return d[4]; },
                function(d) { return d[3]; },
                function(d) { return d[2]; },
                function(d) { return d[1]; },
                function(d) { return d[0]; }];

describe("radix sorting", function() {
  it("sorts an empty list (guess what, it's already sorted...)", function() {
    expect(sorting.radix_sort([], function(x) { return x; }, indexers).length).toEqual([].length);
  });

  it("sorts some strings of equal length", function() {
    expect(sorting.radix_sort(["hello", "asdfd", "dafds", "aaafa"],
                         function(x) { return x; }, indexers))
    .toEqual(["aaafa", "asdfd", "dafds", "hello"]);

    expect(sorting.radix_sort(["aaaaa", "bbbbb", "aaaaa", "aaaaa"],
                         function(x) { return x; }, indexers))
    .toEqual(["aaaaa", "aaaaa", "aaaaa", "bbbbb"]);
  });

  it("sorts strings backwards when the indicator function is negative", function() {
    expect(sorting.radix_sort(["hello", "asdfd", "dafds", "aaafa"],
                  function(x) { return -1 * x.charCodeAt(0); }, indexers))
    .toEqual(["hello", "dafds", "asdfd", "aaafa"]);
  });
});
