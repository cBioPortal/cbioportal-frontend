import {assert} from "chai";
import {makeGeneticTrackTooltip} from "./TooltipUtils";
import {GeneticTrackDatum} from "./Oncoprint";
import {AnnotatedExtendedAlteration, AnnotatedMutation} from "../../../pages/resultsView/ResultsViewPageStore";

describe("Oncoprint TooltipUtils", ()=>{
    describe("makeGeneticTrackTooltip", ()=>{
        let tooltip:(d:GeneticTrackDatum)=>JQuery;
        before(()=>{
            tooltip = makeGeneticTrackTooltip(false);
        });

        function makeMutation(props:Partial<AnnotatedExtendedAlteration>):AnnotatedExtendedAlteration {
            return {
                molecularProfileAlterationType: "MUTATION_EXTENDED",
                ...props
            } as AnnotatedExtendedAlteration;
        }

        describe("custom driver annotations", ()=>{
            it("should show a binary custom driver icon with descriptive title, if theres a binary custom driver annotation", ()=>{
                const datum = {
                    sample: "sample",
                    data: [makeMutation({
                        driverFilter:"Putative_Driver",
                        driverFilterAnnotation: "annotation here"
                    })]
                };
                const tooltipOutput = tooltip(datum as GeneticTrackDatum);
                assert.equal(tooltipOutput.find("img[src$='driver.png'][title='Putative_Driver: annotation here']").length, 1);
                assert.equal(tooltipOutput.find("img[src$='driver.png']").length, 1, "should only be one icon");
            });

            it("should show multiple binary custom driver icons with corresponding titles, if there are multiple annotated mutations", ()=>{
                const datum = {
                    sample: "sample",
                    data: [makeMutation({
                        driverFilter:"Putative_Driver",
                        driverFilterAnnotation: "annotation 1"
                    }), makeMutation({
                        driverFilter:"Putative_Driver",
                        driverFilterAnnotation: "annotation 2"
                    }), makeMutation({
                        driverFilter:"Putative_Driver",
                        driverFilterAnnotation: "3 annotation"
                    })]
                };
                const tooltipOutput = tooltip(datum as GeneticTrackDatum);
                assert.equal(tooltipOutput.find("img[src$='driver.png'][title='Putative_Driver: annotation 1']").length, 1);
                assert.equal(tooltipOutput.find("img[src$='driver.png'][title='Putative_Driver: annotation 2']").length, 1);
                assert.equal(tooltipOutput.find("img[src$='driver.png'][title='Putative_Driver: 3 annotation']").length, 1);
                assert.equal(tooltipOutput.find("img[src$='driver.png']").length, 3, "should be three icons");
            });

            it("should not show a binary custom driver icon with descriptive title, if theres a binary annotation of non-driver", ()=>{
                const datum = {
                    sample: "sample",
                    data: [makeMutation({
                        driverFilter:"Putative_Passenger",
                        driverFilterAnnotation: "paosidjp"
                    }),makeMutation({
                        driverFilter:"Unknown",
                        driverFilterAnnotation: "asdfas"
                    })]
                };
                const tooltipOutput = tooltip(datum as GeneticTrackDatum);
                assert.equal(tooltipOutput.find("img[src$='driver.png']").length, 0);
            });

            it("should show a tiers custom driver icon with descriptive title, if theres a tiers custom driver annotation", ()=>{
                const datum = {
                    sample: "sample",
                    data: [makeMutation({
                        driverTiersFilter:"tier1",
                        driverTiersFilterAnnotation: "tier1 mutation"
                    })]
                };
                const tooltipOutput = tooltip(datum as GeneticTrackDatum);
                assert.equal(tooltipOutput.find("img[src$='driver_tiers.png'][title='tier1: tier1 mutation']").length, 1);
                assert.equal(tooltipOutput.find("img[src$='driver_tiers.png']").length, 1, "should only be one icon");
            });

            it("should show multiple tiers icons with corresponding titles, if there are multiple annotated mutations", ()=>{
                const datum = {
                    sample: "sample",
                    data: [makeMutation({
                        driverTiersFilter:"tier2",
                        driverTiersFilterAnnotation: "tier2 mutation"
                    }),makeMutation({
                        driverTiersFilter:"tier1",
                        driverTiersFilterAnnotation: "tier1 mutation"
                    }),makeMutation({
                        driverTiersFilter:"tier4",
                        driverTiersFilterAnnotation: "mutation tier4"
                    })]
                };
                const tooltipOutput = tooltip(datum as GeneticTrackDatum);
                assert.equal(tooltipOutput.find("img[src$='driver_tiers.png'][title='tier1: tier1 mutation']").length, 1);
                assert.equal(tooltipOutput.find("img[src$='driver_tiers.png'][title='tier2: tier2 mutation']").length, 1);
                assert.equal(tooltipOutput.find("img[src$='driver_tiers.png'][title='tier4: mutation tier4']").length, 1);
                assert.equal(tooltipOutput.find("img[src$='driver_tiers.png']").length, 3, "should be three icons");
            });

            it("should show both binary and tiers custom driver icons, with descriptive titles, if there are both annotations", ()=>{
                const datum = {
                    sample: "sample",
                    data: [makeMutation({
                        driverFilter:"Putative_Driver",
                        driverFilterAnnotation: "annotation 1"
                    }), makeMutation({
                        driverFilter:"Putative_Driver",
                        driverFilterAnnotation: "annotation 2"
                    }), makeMutation({
                        driverFilter:"Putative_Driver",
                        driverFilterAnnotation: "3 annotation"
                    }),makeMutation({
                        driverFilter:"Putative_Passenger",
                        driverFilterAnnotation: "paosidjp"
                    }),makeMutation({
                        driverFilter:"Unknown",
                        driverFilterAnnotation: "asdfas"
                    }),makeMutation({
                        driverTiersFilter:"tier2",
                        driverTiersFilterAnnotation: "tier2 mutation"
                    }),makeMutation({
                        driverTiersFilter:"tier1",
                        driverTiersFilterAnnotation: "tier1 mutation"
                    }),makeMutation({
                        driverTiersFilter:"tier4",
                        driverTiersFilterAnnotation: "mutation tier4"
                    })]
                };
                const tooltipOutput = tooltip(datum as GeneticTrackDatum);
                assert.equal(tooltipOutput.find("img[src$='driver_tiers.png'][title='tier1: tier1 mutation']").length, 1);
                assert.equal(tooltipOutput.find("img[src$='driver_tiers.png'][title='tier2: tier2 mutation']").length, 1);
                assert.equal(tooltipOutput.find("img[src$='driver_tiers.png'][title='tier4: mutation tier4']").length, 1);
                assert.equal(tooltipOutput.find("img[src$='driver_tiers.png']").length, 3, "should be three tiers icons");
                assert.equal(tooltipOutput.find("img[src$='driver.png'][title='Putative_Driver: annotation 1']").length, 1);
                assert.equal(tooltipOutput.find("img[src$='driver.png'][title='Putative_Driver: annotation 2']").length, 1);
                assert.equal(tooltipOutput.find("img[src$='driver.png'][title='Putative_Driver: 3 annotation']").length, 1);
                assert.equal(tooltipOutput.find("img[src$='driver.png']").length, 3, "should be three binary icons");
            });

            it("should show neither icon if theres no custom driver annotations", ()=>{
                const datum = {
                    sample: "sample",
                    data: [makeMutation({
                        driverFilter:"Putative_Passenger",
                        driverFilterAnnotation: "paosidjp"
                    }),makeMutation({
                        driverFilter:"Unknown",
                        driverFilterAnnotation: "asdfas"
                    }),makeMutation({}), makeMutation({})]
                };
                const tooltipOutput = tooltip(datum as GeneticTrackDatum);
                assert.equal(tooltipOutput.find("img[src$='driver.png']").length, 0, "should be no binary icons");
                assert.equal(tooltipOutput.find("img[src$='driver_tiers.png']").length, 0, "should be no tiers icons");
            });
        });
    });
});