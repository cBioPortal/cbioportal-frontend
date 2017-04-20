import * as React from 'react';
import Spinner from "react-spinkit";
import { If, Else, Then } from 'react-if';

export interface ILoader {
    isLoading:Boolean;
}

export default class Loader extends React.Component<ILoader, {}> {

    public render() {
       return (

            <If condition={this.props.isLoading}>
                <Then>
                    <div>
                        <Spinner spinnerName="three-bounce" style={{ display:'inline-block', marginLeft:10 }} noFadeIn={true}  />
                    </div>
                </Then>
            </If>

        );
    }
}
