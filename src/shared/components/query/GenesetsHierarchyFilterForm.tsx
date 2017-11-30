import * as React from 'react';
import * as styles_any from './styles/styles.module.scss';
import {observable} from "mobx";
import {observer} from "mobx-react";
import ReactSelect from 'react-select';

export type validPercentile = 50|75|100;

interface GenesetsHierarchyFilterFormProps
{
    percentile: validPercentile;
    pvalueThreshold: number;
    scoreThreshold: number;
    onApply: (percentile: validPercentile, pvalueThreshold: number, scoreThreshold: number) => void;
}

@observer
export default class GenesetsHierarchyFilterForm extends React.Component<GenesetsHierarchyFilterFormProps, {}>
{
    @observable percentile = this.props.percentile;
    @observable pvalueThreshold = String(this.props.pvalueThreshold);
    @observable scoreThreshold = String(this.props.scoreThreshold);
    readonly percentileOptions = [{label: '50%', value: 50}, {label: '75%', value: 75}, {label: '100%', value: 100}];
    constructor(props:GenesetsHierarchyFilterFormProps)
    {
        super(props);
        this.percentileChange = this.percentileChange.bind(this);
        this.applyFilter = this.applyFilter.bind(this);
    }
    
    percentileChange(val: {label: string, value: validPercentile} | null)
    {
        this.percentile = val ? val.value : 75;
    }
    
    applyFilter() {
        const pvalueThreshold = this.pvalueThreshold ? Number(this.pvalueThreshold) : NaN;
        const scoreThreshold = this.scoreThreshold ? Number(this.scoreThreshold) : NaN;
        if (!Number.isNaN(pvalueThreshold) && !Number.isNaN(scoreThreshold)) {
            this.props.onApply(this.percentile, pvalueThreshold, scoreThreshold);
        }
    }
    
    render()
    {
        return (
                <div className="form-inline" style={{width:"100%", background:"#eee", padding:"1px 10px"}}>
                <div className="form-group" style={{display:"inline-block", padding: "10px 15px"}}>
                    <label htmlFor="GSVAScore" style={{display:"inline-block"}}>GSVA score</label>
                    <input id="GSVAScore" type="number" className="form-control" value={this.scoreThreshold} 
                        onChange={event => this.scoreThreshold = event.target.value} style={ {display: "block", width:160} } step="0.1"/>
                </div>
                <div className="form-group" style={{display:"inline-block", padding: "10px 15px"}}>
                    <label htmlFor="Pvalue" style={{display:"inline-block"}}>P-value</label>
                    <input id="Pvalue" type="number" className="form-control tableSearchInput" value={this.pvalueThreshold} 
                        onChange={event => this.pvalueThreshold = event.target.value} style={ {display: "block", width:160} } step="0.01" min="0"/>
                </div>
                <div className="form-group" style={{ padding: "10px 15px"}}>
                    <label htmlFor="PercentileScoreCalculation">Percentile for score calculation</label>
                    <ReactSelect
                        addLabelText="Percentile for score calculation"
                        style={ {width:160} }
                        clearable={false}
                        name="PercentileScoreCalculation"
                        value={this.percentile}
                        options={this.percentileOptions}
                        onChange={this.percentileChange}
                    />
                </div>
                <div style={{display:"inline-block", padding: "10px 15px"}}>
                    <button
                        id="filterButton"
                        className="btn btn-primary btn-sm"
                        style={{ display:'block', padding: "20px 18px" }}
                        onClick={this.applyFilter}
                    >
                        Apply Filter
                    </button>
                </div>
            </div>
            );
    }
}
