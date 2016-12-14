import {assert} from "chai";
import SampleColumnFormatter from "./SampleColumnFormatter";

/**
 * @author Selcuk Onur Sumer
 */
describe('SampleColumnFormatter functions', () => {
    const shortSampleId = {columnData: "Short_Id"};
    const longSampleId = {columnData: "This_is_a_quite_long_Sample_Id_in_my_opinion!"};

    it('sample id text is properly formatted', () => {
        // text and display should be the same for short sample ids
        assert.equal(SampleColumnFormatter.getTextValue(shortSampleId),
                     SampleColumnFormatter.getDisplayValue(shortSampleId));

        // text and display values should be different,
        // and truncated size should have fixed number of characters
        assert.equal(SampleColumnFormatter.getDisplayValue(longSampleId).length,
                     SampleColumnFormatter.MAX_LENGTH + SampleColumnFormatter.SUFFIX.length);

        // suffix should be appended in the end
        assert.isTrue(SampleColumnFormatter.getDisplayValue(longSampleId).indexOf(
                          SampleColumnFormatter.SUFFIX) > -1);
    });

    it('sample id style class is properly set', () => {

        // no tooltips for short ids
        assert.notEqual(SampleColumnFormatter.getStyleClass(shortSampleId.columnData),
                        SampleColumnFormatter.TOOLTIP_STYLE);

        // tooltips for long ids
        assert.equal(SampleColumnFormatter.getStyleClass(longSampleId.columnData),
                     SampleColumnFormatter.TOOLTIP_STYLE);
    });
});