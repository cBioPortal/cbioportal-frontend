import React from 'react';
import {ReactWrapper, mount} from "enzyme";
import { assert } from 'chai';
import {default as CopyNumberTableWrapper} from "./CopyNumberTableWrapper"

function hasColumn(tableWrapper:ReactWrapper<any, any>, columnName:string):boolean {
    const columns:string[] = [];
    tableWrapper.find('th span').map((span:ReactWrapper<any, any>)=>{columns.push(span.text())});
    return (columns.indexOf(columnName) > -1);
}

function getTable(samples:string[], mrnaMolecularProfileId?:string):ReactWrapper<any, any> {
    return mount(<CopyNumberTableWrapper
        sampleManager={null}
        sampleIds={samples}
        oncoKbAnnotatedGenes={{}}
        gisticData={{}}
        status="available"
        data={[]}
        mrnaExprRankMolecularProfileId={mrnaMolecularProfileId}
    />);
}

describe("CopyNumberTableWrapper", ()=>{

    it("shows mrna expr column iff theres one sample and a molecular profile id", ()=>{
        assert(hasColumn(getTable(["sampleA"], "id"), "mRNA Expr."), "Has with one sample and id");
        assert(!hasColumn(getTable(["sampleA"]), "mRNA Expr."), "Doesnt have with one sample and no id");
        assert(!hasColumn(getTable([], "id"), "mRNA Expr."), "Doesn't have with 0 samples and id");
        assert(!hasColumn(getTable(["sampleA", "sampleB"], "id"), "mRNA Expr."), "Doesn't have with 2 samples and id");
    });

    it("shows tumors column iff theres more than one sample", ()=>{
        assert(!hasColumn(getTable(["sampleA"]), "Tumors"), "Doesnt have with one sample");
        assert(!hasColumn(getTable(["sampleA"]), "Tumors"), "Doesnt have with zero samples");
        assert(hasColumn(getTable(["sampleA", "sampleB"]), "Tumors"), "Has with two samples");
    });
});