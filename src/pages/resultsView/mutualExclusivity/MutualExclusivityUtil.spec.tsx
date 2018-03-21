import { assert } from 'chai';
import React from 'react';
import {
    calculateAssociation, countOccurences, calculatePValue, calculateLogOddsRatio, getMutuallyExclusiveCounts,
    getCountsText, getData, getFilteredData, formatPValue, formatPValueWithStyle, formatLogOddsRatio, calculateAdjustedPValue
} from "./MutualExclusivityUtil";
import { MutualExclusivity } from "../../../shared/model/MutualExclusivity";
import expect from 'expect';
import expectJSX from 'expect-jsx';
import { mount } from "enzyme";
import { Checkbox } from "react-bootstrap";
import MutualExclusivityTable from "./MutualExclusivityTable";

expect.extend(expectJSX);

const exampleData = [
    {
        "geneA": "EGFR",
        "geneB": "KRAS",
        "neitherCount": 0,
        "aNotBCount": 5,
        "bNotACount": 5,
        "bothCount": 0,
        "logOddsRatio": -Infinity,
        "pValue": 0.003968253968253951,
        "adjustedPValue": 0.023809523809523704,
        "association": "Mutual exclusivity"
    },
    {
        "geneA": "EGFR",
        "geneB": "TP53",
        "neitherCount": 2,
        "aNotBCount": 5,
        "bNotACount": 3,
        "bothCount": 0,
        "logOddsRatio": -Infinity,
        "pValue": 0.08333333333333293,
        "adjustedPValue": 0.49999999999999756,
        "association": "Mutual exclusivity"
    },
    {
        "geneA": "KRAS",
        "geneB": "TP53",
        "neitherCount": 5,
        "aNotBCount": 2,
        "bNotACount": 0,
        "bothCount": 3,
        "logOddsRatio": Infinity,
        "pValue": 0.08333333333333293,
        "adjustedPValue": 0.49999999999999756,
        "association": "Co-occurrence"
    },
    {
        "geneA": "EGFR",
        "geneB": "BRAF",
        "neitherCount": 2,
        "aNotBCount": 4,
        "bNotACount": 3,
        "bothCount": 1,
        "logOddsRatio": -1.791759469228055,
        "pValue": 0.2619047619047609,
        "adjustedPValue": 1,
        "association": "Mutual exclusivity"
    },
    {
        "geneA": "KRAS",
        "geneB": "BRAF",
        "neitherCount": 4,
        "aNotBCount": 2,
        "bNotACount": 1,
        "bothCount": 3,
        "logOddsRatio": 1.791759469228055,
        "pValue": 0.2619047619047609,
        "adjustedPValue": 1,
        "association": "Co-occurrence"
    },
    {
        "geneA": "TP53",
        "geneB": "BRAF",
        "neitherCount": 6,
        "aNotBCount": 0,
        "bNotACount": 1,
        "bothCount": 3,
        "logOddsRatio": Infinity,
        "pValue": 0.03333333333333314,
        "adjustedPValue": 0.19999999999999885,
        "association": "Co-occurrence"
    }
];

const isSampleAlteredMap: any = {
    "EGFR": [true, false, true, true, false, false, true, true, false, false],
    "KRAS": [false, true, false, false, true, true, false, false, true, true],
    "TP53": [false, false, false, false, false, true, false, false, true, true],
    "BRAF": [false, false, false, true, false, true, false, false, true, true]
};

describe("MutualExclusivityUtil", () => {
    describe("#calculateAssociation()", () => {
        it("returns Co-occurrence if log odds ratio is positive", () => {
            assert.equal(calculateAssociation(1), "Co-occurrence");
        });

        it("returns Mutual exclusivity if log odds ratio is 0", () => {
            assert.equal(calculateAssociation(0), "Mutual exclusivity");
        });

        it("returns Mutual exclusivity if log odds ratio is negative", () => {
            assert.equal(calculateAssociation(-1), "Mutual exclusivity");
        });
    });

    describe("#countOccurences()", () => {
        it("returns [1, 0, 0, 1] for [false, true] and [false, true]", () => {
            assert.deepEqual(countOccurences([false, true], [false, true]), [1, 0, 0, 1]);
        });

        it("returns [1, 1, 1, 1] for [false, true, false, true] and [false, true, true, false]", () => {
            assert.deepEqual(countOccurences([false, true, false, true], [false, true, true, false]), [1, 1, 1, 1]);
        });

        it("returns [2, 0, 0, 0] for [false, false] and [false, false]", () => {
            assert.deepEqual(countOccurences([false, false], [false, false]), [2, 0, 0, 0]);
        });
    });

    describe("#calculatePValue()", () => {
        it("returns 0.3653846153846146 for 4, 3, 7, 2", () => {
            assert.equal(calculatePValue(4, 3, 7, 2), 0.3653846153846146);
        });

        it("returns 0.07706146926536687 for 13, 7, 3, 7", () => {
            assert.equal(calculatePValue(13, 7, 3, 7), 0.07706146926536687);
        });
    });

    describe("#calculateAdjustedPValue()", () => {
        it("returns 1 if bigger than 1", () => {
            assert.equal(calculateAdjustedPValue(0.345, 4), 1);
        });

        it("returns the value if smaller than 1", () => {
            assert.equal(calculateAdjustedPValue(0.001, 3), 0.003);
        });
    });

    describe("#calculateLogOddsRatio()", () => {
        it("returns -0.9650808960435872 for 4, 3, 7, 2", () => {
            assert.equal(calculateLogOddsRatio(4, 3, 7, 2), -0.9650808960435872);
        });

        it("returns 1.466337068793427 for 13, 7, 3, 7", () => {
            assert.equal(calculateLogOddsRatio(13, 7, 3, 7), 1.466337068793427);
        });

        it("returns Infinity for 5, 0 ,1, 0", () => {
            assert.equal(calculateLogOddsRatio(5, 0, 1, 0), Infinity);
        });
    });

    describe("#getMutuallyExclusiveCounts()", () => {
        it("returns [<span><b>no</b> gene pair</span>, null] for empty list", () => {
            const data: MutualExclusivity[] = [];
            const result = getMutuallyExclusiveCounts(data, n => n <= 0);
            expect(result[0]).toEqualJSX(<span><b>no</b> gene pair</span>);
            assert.isNull(result[1]);
        });

        it("returns [<span><b>no</b> gene pair</span>, null] for 0 matched data", () => {
            const data: MutualExclusivity[] = [
                {
                    "geneA": "EGFR",
                    "geneB": "KRAS",
                    "neitherCount": 0,
                    "aNotBCount": 5,
                    "bNotACount": 5,
                    "bothCount": 0,
                    "logOddsRatio": Infinity,
                    "pValue": 0.003968253968253968,
                    "adjustedPValue": 0.003968253968253968,
                    "association": "Co-occurrence"
                }
            ];
            const result = getMutuallyExclusiveCounts(data, n => n <= 0);
            expect(result[0]).toEqualJSX(<span><b>no</b> gene pair</span>);
            assert.isNull(result[1]);
        });

        it("returns [<span><b>1</b> gene pair</span>, <span> (none significant)</span>] for " +
            "1 matched 0 significant data", () => {

                const data: MutualExclusivity[] = [
                    {
                        "geneA": "EGFR",
                        "geneB": "KRAS",
                        "neitherCount": 0,
                        "aNotBCount": 5,
                        "bNotACount": 5,
                        "bothCount": 0,
                        "logOddsRatio": -2.1,
                        "pValue": 0.06,
                        "adjustedPValue": 0.06,
                        "association": "Mutual exclusivity"
                    }
                ];
                const result = getMutuallyExclusiveCounts(data, n => n <= 0);
                expect(result[0]).toEqualJSX(<span><b>1</b> gene pair</span>);
                expect(result[1]).toEqualJSX(<span> (none significant)</span>);
            });

        it("returns [<span><b>1</b> gene pair</span>, <span> (<b>1</b> significant)</span>] " +
            "for 1 matched 1 significant data", () => {

                const data: MutualExclusivity[] = [
                    {
                        "geneA": "EGFR",
                        "geneB": "KRAS",
                        "neitherCount": 0,
                        "aNotBCount": 5,
                        "bNotACount": 5,
                        "bothCount": 0,
                        "logOddsRatio": -2.1,
                        "pValue": 0.04,
                        "adjustedPValue": 0.04,
                        "association": "Mutual exclusivity"
                    }
                ];
                const result = getMutuallyExclusiveCounts(data, n => n <= 0);
                expect(result[0]).toEqualJSX(<span><b>1</b> gene pair</span>);
                expect(result[1]).toEqualJSX(<span> (<b>1</b> significant)</span>);
            });

        it("returns [<span><b>2</b> gene pairs</span>, <span> (<b>2</b> significant)</span>] " +
            "for 2 matched 2 significant data", () => {

                const data: MutualExclusivity[] = [
                    {
                        "geneA": "EGFR",
                        "geneB": "KRAS",
                        "neitherCount": 0,
                        "aNotBCount": 5,
                        "bNotACount": 5,
                        "bothCount": 0,
                        "logOddsRatio": -6.51,
                        "pValue": 0.04,
                        "adjustedPValue": 0.08,
                        "association": "Mutual exclusivity"
                    },
                    {
                        "geneA": "EGFR",
                        "geneB": "TP53",
                        "neitherCount": 2,
                        "aNotBCount": 5,
                        "bNotACount": 3,
                        "bothCount": 0,
                        "logOddsRatio": -2.1,
                        "pValue": 0.001,
                        "adjustedPValue": 0.002,
                        "association": "Mutual exclusivity"
                    }
                ];
                const result = getMutuallyExclusiveCounts(data, n => n <= 0);
                expect(result[0]).toEqualJSX(<span><b>2</b> gene pairs</span>);
                expect(result[1]).toEqualJSX(<span> (<b>2</b> significant)</span>);
            });
    });

    describe("#getCountsText()", () => {
        it("returns correct text", () => {

            const data: MutualExclusivity[] = [
                {
                    "geneA": "EGFR",
                    "geneB": "KRAS",
                    "neitherCount": 0,
                    "aNotBCount": 5,
                    "bNotACount": 5,
                    "bothCount": 0,
                    "logOddsRatio": -6.51,
                    "pValue": 0.04,
                    "adjustedPValue": 0.08,
                    "association": "Mutual exclusivity"
                },
                {
                    "geneA": "EGFR",
                    "geneB": "TP53",
                    "neitherCount": 2,
                    "aNotBCount": 5,
                    "bNotACount": 3,
                    "bothCount": 0,
                    "logOddsRatio": -2.1,
                    "pValue": 0.001,
                    "adjustedPValue": 0.002,
                    "association": "Mutual exclusivity"
                }
            ];
            const result = getCountsText(data);
            expect(result).toEqualJSX(<p>The query contains <span><b>2</b> gene pairs</span> with mutually exclusive
                alterations<span> (<b>2</b> significant)</span>, and <span><b>no</b> gene pair</span> with co-occurrent
                alterations.</p>);
        });
    });

    describe("#getData()", () => {
        it("returns correct data", () => {

            const result = getData(isSampleAlteredMap);
            assert.deepEqual(result, exampleData);
        });
    });

    describe("#getFilteredData()", () => {
        it("returns the data correctly", () => {

            const result = getFilteredData(exampleData, true, false, true);
            assert.deepEqual(result,
                [
                    {
                        "geneA": "EGFR",
                        "geneB": "KRAS",
                        "neitherCount": 0,
                        "aNotBCount": 5,
                        "bNotACount": 5,
                        "bothCount": 0,
                        "logOddsRatio": -Infinity,
                        "pValue": 0.003968253968253951,
                        "adjustedPValue": 0.023809523809523704,
                        "association": "Mutual exclusivity"
                    }
                ]
            );
        });
    });

    describe("#formatPValue()", () => {
        it("returns <0.001 for 0.0001", () => {
            assert.equal(formatPValue(0.0001), "<0.001");
        });

        it("returns 0.001 for 0.001", () => {
            assert.equal(formatPValue(0.001), "0.001");
        });

        it("returns 1.345 for 1.3454546", () => {
            assert.equal(formatPValue(1.3454546), "1.345");
        });

        it("returns 0.050 for 0.05", () => {
            assert.equal(formatPValue(0.05), "0.050");
        });
    });

    describe("#formatPValueWithStyle()", () => {
        it("returns <span>0.050</span> for 0.05", () => {
            expect(formatPValueWithStyle(0.05)).toEqualJSX(<span>0.050</span>);
        });

        it("returns <b><span>0.042</span></b> for 0.042", () => {
            expect(formatPValueWithStyle(0.042)).toEqualJSX(<b><span>0.042</span></b>);
        });
    });

    describe("#formatLogOddsRatio()", () => {
        it("returns <-3 for -6.32", () => {
            assert.equal(formatLogOddsRatio(-6.32), "<-3");
        });

        it("returns -3.000 for -3", () => {
            assert.equal(formatLogOddsRatio(-3), "-3.000");
        });

        it("returns 0.230 for 0.23", () => {
            assert.equal(formatLogOddsRatio(0.23), "0.230");
        });

        it("returns 3.000 for 3", () => {
            assert.equal(formatLogOddsRatio(3), "3.000");
        });

        it("returns >3 for 4.32", () => {
            assert.equal(formatLogOddsRatio(4.32), ">3");
        });
    });

    describe("<MutualExclusivityTable/>", () => {
        it("returns rows correctly", () => {

            const data = [
                {
                    "geneA": "KRAS",
                    "geneB": "BRAF",
                    "neitherCount": 4,
                    "aNotBCount": 2,
                    "bNotACount": 1,
                    "bothCount": 3,
                    "logOddsRatio": 1.791759469228055,
                    "pValue": 0.23809523809523808,
                    "adjustedPValue": 0.47619047619047616,
                    "association": "Co-occurrence"
                },
                {
                    "geneA": "TP53",
                    "geneB": "BRAF",
                    "neitherCount": 6,
                    "aNotBCount": 0,
                    "bNotACount": 1,
                    "bothCount": 3,
                    "logOddsRatio": Infinity,
                    "pValue": 0.003968253968253951,
                    "adjustedPValue": 0.023809523809523704,
                    "association": "Co-occurrence"
                }
            ];

            const wrapper = mount(<MutualExclusivityTable data={data} />);
            let cells = wrapper.find('td');
            assert.equal(cells.at(0).html(), "<td><span><b>TP53</b></span></td>");
            assert.equal(cells.at(1).html(), "<td><span><b>BRAF</b></span></td>");
            assert.equal(cells.at(2).html(), "<td><span>6</span></td>");
            assert.equal(cells.at(3).html(), "<td><span>0</span></td>");
            assert.equal(cells.at(4).html(), "<td><span>1</span></td>");
            assert.equal(cells.at(5).html(), "<td><span>3</span></td>");
            assert.equal(cells.at(6).html(), "<td><span>&gt;3</span></td>");
            assert.equal(cells.at(7).html(), "<td><span>0.004</span></td>");
            assert.equal(cells.at(8).html(), "<td><b><span>0.024</span></b></td>");
            assert.equal(cells.at(9).html().replace(/<!--[^>]*-->/g, ""), "<td><span>Co-occurrence" +
                "&nbsp;&nbsp;&nbsp;<span class=\"badge\" style=\"background-color: rgb(88, 172, 250);\">Significant" +
                "</span></span></td>");
            assert.equal(cells.at(19).html().replace(/<!--[^>]*-->/g, ""), "<td><span>Co-occurrence" +
                "&nbsp;&nbsp;&nbsp;</span></td>");
        });
    });
});
