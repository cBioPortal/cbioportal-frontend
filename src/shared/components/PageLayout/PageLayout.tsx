import * as React from "react";
import RightBar from "../rightbar/RightBar";

export class PageLayout extends React.Component<{ showRightBar?:boolean },{}> {

    render(){
        return (
            <div className="contentWidth noMargin">
                <div id="mainColumn">
                    <div>
                        {this.props.children}
                    </div>
                </div>
                {(this.props.showRightBar) &&
                (<div id="rightColumn">
                    <RightBar queryStore={(window as any).globalStores.queryStore}/>
                </div>)
                }
            </div>
        )
    }

}