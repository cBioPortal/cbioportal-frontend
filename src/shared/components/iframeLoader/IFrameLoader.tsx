import * as React from 'react';
import {ThreeBounce} from 'better-react-spinkit';
import LoadingIndicator from "../loadingIndicator/LoadingIndicator";

export default class IFrameLoader extends React.Component<{ url:string; iframeId?:string; showLoader?:boolean; height:Number }, {}> {

    constructor(){
        super();
    }

    //NOTE: we need zindex to be higher than that of global loader
    render(){
        return (
            <div style={{position:'relative'}}>
                {
                    (this.props.showLoader!==false) && (
                        <LoadingIndicator isLoading={true} isGlobal={true}/>
                    )
                }
                <iframe id={this.props.iframeId||""}
                        style={{ width:'100%', position:'relative', zIndex:100, height:this.props.height, border:'none'}}
                        src={this.props.url}>
                </iframe>
            </div>
        )
    }
}