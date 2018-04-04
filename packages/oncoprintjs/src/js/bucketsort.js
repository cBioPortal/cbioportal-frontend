function bucketSort(array, vector_length, getVector, compareEquals) {
    // array: an array of data
    // vector_length: the length of vectors coming out of getVector (must be uniform)
    // getVector: a function that takes an element of array and returns an int vector. defaults to identity
    // compareEquals: an optional standard sort comparator - if specified it is run on the
    //               results of the final buckets before returning
    getVector = getVector || function(d) { return d; };

  var current_sorted_array = array;
  var current_bucket_ranges = [{lower_index_incl: 0, upper_index_excl: array.length}];

  var new_sorted_array, new_bucket_ranges, bucket_range, sorted_result;

  for (var vector_index=0; vector_index<vector_length; vector_index++) {
    new_sorted_array = [];
    new_bucket_ranges = [];
    // sort each bucket range, and collect sorted array and new bucket ranges
    for (var j=0; j<current_bucket_ranges.length; j++) {
      bucket_range = current_bucket_ranges[j];
      sorted_result = bucketSortHelper(
          current_sorted_array,
          vector_length,
          getVector,
          bucket_range.lower_index_incl,
          bucket_range.upper_index_excl,
          vector_index
      );
      new_sorted_array = new_sorted_array.concat(sorted_result.sorted_array);
      new_bucket_ranges = new_bucket_ranges.concat(sorted_result.bucket_ranges);
    }
    current_sorted_array = new_sorted_array;
    current_bucket_ranges = new_bucket_ranges;
  }
  // if compareEquals specified, sort remaining buckets with it
    if (compareEquals) {
      new_sorted_array = [];
      var bucket_elts;
      for (var j=0; j<current_bucket_ranges.length; j++) {
          bucket_range = current_bucket_ranges[j];
          bucket_elts = current_sorted_array.slice(bucket_range.lower_index_incl, bucket_range.upper_index_excl);
          bucket_elts.sort(compareEquals);
          new_sorted_array = new_sorted_array.concat(bucket_elts);
      }
      current_sorted_array = new_sorted_array;
    }
  return current_sorted_array;
};

function compareFull(d1, d2, getVector, compareEquals) {
    // utility function - comparator that describes sort order given by bucketSort
    var ret = compare(getVector(d1), getVector(d2));
    if (ret === 0 && compareEquals) {
        ret = compareEquals(d1, d2);
    }
    return ret;
}

function compare(vector1, vector2) {
    // utility function - comparator that describes vector sort order given by bucketSort
    if (vector1.length !== vector2.length)
        throw new Error("oncoprintjs:bucketsort:compare vector1.length != vector2.length");

    var ret = 0;
    // go left to right, return result of first difference
    for (var i=0; i<vector1.length; i++) {
        if (vector1[i] < vector2[i]) {
            ret = -1;
            break;
        } else if (vector1[i] > vector2[i]) {
            ret = 1;
            break;
        }
    }
    return ret;
}

function bucketSortHelper(array, vector_length, getVector, sort_range_lower_index_incl, sort_range_upper_index_excl, vector_index) {
    // returns { sorted_array: d[], bucket_ranges:{lower_index_incl, upper_index_excl}[]}} },
    //      where sorted_array only contains elements from the specified range of
    //      array[sort_range_lower_index_incl:sort_range_upper_index_excl]

    // stop if empty sort range, or end of vector
    if (!array.length || sort_range_lower_index_incl >= sort_range_upper_index_excl) {
        return {
            sorted_array: [],
            bucket_ranges: []
        }
    }
    if (vector_index >= vector_length) {
        return {
            sorted_array:array.slice(sort_range_lower_index_incl, sort_range_upper_index_excl),
            bucket_ranges:[{lower_index_incl: sort_range_lower_index_incl, upper_index_excl: sort_range_upper_index_excl}]
        }
    }

    // courtesy check that vectors are right size - by this point we know array not empty
    var firstVector = getVector(array[0]);
    if (firstVector.length !== vector_length) {
        throw new Error("oncoprintjs:bucketsort:bucketSortHelper getVector result length is unexpected: "+
                "Expected "+vector_length+" but got "+firstVector.length);
    }
    // otherwise, bucket sort the specified range
    // gather elements into buckets
    var buckets = {};
    for (var i=sort_range_lower_index_incl; i<sort_range_upper_index_excl; i++) {
      var key = getVector(array[i])[vector_index];
      buckets[key] = buckets[key] || [];
      buckets[key].push(array[i]);
    }
    // reduce in sorted order
    var keys = Object.keys(buckets).map(function(key) {
        return parseFloat(key);
    });
    keys.sort(function(k1, k2) { return k1 < k2 ? -1 : (k1 > k2 ? 1 : 0); });

    var sorted_array = [];
    var bucket_ranges = [];
    for (var i=0; i<keys.length; i++) {
      var bucket = buckets[keys[i]];
      var lower_index_incl = sort_range_lower_index_incl + sorted_array.length;
      var upper_index_excl = lower_index_incl + bucket.length;
      bucket_ranges.push({lower_index_incl: lower_index_incl, upper_index_excl: upper_index_excl});
      sorted_array = sorted_array.concat(bucket);
    }

    return { sorted_array: sorted_array, bucket_ranges: bucket_ranges };
}

module.exports = {
  bucketSort: bucketSort,
    compare: compare,
    compareFull: compareFull,
  __bucketSortHelper: bucketSortHelper
};
