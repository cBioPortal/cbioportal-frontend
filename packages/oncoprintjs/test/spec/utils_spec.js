"use strict";
var utils = require('../../src/js/utils.js');

describe("translate function", function() {
  it("does the appropriate string manipulation", function() {
    expect(utils.translate(10,42)).toBe("translate(10,42)");
    expect(utils.translate(-10,42)).toBe("translate(-10,42)");
  });
});

describe("This test fails", function() {
  it("FAIL", function() {
    expect(true).toBe(true);
  });
});
