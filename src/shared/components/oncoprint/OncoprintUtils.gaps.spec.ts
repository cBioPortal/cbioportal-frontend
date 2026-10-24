import { observable } from 'mobx';
import { GAP_MODE_ENUM, OncoprintJS, OncoprintModel } from 'oncoprintjs';
import { createStubInstance } from 'sinon';
import { AnnotatedExtendedAlteration } from 'shared/model/AnnotatedExtendedAlteration';
import { IQueriedCaseData } from 'shared/model/IQueriedCaseData';
import { GeneticTrackSpec, IOncoprintProps } from './Oncoprint';
import { transition } from './DeltaUtils';
import { makeGeneticTrackWith } from './OncoprintUtils';
import ResultsViewOncoprint from './ResultsViewOncoprint';

describe('genetic track gap frequencies', () => {
    const mutation = {
        molecularProfileAlterationType: 'MUTATION_EXTENDED',
        mutationType: 'Missense_Mutation',
        proteinChange: 'S310F',
        hugoGeneSymbol: 'ERBB2',
    } as AnnotatedExtendedAlteration;
    const amplification = {
        molecularProfileAlterationType: 'COPY_NUMBER_ALTERATION',
        value: 2,
        hugoGeneSymbol: 'ERBB2',
    } as AnnotatedExtendedAlteration;
    const samples = ['S1', 'S2', 'S3', 'S4'].map((sampleId, index) => ({
        sampleId,
        uniqueSampleKey: sampleId,
        patientId: ['P1', 'P1', 'P2', 'P3'][index],
        uniquePatientKey: ['P1', 'P1', 'P2', 'P3'][index],
        studyId: 'study',
    }));
    const patients = ['P1', 'P2', 'P3'].map(patientId => ({
        patientId,
        uniquePatientKey: patientId,
        studyId: 'study',
    }));
    const coverageRecord = () => ({
        byGene: {},
        allGenes: [],
        notProfiledByGene: {},
        notProfiledAllGenes: [],
    });
    const makeTracks = (
        sampleMode: boolean,
        mutationSamples = ['S1', 'S2'],
        sequencedSamples = ['S1', 'S2', 'S3'],
        merged = false
    ) => {
        const makeTrack = makeGeneticTrackWith({
            sampleMode,
            oncoprint: {
                columnMode: sampleMode ? 'sample' : 'patient',
            } as ResultsViewOncoprint,
            samples,
            patients,
            coverageInformation: {
                samples: Object.fromEntries(
                    samples.map(sample => [
                        sample.uniqueSampleKey,
                        coverageRecord(),
                    ])
                ),
                patients: Object.fromEntries(
                    patients.map(patient => [
                        patient.uniquePatientKey,
                        coverageRecord(),
                    ])
                ),
            },
            sequencedSampleKeysByGene: { ERBB2: sequencedSamples },
            sequencedPatientKeysByGene: { ERBB2: ['P1', 'P2'] },
            selectedMolecularProfiles: [],
            expansionIndexMap: observable.map<string, number[]>(),
        });
        const makeCaseData = (
            alteration: AnnotatedExtendedAlteration,
            alteredSamples: string[],
            oqlLine: string
        ): IQueriedCaseData<AnnotatedExtendedAlteration> => ({
            cases: {
                samples: Object.fromEntries(
                    samples.map(sample => [
                        sample.uniqueSampleKey,
                        alteredSamples.includes(sample.sampleId)
                            ? [alteration]
                            : [],
                    ])
                ),
                patients: Object.fromEntries(
                    patients.map(patient => [
                        patient.uniquePatientKey,
                        samples
                            .filter(
                                sample =>
                                    sample.patientId === patient.patientId &&
                                    alteredSamples.includes(sample.sampleId)
                            )
                            .map(() => alteration),
                    ])
                ),
            },
            oql: {
                gene: 'ERBB2',
                oql_line: oqlLine,
                parsed_oql_line: { gene: 'ERBB2', alterations: [] },
                data: [],
            },
        });
        return [
            makeCaseData(mutation, mutationSamples, 'ERBB2: MUT=S310;'),
            makeCaseData(amplification, ['S1', 'S3'], 'ERBB2: AMP;'),
        ].map((caseData, index) =>
            makeTrack(
                merged
                    ? {
                          ...caseData,
                          oql: { list: [caseData.oql], label: 'Shared label' },
                      }
                    : caseData,
                index
            )
        );
    };
    const makeModel = async (
        tracks: GeneticTrackSpec[],
        order: string[],
        groupById: Record<string, number>
    ) => {
        const model = new OncoprintModel({});
        await model.addTracks(
            tracks.map((track, index) => ({
                track_id: index,
                rule_set: undefined!,
                label: track.label,
                data: track.data,
                data_id_key: 'uid',
                custom_track_options: track.customOptions,
                sortCmpFn: {
                    isVector: true,
                    mandatory: datum => [groupById[datum.uid]],
                    preferred: () => [],
                },
            }))
        );
        model.setIdOrder(order);
        model.setTrackShowGaps(0, GAP_MODE_ENUM.SHOW_GAPS_PERCENT);
        return model;
    };
    const gapInfo = (model: OncoprintModel, trackId: number) =>
        model
            .getTrackCustomOptions(trackId)
            .find(option => !!option.gapLabelsFn)!.gapLabelsFn!(model).map(
            gap => ({
                label: gap.labelFormatter(),
                tooltip: gap.tooltipFormatter(),
            })
        );

    it('uses each OQL track data for identically labeled sample tracks', async () => {
        const tracks = makeTracks(true);
        const model = await makeModel(tracks, ['S2', 'S1', 'S4', 'S3'], {
            S1: 0,
            S2: 0,
            S3: 1,
            S4: 1,
        });

        expect(tracks[0].label).toBe(tracks[1].label);
        expect(gapInfo(model, 0)).toEqual([
            { label: '100%', tooltip: '100% (altered / profiled = 2 / 2)' },
            { label: '0%', tooltip: '0% (altered / profiled = 0 / 1)' },
        ]);
        expect(gapInfo(model, 1)).toEqual([
            { label: '50%', tooltip: '50% (altered / profiled = 1 / 2)' },
            { label: '100%', tooltip: '100% (altered / profiled = 1 / 1)' },
        ]);
    });

    it('counts a patient with two mutated samples once', async () => {
        const tracks = makeTracks(false);
        const model = await makeModel(tracks, ['P2', 'P1', 'P3'], {
            P1: 0,
            P2: 0,
            P3: 1,
        });

        expect(gapInfo(model, 0)[0]).toEqual({
            label: '50%',
            tooltip: '50% (altered / profiled = 1 / 2)',
        });
        expect(gapInfo(model, 1)[0]).toEqual({
            label: '100%',
            tooltip: '100% (altered / profiled = 2 / 2)',
        });
        expect(gapInfo(model, 0)[1].tooltip).toBe(
            'N/P (altered / profiled = 0 / 0)'
        );
    });

    it('distinguishes merged tracks with the same custom label', async () => {
        const tracks = makeTracks(true, ['S1', 'S2'], ['S1', 'S2', 'S3'], true);
        const model = await makeModel(tracks, ['S2', 'S1', 'S4', 'S3'], {
            S1: 0,
            S2: 0,
            S3: 1,
            S4: 1,
        });

        expect(tracks.map(track => track.label)).toEqual([
            'Shared label',
            'Shared label',
        ]);
        expect(gapInfo(model, 0)[0].tooltip).toBe(
            '100% (altered / profiled = 2 / 2)'
        );
        expect(gapInfo(model, 1)[0].tooltip).toBe(
            '50% (altered / profiled = 1 / 2)'
        );
    });

    it('preserves the existing all-column grouping when columns are hidden', async () => {
        const tracks = makeTracks(true);
        const model = await makeModel([tracks[0]], ['S2', 'S1', 'S4', 'S3'], {
            S1: 0,
            S2: 0,
            S3: 1,
            S4: 1,
        });
        model.hideIds(['S2'], true);

        expect(gapInfo(model, 0)).toEqual([
            { label: '100%', tooltip: '100% (altered / profiled = 1 / 1)' },
            { label: '50%', tooltip: '50% (altered / profiled = 1 / 2)' },
        ]);
    });

    it.each(['data', 'coverage', 'column mode'])(
        'refreshes gap calculations on existing tracks after %s changes',
        async change => {
            const tracks = makeTracks(true);
            const model = await makeModel(tracks, ['S2', 'S1', 'S4', 'S3'], {
                S1: 0,
                S2: 0,
                S3: 1,
                S4: 1,
                P1: 0,
                P2: 0,
                P3: 1,
            });
            const updatedTracks =
                change === 'coverage'
                    ? makeTracks(true, ['S1', 'S2'], ['S1', 'S2']).map(
                          (track, index) => ({
                              ...track,
                              data: tracks[index].data,
                          })
                      )
                    : makeTracks(
                          change !== 'column mode',
                          change === 'data' ? ['S3'] : undefined
                      );
            const makeProps = (
                geneticTracks: GeneticTrackSpec[]
            ): IOncoprintProps => ({
                geneticTracks,
                caseLinkOutInTooltips: false,
                clinicalTracks: [],
                genesetHeatmapTracks: [],
                categoricalTracks: [],
                heatmapTracks: [],
                divId: 'oncoprint',
                width: 1000,
            });
            const oncoprint = createStubInstance(OncoprintJS);
            oncoprint.setTrackData.callsFake(model.setTrackData.bind(model));
            oncoprint.setTrackCustomOptions.callsFake(
                model.setTrackCustomOptions.bind(model)
            );
            transition(
                makeProps(updatedTracks),
                makeProps(tracks),
                oncoprint,
                () => ({ GENETICTRACK_0: 0, GENETICTRACK_1: 1 }),
                () => undefined
            );

            expect(gapInfo(model, 0)[0].tooltip).toBe(
                change === 'coverage'
                    ? '100% (altered / profiled = 2 / 2)'
                    : change === 'column mode'
                    ? '50% (altered / profiled = 1 / 2)'
                    : '0% (altered / profiled = 0 / 2)'
            );
            expect(gapInfo(model, 0)[1].tooltip).toBe(
                change !== 'data'
                    ? 'N/P (altered / profiled = 0 / 0)'
                    : '100% (altered / profiled = 1 / 1)'
            );
        }
    );
});
