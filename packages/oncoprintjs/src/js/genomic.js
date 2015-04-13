var d3 = require('d3');
var _ = require('underscore');

var renderers = require('./renderers');
var rendering_engine = require('./rendering_engine');
var utils = require('./utils');

var rendering_engine = rendering_engine();

module.exports = function genomic() {
  var config = {};
  var rendering_rules = [];

  var me = function(container) {
    rendering_engine.config(config);
    rendering_engine.container_width(config.width);
    rendering_engine.element_width(config.rect_width);
    rendering_engine.element_padding(config.rect_padding);
    rendering_engine.label_function(rows_to_labels);
    rendering_engine.renderers(rendering_rules);
    container.call(rendering_engine);
  };

  me.config = function(value) {
    if (!arguments.length) return config;
    config = value;
    return me;
  };

  // expose this function
  me.insert_row = rendering_engine.insert_row;

  me.rendering_rules = function(value) {
    if (!arguments.length) return rendering_rules;
    rendering_rules = value;
    return me;
  };

  me.resort = function(container, sample_id_to_array_index) {
    var row_groups = container.selectAll('.oncoprint-row');
    row_groups = row_groups[0].map(d3.select);
    utils.assert(row_groups.length === rendering_rules.length,
                 "Rows don't matchup with rendering rules.");
    row_groups = row_groups.reverse();

    _.each(_.zip(row_groups, rendering_rules), function(row_group_and_rr) {
      var row_group = row_group_and_rr[0];
      var rr = row_group_and_rr[1];
      rr(config).resort(row_group, sample_id_to_array_index);
    });
  };

  return me;
};

//
// HELPER FUNCTIONS
//

function calculate_row_label(row) {
  var percent_altered = _.filter(row, utils.is_sample_genetically_altered).length / row.length;
  percent_altered = Math.round(percent_altered*100);
  return [{align: 'left', text: row[0].gene}, {align: 'right', text: percent_altered + "%"}];
}

function rows_to_labels(rows) {
  return _.flatten(_.map(rows, calculate_row_label));
}
