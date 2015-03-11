var _ = require("underscore");

var genomic_oncoprint = require('../../src/js/genomic');

// TODO this is dirty.
window.test_for_genomic_data = function(filename, div_selector_string) {
  return d3.json(filename, function(data) {

    // break into rows
    rows = _.chain(data).groupBy(function(d) { return d.gene; }).values().value();

    d3.select(div_selector_string).datum(rows);

    var oncoprint = genomic_oncoprint();

    oncoprint.width(750);
    oncoprint.row_height(25);

    d3.select(div_selector_string).call(oncoprint);
  });
};
