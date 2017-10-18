import {assert} from 'chai';
import React from 'react';
import {
    calculateAssociation, countOccurences, calculatePValue, calculateLogOddsRatio,
    getMutuallyExclusiveCounts, getCountsText, getData, getFilteredData, default as MutualExclusivityTab
} from "./MutualExclusivityTab";
import {MutualExclusivity} from "../../../shared/model/MutualExclusivity";
import expect from 'expect';
import expectJSX from 'expect-jsx';
import {shallow} from "enzyme";
import MutualExclusivityTable from "./MutualExclusivityTable";
import {Checkbox} from "react-bootstrap";

expect.extend(expectJSX);

const exampleData = [
    {
        "geneA": "EGFR",
        "geneB": "KRAS",
        "pValue": 0.003968253968253951,
        "logOddsRatio": -Infinity,
        "association": "Tendency towards mutual exclusivity"
    },
    {
        "geneA": "EGFR",
        "geneB": "TP53",
        "pValue": 0.08333333333333293,
        "logOddsRatio": -Infinity,
        "association": "Tendency towards mutual exclusivity"
    },
    {
        "geneA": "KRAS",
        "geneB": "TP53",
        "pValue": 0.08333333333333293,
        "logOddsRatio": Infinity,
        "association": "Tendency towards co-occurrence"
    },
    {
        "geneA": "EGFR",
        "geneB": "BRAF",
        "pValue": 0.2619047619047609,
        "logOddsRatio": -1.791759469228055,
        "association": "Tendency towards mutual exclusivity"
    },
    {
        "geneA": "KRAS",
        "geneB": "BRAF",
        "pValue": 0.2619047619047609,
        "logOddsRatio": 1.791759469228055,
        "association": "Tendency towards co-occurrence"
    },
    {
        "geneA": "TP53",
        "geneB": "BRAF",
        "pValue": 0.03333333333333314,
        "logOddsRatio": Infinity,
        "association": "Tendency towards co-occurrence"
    }
];

const isSampleAlteredMap: any = {
    "EGFR": [true, false, true, true, false, false, true, true, false, false],
    "KRAS": [false, true, false, false, true, true, false, false, true, true],
    "TP53": [false, false, false, false, false, true, false, false, true, true],
    "BRAF": [false, false, false, true, false, true, false, false, true, true]
};

describe("MutualExclusivityTab", () => {
    describe("#calculateAssociation()", () => {
        it("should return Tendency towards co-occurrence if log odds ratio is positive", () => {
            assert.equal(calculateAssociation(1), "Tendency towards co-occurrence");
        });

        it("should return Tendency towards mutual exclusivity if log odds ratio is 0", () => {
            assert.equal(calculateAssociation(0), "Tendency towards mutual exclusivity");
        });

        it("should return Tendency towards mutual exclusivity if log odds ratio is negative", () => {
            assert.equal(calculateAssociation(-1), "Tendency towards mutual exclusivity");
        });
    });

    describe("#countOccurences()", () => {
        it("should return [1, 0, 0, 1] for [false, true] and [false, true]", () => {
            assert.deepEqual(countOccurences([false, true], [false, true]), [1, 0, 0, 1]);
        });

        it("should return [1, 1, 1, 1] for [false, true, false, true] and [false, true, true, false]", () => {
            assert.deepEqual(countOccurences([false, true, false, true], [false, true, true, false]), [1, 1, 1, 1]);
        });

        it("should return [2, 0, 0, 0] for [false, false] and [false, false]", () => {
            assert.deepEqual(countOccurences([false, false], [false, false]), [2, 0, 0, 0]);
        });
    });

    describe("#calculatePValue()", () => {
        it("should return 0.3653846153846146 for 4, 3, 7, 2", () => {
            assert.equal(calculatePValue(4, 3, 7, 2), 0.3653846153846146);
        });

        it("should return 0.07706146926536687 for 13, 7, 3, 7", () => {
            assert.equal(calculatePValue(13, 7, 3, 7), 0.07706146926536687);
        });
    });

    describe("#calculateLogOddsRatio()", () => {
        it("should return -0.9650808960435872 for 4, 3, 7, 2", () => {
            assert.equal(calculateLogOddsRatio(4, 3, 7, 2), -0.9650808960435872);
        });

        it("should return 1.466337068793427 for 13, 7, 3, 7", () => {
            assert.equal(calculateLogOddsRatio(13, 7, 3, 7), 1.466337068793427);
        });

        it("should return Infinity for 5, 0 ,1, 0", () => {
            assert.equal(calculateLogOddsRatio(5, 0, 1, 0), Infinity);
        });
    });

    describe("#getMutuallyExclusiveCounts()", () => {
        it("should return [<span><b>no</b> gene pair</span>, null] for empty list", () => {
            const data: MutualExclusivity[] = [];
            const result = getMutuallyExclusiveCounts(data, n => n <= 0);
            expect(result[0]).toEqualJSX(<span><b>no</b> gene pair</span>);
            assert.isNull(result[1]);
        });

        it("should return [<span><b>no</b> gene pair</span>, null] for 0 matched data", () => {
            const data: MutualExclusivity[] = [
                {
                    "geneA": "EGFR",
                    "geneB": "KRAS",
                    "pValue": 0.003968253968253968,
                    "logOddsRatio": Infinity,
                    "association": "Tendency towards co-occurrence"
                }
            ];
            const result = getMutuallyExclusiveCounts(data, n => n <= 0);
            expect(result[0]).toEqualJSX(<span><b>no</b> gene pair</span>);
            assert.isNull(result[1]);
        });

        it("should return [<span><b>1</b> gene pair</span>, <span> (none significant)</span>] for " +
            "1 matched 0 significant data", () => {

            const data: MutualExclusivity[] = [
                {
                    "geneA": "EGFR",
                    "geneB": "KRAS",
                    "pValue": 0.06,
                    "logOddsRatio": -2.1,
                    "association": "Tendency towards mutual exclusivity"
                }
            ];
            const result = getMutuallyExclusiveCounts(data, n => n <= 0);
            expect(result[0]).toEqualJSX(<span><b>1</b> gene pair</span>);
            expect(result[1]).toEqualJSX(<span> (none significant)</span>);
        });

        it("should return [<span><b>1</b> gene pair</span>, <span> (<b>1</b> significant)</span>] " +
            "for 1 matched 1 significant data", () => {

            const data: MutualExclusivity[] = [
                {
                    "geneA": "EGFR",
                    "geneB": "KRAS",
                    "pValue": 0.04,
                    "logOddsRatio": -2.1,
                    "association": "Tendency towards mutual exclusivity"
                }
            ];
            const result = getMutuallyExclusiveCounts(data, n => n <= 0);
            expect(result[0]).toEqualJSX(<span><b>1</b> gene pair</span>);
            expect(result[1]).toEqualJSX(<span> (<b>1</b> significant)</span>);
        });

        it("should return [<span><b>2</b> gene pairs</span>, <span> (<b>2</b> significant)</span>] " +
            "for 2 matched 2 significant data", () => {

            const data: MutualExclusivity[] = [
                {
                    "geneA": "EGFR",
                    "geneB": "KRAS",
                    "pValue": 0.04,
                    "logOddsRatio": -6.51,
                    "association": "Tendency towards mutual exclusivity"
                },
                {
                    "geneA": "EGFR",
                    "geneB": "TP53",
                    "pValue": 0.001,
                    "logOddsRatio": -2.1,
                    "association": "Tendency towards mutual exclusivity"
                }
            ];
            const result = getMutuallyExclusiveCounts(data, n => n <= 0);
            expect(result[0]).toEqualJSX(<span><b>2</b> gene pairs</span>);
            expect(result[1]).toEqualJSX(<span> (<b>2</b> significant)</span>);
        });
    });

    describe("#getCountsText()", () => {
        it("should return correct text", () => {

            const data: MutualExclusivity[] = [
                {
                    "geneA": "EGFR",
                    "geneB": "KRAS",
                    "pValue": 0.04,
                    "logOddsRatio": -6.51,
                    "association": "Tendency towards mutual exclusivity"
                },
                {
                    "geneA": "EGFR",
                    "geneB": "TP53",
                    "pValue": 0.001,
                    "logOddsRatio": -2.1,
                    "association": "Tendency towards mutual exclusivity"
                }
            ];
            const result = getCountsText(data);
            expect(result).toEqualJSX(<p>The query contains <span><b>2</b> gene pairs</span> with mutually exclusive
                alterations<span> (<b>2</b> significant)</span>, and <span><b>no</b> gene pair</span> with co-occurrent
                alterations.</p>);
        });
    });

    describe("#getData()", () => {
        it("should return correct data", () => {

            const result = getData(isSampleAlteredMap);
            console.log(result);
            assert.deepEqual(result, exampleData);
        });
    });

    describe("#getFilteredData()", () => {
        it("should filter the data correctly", () => {

            const result = getFilteredData(exampleData, true, false, true);
            assert.deepEqual(result,
                [
                    {
                        "geneA": "EGFR",
                        "geneB": "KRAS",
                        "pValue": 0.003968253968253951,
                        "logOddsRatio": -Infinity,
                        "association": "Tendency towards mutual exclusivity"
                    }
                ]
            );
        });
    });

    // describe("<MutualExclusivityTab/>", () => {
    //     it("should create 1 <MutualExclusivityTable/>, 3 <Checkbox/> and 1 <p/>", () => {
    //
    //         const wrapper = shallow(<MutualExclusivityTab isSampleAlteredMap={isSampleAlteredMap}/>);
    //         assert.equal(wrapper.find(MutualExclusivityTable).length, 1);
    //         assert.equal(wrapper.find(Checkbox).length, 3);
    //         assert.equal(wrapper.find('p').length, 1);
    //     });
    // });
});
