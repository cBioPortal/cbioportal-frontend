var utils = require('./utils');

var gene_rule = function(config) {
  return function(selection) {
    var row_elements = selection.selectAll('g')
    // binds the row-wise data to the row group, <g>. See Bostock's
    // explaination on nested selections: http://bost.ocks.org/mike/nest/#data
    .data(function(d) { return d; })
    .enter().append('g');

    row_elements.attr('transform', function(d, i) {
      return utils.translate(i * (config.rect_width + config.rect_padding), 0);
    });

    row_elements.append('rect')
    .attr('fill', function(d) { return config.cna_fills[d.cna]; })
    .attr('height', config.rect_height)
    .attr('width', config.rect_width);

    var one_third_height = config.rect_height / 3;

    var mutation = row_elements.append('rect')
    .attr('y', one_third_height)
    .attr('fill', function(d) {
      // leave the ones without mutations uncolored
      return d.mutation !== undefined ? config.mutation_fill : 'none';
    })
    .attr('height', one_third_height)
    .attr('width', config.rect_width);

    // remove the ones without mutations
    mutation.filter(function(d) {
      return d.mutation === undefined;
    }).remove();
  };
};

exports.gene = gene;
