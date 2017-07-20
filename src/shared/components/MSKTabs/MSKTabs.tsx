import * as React from 'react';
import * as _ from 'lodash';
import classnames from 'classnames';
import ReactChild = React.ReactChild;
import ReactNode = React.ReactNode;
import ReactChildren = React.ReactChildren;
import {ThreeBounce} from 'better-react-spinkit';
import ReactResizeDetector from 'react-resize-detector';
import onNextRenderFrame from "shared/lib/onNextRenderFrame";

interface IMSKTabProps {
    inactive?:boolean;
    id:string;
    linkText:string;
    activeId?:string;
    className?:string;
    hide?:boolean;
    loading?:boolean;
    anchorStyle?:{[k:string]:string|number|boolean};
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
    currentPage:number;
    pageBreaks:string[];
}

interface IMSKTabsProps {
    className?:string;
    id?:string;
    activeTabId?:string;
    onTabClick?:(tabId:string)=>void;
    enablePagination?:boolean;
    // only used when pagination is true to style arrows
    arrowStyle?:{[k:string]:string|number|boolean};
}

export class MSKTabs extends React.Component<IMSKTabsProps, IMSKTabsState> {

    private shownTabs:string[] = [];
    private navTabsRef: HTMLUListElement;
    private tabRefs: {id:string, element:HTMLLIElement}[] = [];

    constructor(){
        super();

        this.state = {
            currentPage: 1,
            pageBreaks: [] as string[]
        } as IMSKTabsState;
    }

    private cloneTab(tab:React.ReactElement<IMSKTabProps>, inactive:boolean, loading?:boolean):React.ReactElement<IMSKTabProps> {
        if (loading) {
            return React.cloneElement(
                tab,
                { inactive } as Partial<IMSKTabProps>,
                (<ThreeBounce className="default-spinner center-block text-center" />)
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

    navTabsRefHandler(ul: HTMLUListElement) {
        this.navTabsRef = ul;
    }

    tabRefHandler(id: string, li: HTMLLIElement) {
        if (id && li) {
            this.tabRefs.push({id, element: li});
        }
    }

    nextPage() {
        this.setState({
            currentPage: this.state.currentPage + 1
        } as IMSKTabsState);
    }

    prevPage() {
        this.setState({
            currentPage: this.state.currentPage - 1
        } as IMSKTabsState);
    }

    initOnResize(width: number, height: number) {
        let timeout:number|null = null;

        return (evt: any) => {
            if (timeout !== null) {
                window.clearTimeout(timeout);
                timeout = null;
            }

            timeout = window.setTimeout(() => {
                this.setState({
                    currentPage: 1,
                    pageBreaks: [] as string[]
                } as IMSKTabsState);
            }, 600);
        };
    }

    render(){
        if (this.props.children) {

            let children = (this.props.children as React.ReactElement<IMSKTabProps>[]);

            let hasActive: boolean = false;
            let effectiveActiveTab: string = "";

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

            return (
                <div
                    id={(this.props.id) ? this.props.id : ''}
                    className={ classnames(this.props.className) }
                >
                    {this.navTabs(children, effectiveActiveTab)}
                    <div className="tab-content">{arr}</div>
                    <ReactResizeDetector handleWidth={true} onResize={this.initOnResize.bind(this)()} />
                </div>
            );
        } else {
            return null;
        }
    }

    protected navTabs(children: React.ReactElement<IMSKTabProps>[], effectiveActiveTab: string)
    {
        // restart the tab refs before each tab rendering
        this.tabRefs = [];

        // if pagination is disabled, pages.length and pagesCount will be always 1
        const pages = this.tabPages(children, effectiveActiveTab);
        const pageCount = this.state.pageBreaks.length + 1;

        // we need a little style tweak to prevent initial overflow flashing when paging enabled
        // TODO disabling maxHeight tweak due to inconsistencies for now
        const navBarStyle = this.props.enablePagination ? {
            /*maxHeight: 40,*/ border: 0, overflow: "hidden"
        } : undefined;

        const prev = this.state.currentPage > 1 ? (
            <li
                key="prevPage"
                style={{ cursor:'pointer' }}
            >
                <a onClick={this.prevPage.bind(this)}><i className="fa fa-chevron-left" style={this.props.arrowStyle} /></a>
            </li>
        ) : null;

        const next = this.state.currentPage < pageCount ? (
            <li
                key="nextPage"
                style={{ cursor:'pointer' }}
            >
                <a onClick={this.nextPage.bind(this)}><i className="fa fa-chevron-right" style={this.props.arrowStyle} /></a>
            </li>
        ) : null;

        return (
            <ul
                ref={this.navTabsRefHandler.bind(this)}
                className="nav nav-tabs"
                style={navBarStyle}
            >
                {prev}
                {pages[this.state.currentPage - 1]}
                {next}
            </ul>
        );
    }

    protected tabPages(children: React.ReactElement<IMSKTabProps>[], effectiveActiveTab: string): JSX.Element[][]
    {
        const pages: JSX.Element[][] = [[]];
        let currentPage = 1;

        React.Children.forEach(children, (tab: React.ReactElement<IMSKTabProps>) => {
            if (!tab || tab.props.hide || (tab.props.loading && (effectiveActiveTab !== tab.props.id))) {
                return;
            }

            let activeClass = (effectiveActiveTab === tab.props.id) ? 'active' : '';

            // find out if we need to add another page
            if (this.props.enablePagination &&
                this.state.pageBreaks.length > 0 &&
                this.state.pageBreaks[currentPage - 1] === tab.props.id)
            {
                currentPage++;
                pages[currentPage - 1] = [];
            }

            pages[currentPage - 1].push(
                <li
                    key={tab.props.id}
                    style={{ cursor:'pointer' }}
                    ref={this.tabRefHandler.bind(this, tab.props.id)}
                    className={activeClass}
                >
                    <a onClick={this.setActiveTab.bind(this,tab.props.id)} style={tab.props.anchorStyle}>{tab.props.linkText}</a>
                </li>
            );
        });

        return pages;
    }

    componentDidUpdate() {
        onNextRenderFrame(() => {
            // if there are page breaks, it means that page calculations already performed
            if (this.props.enablePagination &&
                this.state.pageBreaks.length  === 0)
            {
                // find page breaks: depends on width of the container
                const pageBreaks: string[] = this.findPageBreaks();

                // find current page: depends on active tab id
                const currentPage: number = this.findCurrentPage(pageBreaks);

                this.setState({
                    currentPage,
                    pageBreaks
                } as IMSKTabsState);
            }
        });
    }

    findCurrentPage(pageBreaks: string[]) {
        let currentPage = 1;
        let found = false;

        if (this.props.activeTabId && pageBreaks.length > 0) {
            _.each(this.tabRefs, ref => {
                // we reached a page break before reaching the active tab id.
                // increment current page
                if (ref.id === pageBreaks[currentPage - 1]) {
                    currentPage++;
                }

                // we reached the active tab id within current page.
                // break the each loop, and return current page.
                if (ref.id === this.props.activeTabId) {
                    found = true;
                    return false;
                }
            });
        }

        // in case active tab id is not valid, default to first page
        return found ? currentPage : 1;
    }

    findPageBreaks()
    {
        const pageBreaks: string[] = [];
        const containerWidth: number = (this.navTabsRef && this.navTabsRef.offsetWidth) || 0;

        // do not attempt paging if container width is zero
        if (containerWidth > 0)
        {
            let width = 0;

            _.each(this.tabRefs, ref => {
                width += ref.element.offsetWidth;

                // TODO 160 and 100 are magic numbers, something is not right with the width calculation...
                // in the first page we will only have the right arrow, so we don't need the full padding
                const padding = pageBreaks.length > 0 ? 160 : 100;

                // add a page break, and reset the width for the next page
                if (width > containerWidth - padding) {
                    pageBreaks.push(ref.id);
                    width = ref.element.offsetWidth;
                }
            });
        }

        return pageBreaks;
    }
}
