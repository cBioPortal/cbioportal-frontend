var ClusteringWorker = require('worker-loader?inline=true&fallback=false!./workers/clustering-worker.js');

/**
 * Executes the clustering of casesAndEntitites in the requested
 * dimension (CASES or ENTITIES).
 *
 * @param casesAndEntitites: Object with sample(or patient)Id and map
 * of geneticEntity/value pairs. Example:
 *
 * var a =
 *  {
     *    "TCGA-AO-AA98-01":
     *    {
     *    	"TP53": 0.045,
     *    	"BRA1": -0.89
     *    }
     *   },
 *   ...
 *
 * @return a deferred which gets resolved with the clustering result
 *   when the clustering is done.
 */
var _hcluster = function(casesAndEntitites, dimension) {
    var worker = new ClusteringWorker();
    var message = new Object();
    var def = new $.Deferred();
    message.casesAndEntitites = casesAndEntitites;
    message.dimension = dimension;
    worker.postMessage(message);
    worker.onmessage = function(m) {
        def.resolve(m.data);
    }
    return def.promise();
}

/**
 * Use: cbio.stat.hclusterCases(a);

 * @return a deferred which gets resolved with the clustering result
 *   when the clustering is done.
 */
var hclusterColumns = function(casesAndEntitites) {
    return _hcluster(casesAndEntitites, "CASES");
}

/**
 * Use: hclusterGeneticEntities(a);
 *
 * @return a deferred which gets resolved with the clustering result
 *   when the clustering is done.
 */
var hclusterTracks = function(casesAndEntitites) {
    return _hcluster(casesAndEntitites, "ENTITIES");
}

module.exports = {
    hclusterColumns: hclusterColumns,
    hclusterTracks: hclusterTracks
}