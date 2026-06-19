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

// All oncotree codes mapped to their gene counts. Kept as counts (not the full
// gene lists) and base64url-encoded (the viz decodes base64) to keep the
// annotation URL short; the gene names live in the table below.
function getOncotreeCountsUrl(): string {
    const counts: { [code: string]: number } = {};
    Object.keys(O2GL_GENE_MAP).forEach(code => {
        counts[code] = (O2GL_GENE_MAP[code] || []).length;
    });
    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(counts))))
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
    return `${ONCOTREE_BASE}&annotations=${encoded}`;
}

const OncoTree2GenesPage: React.FunctionComponent<{}> = () => {
    const [codeToName, setCodeToName] = React.useState<{
        [code: string]: string;
    }>({});
    const [filter, setFilter] = React.useState('');

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
                    The full mapping is {Object.keys(O2GL_GENE_MAP).length}{' '}
                    OncoTree codes. Browse the per-code gene counts on the
                    OncoTree:{' '}
                    <a href={getOncotreeCountsUrl()} target="_blank">
                        view on OncoTree
                    </a>
                    .
                </p>
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
