import * as React from "react";
import * as _ from "lodash";
import {observer} from "mobx-react";
import {CategorizedConfigItems} from "../../../config/IAppConfig";
import DefaultTooltip from "../defaultTooltip/DefaultTooltip";


@observer
export default class QuickSelectButtons extends React.Component<{ buttonsConfig:CategorizedConfigItems, onSelect:(studyIds:string[])=>void }, {}> {

    render(){

        return (<div>Quick select:&nbsp;
            {
            _.map(this.props.buttonsConfig,(values, name)=>{

                const [buttonText,tooltipText] = name.split("|");

                const buttonEl = <button data-test="selectPanCan"
                                         className={"btn btn-default btn-xs"}
                                         onClick={()=>this.props.onSelect(values)}>
                    {buttonText}
                </button>;

                return (tooltipText) ?
                    <DefaultTooltip overlay={tooltipText||""}>{buttonEl}</DefaultTooltip> : buttonEl;
            })
        }
        </div>
        );


    }


}