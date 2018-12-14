import * as React from 'react';
import * as _ from 'lodash';
import classnames from 'classnames';
import {ThreeBounce} from 'better-react-spinkit';
import ReactResizeDetector from 'react-resize-detector';
import './styles.scss';
import autobind from "autobind-decorator";
import Spinner from "react-spinkit";
import LoadingIndicator from "../loadingIndicator/LoadingIndicator";
import {observable} from "mobx";
import {ReactChild} from "react";
import {observer} from "mobx-react";

export interface IMSKTabProps {
    inactive?:boolean;
    id:string;
    linkText:string;
    activeId?:string;
    className?:string;
    hide?:boolean;
    datum?:any;
    anchorStyle?:{[k:string]:string|number|boolean};
    unmountOnHide?:boolean;
    onTabDidMount?:(tab:HTMLDivElement)=>void;
    onTabUnmount?:(tab:HTMLDivElement)=>void;
}

@observer
export class DeferredRender extends React.Component<{ className:string, loadingState?:JSX.Element },{}> {

    @observable renderedOnce = false;

    render(){

        if (!this.renderedOnce) {
            setTimeout(()=>this.renderedOnce = true)
        }

        return (<div className={this.props.className}>
            {
                this.renderedOnce && this.props.children
            }
            {
                !this.renderedOnce && (this.props.loadingState || null)
            }
        </div>)
    }
}


export class MSKTab extends React.Component<IMSKTabProps,{}> {

    constructor(props: IMSKTabProps){
        super(props);
    }

    public div:HTMLDivElement;

    componentDidMount(){
        if (this.props.onTabDidMount) {
            this.props.onTabDidMount(this.div);
        }
    }

    componentWillUnmount(){
        if (this.props.onTabUnmount) {
            this.props.onTabUnmount(this.div);
        }
    }

    @autobind
    assignRef(div:HTMLDivElement){
        this.div = div;
    }

    render(){
        return (
            <div
                ref={(div:HTMLDivElement)=>this.div=div}
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
    deferedActiveTabId:string;
}

interface IMSKTabsProps {
    className?:string;
    id?:string;
    activeTabId?:string;
    onTabClick?:(tabId:string, datum:any)=>void;
    enablePagination?:boolean;
    // only used when pagination is true to style arrows
    arrowStyle?:{[k:string]:string|number|boolean};
    tabButtonStyle?:string;
    unmountOnHide?:boolean;
    loadingComponent?:JSX.Element;
}

export class MSKTabs extends React.Component<IMSKTabsProps, IMSKTabsState> {

    private shownTabs:string[] = [];
    private navTabsRef: HTMLUListElement;
    private tabRefs: {id:string, element:HTMLLIElement}[] = [];

    public static defaultProps: Partial<IMSKTabsProps> = {
        unmountOnHide: true,
        loadingComponent:<LoadingIndicator isLoading={true} center={true} size={"big"}/>
    };

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
                (this.props.loadingComponent!)
            );
        } else {
            return React.cloneElement(
                tab,
                { inactive } as Partial<IMSKTabProps>
            );
        }
    }

    setActiveTab(id: string, datum?:any){
        this.props.onTabClick && this.props.onTabClick(id, datum);
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
                // re-init paging for the resized container size
                this.initPaging();
            }, 600);
        };
    }

    render(){


        if (this.props.children && React.Children.count(this.props.children)) {

            let children = (this.props.children as React.ReactElement<IMSKTabProps>[]);

            const toArrayedChildren:ReactChild[] = React.Children.toArray(children);

            const targetTabId = (()=>{
                if (this.props.activeTabId && _.some(toArrayedChildren,(child:React.ReactElement<IMSKTabProps>)=>child.props.id===this.props.activeTabId)) {
                    return this.props.activeTabId;
                } else {
                    return (toArrayedChildren[0] as React.ReactElement<IMSKTabProps>).props.id;
                }
            })();

            let arr:React.ReactElement<IMSKTabProps>[] = [];

            arr = _.reduce(toArrayedChildren, (memo: React.ReactElement<IMSKTabProps>[], child: React.ReactElement<IMSKTabProps>) => {
                if (!child.props.hide) {
                    if (child.props.id === targetTabId) {
                        this.shownTabs.push(child.props.id);
                        memo.push(this.cloneTab(child, false));
                    } else if (
                        (child.props.unmountOnHide === false || (child.props.unmountOnHide === undefined && this.props.unmountOnHide === false))
                        && _.includes(this.shownTabs, child.props.id)) {
                        // if we're NOT unmounting it and the tab has been shown and it's not loading, include it
                        memo.push(this.cloneTab(child, true));
                    }
                }
                return memo;
            }, []);


            return (
                <div
                    id={(this.props.id) ? this.props.id : ''}
                    className={ classnames('msk-tabs', 'posRelative', this.props.className) }
                >
                    {this.navTabs(children, targetTabId)}

                    <DeferredRender className="tab-content" loadingState={<LoadingIndicator isLoading={true} center={true} size={"big"}/>}>
                        {arr}
                    </DeferredRender>

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
           border: 0, overflow: "hidden" as "hidden"
        } : {};

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

        const navButtonStyle : string = this.props.tabButtonStyle || 'tabs';

        return (
            <ul
                ref={this.navTabsRefHandler.bind(this)}
                className={classnames('nav',`nav-${navButtonStyle}`)}
                style={navBarStyle}
            >
                {prev}
                {pages[this.state.currentPage - 1]}
                {next}
                {// TODO this doesn't always calculate the page size properly after resize, disabling for now
                // this.props.enablePagination && (
                //     <ReactResizeDetector handleWidth={true} onResize={this.initOnResize.bind(this)()} />
                // )
                }
            </ul>
        );
    }

    protected tabPages(children: React.ReactElement<IMSKTabProps>[], effectiveActiveTab: string): JSX.Element[][]
    {
        const pages: JSX.Element[][] = [[]];
        let currentPage = 1;

        React.Children.forEach(children, (tab: React.ReactElement<IMSKTabProps>) => {
            if (!tab || tab.props.hide) {
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
                    <a className={classnames(`tabAnchor_${tab.props.id}`)} onClick={this.setActiveTab.bind(this,tab.props.id, tab.props.datum)} style={tab.props.anchorStyle}>{tab.props.linkText}</a>
                </li>
            );
        });

        return pages;
    }

    componentDidMount() {

        setTimeout(() => {
            // if there are page breaks, it means that page calculations already performed
            if (this.state.pageBreaks.length  === 0) {
                this.initPaging();
            }
        },1);

    }

    initPaging() {
        if (this.props.enablePagination)
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
