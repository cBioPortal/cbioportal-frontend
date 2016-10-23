import React from 'react';
import ReactDOM from 'react-dom';
import PancancerStudySummaryHistogram from './RenderHistogram';
import mockModel from './mockModel';
import DataManagerPresenter from './DataManagerPresenter';
import Plotly from 'react-plotlyjs';
import { connect } from 'react-redux';
import { mapStateToProps, actionCreators } from './duck';
import _ from 'lodash';
import transformData from './transformData';

import cancerData from './mockData/cancerTypes';

let mockData = [
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

        if (this.props.status === 'fetching') {
            return null;
        } else {

            let moo = this.props.oncoprintData.toJS();

            mockData = transformData(moo[0], cancerData);

            const alterationList = mockData[0].alterations;
            const cancerTypes = _.map(mockData, (item) => item.typeOfCancer);

            let traces = [];

            Object.keys(alterationList).forEach((key) => {
                if (key !== 'all') {

                    traces.push({
                        x: cancerTypes,
                        y: _.map(mockData, (cancer)=>cancer.alterations[key] / cancer.caseSetLength),
                        name: key,
                        type: 'bar'
                    });
                }
            });

            var layout = {
                barmode: 'stack',
                yaxis: {
                    tickformat: '%'
                },
                margin: {
                    t: 20
                },
                legend: {
                    orientation: 'v'
                },
                width: 500,
                height: 250
            };

            return (
                <div>
                    <h3>KRAS</h3>
                    <Plotly className="whatever" data={traces} layout={layout}/>
                    <h3>NRAS</h3>
                    <Plotly className="whatever" data={traces} layout={layout}/>
                    <h3>BRAF</h3>
                    <Plotly className="whatever" data={traces} layout={layout}/>
                </div>
            );
        }

    }

}

export default connect(mapStateToProps, actionCreators)(Histogram);











