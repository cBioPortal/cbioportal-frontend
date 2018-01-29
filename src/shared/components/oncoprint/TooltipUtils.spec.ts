import {assert} from "chai";
import {makeClinicalTrackTooltip, makeGeneticTrackTooltip, makeHeatmapTrackTooltip} from "./TooltipUtils";
import {GeneticTrackDatum} from "./Oncoprint";
import {AnnotatedExtendedAlteration, AnnotatedMutation} from "../../../pages/resultsView/ResultsViewPageStore";
import $ from "jquery";

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
    describe("makeClinicalTrackTooltip", ()=>{
        it("should show the given sample id", ()=>{
            const trackLabel = "label1234";
            const trackSpec = {
                key: "",
                label: trackLabel,
                description: "",
                data: [],
                datatype: "string" as "string"
            };
            const tooltip = makeClinicalTrackTooltip(trackSpec, false);
            const sampleTooltipResult = tooltip({ attr_val_counts: {"a":1}, attr_val:"a", sample:"sampleID" });
            assert.isTrue(sampleTooltipResult.html().indexOf("<span>Sample: sampleID</span>") > -1 );
        });
        it("should show the given patient id", ()=>{
            const trackLabel = "label1234";
            const trackSpec = {
                key: "",
                label: trackLabel,
                description: "",
                data: [],
                datatype: "string" as "string"
            };
            const tooltip = makeClinicalTrackTooltip(trackSpec, false);
            const patientTooltipResult = tooltip({ attr_val_counts: {"a":1}, attr_val:"a", patient:"patientID" });
            assert.isTrue(patientTooltipResult.html().indexOf("<span>Patient: patientID</span>") > -1 );
        });
        it("should show the correct output for a single value", ()=>{
            const trackLabel = "label1234";
            const trackSpec = {
                key: "",
                label: trackLabel,
                description: "",
                data: [],
                datatype: "string" as "string"
            };
            const tooltip = makeClinicalTrackTooltip(trackSpec, false);
            const tooltipResult = tooltip({ attr_val_counts: {"a":1}, attr_val:"a", sample:"sampleID" });
            assert.isTrue(tooltipResult.html().indexOf("label1234: <b>a</b>") > -1);
        });
        it("should show the correct output for multiple values", ()=>{
            const trackLabel = "label1234";
            const trackSpec = {
                key: "",
                label: trackLabel,
                description: "",
                data: [],
                datatype: "string" as "string"
            };
            const tooltip = makeClinicalTrackTooltip(trackSpec, false);
            const tooltipResult = tooltip({ attr_val_counts: {"a":1, "b":3}, attr_val:"a", sample:"sampleID" });
            assert.isTrue(tooltipResult.html().indexOf("label1234:<br><b>a</b>: 1<br><b>b</b>: 3") > -1);
        });
        it("should show numerical data rounded to 2 decimal digits", ()=>{
            const trackSpec = {
                key: "",
                label: "",
                description: "",
                data: [],
                datatype: "number" as "number",
                numberRange:[0,0] as [number, number],
                numberLogScale:false
            };
            const tooltip = makeClinicalTrackTooltip(trackSpec, false);
            let tooltipResult = tooltip({ attr_val_counts: {"0.13500013531":1}, attr_val:"0.13500013531", sample:"sampleID" });
            assert.isTrue(tooltipResult.html().indexOf("<b>0.14</b>") > -1, "correct result with no integer part");
            tooltipResult = tooltip({ attr_val_counts: {"6.100032":1}, attr_val:"6.100032", sample:"sampleID" });
            assert.isTrue(tooltipResult.html().indexOf("<b>6.10</b>") > -1, "correct result with integer part");
            tooltipResult = tooltip({ attr_val_counts: {"0":1}, attr_val:"0", sample:"sampleID" });
            assert.isTrue(tooltipResult.html().indexOf("<b>0</b>") > -1, "correct result for zero")
            tooltipResult = tooltip({ attr_val_counts: {"-0.13500013531":1}, attr_val:"-0.13500013531", sample:"sampleID" });
            assert.isTrue(tooltipResult.html().indexOf("<b>-0.14</b>") > -1, "correct result with no integer part, negative");
            tooltipResult = tooltip({ attr_val_counts: {"-6.100032":1}, attr_val:"-6.100032", sample:"sampleID" });
            assert.isTrue(tooltipResult.html().indexOf("<b>-6.10</b>") > -1, "correct result with integer part, negative");
        });
    });
    describe("makeHeatmapTrackTooltip", ()=>{
        it("should show data rounded to 2 decimal digits", ()=>{
            const tooltip = makeHeatmapTrackTooltip("MRNA_EXPRESSION", false);
            let tooltipResult = tooltip({ profile_data:0.13500013531, sample:"sampleID" });
            assert.isTrue(tooltipResult.html().indexOf("<b>0.14</b>") > -1, "correct result with no integer part");
            tooltipResult = tooltip({ profile_data:6.100032, sample:"sampleID" });
            assert.isTrue(tooltipResult.html().indexOf("<b>6.10</b>") > -1, "correct result with integer part");
            tooltipResult = tooltip({ profile_data: 0, sample:"sampleID" });
            assert.isTrue(tooltipResult.html().indexOf("<b>0.00</b>") > -1, "correct result for zero")
            tooltipResult = tooltip({ profile_data:-0.13500013531, sample:"sampleID" });
            assert.isTrue(tooltipResult.html().indexOf("<b>-0.14</b>") > -1, "correct result with no integer part, negative");
            tooltipResult = tooltip({ profile_data:-6.100032, sample:"sampleID" });
            assert.isTrue(tooltipResult.html().indexOf("<b>-6.10</b>") > -1, "correct result with integer part, negative");
        });
    });
});