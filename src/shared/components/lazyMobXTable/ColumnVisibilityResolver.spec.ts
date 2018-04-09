import {assert} from 'chai';
import * as _ from 'lodash';
import {resolveColumnVisibility, resolveColumnVisibilityByColumnDefinition} from "./ColumnVisibilityResolver";

function getVisibleColumnIds(columnVisibility: {[columnId: string]: boolean}): string[]
{
    return _.keys(columnVisibility).filter(id => columnVisibility[id] === true).sort();
}

describe('ColumnVisibilityResolver', () => {

    let columns:any[];

    beforeEach(() => {
        columns = [
            {
                name: "1st",
                visible: true
            },
            {
                name: "2nd",
                visible: true
            },
            {
                name: "3rd",
                visible: false
            },
            {
                name: "4th",
                visible: true
            },
            {
                name: "5th",
                visible: false
            }
        ];
    });

    describe('resolveColumnVisibilityByColumnDefinition', () => {
        it("properly resolves column visibility by column definition", () => {
            const colVis = resolveColumnVisibilityByColumnDefinition(columns);
            assert.deepEqual(getVisibleColumnIds(colVis), ["1st", "2nd", "4th"],
                "only 1st, 2nd, and 4th columns should be visible");
        });
    });

    describe('resolveColumnVisibility', () => {
        it("relies only on custom column visibility contents when provided", () => {
            const customColumnVisibility = {
                "1st": false,
                "2nd": true,
                "3rd": false,
                "4th": false,
                "5th": true
            };

            const columnVisibilityOverride = {
                "1st": true,
                "2nd": true,
                "3rd": true,
                "4th": true,
                "5th": true
            };

            const colVisByColumnDefinition = resolveColumnVisibilityByColumnDefinition(columns);

            const colVis = resolveColumnVisibility(
                colVisByColumnDefinition, customColumnVisibility, columnVisibilityOverride);

            assert.deepEqual(getVisibleColumnIds(colVis), ["2nd", "5th"],
                "only 2nd and 5th columns should be visible");
        });

        it("properly overrides column visibility with the column visibility override content", () => {
            const columnVisibilityOverride = {
                "1st": false,
                "2nd": true,
                "3rd": true,
                "4th": false,
                "5th": true
            };

            const colVisByColumnDefinition = resolveColumnVisibilityByColumnDefinition(columns);

            const colVis = resolveColumnVisibility(
                colVisByColumnDefinition, undefined, columnVisibilityOverride);

            assert.deepEqual(getVisibleColumnIds(colVis), ["2nd", "3rd", "5th"],
                "only 2nd, 3rd and 5th columns should be visible");
        });

        it("resolves visibility for dynamically updated column definition", () => {
            const columnVisibilityOverride = {
                "1st": false,
                "2nd": true,
                "3rd": true,
                "4th": false,
                "5th": true
            };

            // no override previously defined for the 6th col, so it should be resolved visible
            columns.push({
                name: "6th",
                visible: true
            });

            const colVisByColumnDefinition = resolveColumnVisibilityByColumnDefinition(columns);

            const colVis = resolveColumnVisibility(
                colVisByColumnDefinition, undefined, columnVisibilityOverride);

            assert.deepEqual(getVisibleColumnIds(colVis), ["2nd", "3rd", "5th", "6th"],
                "2nd, 3rd, 5th, and 6th columns should be visible");
        });
    });
});
