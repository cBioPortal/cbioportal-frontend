import { AlterationTypeConstants } from 'shared/constants';
import { remoteData } from 'cbioportal-frontend-commons';
import { Gene } from 'cbioportal-ts-api-client';
import { observable, when } from 'mobx';
import PlotsTab, { IPlotsTabProps, PlotsTabURLQuery } from './PlotsTab';
import { SAME_SELECTED_OPTION_NUMERICAL_VALUE } from './PlotsTabTypes';
import { CLIN_ATTR_DATA_TYPE } from './PlotsTabUtils';

const tp53 = { value: 7157, label: 'TP53' };
const brca1 = { value: 672, label: 'BRCA1' };

function makePlotsTab(hasNoQueriedGenes = true) {
    const query = observable({
        plots_horz_selection: {
            dataType: AlterationTypeConstants.COPY_NUMBER_ALTERATION,
        },
        plots_vert_selection: {
            dataType: AlterationTypeConstants.MRNA_EXPRESSION,
        },
    } as PlotsTabURLQuery);
    const plots = new PlotsTab(({
        hasNoQueriedGenes,
        genes: remoteData({
            invoke: async () =>
                [tp53, brca1].map(option => ({
                    entrezGeneId: option.value,
                    hugoGeneSymbol: option.label,
                })) as Gene[],
        }),
        coverageInformation: {
            result: { samples: { sample: { allGenes: [{}] } } },
        },
        urlWrapper: {
            query,
            updateURL: (update: (current: PlotsTabURLQuery) => void) =>
                update(query),
        },
    } as unknown) as IPlotsTabProps);
    Object.defineProperty(plots, 'dataTypeOptions', {
        value: {
            isComplete: true,
            result: [
                { value: AlterationTypeConstants.COPY_NUMBER_ALTERATION },
                { value: AlterationTypeConstants.MRNA_EXPRESSION },
                { value: CLIN_ATTR_DATA_TYPE },
            ],
        },
    });
    return plots;
}

const waitForGeneOptions = (plots: PlotsTab) =>
    when(
        () =>
            plots.horzGeneOptions.isComplete && plots.vertGeneOptions.isComplete
    );

describe('PlotsTab', () => {
    describe('default axis genes', () => {
        beforeEach(() => localStorage.clear());
        afterEach(() => localStorage.clear());

        it('leaves both genes empty until a horizontal gene is chosen in study view', async () => {
            const plots = makePlotsTab();
            await waitForGeneOptions(plots);

            expect(plots['horzSelection'].selectedGeneOption).toBeUndefined();
            expect(plots['vertSelection'].selectedGeneOption).toBeUndefined();
        });

        it('defaults the vertical axis to the same gene after a horizontal gene is chosen', async () => {
            const plots = makePlotsTab();
            await waitForGeneOptions(plots);
            plots['horzSelection'].selectedGeneOption = tp53;
            await waitForGeneOptions(plots);

            expect(plots['vertSelection'].selectedGeneOption).toEqual({
                value: SAME_SELECTED_OPTION_NUMERICAL_VALUE,
                label: 'Same gene (TP53)',
            });
            expect(plots['vertSelection'].entrezGeneId).toBe(tp53.value);
        });

        it('follows changes to the horizontal gene while using the default', async () => {
            const plots = makePlotsTab();
            await waitForGeneOptions(plots);
            plots['horzSelection'].selectedGeneOption = tp53;
            await waitForGeneOptions(plots);
            expect(plots['vertSelection'].entrezGeneId).toBe(tp53.value);

            plots['horzSelection'].selectedGeneOption = brca1;
            await waitForGeneOptions(plots);

            expect(plots['vertSelection'].selectedGeneOption).toEqual({
                value: SAME_SELECTED_OPTION_NUMERICAL_VALUE,
                label: 'Same gene (BRCA1)',
            });
            expect(plots['vertSelection'].entrezGeneId).toBe(brca1.value);
        });

        it('preserves an explicit vertical gene when the horizontal gene changes', async () => {
            const plots = makePlotsTab();
            await waitForGeneOptions(plots);
            plots['horzSelection'].selectedGeneOption = tp53;
            plots['vertSelection'].selectedGeneOption = tp53;
            await waitForGeneOptions(plots);
            plots['horzSelection'].selectedGeneOption = brca1;
            await waitForGeneOptions(plots);

            expect(plots['vertSelection'].selectedGeneOption).toEqual(tp53);
            expect(plots['vertSelection'].entrezGeneId).toBe(tp53.value);
        });

        it('preserves a remembered vertical gene', async () => {
            localStorage.setItem('plotsVertGeneSelection', `${brca1.value}`);
            const plots = makePlotsTab();
            await waitForGeneOptions(plots);
            plots['horzSelection'].selectedGeneOption = tp53;
            await waitForGeneOptions(plots);

            expect(plots['vertSelection'].selectedGeneOption).toEqual(brca1);
        });

        it('prefers a vertical gene restored from the URL over the remembered gene', async () => {
            localStorage.setItem('plotsVertGeneSelection', `${tp53.value}`);
            const plots = makePlotsTab();
            plots.props.urlWrapper.query.plots_vert_selection!.selectedGeneOption = `${brca1.value}`;
            await waitForGeneOptions(plots);
            plots['horzSelection'].selectedGeneOption = tp53;
            await waitForGeneOptions(plots);

            expect(plots['vertSelection'].selectedGeneOption).toEqual(brca1);
            expect(plots['vertSelection'].entrezGeneId).toBe(brca1.value);
        });

        it('clears the default vertical gene when the horizontal axis becomes clinical', async () => {
            const plots = makePlotsTab();
            await waitForGeneOptions(plots);
            plots['horzSelection'].selectedGeneOption = tp53;
            await waitForGeneOptions(plots);
            expect(plots['vertSelection'].selectedGeneOption!.value).toBe(
                SAME_SELECTED_OPTION_NUMERICAL_VALUE
            );

            plots['horzSelection'].dataType = CLIN_ATTR_DATA_TYPE;
            await waitForGeneOptions(plots);

            expect(plots['vertSelection'].selectedGeneOption).toBeUndefined();
        });

        it('keeps the first queried gene and same-gene defaults in results view', async () => {
            const plots = makePlotsTab(false);
            await waitForGeneOptions(plots);

            expect(plots['horzSelection'].selectedGeneOption).toEqual(tp53);
            expect(plots['vertSelection'].selectedGeneOption).toEqual({
                value: SAME_SELECTED_OPTION_NUMERICAL_VALUE,
                label: 'Same gene (TP53)',
            });
            expect(plots['vertSelection'].entrezGeneId).toBe(tp53.value);
        });
    });

    describe('controls', () => {
        describe('gene lock', () => {
            it('genes can be freely selected when gene lock is off', () => {});
            it('when gene lock is selected, both axes gene selection should be the one from the axis where lock was clicked', () => {});
            it('genes are locked to be the same when gene lock is on and gene selection is changed in either axis', () => {});
        });

        describe('apply log scale', () => {
            it('should show log scale selector if and only if profile is of [TODO: what type???] type', () => {});
        });

        describe('utilities menu', () => {
            describe('view section', () => {
                it('should appear if and only if the same gene is selected in both axes', () => {});
            });
        });

        describe('genetic profile menu', () => {
            it('in each axis it should show the genetic profile controls when the genetic profile radio is selected', () => {});
        });

        describe('clinical attributes menu', () => {
            it('in each axis it should show the clinical attribute selector when the clinical attribute radio is selected', () => {});
        });
    });
});
