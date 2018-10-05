import * as React from 'react';
import {ThreeBounce} from 'better-react-spinkit';
import LoadingIndicator from "../loadingIndicator/LoadingIndicator";
import {observer} from "mobx-react";
import {observable} from "mobx";
import autobind from "autobind-decorator";

@observer
export default class IFrameLoader extends React.Component<{ url:string; iframeId?:string; height:Number }, {}> {

    constructor(){
        super();
    }

    @observable iframeLoaded = false;

    @autobind
    private onLoad() {
        this.iframeLoaded = true;
    }

    //NOTE: we need zindex to be higher than that of global loader
    render(){
        return (
            <div style={{position:'relative'}}>

                <LoadingIndicator center={true} size={"big"} isLoading={!this.iframeLoaded}  />
                <iframe id={this.props.iframeId||""}
                        style={{ width:'100%', position:'relative', zIndex:100, height:this.props.height, border:'none'}}
                        src={this.props.url}
                        onLoad={this.onLoad}
                >
                </iframe>
            </div>
        )
    }
}