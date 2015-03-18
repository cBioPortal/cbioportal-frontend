var _ = require('underscore');

var exports = module.exports = {};

function copy_array(array) {
  return array.slice();
}

function rows_to_indexers(rows) {
  return _.range(rows.length)
  .reverse()     // least significant first
  .map(function(ith_row) {
    return function(index) { return rows[ith_row][index]; };
  });
}

exports.genomic_metric = function genomic_metric(x) {
  var cna_order = {AMPLIFIED:4, HOMODELETED:3, GAINED:2, HEMIZYGOUSLYDELETED:1, DIPLOID: 0, undefined: 0};
  var regulated_order = {UPREGULATED: 2, DOWNREGULATED: 1, undefined: 0};
  var mutation_order_f = function(m) {
    // fusion > non-fusion mutations.
    return m === undefined ? 0 : (/fusion($|,)/i.test(m)?2:1);
  };

  // need -1 to flip the order.
  return -1 * (1000 * cna_order[x.cna]
               + 100 * regulated_order[x.mrna]
               + 10 * regulated_order[x.rppa]
               + mutation_order_f(x.mutation));
};

// indexers is least significant first.
exports.radixSort = function radixSort(datums, compare, indexers) {
  var to_return = copy_array(datums);

  indexers.forEach(function(indexer) {
    to_return = _.sortBy(to_return, function(x) {
      return compare(indexer(x));
    });
  });

  return to_return;
};

exports.sort_rows = function sort_rows(rows, metric) {
  var indexers = rows_to_indexers(rows);
  var sorted_column_indices = exports.radixSort(_.range(rows[0].length), metric, indexers);
  return _.map(rows, function(row) {
    return sorted_column_indices.map(function(i) { return row[i]; });
  });
};

//
// BASIC TESTS
//

var indexers = [function(d) { return d[4]; },
                function(d) { return d[3]; },
                function(d) { return d[2]; },
                function(d) { return d[1]; },
                function(d) { return d[0]; }];

// radixSort
exports.radixSort(["hello", "asdfd", "dafds", "aaafa"], function(x,y) { return x < y; }, indexers);
exports.radixSort(["aaaaa", "bbbbb", "aaaaa", "aaaaa"], function(x,y) { return x < y; }, indexers);
exports.radixSort([], function(x,y) { return x < y; }, indexers);
exports.radixSort(["hello", "asdfd", "dafds", "aaafa"], function(x,y) { return x > y; }, indexers);
