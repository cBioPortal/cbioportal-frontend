import * as React from 'react';
import {ThreeBounce} from 'better-react-spinkit';

export default class IFrameLoader extends React.Component<{ url:string, height:Number }, {}> {

    constructor(){
        super();
    }

    render(){
        return (
            <div style={{position:'relative'}}>

                <div style={{position:'absolute', left:'50%'}}>
                    <ThreeBounce style={{position:'relative', left:'-50%'}} className="center-block text-center" /> {/*Put it underneath so it gets covered by loaded element*/}
                </div>
                <iframe style={{ width:'100%', position:'relative', height:this.props.height, border:'none'}} src={this.props.url}></iframe>
            </div>
        )
    }



}