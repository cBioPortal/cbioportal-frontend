import * as React from 'react';
import Helmet from 'react-helmet';
import _ from 'lodash';
import { PageLayout } from '../../../shared/components/PageLayout/PageLayout';
import { getClient } from 'shared/api/cbioportalClientInstance';
import LazyMobXTable, {
    Column,
} from 'shared/components/lazyMobXTable/LazyMobXTable';

const O2GL_GENE_MAP: {
    [code: string]: string[];
} = require('pages/studyView/oncotree2genes/o2gl.json');

interface O2glRow {
    code: string;
    name: string;
    geneCount: number;
    genes: string[];
}

class O2glTable extends LazyMobXTable<O2glRow> {}

const COLUMNS: Column<O2glRow>[] = [
    {
        name: 'Code',
        render: r => <span>{r.code}</span>,
        sortBy: r => r.code,
        filter: (r, s, up) => r.code.toUpperCase().includes(up || ''),
        download: r => r.code,
        width: 90,
    },
    {
        name: 'Cancer type',
        render: r => <span>{r.name}</span>,
        sortBy: r => r.name,
        filter: (r, s, up) => r.name.toUpperCase().includes(up || ''),
        download: r => r.name,
        width: 240,
    },
    {
        name: '# genes',
        align: 'right',
        render: r => <span>{r.geneCount}</span>,
        sortBy: r => r.geneCount,
        download: r => String(r.geneCount),
        width: 80,
    },
    {
        name: 'Genes',
        render: r => <span>{r.genes.join(', ')}</span>,
        sortBy: r => r.genes.join(', '),
        filter: (r, s, up) =>
            r.genes.some(g => g.toUpperCase().includes(up || '')),
        download: r => r.genes.join(' '),
    },
];
const REPO_URL = 'https://github.com/SuhasiniLulla/OncoTree2Genes-LLM';
const ONCOTREE_BASE =
    'https://inodb.github.io/oncotree/?version=oncotree_latest_stable';

// Full per-code annotations (gene count + gene list) for the embedded OncoTree.
// Sent via postMessage so there is no URL-length limit.
const ONCOTREE_ANNOTATIONS: {
    [code: string]: { value: number; genes: string[] };
} = _.mapValues(O2GL_GENE_MAP, genes => ({
    value: (genes || []).length,
    genes: genes || [],
}));

const OncoTree2GenesPage: React.FunctionComponent<{}> = () => {
    const [codeToName, setCodeToName] = React.useState<{
        [code: string]: string;
    }>({});
    const iframeRef = React.useRef<HTMLIFrameElement>(null);

    // Push the full annotations to the embedded OncoTree once it signals ready.
    React.useEffect(() => {
        function onMessage(event: MessageEvent) {
            if (
                event.data &&
                event.data.type === 'oncotree-ready' &&
                iframeRef.current &&
                iframeRef.current.contentWindow
            ) {
                iframeRef.current.contentWindow.postMessage(
                    {
                        type: 'oncotree-annotations',
                        annotations: ONCOTREE_ANNOTATIONS,
                    },
                    '*'
                );
            }
        }
        window.addEventListener('message', onMessage);
        return () => window.removeEventListener('message', onMessage);
    }, []);

    React.useEffect(() => {
        getClient()
            .getAllCancerTypesUsingGET({})
            .then(types => {
                const m: { [code: string]: string } = {};
                types.forEach(t => {
                    if (t.name) {
                        m[t.cancerTypeId.toUpperCase()] = t.name;
                    }
                });
                setCodeToName(m);
            })
            .catch(() => {});
    }, []);

    const data: O2glRow[] = React.useMemo(
        () =>
            Object.keys(O2GL_GENE_MAP)
                .sort()
                .map(code => {
                    const genes = O2GL_GENE_MAP[code] || [];
                    return {
                        code,
                        name: codeToName[code] || '',
                        geneCount: genes.length,
                        genes,
                    };
                }),
        [codeToName]
    );

    return (
        <PageLayout className={'whiteBackground staticPage'} hideFooter={true}>
            <Helmet>
                <title>
                    {'cBioPortal for Cancer Genomics::OncoTree2Genes-LLM'}
                </title>
            </Helmet>
            <div style={{ padding: '15px 20px', maxWidth: 1100 }}>
                <h1>OncoTree2Genes-LLM (O2GL)</h1>
                <p>
                    OncoTree2Genes-LLM is a large-language-model-generated
                    mapping from{' '}
                    <a href="https://oncotree.info" target="_blank">
                        OncoTree
                    </a>{' '}
                    cancer type codes to the genes most relevant for each cancer
                    type. Method and dataset is further described at{' '}
                    <a href={REPO_URL} target="_blank">
                        github.com/SuhasiniLulla/OncoTree2Genes-LLM
                    </a>
                    .
                </p>
                <p>
                    The full mapping covers {Object.keys(O2GL_GENE_MAP).length}{' '}
                    OncoTree codes. Browse the genes on the OncoTree below, or
                    use the table that follows.
                </p>
                <iframe
                    ref={iframeRef}
                    src={ONCOTREE_BASE}
                    title="OncoTree2Genes-LLM on OncoTree"
                    style={{
                        width: '100%',
                        height: 600,
                        border: '1px solid #ddd',
                        marginBottom: 15,
                    }}
                />
                <O2glTable
                    data={data}
                    columns={COLUMNS}
                    initialSortColumn="Code"
                    initialItemsPerPage={50}
                    showColumnVisibility={false}
                />
            </div>
        </PageLayout>
    );
};

export default OncoTree2GenesPage;
