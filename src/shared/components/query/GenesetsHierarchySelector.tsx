import * as _ from 'lodash';
import * as React from 'react';
import * as styles_any from './styles/styles.module.scss';
import {action, ObservableMap, expr, toJS, computed, observable} from "mobx";
import {observer, Observer} from "mobx-react";
import {MutSig} from "../../api/generated/CBioPortalAPIInternal";
import ReactSelect from 'react-select';
import GenesetJsTree from "./GenesetJsTree";
import { InputHTMLAttributes, FormEvent } from "react";

const styles = styles_any as {
    GenesetsSelectorWindow: string,
    GenesetsSelectionArea: string,
    selectionColumnHeader: string,
    selectionColumnCell: string,
};

export interface GenesetsHierarchySelectorProps
{
gsvaProfile: string;
sampleListId: string|undefined;
}

@observer
export default class GenesetsHierarchySelector extends React.Component<GenesetsHierarchySelectorProps, {}>
{
    @observable appliedPercentile: string;
    @observable appliedPvalueThreshold: string;
    @observable appliedScoreThreshold: string;
    @observable percentileSelectOptions: {label: string, value: string};
    @observable pvalueThreshold: string;
    @observable scoreThreshold: string;
    @observable searchValue: string;
    readonly percentileOptions = [{label: '50%', value: '50'}, {label: '75%', value: '75'}, {label: '100%', value: '100'}];
    constructor(props:GenesetsHierarchySelectorProps)
    {
        super(props);
        this.appliedPercentile = '75';
        this.appliedPvalueThreshold = "0.05";
        this.appliedScoreThreshold = "0.5";
        this.percentileSelectOptions = {label: '75%', value: '75'};
        this.pvalueThreshold = "0.05";
        this.scoreThreshold = "0.5";
        this.searchValue = "";
        this.percentileChange = this.percentileChange.bind(this);
        this.applyFilter = this.applyFilter.bind(this);
    }
    
    percentileChange(val: {label: string, value: string} | null)
    {
        this.percentileSelectOptions = val || {label: '75%', value: '75'};
    }
    
    applyFilter() {
        this.appliedPercentile = this.percentileSelectOptions.value;
        this.appliedPvalueThreshold = this.pvalueThreshold;
        this.appliedScoreThreshold = this.scoreThreshold;
    }
    
    render()
    {
        return (
                <div className={styles.GenesetsSelectorWindow}>
                <div className={styles.GenesetsSelectionArea}>
                <text>Search hierarchy</text>
                <div className={`form-group has-feedback input-group-sm`} style={{ display:'inline-block'}}>
                <input id="geneset-hierarchy-search" type="text" className="form-control tableSearchInput" 
                    style={{ width:768 }} value={this.searchValue} onChange={event => this.searchValue = event.target.value} />
                <span className="fa fa-search form-control-feedback" aria-hidden="true"></span>
                </div>
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
                <ReactSelect addLabelText="Percentile for score calculation" style={ {width:160} }
                name="PercentileScoreCalculation"
                value={this.percentileSelectOptions}
                options={this.percentileOptions}
                onChange={this.percentileChange}
                />
                </div>
                <div style={{display:"inline-block", padding: "10px 15px"}}>
                <button id= "filterButton" className="btn btn-primary btn-sm" style={{ display:'block', padding: "20px 18px" }}
                    onClick={this.applyFilter}>
                Apply Filter
                </button>
                </div>
                </div>
                <GenesetJsTree 
                scoreThreshold={this.appliedScoreThreshold}
                pvalueThreshold={this.appliedPvalueThreshold}
                percentile={this.appliedPercentile}
                gsvaProfile={this.props.gsvaProfile}
                sampleListId={this.props.sampleListId}
                searchValue={this.searchValue}
                />
                </div>
                </div>
        );
    }
}
