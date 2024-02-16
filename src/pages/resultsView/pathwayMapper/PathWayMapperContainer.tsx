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
import { runInAction, autorun } from 'mobx';
import request from 'superagent';
import { remoteData } from 'cbioportal-frontend-commons';

interface IPathwayMapperContainerProps {
    resultsViewPageStore: ResultsViewPageStore;
    appStore: AppStore;
    urlWrapper: ResultsViewURLWrapper;
}

interface ResultItem {
    databases: DatabaseItem[];
}
interface DatabaseItem {
    name: string;
    numberOfNetworks: string;
    url: string;
}
interface ApiResponse {
    results: ResultItem[];
}

function makeRemoteData() {
    return remoteData<DatabaseItem[]>({
        await: () => [],
        invoke: async () => {
            try {
                const getResponse = await request
                    .get(
                        'https://iquery-cbio-dev.ucsd.edu/integratedsearch/v1/source'
                    )
                    .query({
                        param1: 'value1',
                        param2: 'value2',
                        param3: 'value3',
                    })
                    .set('Accept', 'application/json')
                    .timeout(60000)
                    .redirects(0);
                const jsonData: ApiResponse = getResponse.body;
                const extractedData: DatabaseItem[] = jsonData.results[0].databases.map(
                    result => ({
                        name: result.name,
                        numberOfNetworks: parseInt(
                            result.numberOfNetworks,
                            10
                        ).toString(),
                        url: result.url,
                    })
                );
                return extractedData;
            } catch (error) {
                console.error('Error fetching tooltip content:', error);
                return [];
            }
        },
        default: [],
    });
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
            tooltipContent: null as DatabaseItem[] | null,
            isFetchingTooltip: false,
            tooltipData: makeRemoteData(),
        }));

        autorun(() => {
            if (store.tooltipData.isComplete) {
                runInAction(() => {
                    store.tooltipContent = store.tooltipData.result;
                    store.isFetchingTooltip = false;
                });
            }
        });

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
                    {/*<MSKTab
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
                                shows 1,352 pathways:
                                <ul>
                                    <li>
                                        207 from{' '}
                                        <a
                                            href="https://www.nlm.nih.gov/research/umls/sourcereleasedocs/current/NCI_PID/index.html"
                                            target="_blank"
                                        >
                                            NCI-PID
                                        </a>
                                    </li>
                                    <li>
                                        83 from{' '}
                                        <a
                                            href="https://signor.uniroma2.it/"
                                            target="_blank"
                                        >
                                            Signor
                                        </a>
                                    </li>
                                    <li>
                                        675 from{' '}
                                        <a
                                            href="https://www.wikipathways.org/"
                                            target="_blank"
                                        >
                                            WikiPathways
                                        </a>
                                        <li>
                                            11 from{' '}
                                            <a
                                                href="http://cptac.wikipathways.org/"
                                                target="_blank"
                                            >
                                                CPTAC
                                            </a>
                                        </li>
                                        <li>
                                            30 from{' '}
                                            <a
                                                href="http://cptac.wikipathways.org/"
                                                target="_blank"
                                            >
                                                CCMI
                                            </a>
                                        </li>
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
                    </MSKTab>*/}
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
                                shows 1,352 pathways:
                                {store.tooltipData.isPending ? (
                                    <div>Loading tooltip content...</div>
                                ) : (
                                    <div>
                                        {store.tooltipData.result && (
                                            <ul>
                                                {store.tooltipData.result.map(
                                                    (
                                                        item: DatabaseItem,
                                                        index: number
                                                    ) => (
                                                        <li key={index}>
                                                            {
                                                                item.numberOfNetworks
                                                            }{' '}
                                                            from{' '}
                                                            <a
                                                                href={item.url}
                                                                target="_blank"
                                                            >
                                                                {item.name}
                                                            </a>
                                                        </li>
                                                    )
                                                )}
                                            </ul>
                                        )}
                                    </div>
                                )}
                            </div>
                        }
                        hide={
                            !getServerConfig().show_ndex ||
                            !resultsViewPageStore.remoteNdexUrl.isComplete ||
                            !resultsViewPageStore.remoteNdexUrl.result
                        }
                    >
                        {store.tooltipData && (
                            <IFrameLoader
                                height={800}
                                url={`${resultsViewPageStore.remoteNdexUrl.result}`}
                            />
                        )}
                    </MSKTab>
                </MSKTabs>
            </>
        );
    }
);

export default PathWayMapperContainer;
