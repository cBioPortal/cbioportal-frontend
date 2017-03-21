import * as React from 'react';
import * as _ from 'lodash';
import classnames from 'classnames';
import ReactChild = React.ReactChild;
import ReactNode = React.ReactNode;
import ReactChildren = React.ReactChildren;

interface IMSKTabProps {
    hidden?:Boolean;
    id:string;
    linkText:string;
    activeId?:string;
}

export class MSKTab extends React.Component<IMSKTabProps,{}> {

    constructor(props: IMSKTabProps){
        super(props);
    }

    render(){
        return <div className={classnames({ 'msk-tab':true, 'hidden':(this.props.hidden === true)  })}>{this.props.children}</div>
    }

}

interface IMSKTabsState {
    activeTabId:string;
}

interface IMSKTabsProps {
    className?:string;
    id?:string;
    activeTabId?:string;
    onTabClick(tabId:string):void;
}

export class MSKTabs extends React.Component<IMSKTabsProps, IMSKTabsState> {

    private shownTabs:string[] = [];

    constructor(){
        super();
        this.state = { activeTabId: "one" };
    }

    setActiveTab(id: string){
        this.props.onTabClick(id);
    }

    render(){
        if (this.props.children) {

            let children: any[] = (this.props.children as any[]);

            let hasActive: boolean = false;
            let defaultTab: string;

            const arr: any = _.reduce(React.Children.toArray(children), (memo: any, child: any) => {
                if (child.props.id === this.props.activeTabId) {
                    hasActive = true;
                    this.shownTabs.push(child.props.id);
                    const newChild = React.cloneElement(child, {
                        hidden: false,
                        shown: true
                    });
                    memo.push(newChild);
                } else if (_.includes(this.shownTabs, child.props.id)) {
                    const newChild = React.cloneElement(child, {
                        hidden: true
                    });
                    memo.push(newChild);
                }
                return memo;
            }, []);

            // if we don't have an active child, then default to first
            if (hasActive === false) {
                this.shownTabs.push(children[0].props.id);
                arr[0] = React.cloneElement(children[0], {
                    hidden: false,
                });
                defaultTab = children[0].props.id;
            }

            return <div id={(this.props.id) ? this.props.id : ''}
                        className={ classnames(this.props.className) }>
                <ul className="nav nav-tabs">{
                    React.Children.map(children, (tab: any) => {
                        if (!tab) return;
                        let activeClass = (this.props.activeTabId === tab.props.id || defaultTab === tab.props.id) ? 'active' : '';
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

