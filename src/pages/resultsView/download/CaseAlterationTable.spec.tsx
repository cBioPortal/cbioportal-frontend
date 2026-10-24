import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { autorun, when } from 'mobx';
import { MolecularProfile } from 'cbioportal-ts-api-client';
import { remoteData } from 'cbioportal-frontend-commons';
import CaseAlterationTable, {
    generateOqlValue,
    getPseudoOqlSummaryByAlterationTypes,
    ICaseAlteration,
    IOqlData,
} from './CaseAlterationTable';
import { generateOqlData, updateOqlData } from './DownloadUtils';
import DownloadTab from './DownloadTab';
import { ResultsViewPageStore } from '../ResultsViewPageStore';
import {
    filterCBioPortalWebServiceDataByOQLLine,
    filterCBioPortalWebServiceDataByUnflattenedOQLLine,
    OQLLineFilterOutput,
} from 'shared/lib/oql/oqlfilter';
import AccessorsForOqlFilter from 'shared/lib/oql/AccessorsForOqlFilter';
import { AnnotatedExtendedAlteration } from 'shared/model/AnnotatedExtendedAlteration';
import { GeneticTrackDatum } from 'shared/components/oncoprint/Oncoprint';
import LazyMobXTable, {
    Column,
} from 'shared/components/lazyMobXTable/LazyMobXTable';
import { AlteredStatus } from '../mutualExclusivity/MutualExclusivityUtil';

const profiles = [
    {
        molecularProfileId: 'mutations',
        molecularAlterationType: 'MUTATION_EXTENDED',
    },
    {
        molecularProfileId: 'cna',
        molecularAlterationType: 'COPY_NUMBER_ALTERATION',
    },
    {
        molecularProfileId: 'sv',
        molecularAlterationType: 'STRUCTURAL_VARIANT',
    },
    {
        molecularProfileId: 'mrna',
        molecularAlterationType: 'MRNA_EXPRESSION',
    },
    {
        molecularProfileId: 'protein',
        molecularAlterationType: 'PROTEIN_LEVEL',
    },
] as MolecularProfile[];
const profileMap: {
    [profileId: string]: MolecularProfile;
} = Object.fromEntries(
    profiles.map(profile => [profile.molecularProfileId, profile])
);

function alteration(
    molecularProfileId: string,
    putativeDriver = true,
    sampleId = 'driver-case'
): AnnotatedExtendedAlteration {
    return {
        molecularProfileId,
        sampleId,
        patientId: sampleId,
        studyId: 'study',
        uniqueSampleKey: sampleId,
        uniquePatientKey: sampleId,
        gene: { hugoGeneSymbol: 'TP53', entrezGeneId: 7157 },
        hugoGeneSymbol: 'TP53',
        entrezGeneId: 7157,
        mutationType: 'Missense_Mutation',
        mutationStatus: 'Somatic',
        proteinChange: putativeDriver ? 'R175H' : 'R273H',
        value: 2,
        putativeDriver,
        eventInfo: 'TP53-ALK Fusion',
        site1HugoSymbol: 'TP53',
        site2HugoSymbol: 'ALK',
    } as AnnotatedExtendedAlteration;
}

function makeOqlData(
    data: AnnotatedExtendedAlteration[],
    profiledIds = ['mutations', 'cna', 'sv'],
    label = 'TP53'
) {
    const datum: GeneticTrackDatum = {
        trackLabel: label,
        patient: 'patient',
        study_id: 'study',
        uid: 'sample',
        data,
        profiled_in: profiledIds.map(molecularProfileId => ({
            molecularProfileId,
        })),
    };
    return updateOqlData(
        datum,
        generateOqlData(datum, undefined, profileMap),
        profileMap
    );
}

describe('ANY alteration summaries', () => {
    it.each([
        ['mutation', 'MUT', 'R175H (driver)'],
        ['copy number', 'CNA', 'AMP (driver)'],
        ['structural variant', 'FUSION', 'TP53-ALK Fusion'],
    ])(
        'summarizes a qualifying %s like its concrete type',
        (_, type, expected) => {
            const source: IOqlData = {
                geneSymbol: 'TP53',
                sequenced: true,
                mutation:
                    type === 'MUT'
                        ? [
                              {
                                  proteinChange: 'R175H',
                                  isGermline: false,
                                  putativeDriver: true,
                              },
                          ]
                        : [],
                structuralVariant: type === 'FUSION' ? ['TP53-ALK Fusion'] : [],
                cna:
                    type === 'CNA'
                        ? [{ type: 'AMP', value: 2, putativeDriver: true }]
                        : [],
                mrnaExp: [],
                proteinLevel: [],
                isMutationNotProfiled: type !== 'MUT',
                isStructuralVariantNotProfiled: type !== 'FUSION',
                isCnaNotProfiled: type !== 'CNA',
                isMrnaExpNotProfiled: true,
                isProteinLevelNotProfiled: true,
                alterationTypes: [type],
            };
            const before = JSON.stringify(source);
            const result = generateOqlValue(source, 'ANY', true)!;
            expect(result.summaryContent).toBe(expected);
            expect(result).toEqual(generateOqlValue(source, type, true));
            expect(JSON.stringify(source)).toBe(before);
        }
    );

    it.each<[string[], AlteredStatus, string]>([
        [[], AlteredStatus.UNPROFILED, 'not profiled'],
        [['mutations'], AlteredStatus.UNALTERED, 'no alteration'],
        [['cna'], AlteredStatus.UNALTERED, 'no alteration'],
        [['mutations', 'cna'], AlteredStatus.UNALTERED, 'no alteration'],
    ])(
        'retains existing profiling semantics for %j',
        (profiled, status, text) => {
            const datum = makeOqlData([], profiled);
            expect(generateOqlValue(datum, 'ANY', true)).toMatchObject({
                summaryContent: text,
                summaryAlteredStatus: status,
            });
        }
    );

    it.each(['EXP', 'PROT'])(
        'retains the %s renderer for already-filtered data',
        type => {
            const datum = makeOqlData([]);
            datum.alterationTypes = [type];
            if (type === 'EXP') {
                datum.mrnaExp = [{ type: 'UP', value: 3 }];
                datum.isMrnaExpNotProfiled = false;
            } else {
                datum.proteinLevel = [{ type: 'DOWN', value: -3 }];
                datum.isProteinLevelNotProfiled = false;
            }
            expect(generateOqlValue(datum, 'ANY', true)).toEqual(
                generateOqlValue(datum, type, true)
            );
        }
    );

    it('does not reinterpret missing data or unknown concrete types', () => {
        expect(
            generateOqlValue(makeOqlData([]), 'UNSUPPORTED', true)
        ).toMatchObject({
            summaryContent: 'no alteration',
            summaryAlteredStatus: AlteredStatus.UNALTERED,
        });
        expect(
            getPseudoOqlSummaryByAlterationTypes({}, 'missing', undefined, true)
        ).toMatchObject({
            summaryContent: 'not profiled',
            summaryAlteredStatus: AlteredStatus.UNPROFILED,
        });
    });
});

describe('DRIVER table rendering and TSV export', () => {
    const disposers: (() => void)[] = [];
    const tables: LazyMobXTable<ICaseAlteration>[] = [];

    afterEach(() => {
        tables.splice(0).forEach(table => table.componentWillUnmount());
        disposers.splice(0).forEach(dispose => dispose());
    });

    it.each<[string, string[]]>([
        ['TP53: DRIVER', ['mutations']],
        ['TP53: DRIVER', ['cna']],
        ['TP53: DRIVER', ['sv']],
        ['TP53: DRIVER', ['mutations', 'cna', 'sv']],
        ['TP53: DRIVER MUT CNA', ['mutations', 'cna', 'sv']],
        ['["Merged" TP53: DRIVER; TP53: MUT]', ['mutations', 'cna', 'sv']],
        ['TP53: MUT', ['mutations']],
        ['TP53: AMP', ['cna']],
    ])(
        'exports %s over %j through the actual OQL path',
        async (query, selected) => {
            const raw = selected.flatMap(profile => [
                alteration(profile),
                alteration(profile, false, 'passenger-case'),
            ]);
            const accessors = new AccessorsForOqlFilter(profiles);
            const lines = filterCBioPortalWebServiceDataByOQLLine(
                query,
                raw,
                accessors
            ) as OQLLineFilterOutput<AnnotatedExtendedAlteration>[];
            const tracks = filterCBioPortalWebServiceDataByUnflattenedOQLLine(
                query,
                raw,
                accessors
            );
            const tab = new DownloadTab({
                store: ({
                    oqlText: query,
                    oqlFilteredCaseAggregatedDataByOQLLine: remoteData(() =>
                        Promise.resolve(lines.map(oql => ({ oql })))
                    ),
                    oqlFilteredCaseAggregatedDataByUnflattenedOQLLine: remoteData(
                        () =>
                            Promise.resolve(
                                tracks.map(oql => ({
                                    oql,
                                    mergedTrackOqlList:
                                        'list' in oql ? [] : undefined,
                                }))
                            )
                    ),
                    defaultOQLQueryAlterations: remoteData(() =>
                        Promise.resolve(false)
                    ),
                } as unknown) as ResultsViewPageStore,
            });
            const metadata = [
                tab.trackLabels,
                tab.trackAlterationTypesMap,
                tab.geneAlterationMap,
                tab.oqls,
            ];
            disposers.push(
                autorun(() => metadata.forEach(item => item.status))
            );
            await when(() => metadata.every(item => item.isComplete), {
                timeout: 5000,
            });
            const label = tab.trackLabels.result![0];
            const rows = ['driver-case', 'passenger-case'].map(sampleId => {
                const filtered = lines
                    .flatMap(line => line.data)
                    .filter(datum => datum.sampleId === sampleId);
                const distinct = Array.from(new Set(filtered));
                const datum = makeOqlData(distinct, selected);
                return {
                    studyId: 'study',
                    patientId: sampleId,
                    sampleId,
                    altered: distinct.length > 0,
                    oqlData: { [label]: datum },
                    oqlDataByGene: { TP53: datum },
                };
            });
            const before = JSON.stringify(rows);
            const component = new CaseAlterationTable({
                caseAlterationData: rows,
                oqls: tab.oqls.result!,
                trackLabels: tab.trackLabels.result!,
                trackAlterationTypesMap: tab.trackAlterationTypesMap.result!,
                geneAlterationTypesMap: tab.geneAlterationMap.result!,
            });
            const element = component.render();
            const columns: Column<ICaseAlteration>[] = element.props.columns;
            const trackColumn = columns.find(column => column.name === label)!;
            const rendered = renderToStaticMarkup(trackColumn.render(rows[0]));
            const expected = selected.map(profile =>
                profile === 'mutations'
                    ? 'R175H'
                    : profile === 'cna'
                    ? 'AMP'
                    : 'TP53-ALK Fusion'
            );
            for (const value of expected) {
                expect(rendered).toContain(value);
                expect(trackColumn.download!(rows[0])).toContain(value);
            }
            const TableComponent = element.type as typeof LazyMobXTable;
            const table = new TableComponent<ICaseAlteration>(element.props);
            tables.push(table);
            const tsv = table.getDownloadData();
            const linesOfTsv = tsv
                .trim()
                .split(/\r?\n/)
                .map(line => line.split('\t'));
            const trackIndex = linesOfTsv[0].indexOf(label);
            expect(trackIndex).toBeGreaterThanOrEqual(0);
            expect(linesOfTsv).toHaveLength(3);
            const driverRow = linesOfTsv.find(
                line => line[1] === 'driver-case'
            )!;
            const alteredIndex = linesOfTsv[0].indexOf('Altered');
            rows.forEach(row => {
                const exported = linesOfTsv.find(
                    line => line[1] === row.sampleId
                )!;
                expect(exported[alteredIndex]).toBe(row.altered ? '1' : '0');
            });
            for (const value of expected) {
                expect(driverRow[trackIndex].split(value)).toHaveLength(2);
            }
            if (query === 'TP53: DRIVER') {
                expect(
                    lines
                        .flatMap(line => line.data)
                        .every(datum => datum.putativeDriver)
                ).toBe(true);
                expect(tsv).not.toContain('R273H');
                expect(rows[1].altered).toBe(false);
                expect(trackColumn.download!(rows[1])).toBe('no alteration');
            }
            expect(rows).toHaveLength(2);
            expect(rows[0].altered).toBe(true);
            expect(JSON.stringify(rows)).toBe(before);
        }
    );
});
