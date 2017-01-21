import * as _ from 'lodash';
import * as React from 'react';
import client from "../../api/cbioportalClientInstance";
import {observer} from "../../../../node_modules/mobx-react/index";
import {observe, toJS, observable, action, computed} from "../../../../node_modules/mobx/lib/mobx";
import RemoteData from "../../api/RemoteData";

@observer
export default class MobxTest extends React.Component<any, any>
{
	constructor(props: any)
	{
		super(props);
	}

	rpc = new RemoteData(client, client.getAllCancerTypesUsingGET, {});

	render()
	{
		return (
			<div>{JSON.stringify(this.rpc.result)}</div>
		);
	}
}


