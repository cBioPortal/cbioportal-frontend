import * as React from 'react';
import Helmet from 'react-helmet';
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
    // current (uppercased) search term, so the Genes cell can highlight matches
    term?: string;
}

class O2glTable extends LazyMobXTable<O2glRow> {}

const HL_STYLE: React.CSSProperties = {
    backgroundColor: '#fff2a8',
    fontWeight: 600,
};

// Highlight the matching substring of `text` for the (uppercased) search term.
function highlight(text: string, term: string): React.ReactNode {
    if (!term) {
        return text;
    }
    const idx = text.toUpperCase().indexOf(term);
    if (idx < 0) {
        return text;
    }
    return (
        <>
            {text.slice(0, idx)}
            <span style={HL_STYLE}>{text.slice(idx, idx + term.length)}</span>
            {text.slice(idx + term.length)}
        </>
    );
}

const COLUMNS: Column<O2glRow>[] = [
    {
        name: 'Code',
        render: r => <span>{highlight(r.code, r.term || '')}</span>,
        sortBy: r => r.code,
        filter: (r, s, up) => r.code.toUpperCase().includes(up || ''),
        download: r => r.code,
        width: 90,
    },
    {
        name: 'Cancer type',
        render: r => <span>{highlight(r.name, r.term || '')}</span>,
        sortBy: r => r.name,
        filter: (r, s, up) => r.name.toUpperCase().includes(up || ''),
        download: r => r.name,
        width: 240,
    },
    {
        name: '# genes',
        align: 'right',
        render: r => <div style={{ textAlign: 'right' }}>{r.geneCount}</div>,
        sortBy: r => r.geneCount,
        download: r => String(r.geneCount),
        width: 80,
    },
    {
        name: 'Genes',
        render: r => (
            <span>
                {r.genes.map((g, i) => (
                    <React.Fragment key={g}>
                        {i > 0 ? ', ' : ''}
                        {highlight(g, r.term || '')}
                    </React.Fragment>
                ))}
            </span>
        ),
        sortBy: r => r.genes.join(', '),
        filter: (r, s, up) =>
            r.genes.some(g => g.toUpperCase().includes(up || '')),
        download: r => r.genes.join(' '),
    },
];
const REPO_URL = 'https://github.com/SuhasiniLulla/OncoTree2Genes-LLM';
const ONCOTREE_BASE = 'https://inodb.github.io/oncotree/?embed=1';

// Full per-code annotations (gene count + gene list) for the embedded OncoTree,
// sent once via postMessage; search is driven separately via "oncotree-search".
const ONCOTREE_ANNOTATIONS: {
    [code: string]: { value: number; genes: string[] };
} = {};
Object.keys(O2GL_GENE_MAP).forEach(code => {
    const genes = O2GL_GENE_MAP[code] || [];
    ONCOTREE_ANNOTATIONS[code] = { value: genes.length, genes };
});

function matchesSearch(r: O2glRow, up: string): boolean {
    return (
        !up ||
        r.code.toUpperCase().includes(up) ||
        r.name.toUpperCase().includes(up) ||
        r.genes.some(g => g.toUpperCase().includes(up))
    );
}

// Inverse mapping: gene -> oncotree codes that include it (for the per-gene
// table at the bottom).
const GENE_TO_CODES: { [gene: string]: string[] } = {};
Object.keys(O2GL_GENE_MAP).forEach(code => {
    (O2GL_GENE_MAP[code] || []).forEach(g => {
        (GENE_TO_CODES[g] = GENE_TO_CODES[g] || []).push(code);
    });
});

interface GeneRow {
    gene: string;
    cancerTypeCount: number;
    codes: string[];
    term?: string;
}

class GeneTable extends LazyMobXTable<GeneRow> {}

const GENE_COLUMNS: Column<GeneRow>[] = [
    {
        name: 'Gene',
        render: r => <span>{highlight(r.gene, r.term || '')}</span>,
        sortBy: r => r.gene,
        filter: (r, s, up) => r.gene.toUpperCase().includes(up || ''),
        download: r => r.gene,
        width: 110,
    },
    {
        name: '# cancer types',
        align: 'right',
        render: r => (
            <div style={{ textAlign: 'right' }}>{r.cancerTypeCount}</div>
        ),
        sortBy: r => r.cancerTypeCount,
        download: r => String(r.cancerTypeCount),
        width: 120,
    },
    {
        name: 'Cancer types',
        render: r => (
            <span>
                {r.codes.map((c, i) => (
                    <React.Fragment key={c}>
                        {i > 0 ? ', ' : ''}
                        {highlight(c, r.term || '')}
                    </React.Fragment>
                ))}
            </span>
        ),
        sortBy: r => r.codes.join(', '),
        filter: (r, s, up) =>
            r.codes.some(c => c.toUpperCase().includes(up || '')),
        download: r => r.codes.join(' '),
    },
];

function geneMatches(
    r: GeneRow,
    up: string,
    codeToName: { [code: string]: string }
): boolean {
    return (
        !up ||
        r.gene.toUpperCase().includes(up) ||
        r.codes.some(
            c =>
                c.includes(up) ||
                (codeToName[c] || '').toUpperCase().includes(up)
        )
    );
}

const OncoTree2GenesPage: React.FunctionComponent<{}> = () => {
    const [codeToName, setCodeToName] = React.useState<{
        [code: string]: string;
    }>({});
    const [search, setSearch] = React.useState('');
    const [debouncedSearch, setDebouncedSearch] = React.useState('');
    const [treeReady, setTreeReady] = React.useState(false);
    const iframeRef = React.useRef<HTMLIFrameElement>(null);

    // Debounce the search so we don't filter/post on every keystroke.
    React.useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(search), 250);
        return () => clearTimeout(t);
    }, [search]);

    // Track when the embedded OncoTree is ready to receive annotations.
    React.useEffect(() => {
        function onMessage(event: MessageEvent) {
            if (event.data && event.data.type === 'oncotree-ready') {
                setTreeReady(true);
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

    const up = debouncedSearch.trim().toUpperCase();
    const filteredData = React.useMemo(
        () =>
            (up ? data.filter(r => matchesSearch(r, up)) : data).map(r => ({
                ...r,
                term: up,
            })),
        [data, up]
    );
    const uniqueGeneCount = React.useMemo(() => {
        const s = new Set<string>();
        filteredData.forEach(r => r.genes.forEach(g => s.add(g)));
        return s.size;
    }, [filteredData]);

    const geneData: GeneRow[] = React.useMemo(
        () =>
            Object.keys(GENE_TO_CODES)
                .sort()
                .map(gene => {
                    const codes = GENE_TO_CODES[gene].slice().sort();
                    return { gene, cancerTypeCount: codes.length, codes };
                }),
        []
    );
    const filteredGeneData = React.useMemo(
        () =>
            (up
                ? geneData.filter(r => geneMatches(r, up, codeToName))
                : geneData
            ).map(r => ({ ...r, term: up })),
        [geneData, up, codeToName]
    );

    // Post the full annotations once the tree is ready.
    React.useEffect(() => {
        if (treeReady && iframeRef.current && iframeRef.current.contentWindow) {
            iframeRef.current.contentWindow.postMessage(
                {
                    type: 'oncotree-annotations',
                    annotations: ONCOTREE_ANNOTATIONS,
                },
                '*'
            );
        }
    }, [treeReady]);

    // Drive the tree's own search from the same (debounced) search box.
    React.useEffect(() => {
        if (treeReady && iframeRef.current && iframeRef.current.contentWindow) {
            iframeRef.current.contentWindow.postMessage(
                { type: 'oncotree-search', query: debouncedSearch.trim() },
                '*'
            );
        }
    }, [treeReady, debouncedSearch]);

    return (
        <PageLayout className={'whiteBackground staticPage'} hideFooter={true}>
            <Helmet>
                <title>
                    {'cBioPortal for Cancer Genomics::OncoTree2Genes-LLM'}
                </title>
            </Helmet>
            <div style={{ padding: '15px 20px' }}>
                <h1>OncoTree2Genes-LLM (O2GL)</h1>
                <p>
                    OncoTree2Genes-LLM is a large-language-model-generated
                    mapping from{' '}
                    <a href="https://oncotree.info" target="_blank">
                        OncoTree
                    </a>{' '}
                    cancer type codes to relevant genes. Method and dataset is
                    further described at{' '}
                    <a href={REPO_URL} target="_blank">
                        github.com/SuhasiniLulla/OncoTree2Genes-LLM
                    </a>
                    .
                </p>
                <p>
                    The full mapping covers {Object.keys(O2GL_GENE_MAP).length}{' '}
                    OncoTree codes and {Object.keys(GENE_TO_CODES).length}{' '}
                    genes. Search below to highlight matching cancer types on
                    the tree and filter the table.
                </p>
                <input
                    type="text"
                    className="form-control"
                    placeholder="Search by code, cancer type, or gene…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{ maxWidth: 420, marginBottom: 6 }}
                />
                <div style={{ fontSize: 13, color: '#888', marginBottom: 12 }}>
                    Examples:{' '}
                    {[
                        { q: 'IDC', note: 'a cancer type' },
                        { q: 'FLT3', note: 'a lineage-specific gene' },
                        { q: 'TP53', note: 'a pan-cancer gene' },
                    ].map((ex, i) => (
                        <React.Fragment key={ex.q}>
                            {i > 0 ? ' · ' : ''}
                            <a
                                href="#"
                                onClick={e => {
                                    e.preventDefault();
                                    setSearch(ex.q);
                                }}
                            >
                                {ex.q}
                            </a>{' '}
                            ({ex.note})
                        </React.Fragment>
                    ))}
                </div>
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
                <h3>Cancer types &rarr; genes</h3>
                <div style={{ color: '#888', marginBottom: 6 }}>
                    {filteredData.length} of {Object.keys(O2GL_GENE_MAP).length}{' '}
                    cancer types · {uniqueGeneCount} genes
                </div>
                <O2glTable
                    data={filteredData}
                    columns={COLUMNS}
                    initialSortColumn="Code"
                    initialItemsPerPage={10}
                    showFilter={false}
                    showColumnVisibility={false}
                />
                <h3 style={{ marginTop: 25 }}>Genes &rarr; cancer types</h3>
                <div style={{ color: '#888', marginBottom: 6 }}>
                    {filteredGeneData.length} of{' '}
                    {Object.keys(GENE_TO_CODES).length} genes
                </div>
                <GeneTable
                    data={filteredGeneData}
                    columns={GENE_COLUMNS}
                    initialSortColumn="Gene"
                    initialItemsPerPage={10}
                    showFilter={false}
                    showColumnVisibility={false}
                />
            </div>
        </PageLayout>
    );
};

export default OncoTree2GenesPage;
