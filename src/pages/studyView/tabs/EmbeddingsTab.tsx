import * as React from 'react';
import { observer } from 'mobx-react';
import { observable, action, makeObservable } from 'mobx';
import { StudyViewPageStore } from 'pages/studyView/StudyViewPageStore';
import { EmbeddingsPanel } from './EmbeddingsPanel';

export interface IEmbeddingsTabProps {
    store: StudyViewPageStore;
}

type PanelIndex = 1 | 2 | 3 | 4;

const MAX_PANELS = 4;

function coloringParamName(panelIndex: number): string {
    return panelIndex === 1
        ? 'embeddings_coloring_selection'
        : `embeddings_panel${panelIndex}_coloring_selection`;
}

function mapParamName(panelIndex: number): string {
    return panelIndex === 1
        ? 'embeddings_map'
        : `embeddings_panel${panelIndex}_map`;
}

function tooltipFieldsParamName(panelIndex: number): string {
    return panelIndex === 1
        ? 'embeddings_tooltip_fields'
        : `embeddings_panel${panelIndex}_tooltip_fields`;
}

// Splits the embeddings tab into 1-4 independent, side-by-side panels, each
// its own EmbeddingsPanel with its own map/color-by/tooltip-fields state,
// synced to its own fixed-slot URL params (see coloringParamName et al.).
@observer
export class EmbeddingsTab extends React.Component<IEmbeddingsTabProps, {}> {
    @observable private panelCount: number = 1;

    constructor(props: IEmbeddingsTabProps) {
        super(props);
        makeObservable(this);

        const urlWrapper = (this.props.store as any).urlWrapper;
        let count = 1;
        for (let i = 2; i <= MAX_PANELS; i++) {
            const hasParams =
                !!urlWrapper?.query?.[coloringParamName(i)]?.selectedOption ||
                !!urlWrapper?.query?.[mapParamName(i)] ||
                !!urlWrapper?.query?.[tooltipFieldsParamName(i)];
            if (hasParams) {
                count = i;
            } else {
                break;
            }
        }
        this.panelCount = count;
    }

    @action.bound
    private onSplitView(callingPanelIndex: number) {
        if (this.panelCount >= MAX_PANELS) {
            return;
        }
        const urlWrapper = (this.props.store as any).urlWrapper;
        if (!urlWrapper) {
            return;
        }
        const newIndex = this.panelCount + 1;
        urlWrapper.updateURL({
            [coloringParamName(newIndex)]: urlWrapper.query?.[
                coloringParamName(callingPanelIndex)
            ],
            [mapParamName(newIndex)]: urlWrapper.query?.[
                mapParamName(callingPanelIndex)
            ],
            [tooltipFieldsParamName(newIndex)]: urlWrapper.query?.[
                tooltipFieldsParamName(callingPanelIndex)
            ],
        });
        this.panelCount = newIndex;
    }

    @action.bound
    private onClosePanel(index: number) {
        const count = this.panelCount;

        // Unmount the topmost panel FIRST, before touching its URL params.
        // That panel's own URL-sync reaction fires synchronously on any
        // change to its param slot; if we cleared the slot while it's
        // still mounted, it would see "no URL params for me" and
        // immediately write a fresh default straight back into the slot
        // we're trying to free, racing the close. Decrementing panelCount
        // here disposes that panel (and its reaction) via unmount before
        // the deferred URL update below ever runs.
        this.panelCount = count - 1;

        setTimeout(() => {
            const urlWrapper = (this.props.store as any).urlWrapper;
            if (!urlWrapper) {
                return;
            }
            const updates: { [key: string]: any } = {};
            // Shift every panel above the closed one down by one slot so
            // the fixed param slots stay contiguous (1..count-1).
            for (let i = index; i < count; i++) {
                updates[coloringParamName(i)] =
                    urlWrapper.query?.[coloringParamName(i + 1)];
                updates[mapParamName(i)] =
                    urlWrapper.query?.[mapParamName(i + 1)];
                updates[tooltipFieldsParamName(i)] =
                    urlWrapper.query?.[tooltipFieldsParamName(i + 1)];
            }
            // Clear the now-vacated top slot.
            updates[coloringParamName(count)] = undefined;
            updates[mapParamName(count)] = undefined;
            updates[tooltipFieldsParamName(count)] = undefined;

            urlWrapper.updateURL(updates);
        }, 0);
    }

    render() {
        const panelIndexes: PanelIndex[] = Array.from(
            { length: this.panelCount },
            (_, i) => (i + 1) as PanelIndex
        );

        return (
            <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                {panelIndexes.map(panelIndex => (
                    <div key={panelIndex} style={{ flex: 1, minWidth: 0 }}>
                        <EmbeddingsPanel
                            store={this.props.store}
                            panelIndex={panelIndex}
                            panelCount={this.panelCount}
                            onSplitView={() => this.onSplitView(panelIndex)}
                            onClosePanel={() => this.onClosePanel(panelIndex)}
                        />
                    </div>
                ))}
            </div>
        );
    }
}
