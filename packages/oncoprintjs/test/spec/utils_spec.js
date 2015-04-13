"use strict";
var utils = require('../../src/js/utils.js');

describe("translate function", function() {
  it("does the appropriate string manipulation", function() {
    expect(utils.translate(10,42)).toBe("translate(10,42)");
    expect(utils.translate(-10,42)).toBe("translate(-10,42)");
  });
});

describe("is sample genetically altered", function() {
  it("shows that an empty sample (no data) is not genetically altered", function() {
    expect(utils.is_sample_genetically_altered({})).toBe(false);
  });

  it("shows that a clinical-ish sample is not genetically altered", function() {
    expect(utils.is_sample_genetically_altered({sample_id: "ABC123",
                                                attr_id: "MY_SPECIAL_ATTR",
                                                attr_val: 42})).toBe(false);
  });

  it("shows that a genetically altered sample as altered", function() {
    expect(utils.is_sample_genetically_altered({sample_id: "ABC123",
                                                gene: "TP53",
                                                cna: "AMPLIFIED"})).toBe(true);
  });
});



describe("validate_row_against_rows", function() {
  it("error if lengths don't match", function() {
    (function() {
      // row.length < rows[0].length
      var row = [2, 2];
      var rows = [[3, 3, 3], [3, 3, 3]];
      expect(function() {
        utils.validate_row_against_rows(row, rows);
      }).toThrow("Row lengths don't match: 2 and 3");
    })();

    (function() {
      // row.length > rows[0].length
      var row = [3,3,3];
      var rows = [[2,2], [2,2]];
      expect(function() {
        utils.validate_row_against_rows(row, rows);
      }).toThrow("Row lengths don't match: 3 and 2");
    })();

    (function() {
      // rows is the empty matrix
      var row = [3,3,3];
      var rows = [];
      expect(function() {
        utils.validate_row_against_rows(row, rows);
      }).toThrow("Rows are empty");
    })();

  });

  it("error if samples don't match up exactly", function() {
    (function() {
      var row = [
        {sample_id: "A"},
        {sample_id: "Z"},
        {sample_id: "C"}
      ];

      var rows = [[{sample_id: "A"}, {sample_id: "B"}, {sample_id: "C"}],
                  [{sample_id: "A"}, {sample_id: "B"}, {sample_id: "C"}],
                  [{sample_id: "A"}, {sample_id: "B"}, {sample_id: "C"}]];

      expect(function() {
        utils.validate_row_against_rows(row, rows);
      }).toThrow("Sample ids do not match between new row and given rows.");
    })();

    (function() {
      var row = [
        {sample_id: "A"},
        {sample_id: "B"},
        {sample_id: "C"}
      ];

      var rows = [[{sample_id: "A"}, {sample_id: "Z"}, {sample_id: "C"}],
                  [{sample_id: "A"}, {sample_id: "Z"}, {sample_id: "C"}],
                  [{sample_id: "A"}, {sample_id: "Z"}, {sample_id: "C"}]];

      expect(function() {
        utils.validate_row_against_rows(row, rows);
      }).toThrow("Sample ids do not match between new row and given rows.");
    })();

  });

  it("returns true if all is well", function() {
    (function() {
      var row = [
        {sample_id: "B"},
        {sample_id: "A"}, // order shouldn't matter.
        {sample_id: "C"}
      ];

      var rows = [[{sample_id: "A"}, {sample_id: "B"}, {sample_id: "C"}],
                  [{sample_id: "A"}, {sample_id: "B"}, {sample_id: "C"}],
                  [{sample_id: "A"}, {sample_id: "B"}, {sample_id: "C"}]];

      expect(utils.validate_row_against_rows(row, rows)).toBe(true);
    })();
  });
});
