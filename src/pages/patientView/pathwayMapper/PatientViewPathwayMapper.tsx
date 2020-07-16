import * as React from 'react';
import _ from 'lodash';
import { PatientViewPageStore } from '../clinicalInformation/PatientViewPageStore';
//import { addGenesToQuery, ResultsViewTab } from '../PatientViewPageHelpers';
import 'pathway-mapper/dist/base.css';
import PathwayMapperTable, { IPathwayMapperTable } from './PathwayMapperTable';
import { observer } from 'mobx-react';
import autobind from 'autobind-decorator';
import {
    observable,
    computed,
    action,
    reaction,
    IReactionDisposer,
} from 'mobx';
import { Row } from 'react-bootstrap';

import { AppStore } from 'AppStore';
import { remoteData } from 'cbioportal-frontend-commons';
import { fetchGenes } from 'shared/lib/StoreUtils';
import OqlStatusBanner from 'shared/components/banners/OqlStatusBanner';
import { getAlterationData } from 'shared/components/oncoprint/OncoprintUtils';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer, toast } from 'react-toastify';
//import { initStore } from '../PatientViewPage';
import ResultsViewURLWrapper from '../PatientViewUrlWrapper';

import 'cytoscape-panzoom/cytoscape.js-panzoom.css';
import 'cytoscape-navigator/cytoscape.js-navigator.css';
import 'react-toastify/dist/ReactToastify.css';
import styles from './pathwayMapper.module.scss';
import PathwayMapper, { ICBioData } from 'pathway-mapper';
import AlterationFilterWarning from 'shared/components/banners/AlterationFilterWarning';

interface IResultsViewPathwayMapperProps {
    store: PatientViewPageStore;
    appStore: AppStore;
    urlWrapper: ResultsViewURLWrapper;
}
@observer
export default class ResultsViewPathwayMapper extends React.Component<
    IResultsViewPathwayMapperProps
> {
    private accumulatedAlterationFrequencyDataForNonQueryGenes: ICBioData[];
    private readonly accumulatedValidGenes: { [gene: string]: boolean };

    @observable
    private selectedPathway = '';

    @observable
    private newGenesFromPathway: string[];

    @observable
    private activeToasts: React.ReactText[];

    private toastReaction: IReactionDisposer;

    private readonly validNonQueryGenes = remoteData<string[]>({
        invoke: async () => {
            const genes = await fetchGenes(this.newGenesFromPathway);

            return genes.map(gene => gene.hugoGeneSymbol);
        },
        onResult: (genes: string[]) => {
            // show loading text only if there are actually new genes to load
            if (genes.length > 0) {
                const tId = toast('Loading alteration data...', {
                    autoClose: false,
                    draggable: false,
                    position: 'bottom-left',
                    className: styles.toast,
                });

                this.activeToasts.push(tId);
            }
        },
    });
}
