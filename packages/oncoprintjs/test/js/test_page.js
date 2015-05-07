var _ = require("underscore");
var $ = require('jquery');

var Oncoprint  = require('../../src/js/Oncoprint');
var onc = new Oncoprint('#onc');
$('#shuffle_btn').click(function() {
  onc.sortOnTrack('gender', function(d1, d2) {
    var map = {'MALE':0, 'FEMALE':1};
    return map[d1.attr_val] - map[d2.attr_val];
  });
})
$('#padding_btn').click(function(){
  onc.setCellPadding(onc.config.cell_padding+1);
});
$('#width_btn').click(function(){
  onc.setCellWidth(onc.config.cell_width+1);
});
$('#move_btn').click(function(){
  var newPos = Math.floor(Math.random()*5);
  onc.moveTrack('gender', newPos);
    console.log('moving gender to '+newPos);
});
$('#remove_btn').click(function(){
  onc.removeTrack('gender2');
  console.log('removing Gender 2');
});
var genderData;
var genderDataPromise = $.getJSON('./gbm/gender-gbm.json');
var geneData;
var geneDataPromise = $.getJSON('./gbm/tp53.json');
var mutationData;
genderDataPromise.then(function(data) {
  genderData = data.data;
  mutationData = genderData.map(function(x) { return $.extend({}, x, {attr_val: (x.attr_val === 'MALE' ? 70 + Math.random()*30 : Math.random()*30)}); });
});
geneDataPromise.then(function(data) {
  geneData = data;
});
$.when(geneDataPromise, genderDataPromise).then(function() {
  onc.addTrack('gender', genderData, {label: 'Gender'})
          .useRenderTemplate('categorical_color', {
            color: {MALE: '#6699FF', FEMALE:'#FF00FF'},
            category: function(d) {
              return d.attr_val;
            }
          });
  onc.addTrack('mutations', mutationData, {label: 'Mutations'})
        .useRenderTemplate('bar_chart', {
          data: function(d) {
            return d.attr_val;
          },
          range:[0,100]
        });
  /*var renderer = onc.addTrack('gender',genderData, {label:'Gender' }).renderer;
  renderer.addRule({condition:function(d) { return d.attr_val === 'MALE';}, 
                                  d3_shape: d3.select(document.createElementNS('http://www.w3.org/2000/svg', 'rect')), 
                                  attrs: {'fill':'rgba(255,0,0,255)', 'width':'100%', 'height':'33.33%', 'y':'33.33%'},
                                  z_index: 1});
  renderer.addRule({condition:function(d) { return true;}, 
                                  d3_shape:d3.select(document.createElementNS('http://www.w3.org/2000/svg', 'rect')), 
                                  attrs:{'fill':'rgba(100,100,100,255)', 'width':'100%', 'height':function(d,i) { return 100*i/genderData.length + '%';}}, 
                                  z_index: 0});
  /*var renderer = onc.appendTrack('gender2',genderData, {label:'Gender 2' }).renderer.cellRenderer;
  renderer.addRule(function(d) { return d.attr_val === 'MALE';}, d3.select(document.createElementNS('http://www.w3.org/2000/svg', 'rect')), {'fill':'rgba(255,0,0,255)', 'width':'100%', 'height':'33.33%', 'y':'33.33%'},1);
  renderer.addRule(function(d) { return true;}, d3.select(document.createElementNS('http://www.w3.org/2000/svg', 'rect')), {'fill':'rgba(100,100,100,255)', 'width':'100%', 'height':'100%'}, 0);*/
});
//global.Oncoprint = require('../../src/js/oncoprint');
/*
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
};*/
