import {assert} from "chai";
import SampleColumnFormatter from "./SampleColumnFormatter";

/**
 * @author Selcuk Onur Sumer
 */
describe('SampleColumnFormatter functions', () => {
    const shortSampleId = "Short_Id";
    const longSampleId = "This_is_a_quite_long_Sample_Id_in_my_opinion!";

    it('sample id text is properly formatted', () => {

        let text = SampleColumnFormatter.getText(shortSampleId);
        assert.equal(text, shortSampleId); // should be same

        text = SampleColumnFormatter.getText(longSampleId);
        assert.equal(text.length, SampleColumnFormatter.MAX_LENGTH + SampleColumnFormatter.SUFFIX.length);
        assert.isTrue(text.indexOf(SampleColumnFormatter.SUFFIX) != -1);
    });

    it('sample id style class is properly set', () => {

        let style = SampleColumnFormatter.getStyleClass(shortSampleId);
        assert.notEqual(style, SampleColumnFormatter.TOOLTIP_STYLE); // no tooltips for short ids

        style = SampleColumnFormatter.getStyleClass(longSampleId);
        assert.equal(style, SampleColumnFormatter.TOOLTIP_STYLE); // tooltips for long ids
    });
});