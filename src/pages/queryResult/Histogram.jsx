import React from 'react';
import ReactDOM from 'react-dom';
import PancancerStudySummaryHistogram from './RenderHistogram';
import mockModel from './mockModel';
import DataManagerPresenter from './DataManagerPresenter';

class QueryResultPage extends React.Component {
    componentDidMount() {


        this.dmPresenter = new DataManagerPresenter();


        Object.assign(this.dmPresenter, mockModel.dmPresenter);

        mockModel.get = function(key){
            return mockModel[key];
        };

        this.histogram = new PancancerStudySummaryHistogram();


        console.log(this.dmPresenter);

        this.histogram.render(this._histogramRoot, mockModel, this.dmPresenter, "KRAS")




    }
    render() {
        // return (
        //     <div ref={(el)=>{ this._histogramRoot = el }} className="histogram"></div>
        // );
    }
}

export default QueryResultPage;









