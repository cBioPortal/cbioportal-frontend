var _ = require("underscore");

var renderers = require("../../src/js/renderers");
var sorting = require("../../src/js/sorting");

var genomic_oncoprint = require('../../src/js/genomic');

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

// TODO this is dirty.
window.test_for_genomic_data = function(filenames, div_selector_string) {
  // filenames has length 2.
  var genomic_file = filenames[0];
  var additional_file = filenames[1];

  // genomic data
  return d3.json(genomic_file, function(data) {
    // break into rows
    var rows = _.chain(data).groupBy(function(d) { return d.gene; }).values().value();
    var sorted_rows = sorting.sort_rows(rows, sorting.genomic_metric);
    var container = d3.select(div_selector_string).datum(sorted_rows);

    var oncoprint = genomic_oncoprint();

    oncoprint.config(config);

    var rendering_rules = _.map(rows, function(row) {
      // at the cBioPortal OncoPrints always start as just genomic data.
      return renderers.gene_rule;
    });
    oncoprint.rendering_rules(rendering_rules);

    container.call(oncoprint);

    // additional clinical data if it has been specified.
    if (additional_file !== undefined) {
      d3.json(additional_file, function(payload) {
        var gender_data = payload.data;

        gender_data = _.sortBy(gender_data, function(d) {
          // grab the sorted sampleids
          var sampleids = sorted_rows[0].map(function(d) {
            return d.sample_id || d.sample;
          });

          // sort the new gender data based on the previous sorting
          var sampleid_to_array_index = sampleids.reduce(function(curr, next, index) {
            curr[next] = index;
            return curr;
          }, {});

          return sampleid_to_array_index[d.sample_id || d.sample];
        });

        // update the list of renderers
        rendering_rules.unshift(renderers.gender_rule);
        oncoprint.rendering_rules(rendering_rules);

        oncoprint.insert_row(container, gender_data, renderers.gender_rule);

        d3.select('#shuffle-gbm').on('click', function() {
          var sampleids = rows[0].map(function(d) { return d.sample_id || d.sample; });
          var shuffled_sampleids = d3.shuffle(sampleids);
          var sampleid_to_array_index = shuffled_sampleids.reduce(function(curr, next, index) {
            curr[next] = index;
            return curr;
          }, {});
          oncoprint.resort(container, sampleid_to_array_index);
        });
      });
    }
  });
};
