import React from 'react';
import ReactDOM from 'react-dom';
import PancancerStudySummaryHistogram from './RenderHistogram';
import mockModel from './mockModel';
import DataManagerPresenter from './DataManagerPresenter';
import Plotly from 'react-plotlyjs';
import _ from 'lodash';

const mockData = [
    {
        "typeOfCancer": "Colon Adenocarcinoma",
        "caseSetLength": 94,
        "alterations": {"all": 33, "mutation": 33, "cnaUp": 0, "cnaDown": 0, "cnaLoss": 0, "cnaGain": 0, "multiple": 0}
    }, {
        "typeOfCancer": "Colorectal Cancer",
        "caseSetLength": 23,
        "alterations": {"all": 14, "mutation": 14, "cnaUp": 0, "cnaDown": 0, "cnaLoss": 0, "cnaGain": 0, "multiple": 0}
    }, {
        "typeOfCancer": "Rectal Adenocarcinoma",
        "caseSetLength": 48,
        "alterations": {"all": 24, "mutation": 23, "cnaUp": 0, "cnaDown": 0, "cnaLoss": 0, "cnaGain": 0, "multiple": 1}
    }];


class Histogram extends React.Component {

    render() {


        const alterationList = mockData[0].alterations;
        const cancerTypes = _.map(mockData, (item)=>item.typeOfCancer);

        let traces = [];

        Object.keys(alterationList).forEach((key) => {
            if (key !== 'all') {

                traces.push({
                    x: cancerTypes,
                    y: _.map(mockData, (cancer)=>cancer.alterations[key]/cancer.caseSetLength),
                    name: key,
                    type: 'bar'
                });
            }
        });

        var layout = {
            barmode: 'stack',
            yaxis: {
                tickformat:'%'
            }
        };

        return (
            <Plotly className="whatever" data={traces} layout={layout}/>
        );

    }

}

export default Histogram;









