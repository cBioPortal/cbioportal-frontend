import { expect } from 'chai';
import React from 'react';
//import { PDXTree, getTreeNodesFromClinicalData } from './PDXTree';

// describe('Tree component', () => {
//   it('should convert clinical data from cBioPortal to Tree input data', () => {
//     let clinicalDataMap = {
//       "HCI002T": {},
//       "HCI003T": {},
//       "HCI002X": {
//         "PDX_PARENT": "HCI002T"
//       },
//       "HCI002X2": {
//         "PDX_PARENT": "HCI002X"
//       },
//       "HCI002X3": {
//         "PDX_PARENT": "HCI002X2"
//       }
//     }
//     let sampleOrder = ["HCI002T", "HCI002X", "HCI002X2", "HCI002X3", "HCI003T"];
//     let trees = getTreeNodesFromClinicalData(clinicalDataMap, sampleOrder)
//     expect(trees).toEqual([
//       {
//         "name": "HCI002T",
//         "label": "1",
//         "children": [
//           {
//             "label": "2",
//             "name": "HCI002X",
//             "children": [
//               {
//                 "label": "3",
//                 "name": "HCI002X2",
//                 "children": [
//                   {
//                     "label": "4",
//                     "name": "HCI002X3"
//                   }
//                 ]
//               }
//             ]
//           }
//         ]
//       },
//       {
//         "name": "HCI003T",
//         "label": "5"
//       }
//     ])
//   })
// })
