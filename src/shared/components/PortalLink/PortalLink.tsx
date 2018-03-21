import * as React from 'react';

/*
 * this component will be replaced by ReactRouter Link when we switch to SPA
 */
export default class PortalLink extends React.Component<{ to:any },{}> {

    render(){
        const href = `${this.props.to.basepath}#${this.props.to.pathname}?${this.props.to.search}`;
        const props: any = {};
        if (this.props.to.newTab) {
            props.target = "_blank";
        }
        return <a href={href} {...props}>{this.props.children}</a>
    }

}