import * as React from "react";
import {observer} from "mobx-react";
import {ResultsViewPageStore} from "./ResultsViewPageStore";
import ReactSelect from "react-select2";
import {capitalize} from "../../shared/lib/StringUtils";
import autobind from "autobind-decorator";

export interface IResultsPageSettingsProps {
    store:ResultsViewPageStore;
}

@observer
export default class ResultsPageSettings extends React.Component<IResultsPageSettingsProps, {}> {
    @autobind private onChange(v:{ label:string, value:"sample"|"patient"}) {
        this.props.store.setCaseType(v.value);
    }

    render() {
        return (
            <div style={{padding:5}}>
                <h5>Settings</h5>
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
            </div>
        );
    }
}