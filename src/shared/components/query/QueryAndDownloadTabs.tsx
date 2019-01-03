import * as React from 'react';
import {Tabs, Tab, default as ReactBootstrap} from 'react-bootstrap';
import * as styles_any from './styles/styles.module.scss';
import {observer} from 'mobx-react';
import QueryContainer from "./QueryContainer";
import { QueryStore} from "./QueryStore";
import {observable} from "mobx";

const styles = styles_any as {
	QueryAndDownloadTabs: string,
};

const DOWNLOAD = 'download';
const QUERY = 'query';

interface IQueryAndDownloadTabsProps
{
	onSubmit?:()=>void;
	showDownloadTab?:boolean;
    getQueryStore:()=>QueryStore;
    showAlerts?:boolean;
}


@observer
export default class QueryAndDownloadTabs extends React.Component<IQueryAndDownloadTabsProps, {}>
{

	constructor(props:IQueryAndDownloadTabsProps){
		super();

		// the query store models a single use of the query component and therefor a new one should
		// be made when the component is instantiated and it should be destroyed when the component unmounts
		// we use a callback because we want to create the query store at the moment the query form is instantiated/shown
		// because it needs the state of route at that moment (so that on the results page it reflects the current query)
		this.store = props.getQueryStore();
	}

	@observable.ref store: QueryStore;

	onSelectTab = (eventKey:string) =>
	{
		this.store.forDownloadTab = eventKey === DOWNLOAD;
		this.store.selectableSelectedStudyIds = [];
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

				<Tabs
					id='QueryAndDownloadTabs'
					animation={false}
					activeKey={this.store.forDownloadTab ? DOWNLOAD : QUERY}
					onSelect={this.onSelectTab as ReactBootstrap.SelectCallback}
				>

					<Tab eventKey='query' title="Query"/>

					{
						(this.props.showDownloadTab !== false) && (<Tab eventKey='download' title="Download Data"/>)
					}

				</Tabs>
				<QueryContainer onSubmit={this.props.onSubmit} store={this.store}/>
			</div>
		);
	}
}
