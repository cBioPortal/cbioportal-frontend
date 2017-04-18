import * as React from 'react';
import * as _ from 'lodash';
import classnames from 'classnames';
import ReactChild = React.ReactChild;
import ReactNode = React.ReactNode;
import ReactChildren = React.ReactChildren;
import Spinner from "react-spinkit";

interface IMSKTabProps {
    inactive?:boolean;
    id:string;
    linkText:string;
    activeId?:string;
    className?:string;
    hide?:boolean;
    loading?:boolean;
}

export class MSKTab extends React.Component<IMSKTabProps,{}> {

    constructor(props: IMSKTabProps){
        super(props);
    }

    render(){
        return (
            <div
                className={classnames({ 'msk-tab':true, 'hiddenByPosition':!!this.props.inactive  }, this.props.className )}
            >
                {this.props.children}
            </div>
        );
    }

}

interface IMSKTabsState {
    activeTabId:string;
}

interface IMSKTabsProps {
    className?:string;
    id?:string;
    activeTabId?:string;
    onTabClick?:(tabId:string)=>void;
}

export class MSKTabs extends React.Component<IMSKTabsProps, IMSKTabsState> {

    private shownTabs:string[] = [];

    constructor(){
        super();
    }

    private cloneTab(tab:React.ReactElement<IMSKTabProps>, inactive:boolean, loading?:boolean):React.ReactElement<IMSKTabProps> {
        if (loading) {
            return React.cloneElement(
                tab,
                { inactive } as Partial<IMSKTabProps>,
                (<Spinner style={{textAlign:'center'}} spinnerName="three-bounce" noFadeIn/>)
            );
        } else {
            return React.cloneElement(
                tab,
                { inactive } as Partial<IMSKTabProps>
            );
        }

    }

    setActiveTab(id: string){
        this.props.onTabClick && this.props.onTabClick(id);
    }

    render(){
        if (this.props.children) {

            let children = (this.props.children as React.ReactElement<IMSKTabProps>[]);

            let hasActive: boolean = false;
            let effectiveActiveTab: string;

            const arr = _.reduce(React.Children.toArray(children), (memo: React.ReactElement<IMSKTabProps>[], child:React.ReactElement<IMSKTabProps>) => {
                if (!child.props.hide) {
                    if (child.props.id === this.props.activeTabId) {
                        hasActive = true;
                        effectiveActiveTab = this.props.activeTabId;
                        this.shownTabs.push(child.props.id);
                        memo.push(this.cloneTab(child, false, !!child.props.loading));
                    } else if (_.includes(this.shownTabs, child.props.id) && !child.props.loading) {
                        memo.push(this.cloneTab(child, true, !!child.props.loading));
                    }
                }
                return memo;
            }, []);

            // if we don't have an active child, then default to first
            if (hasActive === false) {
                this.shownTabs.push(children[0].props.id);
                arr[0] = this.cloneTab(children[0], false, !!children[0].props.loading);
                effectiveActiveTab = children[0].props.id;
            }

            return <div id={(this.props.id) ? this.props.id : ''}
                        className={ classnames(this.props.className) }>
                <ul className="nav nav-tabs">{
                    React.Children.map(children, (tab: React.ReactElement<IMSKTabProps>) => {
                        if (!tab || tab.props.hide || (tab.props.loading && (effectiveActiveTab !== tab.props.id))) {
                            return;
                        }
                        let activeClass = (effectiveActiveTab === tab.props.id) ? 'active' : '';
                        return <li style={{ cursor:'pointer' }} className={activeClass}>
                            <a onClick={this.setActiveTab.bind(this,tab.props.id)}>{tab.props.linkText}</a>
                        </li>
                    })
                }</ul>
                <div className="tab-content">{arr}</div>
            </div>;
        } else {
            return null;
        }
    }

}

