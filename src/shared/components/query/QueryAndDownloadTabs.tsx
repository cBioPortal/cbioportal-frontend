import * as React from 'react';
import {Tabs, Tab, default as ReactBootstrap} from 'react-bootstrap';
import * as styles_any from './styles/styles.module.scss';
import {observer} from 'mobx-react';
import QueryContainer from "./QueryContainer";
import { QueryStore} from "./QueryStore";

const styles = styles_any as {
	QueryAndDownloadTabs: string,
};

const DOWNLOAD = 'download';
const QUERY = 'query';

interface IQueryAndDownloadTabsProps
{
	store:QueryStore;
	onSubmit?:()=>void;
	showDownloadTab?:boolean;
}


@observer
export default class QueryAndDownloadTabs extends React.Component<IQueryAndDownloadTabsProps, {}>
{

	get store()
	{
		return this.props.store;
	}

	onSelectTab = (eventKey:string) =>
	{
		this.store.forDownloadTab = eventKey === DOWNLOAD;
	}

	render()
	{
		return (
			<div className={styles.QueryAndDownloadTabs}>
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
				<QueryContainer onSubmit={this.props.onSubmit} store={this.props.store}/>
			</div>
		);
	}
}
