import MutationAssessorColumnFormatter from './MutationAssessorColumnFormatter';
import styles from "./mutationAssessor.module.scss";
import React from 'react';
import { assert } from 'chai';
import { shallow, mount } from 'enzyme';
import sinon from 'sinon';

describe('MutationAssessorColumnFormatter', () => {
    const mutations = [
        {
            functionalImpactScore: "H",
            fisValue: 3.5,
            linkPdb: "http://mutationassessor.org/r2/pdb.php?var=Q616K",
            linkMsa: "http://mutationassessor.org/r2/?cm=msa&var=Q616K",
            linkXvar: "http://mutationassessor.org/r2/?cm=var&var=hg19,0,0,X,X"
        },
        {

            functionalImpactScore: "H",
            fisValue: 3.8,
            linkPdb: null,
            linkMsa: null,
            linkXvar: "http://mutationassessor.org/r2/?cm=var&var=hg19,0,0,Y,Y"
        },
        {
            functionalImpactScore: "M",
            fisValue: null,
            linkPdb: null,
            linkMsa: "http://mutationassessor.org/r2/?cm=msa&var=Q1429R",
            linkXvar: "http://mutationassessor.org/r2/?cm=var&var=hg19,0,0,Z,Z"
        },
        {
            functionalImpactScore: "M",
            fisValue: 2.2,
            linkPdb: null,
            linkMsa: "http://mutationassessor.org/r2/?cm=msa&var=Q1429R",
            linkXvar: null
        },
        {
            functionalImpactScore: "L",
            fisValue: 0.7,
            linkPdb: null,
            linkMsa: null,
            linkXvar: null
        },
        {
            functionalImpactScore: "Unknown",
            fisValue: null,
            linkPdb: null,
            linkMsa: null,
            linkXvar: null
        }
    ];

    const tableData = [
        [mutations[0]],
        [mutations[1]],
        [mutations[2]],
        [mutations[3]],
        [mutations[4]],
        [mutations[5]]
    ];

    let components = [];
    let tooltips = [];
    let formatterData = [];

    before(()=>{
        // prepare the data and component arrays for test
        mutations.forEach((mutation) => {
            const data = {
                name: "Mutation Assessor",
                tableData: tableData,
                rowData: [mutation]
            };

            formatterData.push(data);
            components.push(mount(MutationAssessorColumnFormatter.renderFunction(data)));
            tooltips.push(mount(MutationAssessorColumnFormatter.getTooltipContent(data)))
        });
    });

    it('component class name', () => {
        assert.isTrue(components[0].find(`span.${styles['oma-high']}`).exists(),
            `Span has the correct class name for impact score H(3.5)`);
        assert.isTrue(components[1].find(`span.${styles['oma-high']}`).exists(),
            `Span has the correct class name for impact score H(3.8)`);
        assert.isTrue(components[2].find(`span.${styles['oma-medium']}`).exists(),
            `Span has the correct class name for impact score M(null)`);
        assert.isTrue(components[3].find(`span.${styles['oma-medium']}`).exists(),
            `Span has the correct class name for impact score M(2.2)`);
        assert.isTrue(components[4].find(`span.${styles['oma-low']}`).exists(),
            `Span has the correct class name for impact score L(0.7)`);
        assert.isFalse(components[5].find(`span.${styles['oma-link']}`).exists(),
            `Span has the correct class name for impact score Unknown(null)`);
    });

    it('mutation assessor main link for the tooltip', () => {
        assert.isTrue(tooltips[0].find(`.${styles['mutation-assessor-main-img']}`).exists(),
            `Main mutation assessor link exists for impact score H(3.5)`);
        assert.isTrue(tooltips[1].find(`.${styles['mutation-assessor-main-img']}`).exists(),
            `Main mutation assessor link exists for impact score H(3.8)`);
        assert.isTrue(tooltips[2].find(`.${styles['mutation-assessor-main-img']}`).exists(),
            `Main mutation assessor link exists for impact score M(null)`);
        assert.isFalse(tooltips[3].find(`.${styles['mutation-assessor-main-img']}`).exists(),
            `Main mutation assessor link should not exist for impact score M(2.2)`);
        assert.isFalse(tooltips[4].find(`.${styles['mutation-assessor-main-img']}`).exists(),
            `Main mutation assessor link should not exist for impact score L(0.7)`);
        assert.isFalse(tooltips[5].find(`.${styles['mutation-assessor-main-img']}`).exists(),
            `Main mutation assessor link should not exist for impact score Unknown(null)`);
    });

    it('MSA link for the tooltip', () => {
        assert.isTrue(tooltips[0].find(`.${styles['ma-msa-icon']}`).exists(),
            `MSA link exists for impact score H(3.5)`);
        assert.isFalse(tooltips[1].find(`.${styles['ma-msa-icon']}`).exists(),
            `MSA link should not exist for impact score H(3.8)`);
        assert.isTrue(tooltips[2].find(`.${styles['ma-msa-icon']}`).exists(),
            `MSA link exists for impact score M(null)`);
        assert.isTrue(tooltips[3].find(`.${styles['ma-msa-icon']}`).exists(),
            `MSA link exists for impact score M(2.2)`);
        assert.isFalse(tooltips[4].find(`.${styles['ma-msa-icon']}`).exists(),
            `MSA link should not exist for impact score L(0.7)`);
        assert.isFalse(tooltips[5].find(`.${styles['ma-msa-icon']}`).exists(),
            `MSA link should not exist for impact score Unknown(null)`);
    });

    it('PDB link for the tooltip', () => {
        assert.isTrue(tooltips[0].find(`.${styles['ma-3d-icon']}`).exists(),
            `PDB link exists for impact score H(3.5)`);
        assert.isFalse(tooltips[1].find(`.${styles['ma-3d-icon']}`).exists(),
            `PDB link should not exist for impact score H(3.8)`);
        assert.isFalse(tooltips[2].find(`.${styles['ma-3d-icon']}`).exists(),
            `PDB link should not exist for impact score M(null)`);
        assert.isFalse(tooltips[3].find(`.${styles['ma-3d-icon']}`).exists(),
            `PDB link should not exist for impact score M(2.2)`);
        assert.isFalse(tooltips[4].find(`.${styles['ma-3d-icon']}`).exists(),
            `PDB link should not exist for impact score L(0.7)`);
        assert.isFalse(tooltips[5].find(`.${styles['ma-3d-icon']}`).exists(),
            `PDB link should not exist for impact score Unknown(null)`);
    });

    it('sortFunction', ()=>{
        assert.isAbove(MutationAssessorColumnFormatter.sortFunction(formatterData[0], formatterData[2]), 0,
            "H(3.5) should rank higher than M(null)");
        assert.isBelow(MutationAssessorColumnFormatter.sortFunction(formatterData[0], formatterData[1]), 0,
            "H(3.5) should rank lower than H(3.8)");
        assert.isAbove(MutationAssessorColumnFormatter.sortFunction(formatterData[1], formatterData[3]), 0,
            "H(3.8) should rank higher than M(2.2)");
        assert.isBelow(MutationAssessorColumnFormatter.sortFunction(formatterData[2], formatterData[3]), 0,
            "M(null) should rank lower than M(2.2)");
        assert.isAbove(MutationAssessorColumnFormatter.sortFunction(formatterData[2], formatterData[4]), 0,
            "M(null) should rank higher than L(0.7)");
        assert.isAbove(MutationAssessorColumnFormatter.sortFunction(formatterData[4], formatterData[5]), 0,
            "L(0.7) should rank higher than Unknown(null)");
    });

    after(()=>{

    });

});
