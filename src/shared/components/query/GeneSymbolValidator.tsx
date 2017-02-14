import * as _ from 'lodash';
import * as React from 'react';
import queryStore from "./QueryStore";
import * as styles_any from './styles.module.scss';
import {toJS, observable, autorunAsync, reaction, action, computed, whyRun, expr} from "../../../../node_modules/mobx/lib/mobx";
import {observer} from "../../../../node_modules/mobx-react/index";
import {FlexRow, FlexCol} from "../flexbox/FlexBox";
import gene_lists from './gene_lists';
import oql_parser from '../../lib/oql/oql-parser';

@observer
export default class GeneSymbolValidator extends React.Component<{}, {}>
{
	get store()
	{
		return queryStore;
	}

	disposeAutorun = autorunAsync('validateGenes', () => {
		try
		{
			this.results = oql_parser.parse(this.store.geneSet);
		}
		catch (e)
		{
			this.error = e;
		}
	}, 500);

	@observable.ref results:ReadonlyArray<any> = [];
	@observable.ref error?:Error = undefined;

	render()
	{
		return (
			<div>{JSON.stringify(this.results)}</div>
		);
	}

	componentWillUnmount()
	{
		this.disposeAutorun();
	}
}