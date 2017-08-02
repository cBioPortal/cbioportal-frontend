import MutationAssessorColumnFormatter from './MutationAssessorColumnFormatter';
import styles from "./mutationAssessor.module.scss";
import {initMutation} from "test/MutationMockUtils";
import React from 'react';
import { assert } from 'chai';
import {shallow, mount, ReactWrapper} from 'enzyme';
import sinon from 'sinon';
import {Mutation} from "shared/api/generated/CBioPortalAPI";
import {lazyMobXTableSort} from "shared/components/lazyMobXTable/LazyMobXTable";

describe('MutationAssessorColumnFormatter', () => {
    const mutations = [
        initMutation({
            functionalImpactScore: "H",
            fisValue: 3.5,
            linkPdb: "http://mutationassessor.org/r2/pdb.php?var=Q616K",
            linkMsa: "http://mutationassessor.org/r2/?cm=msa&var=Q616K",
            linkXvar: "http://mutationassessor.org/r2/?cm=var&var=hg19,0,0,X,X"
        }),
        initMutation({
            functionalImpactScore: "H",
            fisValue: 3.8,
            linkPdb: null,
            linkMsa: null,
            linkXvar: "http://mutationassessor.org/r2/?cm=var&var=hg19,0,0,Y,Y"
        }),
        initMutation({
            functionalImpactScore: "M",
            fisValue: null,
            linkPdb: null,
            linkMsa: "http://mutationassessor.org/r2/?cm=msa&var=Q1429R",
            linkXvar: "http://mutationassessor.org/r2/?cm=var&var=hg19,0,0,Z,Z"
        }),
        initMutation({
            functionalImpactScore: "M",
            fisValue: 2.2,
            linkPdb: null,
            linkMsa: "http://mutationassessor.org/r2/?cm=msa&var=Q1429R",
            linkXvar: null
        }),
        initMutation({
            functionalImpactScore: "L",
            fisValue: 0.7,
            linkPdb: null,
            linkMsa: null,
            linkXvar: null
        }),
        initMutation({
            functionalImpactScore: "Unknown",
            fisValue: null,
            linkPdb: null,
            linkMsa: null,
            linkXvar: null
        })
    ];

    const tableData = [
        [mutations[0]],
        [mutations[1]],
        [mutations[2]],
        [mutations[3]],
        [mutations[4]],
        [mutations[5]]
    ];

    const components: Array<ReactWrapper<any, any>> = [];
    const tooltips: Array<ReactWrapper<any, any>> = [];

    before(() => {
        // prepare the data and component arrays for test
        mutations.forEach((mutation) => {
            const data = [mutation];

            components.push(mount(MutationAssessorColumnFormatter.renderFunction(data)));
            tooltips.push(mount(MutationAssessorColumnFormatter.getTooltipContent(data)));
        });
    });

    it('sets component class name', () => {
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

    it('renders mutation assessor main link for the tooltip', () => {
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

    it('renders MSA link for the tooltip', () => {
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

    it('renders PDB link for the tooltip', () => {
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

    let sortedMutations = lazyMobXTableSort<Mutation>(mutations, m=>MutationAssessorColumnFormatter.getSortValue([m]), true);
    it('properly sorts by Mutation Assessor column', () => {
        assert.isAbove(sortedMutations.indexOf(mutations[0]), sortedMutations.indexOf(mutations[2]),
            "H(3.5) should rank higher than M(null)");
        assert.isBelow(sortedMutations.indexOf(mutations[0]), sortedMutations.indexOf(mutations[1]),
            "H(3.5) should rank lower than H(3.8)");
        assert.isAbove(sortedMutations.indexOf(mutations[1]), sortedMutations.indexOf(mutations[3]),
            "H(3.8) should rank higher than M(2.2)");
        assert.isAbove(sortedMutations.indexOf(mutations[2]), sortedMutations.indexOf(mutations[3]),
            "M(null) should rank higher than M(2.2)");
        assert.isAbove(sortedMutations.indexOf(mutations[2]), sortedMutations.indexOf(mutations[4]),
            "M(null) should rank higher than L(0.7)");
        assert.isBelow(sortedMutations.indexOf(mutations[4]), sortedMutations.indexOf(mutations[5]),
            "L(0.7) should rank lower than Unknown(null)");
    });

    after(() => {

    });

});
