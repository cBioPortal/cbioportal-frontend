import OncoprintModel, { GAP_MODE_ENUM } from './oncoprintmodel';
import { assert } from 'chai';

describe('OncoprintModel gap mode on init', () => {
    const addTrackWith = async (gapParams: {
        show_gaps_on_init?: boolean;
        gap_mode_on_init?: GAP_MODE_ENUM;
    }) => {
        const model = new OncoprintModel({} as any);
        const onGapChange = { called: false };
        await model.addTracks([
            {
                track_id: 1,
                target_group: 0,
                data: [],
                sortCmpFn: { mandatory: () => 0, preferred: () => 0 },
                track_can_show_gaps: true,
                onGapChange: () => {
                    onGapChange.called = true;
                },
                ...gapParams,
            } as any,
        ]);
        return { model, onGapChange };
    };

    it('uses the exact gap mode given in gap_mode_on_init', async () => {
        const { model, onGapChange } = await addTrackWith({
            gap_mode_on_init: GAP_MODE_ENUM.SHOW_GAPS,
        });
        assert.equal(model.getTrackShowGaps(1), GAP_MODE_ENUM.SHOW_GAPS);
        assert.equal(model.getTrackSortDirection(1), 1);
        assert.isFalse(onGapChange.called);
    });

    it('lets gap_mode_on_init take precedence over show_gaps_on_init', async () => {
        const { model } = await addTrackWith({
            show_gaps_on_init: true,
            gap_mode_on_init: GAP_MODE_ENUM.HIDE_GAPS,
        });
        assert.equal(model.getTrackShowGaps(1), GAP_MODE_ENUM.HIDE_GAPS);
    });

    it('keeps mapping show_gaps_on_init to SHOW_GAPS_PERCENT', async () => {
        const { model } = await addTrackWith({ show_gaps_on_init: true });
        assert.equal(
            model.getTrackShowGaps(1),
            GAP_MODE_ENUM.SHOW_GAPS_PERCENT
        );
    });

    it('hides gaps when neither init parameter is given', async () => {
        const { model } = await addTrackWith({});
        assert.equal(model.getTrackShowGaps(1), GAP_MODE_ENUM.HIDE_GAPS);
    });
});
