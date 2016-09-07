import Immutable from 'immutable';
import { mockData } from '../mockData';
//import convertSampleData from './convertSampleData';
import { assert } from 'chai';

describe('', ()=>{

   var convertSampleData = function(data) {

       //console.log(data);

       const output = { columns:[],  items:{} };

       data.forEach((sample)=>{

           const sampleId = sample.get('id');

           sample.get('clinicalData').forEach((dataItem)=>{

               output.items[dataItem.get('id')] = output.items[dataItem.get('id')] || {};
               output.items[dataItem.get('id')][sampleId] = dataItem.get('value');

               if (output.columns.indexOf(dataItem.get('id')) === -1) {
                   output.columns.push({ id: dataItem.get('id'), name: dataItem.get('name')  })
               }

           });


       });

       console.log(output);

   };


   it.only('its true', function(){

       convertSampleData(Immutable.fromJS(mockData.samples));



   });


});



