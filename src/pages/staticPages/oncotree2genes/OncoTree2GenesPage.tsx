import * as React from 'react';
import Helmet from 'react-helmet';
import _ from 'lodash';
import { PageLayout } from '../../../shared/components/PageLayout/PageLayout';
import { getClient } from 'shared/api/cbioportalClientInstance';

const O2GL_GENE_MAP: {
    [code: string]: string[];
} = require('pages/studyView/oncotree2genes/o2gl.json');
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
    const [filter, setFilter] = React.useState('');
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

    const f = filter.trim().toUpperCase();
    const rows = Object.keys(O2GL_GENE_MAP)
        .sort()
        .map(code => ({
            code,
            name: codeToName[code] || '',
            genes: O2GL_GENE_MAP[code] || [],
        }))
        .filter(
            r =>
                !f ||
                r.code.includes(f) ||
                r.name.toUpperCase().includes(f) ||
                r.genes.some(g => g.toUpperCase().includes(f))
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
                <input
                    type="text"
                    className="form-control"
                    placeholder="Filter by code, cancer type, or gene…"
                    value={filter}
                    onChange={e => setFilter(e.target.value)}
                    style={{ maxWidth: 360, marginBottom: 10 }}
                />
                <div style={{ color: '#888', marginBottom: 6 }}>
                    {rows.length} of {Object.keys(O2GL_GENE_MAP).length} codes
                </div>
                <table className="table table-striped table-bordered">
                    <thead>
                        <tr>
                            <th style={{ width: 90 }}>Code</th>
                            <th style={{ width: 230 }}>Cancer type</th>
                            <th style={{ width: 60 }}># genes</th>
                            <th>Genes</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map(r => (
                            <tr key={r.code}>
                                <td>{r.code}</td>
                                <td>{r.name}</td>
                                <td>{r.genes.length}</td>
                                <td>{r.genes.join(', ')}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </PageLayout>
    );
};

export default OncoTree2GenesPage;
