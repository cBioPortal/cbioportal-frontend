import * as _ from 'lodash';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import PageHeader from '../../pages/pageHeader/PageHeader';
import UnsupportedBrowserModal from "shared/components/unsupportedBrowserModal/UnsupportedBrowserModal";

import '../../globalStyles/prefixed-global.scss';
import PortalHeader from "./PortalHeader";
import PortalFooter from "./PortalFooter";
import RightBar from "../../shared/components/rightbar/RightBar";
import {QueryStore} from "../../shared/components/query/QueryStore";

interface IContainerProps {
    location: Location;
    children: React.ReactNode;
}


export default class Container extends React.Component<IContainerProps, {}> {

    static contextTypes = {
        router: React.PropTypes.object,
        queryStore: QueryStore
    };

    context: { router: any, queryStore: QueryStore };

    componentDidMount() {

        const headerNode = document.getElementById("reactHeader");
        if (headerNode !== null) {
            ReactDOM.render(<PageHeader router={this.context.router} currentRoutePath={this.props.location.pathname}/>,
                headerNode);
        }

    }

    renderChildren() {
        const childProps = {...this.props};
        const {children} = this.props;
        return React.Children.map(children,
            c => React.cloneElement(c as React.ReactElement<any>, childProps));
    }

    render() {
        return (
            <div>
                <div className="pageTopContainer">
                    <div className="contentWidth">
                        <PortalHeader/>
                    </div>
                </div>

                <div className="contentWrapper">
                    <UnsupportedBrowserModal/>
                    {this.renderChildren()}
                </div>

                <PortalFooter/>

            </div>
        );
    }
}
