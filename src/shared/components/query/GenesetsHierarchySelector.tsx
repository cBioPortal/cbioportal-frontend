import * as React from 'react';
import {ObservableMap, observable} from "mobx";
import {observer} from "mobx-react";
import GenesetsJsTree from "./GenesetsJsTree";
import GenesetsHierarchyFilterForm, {validPercentile} from "./GenesetsHierarchyFilterForm";

export interface GenesetsHierarchySelectorProps
{
    initialSelection: string[];
    gsvaProfile: string;
    sampleListId: string|undefined;
    onSelect: (map_geneSet_selected:ObservableMap<boolean>) => void;
}

@observer
export default class GenesetsHierarchySelector extends React.Component<GenesetsHierarchySelectorProps, {}>
{
    @observable percentile: validPercentile = 75;
    @observable pvalueThreshold = 0.05;
    @observable scoreThreshold = 0.5;
    @observable searchValue = "";
    
    constructor(props:GenesetsHierarchySelectorProps)
    {
        super(props);
        this.updateSelectionParameters = this.updateSelectionParameters.bind(this);
    }
    
    updateSelectionParameters(percentile: validPercentile, pvalueThreshold: number, scoreThreshold: number) {
        this.percentile = percentile;
        this.pvalueThreshold = pvalueThreshold;
        this.scoreThreshold = scoreThreshold;
    }
    
    render()
    {
        return (
                <div>
                    <text>Search hierarchy</text>
                    <div className={`form-group has-feedback input-group-sm`} style={{ display:'inline-block'}}>
                        <input
                            type="text"
                            id="geneset-hierarchy-search"
                            className="form-control tableSearchInput"
                            style={{ width:768 }}
                            value={this.searchValue}
                            onChange={event => this.searchValue = event.target.value}
                        />
                        <span className="fa fa-search form-control-feedback" aria-hidden="true"></span>
                    </div>
                    <GenesetsHierarchyFilterForm
                        percentile = {this.percentile}
                        pvalueThreshold = {this.pvalueThreshold}
                        scoreThreshold = {this.scoreThreshold}
                        onApply={this.updateSelectionParameters}
                    />
                    <GenesetsJsTree
                        initialSelection={this.props.initialSelection}
                        scoreThreshold={this.scoreThreshold}
                        pvalueThreshold={this.pvalueThreshold}
                        percentile={this.percentile}
                        gsvaProfile={this.props.gsvaProfile}
                        sampleListId={this.props.sampleListId}
                        searchValue={this.searchValue}
                        onSelect={this.props.onSelect}
                    />
                </div>
        );
    }
}
