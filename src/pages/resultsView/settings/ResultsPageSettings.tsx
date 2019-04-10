import * as React from "react";
import {observer} from "mobx-react";
import {ResultsViewPageStore} from "../ResultsViewPageStore";
import ReactSelect from "react-select2";
import {capitalize} from "../../../shared/lib/StringUtils";
import autobind from "autobind-decorator";
import DriverAnnotationControls, {
    IDriverAnnotationControlsHandlers,
    IDriverAnnotationControlsState
} from "./DriverAnnotationControls";
import {IObservableObject} from "mobx";
import {buildDriverAnnotationControlsHandlers, buildDriverAnnotationControlsState} from "./ResultsPageSettingsUtils";

export interface IResultsPageSettingsProps {
    store:ResultsViewPageStore;
}

enum EVENT_KEY {
    hidePutativePassengers="0",
    hideGermlineMutations="1"
}

@observer
export default class ResultsPageSettings extends React.Component<IResultsPageSettingsProps, {}> {
    @autobind private onChange(v:{ label:string, value:"sample"|"patient"}) {
        this.props.store.setCaseType(v.value);
    }

    private driverSettingsState:IDriverAnnotationControlsState & IObservableObject;
    private driverSettingsHandlers:IDriverAnnotationControlsHandlers;


    constructor(props:IResultsPageSettingsProps) {
        super(props);
        this.driverSettingsState = buildDriverAnnotationControlsState(this);
        this.driverSettingsHandlers = buildDriverAnnotationControlsHandlers(this, this.driverSettingsState);
    }

    @autobind private onInputClick(event:React.MouseEvent<HTMLInputElement>) {
        switch ((event.target as HTMLInputElement).value) {
            case EVENT_KEY.hidePutativePassengers:
                this.props.store.driverAnnotationSettings.ignoreUnknown = !this.props.store.driverAnnotationSettings.ignoreUnknown;
                break;
            case EVENT_KEY.hideGermlineMutations:
                break;
        }
    }

    render() {
        return (
            <div className="cbioportal-frontend" style={{padding:5}}>
                <h4>Settings</h4>
                <div
                    style={{
                        padding:5,
                        display:"flex",
                        alignItems:"center"
                    }}
                >
                    <span style={{
                        width:60
                    }}>
                        Case type:
                    </span>
                    <div
                        style={{
                            width:170,
                            marginLeft:10
                        }}
                    >
                        <ReactSelect
                            value={{label:capitalize(this.props.store.caseType), value:this.props.store.caseType}}
                            options={[{
                                label:"Patient",
                                value:"patient"
                            }, {
                                label:"Sample",
                                value:"sample"
                            }]}
                            onChange={this.onChange}
                        />
                    </div>
                </div>

                <h5>Annotate Data</h5>
                <DriverAnnotationControls
                    state={this.driverSettingsState}
                    handlers={this.driverSettingsHandlers}
                />

                <h5>Filter Data</h5>
                <div style={{marginLeft:10}}>
                    <div className="checkbox"><label>
                        <input
                            data-test="HideVUS"
                            type="checkbox"
                            value={EVENT_KEY.hidePutativePassengers}
                            checked={!this.props.store.driverAnnotationSettings.ignoreUnknown}
                            onClick={this.onInputClick}
                            disabled={!this.driverSettingsState.distinguishDrivers}
                        /> Show VUS (variants of unknown significance)
                    </label></div>
                    {/*<div className="checkbox"><label>
                        <input
                            data-test="HideGermline"
                            type="checkbox"
                            value={EVENT_KEY.hideGermlineMutations}
                            checked={!this.props.state.hideGermlineMutations}
                            onClick={this.onInputClick}
                        /> Show germline mutations
                    </label></div>*/}
                </div>
            </div>
        );
    }
}