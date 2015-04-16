var _ = require("underscore");

var OncoPrint = require('../../src/js/main');
var renderers = require("../../src/js/renderers");
var utils = require("../../src/js/utils");

var config = { rect_height: 20,
              rect_padding: 3,
              rect_width: 10,
              row_height: 25,
              mutation_fill: 'green',
              width: 750,
              cna_fills: {
              null: 'grey',
              undefined: 'grey',
              AMPLIFIED: 'red',
              HOMODELETED: 'blue'
             }
};

module.exports = function test_script(filenames, div_selector_string) {
  // filenames has length 2.
  var genomic_file = filenames[0];
  var additional_file = filenames[1];

  // genomic data
  return d3.json(genomic_file, function(data) {
    var oncoprint = OncoPrint();
    oncoprint(div_selector_string, data);

    // additional clinical data if it has been specified.
    var is_inserted = false;
    // TODO is_inserted is a hack. At some point,
    // should add a remove row function too and test these together.
    if (additional_file !== undefined) {
      d3.json(additional_file, function(payload) {
          d3.select("#insert-gender-data-gbm").on('click', function() {
            if (!is_inserted) {
              oncoprint.insert_row(div_selector_string, payload.data, renderers.gender_rule);
              is_inserted = true;
            }
          });
      });
    }

    // shuffle order button
    if (genomic_file.indexOf("gbm") !== -1)
      d3.select('#shuffle-gbm').on('click', function() {
        // get and shuffle order
        var container = d3.select(div_selector_string);
        var sampleids = container.datum()[0].map(function(d) { return d.sample_id || d.sample; });
        var shuffled_sampleids = d3.shuffle(sampleids);

        var sampleid_to_array_index = utils.invert_array(shuffled_sampleids);
        oncoprint.resort(div_selector_string, sampleid_to_array_index);
      });

  });
};
