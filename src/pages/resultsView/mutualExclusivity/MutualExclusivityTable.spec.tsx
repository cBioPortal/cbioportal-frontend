import {assert} from 'chai';
import React from 'react';
import {
    formatPValue, formatPValueWithStyle, formatLogOddsRatio,
    default as MutualExclusivityTable
} from "./MutualExclusivityTable";
import expect from 'expect';
import expectJSX from 'expect-jsx';
import {mount} from "enzyme";

expect.extend(expectJSX);

describe("MutualExclusivityTable", () => {
    describe("#formatPValue()", () => {
        it("should return <0.001 for 0.0001", () => {
            assert.equal(formatPValue(0.0001), "<0.001");
        });

        it("should return 0.001 for 0.001", () => {
            assert.equal(formatPValue(0.001), "0.001");
        });

        it("should return 1.345 for 1.3454546", () => {
            assert.equal(formatPValue(1.3454546), "1.345");
        });

        it("should return 0.050 for 0.05", () => {
            assert.equal(formatPValue(0.05), "0.050");
        });
    });

    describe("#formatPValueWithStyle()", () => {
        it("should return <span>0.050</span> for 0.05", () => {
            expect(formatPValueWithStyle(0.05)).toEqualJSX(<span>0.050</span>);
        });

        it("should return <b><span>0.042</span></b> for 0.042", () => {
            expect(formatPValueWithStyle(0.042)).toEqualJSX(<b><span>0.042</span></b>);
        });
    });

    describe("#formatLogOddsRatio()", () => {
        it("should return <-3 for -6.32", () => {
            assert.equal(formatLogOddsRatio(-6.32), "<-3");
        });

        it("should return -3.000 for -3", () => {
            assert.equal(formatLogOddsRatio(-3), "-3.000");
        });

        it("should return 0.230 for 0.23", () => {
            assert.equal(formatLogOddsRatio(0.23), "0.230");
        });

        it("should return 3.000 for 3", () => {
            assert.equal(formatLogOddsRatio(3), "3.000");
        });

        it("should return >3 for 4.32", () => {
            assert.equal(formatLogOddsRatio(4.32), ">3");
        });
    });

    describe("<MutualExclusivityTable/>", ()=> {
        it("should show rows correctly", () => {

            const data = [
                {
                    "geneA": "KRAS",
                    "geneB": "BRAF",
                    "pValue": 0.23809523809523808,
                    "logOddsRatio": 1.791759469228055,
                    "association": "Tendency towards co-occurrence"
                },
                {
                    "geneA": "TP53",
                    "geneB": "BRAF",
                    "pValue": 0.03333333333333333,
                    "logOddsRatio": Infinity,
                    "association": "Tendency towards co-occurrence"
                }
            ];

            const wrapper = mount(<MutualExclusivityTable data={data}/>);
            let cells = wrapper.find('td');
            assert.equal(cells.at(0).html(), "<td><span><b>TP53</b></span></td>");
            assert.equal(cells.at(1).html(), "<td><span><b>BRAF</b></span></td>");
            assert.equal(cells.at(2).html(), "<td><b><span>0.033</span></b></td>");
            assert.equal(cells.at(3).html(), "<td><span>&gt;3</span></td>");
            assert.equal(cells.at(4).html().replace(/<!--[^>]*-->/g, ""), "<td><span>Tendency towards co-occurrence" +
                "&nbsp;&nbsp;&nbsp;<span class=\"badge\" style=\"background-color: rgb(88, 172, 250);\">Significant" +
                "</span></span></td>");
            assert.equal(cells.at(9).html().replace(/<!--[^>]*-->/g, ""), "<td><span>Tendency towards co-occurrence" +
                "&nbsp;&nbsp;&nbsp;</span></td>");
        });
    });
});
