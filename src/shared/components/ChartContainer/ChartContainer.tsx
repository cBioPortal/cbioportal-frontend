import * as React from 'react';

export default class ChartContainer extends React.Component<{}, {}> {

    render(){

        return  (
            <div className="borderedChart">
                <div style={{fontFamily:"Arial, Helvetica", overflowX:'auto', overflowY:'hidden'}}>
                    {this.props.children}
                </div>
         </div>
        )

    }


}