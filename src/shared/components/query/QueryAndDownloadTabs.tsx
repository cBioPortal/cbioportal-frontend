import * as React from 'react';
import {Tabs, Tab, default as ReactBootstrap} from 'react-bootstrap';
import * as styles_any from './styles/styles.module.scss';
import {observer} from 'mobx-react';
import QueryContainer from "./QueryContainer";
import { QueryStore} from "./QueryStore";
import {observable} from "mobx";
import {MSKTab, MSKTabs} from "../MSKTabs/MSKTabs";
import QuickSearch from "./quickSearch/QuickSearch";
import HomePageSummary from "./quickSearch/HomePageSummary";
import getBrowserWindow from "../../lib/getBrowserWindow";
import autobind from "autobind-decorator";

const styles = styles_any as {
	QueryAndDownloadTabs: string,
};

const ADVANCED = 'advanced';
const QUICK_SEARCH_TAB_ID = 'quickSearch';
const QUICK_SEARCH_LS_KEY = 'defaultHomePageTab';

interface IQueryAndDownloadTabsProps
{
	onSubmit?:()=>void;
	showQuickSearchTab?:boolean;
    getQueryStore:()=>QueryStore;
    showAlerts?:boolean;
}


@observer
export default class QueryAndDownloadTabs extends React.Component<IQueryAndDownloadTabsProps, {}>
{

	constructor(props:IQueryAndDownloadTabsProps){
		super();

		if (getBrowserWindow().localStorage.getItem(QUICK_SEARCH_LS_KEY) === QUICK_SEARCH_TAB_ID) {
			this.activeTabId = getBrowserWindow().localStorage.getItem(QUICK_SEARCH_LS_KEY);
		}

		// the query store models a single use of the query component and therefor a new one should
		// be made when the component is instantiated and it should be destroyed when the component unmounts
		// we use a callback because we want to create the query store at the moment the query form is instantiated/shown
		// because it needs the state of route at that moment (so that on the results page it reflects the current query)
		this.store = props.getQueryStore();
	}

	@observable.ref store: QueryStore;

	@observable activeTabId:string;

	public get quickSearchDefaulted(){
        return getBrowserWindow().localStorage.getItem(QUICK_SEARCH_LS_KEY) === QUICK_SEARCH_TAB_ID;
	}

	@autobind
	setDefaultTab(tabId:string|undefined){
		// right now we only care if quick search or NOT
		getBrowserWindow().localStorage.defaultHomePageTab =
			(tabId === QUICK_SEARCH_TAB_ID) ? QUICK_SEARCH_TAB_ID : undefined;
	}

	@autobind
	onSelectTab(tabId:string)
	{
		this.activeTabId = tabId;
	}

	render()
	{
		return (
			<div className={styles.QueryAndDownloadTabs}>
				{
					(this.props.showAlerts && this.store.genes.isComplete && this.store.genes.result.suggestions.length > 0) && (
                        <div className="alert alert-danger"><i className={"fa fa-exclamation-triangle"} /> Your query has invalid or out-dated gene symbols. Please correct below.</div>
					)
				}

				<MSKTabs activeTabId={this.activeTabId} onTabClick={this.onSelectTab} className={"mainTabs"}>
					<MSKTab id={"advanced"} linkText={"Query"} onTabDidMount={()=>this.setDefaultTab(undefined)}>
                        <QueryContainer onSubmit={this.props.onSubmit} store={this.store}/>
					</MSKTab>
					<MSKTab id={QUICK_SEARCH_TAB_ID} linkText={<span>Quick Search <strong className={"beta-text"}>Beta!</strong></span>}  onTabDidMount={()=>this.setDefaultTab(QUICK_SEARCH_TAB_ID)}>
                        <div>
							<QuickSearch/>
                        </div>
					</MSKTab>
				</MSKTabs>
			</div>
		);
	}
}
