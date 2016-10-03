import React, {PropTypes as T} from 'react';
import PageHeader from 'shared/components/pageHeader.jsx';


export class Container extends React.Component {

    changeRoute(newValue){
        this.context.router.push(newValue);
    }

    renderChildren() {
        const childProps = {
            ...this.props,
        };
        const {children} = this.props;
        return React.Children.map(children,
            c => React.cloneElement(c, childProps));
    }

    render() {


        return (
            <div>
                <PageHeader changeRoute={this.changeRoute.bind(this)} currentRoutePath={ this.props.location.pathname } />
                <div>
                    {this.renderChildren()}
                </div>
            </div>
        );
    }
}

Container.contextTypes = {
    router: T.object,
};

export default Container;
