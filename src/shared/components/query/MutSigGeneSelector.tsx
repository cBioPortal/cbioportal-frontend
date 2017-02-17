import * as _ from 'lodash';
import * as React from 'react';
import {GeneticProfile} from "../../api/CBioPortalAPI";
import LabeledCheckbox from "../labeledCheckbox/LabeledCheckbox";
import FontAwesome from "react-fontawesome";
import * as styles_any from './styles.module.scss';
import queryStore from "./QueryStore";
import {toJS, computed} from "../../../../node_modules/mobx/lib/mobx";
import {observer} from "../../../../node_modules/mobx-react/custom";

const styles = styles_any as {
	MutSigGeneSelector: string,
};

@observer
export default class MutSigGeneSelector extends React.Component<{}, {}>
{
	get store()
	{
		return queryStore;
	}

	render()
	{
		return (
			<div className={styles.MutSigGeneSelector}>
				{this.store.mutSigForSingleStudy.result.length}
			</div>
		);
	}
}
