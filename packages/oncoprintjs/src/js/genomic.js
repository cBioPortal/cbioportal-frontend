var d3 = require('d3');
var _ = require('underscore');

var renderers = require('./renderers');
var rendering_engine = require('./rendering_engine');
var utils = require('./utils');

var rendering_engine = rendering_engine();

var config = { rect_height: 20,
              rect_padding: 3,
              rect_width: 10,
              mutation_fill: 'green',

              cna_fills: {
              null: 'grey',
              undefined: 'grey',
              AMPLIFIED: 'red',
              HOMODELETED: 'blue'
             }
};

var gene_renderer = renderers.gene(config);

function is_sample_genetically_altered(datum) {
  return datum.cna !== undefined
    || datum.mutation !== undefined
    || datum.rna !== undefined
    || datum.protein !== undefined;
};

function calculate_row_label(row) {
  var percent_altered = _.filter(row, is_sample_genetically_altered).length / row.length;
  percent_altered = Math.round(percent_altered*100);
  return [{align: 'left', text: row[0].gene}, {align: 'right', text: percent_altered + "%"}];
};

function rows_to_labels(rows) {
  return _.flatten(_.map(rows, calculate_row_label));
}

var genomic = function() {
  var row_height = 25;
  var width = 500;

  var me = function(container) {
    rendering_engine.config({row_height: row_height});
    rendering_engine.container_width(width);
    rendering_engine.element_width(config.rect_width);
    rendering_engine.element_padding(config.rect_padding);
    rendering_engine.labels(rows_to_labels(rows));
    container.call(rendering_engine);
  };

  me.row_height = function(value) {
    if (!arguments.length) return row_height;
    row_height = value;
    return me;
  };

  me.width = function(value) {
    if (!arguments.length) return width;
    width = value;
    return me;
  };

  return me;
};

module.exports = genomic;
