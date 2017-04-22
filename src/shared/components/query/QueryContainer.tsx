import * as _ from "lodash";
import * as React from "react";
import * as ReactBootstrap from 'react-bootstrap';
import Spinner from "react-spinkit";
import Dictionary = _.Dictionary;
import CancerStudySelector from "./CancerStudySelector";
import {FlexRow, FlexCol} from "../flexbox/FlexBox";
import Radio = ReactBootstrap.Radio;
import Checkbox = ReactBootstrap.Checkbox;
import {Select, StateToggle} from "../ExperimentalControls";
import * as styles_any from './styles.module.scss';
import firstDefinedValue from "../../lib/firstDefinedValue";
import GeneticProfileSelector from "./GeneticProfileSelector";
import {IGeneticProfileSelectorState} from "./GeneticProfileSelector";
import {observer} from "../../../../node_modules/mobx-react/custom";
import queryStore from "./QueryStore";
import DevTools from "../../../../node_modules/mobx-react-devtools/index";

const styles = styles_any as {
	QueryContainer: string,
	CancerStudySelector: string,
};

export interface IQueryContainerProps
{
}

export type IQueryContainerState = {
} & IGeneticProfileSelectorState;

@observer
export default class QueryContainer extends React.Component<IQueryContainerProps, IQueryContainerState>
{
    constructor(props:IQueryContainerProps)
    {
        super(props);
        this.state = {};
    }

    render():JSX.Element
    {
        if (queryStore.cancerTypes.status == 'fetching' || queryStore.cancerStudies.status == 'fetching')
            return <Spinner/>;
        if (!queryStore.cancerTypes.result || !queryStore.cancerStudies.result)
            return <span>No data</span>;

        return (
            <FlexCol padded flex={1} className={styles.QueryContainer}>

                <CancerStudySelector/>

				{!!(queryStore.geneticProfiles.result) && (
					<GeneticProfileSelector
						profiles={queryStore.geneticProfiles.result}
						selectedProfileIds={this.state.selectedProfileIds}
					/>
				)}
            </FlexCol>
        );
    }
}
