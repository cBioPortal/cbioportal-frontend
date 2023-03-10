import { MSKTab, MSKTabs } from 'shared/components/MSKTabs/MSKTabs';
import { ResultsViewPathwaysSubTab } from 'pages/resultsView/ResultsViewPageHelpers';
import { getServerConfig } from 'config/config';
import ResultsViewPathwayMapper from 'pages/resultsView/pathwayMapper/ResultsViewPathwayMapper';
import IFrameLoader from 'shared/components/iframeLoader/IFrameLoader';
import * as React from 'react';
import { observer } from 'mobx-react';
import { ResultsViewPageStore } from 'pages/resultsView/ResultsViewPageStore';
import ResultsViewURLWrapper from 'pages/resultsView/ResultsViewURLWrapper';
import { AppStore } from 'AppStore';
import { useLocalObservable } from 'mobx-react-lite';
import { runInAction } from 'mobx';

interface IPathwayMapperContainerProps {
    resultsViewPageStore: ResultsViewPageStore;
    appStore: AppStore;
    urlWrapper: ResultsViewURLWrapper;
}

const PathWayMapperContainer: React.FunctionComponent<IPathwayMapperContainerProps> = observer(
    function({
        resultsViewPageStore,
        appStore,
        urlWrapper,
    }: IPathwayMapperContainerProps) {
        const store = useLocalObservable(() => ({
            activeTab:
                urlWrapper.query.pathways_source ||
                ResultsViewPathwaysSubTab.PATHWAY_MAPPER,
        }));

        return (
            <>
                <span
                    style={{
                        float: 'left',
                        paddingRight: 10,
                    }}
                >
                    Choose Pathway Source:
                </span>
                <MSKTabs
                    id="pathwaysPageTabs"
                    activeTabId={store.activeTab}
                    onTabClick={(id: ResultsViewPathwaysSubTab) => {
                        runInAction(() => {
                            store.activeTab = id;
                            urlWrapper.updateURL({
                                pathways_source: id,
                            });
                        });
                    }}
                    className="pillTabs resultsPagePathwaysTabs"
                    arrowStyle={{ 'line-height': 0.8 }}
                    tabButtonStyle="pills"
                    unmountOnHide={true}
                >
                    <MSKTab
                        key={ResultsViewPathwaysSubTab.PATHWAY_MAPPER}
                        id={ResultsViewPathwaysSubTab.PATHWAY_MAPPER}
                        linkText={ResultsViewPathwaysSubTab.PATHWAY_MAPPER}
                        linkTooltip={
                            <div style={{ maxWidth: 400 }}>
                                <a
                                    href="https://www.pathwaymapper.org/"
                                    target="_blank"
                                >
                                    PathwayMapper
                                </a>{' '}
                                shows pathways from over fifty cancer related
                                pathways and provides a collaborative web-based
                                editor for creating new ones.
                            </div>
                        }
                        hide={!getServerConfig().show_pathway_mapper}
                    >
                        <ResultsViewPathwayMapper
                            store={resultsViewPageStore}
                            appStore={appStore}
                            urlWrapper={resultsViewPageStore.urlWrapper}
                        />
                    </MSKTab>
                    <MSKTab
                        key={ResultsViewPathwaysSubTab.NDEX}
                        id={ResultsViewPathwaysSubTab.NDEX}
                        linkText={ResultsViewPathwaysSubTab.NDEX}
                        linkTooltip={
                            <div style={{ maxWidth: 400 }}>
                                <a
                                    href="https://www.ndexbio.org/"
                                    target="_blank"
                                >
                                    NDEx
                                </a>{' '}
                                shows 966 pathways:
                                <ul>
                                    <li>
                                        211 from{' '}
                                        <a
                                            href="https://www.nlm.nih.gov/research/umls/sourcereleasedocs/current/NCI_PID/index.html"
                                            target="_blank"
                                        >
                                            NCI-PID
                                        </a>
                                    </li>
                                    <li>
                                        69 from{' '}
                                        <a
                                            href="https://signor.uniroma2.it/"
                                            target="_blank"
                                        >
                                            Signor
                                        </a>
                                    </li>
                                    <li>
                                        686 from{' '}
                                        <a
                                            href="https://www.wikipathways.org/"
                                            target="_blank"
                                        >
                                            WikiPathways
                                        </a>
                                    </li>
                                </ul>
                            </div>
                        }
                        hide={
                            !getServerConfig().show_ndex ||
                            !resultsViewPageStore.remoteNdexUrl.isComplete ||
                            !resultsViewPageStore.remoteNdexUrl.result
                        }
                    >
                        <IFrameLoader
                            height={800}
                            url={`${resultsViewPageStore.remoteNdexUrl.result}`}
                        />
                    </MSKTab>
                </MSKTabs>
            </>
        );
    }
);

export default PathWayMapperContainer;
