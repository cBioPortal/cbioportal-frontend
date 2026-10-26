import * as React from 'react';
import { assert } from 'chai';
import { mount, ReactWrapper } from 'enzyme';
import { StructuralVariant } from 'cbioportal-ts-api-client';
import { MSKTab, MSKTabs } from 'shared/components/MSKTabs/MSKTabs';
import {
    buildFusionViewerTab,
    FusionViewerSvData,
} from './fusionViewerPatientTab';

// Stub the viewer itself: these tests cover tab routing, not the diagram.
jest.mock('./FusionViewerTab', () => ({
    FusionViewerTab: (props: { structuralVariants: unknown[] }) => (
        <div className="fusion-viewer-stub">
            {`svCount=${props.structuralVariants.length}`}
        </div>
    ),
}));

const FUSION_TAB = 'fusionViewer';
const SV = ({ hugoGeneSymbol: 'GENE_A' } as unknown) as StructuralVariant;

const pending: FusionViewerSvData = {
    isPending: true,
    isError: false,
    result: undefined,
};
const failed: FusionViewerSvData = {
    isPending: false,
    isError: true,
    result: undefined,
};
function complete(svs: StructuralVariant[]): FusionViewerSvData {
    return { isPending: false, isError: false, result: svs };
}

function page(svData: FusionViewerSvData, activeTabId: string) {
    return (
        <MSKTabs activeTabId={activeTabId}>
            <MSKTab key={0} id="summary" linkText="Summary">
                <span>summary</span>
            </MSKTab>
            {buildFusionViewerTab(FUSION_TAB, svData, activeTabId, 'GRCh37')}
        </MSKTabs>
    );
}

async function settle(w: ReactWrapper<any, any>) {
    for (let i = 0; i < 10; i++) {
        await new Promise(r => setTimeout(r, 20));
        w.update();
    }
}

function navText(w: ReactWrapper<any, any>): string[] {
    return w
        .find('ul.nav-tabs')
        .find('li')
        .map(x => x.text().trim())
        .filter(t => t.length > 0);
}

function contentText(w: ReactWrapper<any, any>): string {
    return w.find('div.tab-content').text();
}

describe('buildFusionViewerTab', () => {
    it('hides the tab when not routed to it and the patient has no SVs', async () => {
        const w = mount(page(complete([]), 'summary'));
        await settle(w);
        assert.deepEqual(navText(w), ['Summary']);
    });

    it('shows a loading state, not a blank page, when routed to it while SVs load', async () => {
        const w = mount(page(pending, FUSION_TAB));
        await settle(w);
        assert.deepEqual(navText(w), ['Summary', 'SV Viewer']);
        assert.lengthOf(w.find('.fusion-viewer-stub'), 0);
        assert.isAbove(
            w.find('div.tab-content').find('LoadingIndicator').length,
            0
        );
    });

    it('keeps the routed tab mounted on a patient switch to a patient with no SVs', async () => {
        const w = mount(page(complete([SV]), FUSION_TAB));
        await settle(w);
        assert.include(contentText(w), 'svCount=1');

        w.setProps({ children: page(complete([]), FUSION_TAB).props.children });
        await settle(w);
        assert.include(contentText(w), 'svCount=0');
    });

    it('shows an explicit error when the SV fetch fails while routed to it', async () => {
        const w = mount(page(complete([SV]), FUSION_TAB));
        await settle(w);

        w.setProps({ children: page(failed, FUSION_TAB).props.children });
        await settle(w);
        assert.lengthOf(w.find('.fusion-viewer-stub'), 0);
        assert.include(
            contentText(w),
            'Structural variant data could not be loaded'
        );
    });
});
