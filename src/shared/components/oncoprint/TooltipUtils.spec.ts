import { assert } from "chai";
import {
    getCaseViewElt,
    makeClinicalTrackTooltip, makeGeneticTrackTooltip, makeGeneticTrackTooltip_getCoverageInformation,
    makeHeatmapTrackTooltip
} from "./TooltipUtils";
import { GeneticTrackDatum } from "./Oncoprint";
import {
    AlterationTypeConstants,
    AnnotatedExtendedAlteration,
    AnnotatedMutation
} from "../../../pages/resultsView/ResultsViewPageStore";
import $ from "jquery";
import { MolecularProfile, Mutation } from "../../api/generated/CBioPortalAPI";
import { getPatientViewUrl, getSampleViewUrl } from "../../api/urls";

describe("Oncoprint TooltipUtils", () => {
    describe("getCaseViewElt", () => {
        it("gives empty result for no input", () => {
            assert.equal(getCaseViewElt([], false), "");
        });
        it("shows case id if single input and no linkout", () => {
            assert.equal(
                getCaseViewElt([{ sample: "sampleID", patient: "patientID", study_id: "studyID" }], false),
                "<span>sampleID</span>"
            );
            assert.equal(
                getCaseViewElt([{ patient: "patientID", study_id: "studyID" }], false),
                "<span>patientID</span>"
            );
        });
        it("shows link if single input and linkout", () => {
            let elt = $(getCaseViewElt([{ sample: "sampleID", patient: "patientID", study_id: "studyID" }], true));
            assert.equal(elt.attr("href"), getSampleViewUrl("studyID", "sampleID"));
            assert.equal(elt.text(), "sampleID");
            elt = $(getCaseViewElt([{ patient: "patientID", study_id: "studyID" }], true));
            assert.equal(elt.attr("href"), getPatientViewUrl("studyID", "patientID"));
            assert.equal(elt.text(), "patientID");
        });
        it("shows number if multiple input and no linkout", () => {
            assert.equal(
                getCaseViewElt([{ sample: "sampleID", patient: "patientID", study_id: "studyID" }, { sample: "sampleID2", patient: "patientID2", study_id: "studyID" }, { sample: "sampleID3", patient: "patientID3", study_id: "studyID" }], false),
                "<span>3 samples</span>"
            );
            assert.equal(
                getCaseViewElt([{ patient: "patientID", study_id: "studyID" }, { patient: "patientID2", study_id: "studyID" }, { patient: "patientID3", study_id: "studyID" }], false),
                "<span>3 patients</span>"
            );
        });
        it("shows link if multiple input and linkout", () => {
            let elt = $(getCaseViewElt([{ sample: "sampleID", patient: "patientID", study_id: "studyID" }, { sample: "sampleID2", patient: "patientID2", study_id: "studyID" }, { sample: "sampleID3", patient: "patientID3", study_id: "studyID" }], true));
            assert.equal(elt.attr("href"), getSampleViewUrl("studyID", "sampleID", [{ patientId: "patientID", studyId: "studyID" }, { patientId: "patientID2", studyId: "studyID" }, { patientId: "patientID3", studyId: "studyID" }]));
            assert.equal(elt.text(), "View these 3 samples");
            elt = $(getCaseViewElt([{ patient: "patientID", study_id: "studyID" }, { patient: "patientID2", study_id: "studyID" }, { patient: "patientID3", study_id: "studyID" }], true));
            assert.equal(elt.attr("href"), getPatientViewUrl("studyID", "patientID", [{ patientId: "patientID", studyId: "studyID" }, { patientId: "patientID2", studyId: "studyID" }, { patientId: "patientID3", studyId: "studyID" }]));
            assert.equal(elt.text(), "View these 3 patients");

        });
    });
    describe("makeGeneticTrackTooltip", () => {
        let tooltip: (d: any) => JQuery;
        before(() => {
            tooltip = makeGeneticTrackTooltip(false, () => ({
                profile: { molecularProfileId: "profile", name: "Profile" } as any as MolecularProfile,
                profile2: { molecularProfileId: "profile2", name: "Profile2" } as any as MolecularProfile,
                profile3: { molecularProfileId: "profile3", name: "Profile3" } as any as MolecularProfile,
            }));
        });

        function makeMutation(props: Partial<AnnotatedExtendedAlteration>): AnnotatedExtendedAlteration {
            return {
                hugoGeneSymbol: "GENE",
                proteinChange: "proteinchange",
                molecularProfileAlterationType: AlterationTypeConstants.MUTATION_EXTENDED,
                ...props
            } as AnnotatedExtendedAlteration;
        }
        function makeFusion(props: Partial<AnnotatedExtendedAlteration>): AnnotatedExtendedAlteration {
            return makeMutation({ alterationSubType: "fusion", ...props });
        }
        function makeCna(props: Partial<AnnotatedExtendedAlteration>): AnnotatedExtendedAlteration {
            return {
                hugoGeneSymbol: "GENE",
                molecularProfileAlterationType: AlterationTypeConstants.COPY_NUMBER_ALTERATION,
                ...props
            } as AnnotatedExtendedAlteration;
        }

        function makeMrna(props: Partial<AnnotatedExtendedAlteration>): AnnotatedExtendedAlteration {
            return {
                hugoGeneSymbol: "GENE",
                molecularProfileAlterationType: AlterationTypeConstants.MRNA_EXPRESSION,
                ...props
            } as AnnotatedExtendedAlteration;
        }

        function makeProt(props: Partial<AnnotatedExtendedAlteration>): AnnotatedExtendedAlteration {
            return {
                hugoGeneSymbol: "GENE",
                molecularProfileAlterationType: AlterationTypeConstants.PROTEIN_LEVEL,
                ...props
            } as AnnotatedExtendedAlteration;
        }

        describe("custom driver annotations", () => {
            it("should show a binary custom driver icon with descriptive title, if theres a binary custom driver annotation", () => {
                const datum = {
                    sample: "sample", study_id: "",
                    data: [makeMutation({
                        driverFilter: "Putative_Driver",
                        driverFilterAnnotation: "annotation here"
                    })],
                };
                const datum2 = {
                    sample: "sample", study_id: "",
                    data: [makeMutation({
                        driverFilter: "Putative_Driver",
                        driverFilterAnnotation: "annotation here"
                    })],
                };
                const datum3 = {
                    sample: "sample", study_id: "",
                    data: [],
                };
                let tooltipOutput = tooltip([datum]);
                assert.equal(tooltipOutput.find("img[title='Putative_Driver: annotation here']").length, 1);
                assert.equal(tooltipOutput.find("img[alt='driver filter']").length, 1, "should only be one icon");
                assert.isFalse(tooltipOutput.html().indexOf("(1)") > -1, "theres no (1) because theres only one datum to the tooltip");

                tooltipOutput = tooltip([datum, datum2]);
                assert.equal(tooltipOutput.find("img[title='Putative_Driver: annotation here']").length, 1, "mutation appears once");
                assert.equal(tooltipOutput.find("img[alt='driver filter']").length, 1, "should only be one icon, because mutation appears once in tooltip");
                assert.isTrue(tooltipOutput.html().indexOf("(2)") > -1, "theres a (2) indicating 2 samples have that mutation");

                tooltipOutput = tooltip([datum, datum3]);
                assert.equal(tooltipOutput.find("img[title='Putative_Driver: annotation here']").length, 1);
                assert.equal(tooltipOutput.find("img[alt='driver filter']").length, 1, "should only be one icon");
                assert.isTrue(tooltipOutput.html().indexOf("(1)") > -1, "theres a (1) indicating 1 sample has that mutation");
            });

            it("should show multiple binary custom driver icons with corresponding titles, if there are multiple annotated mutations", () => {
                const datum = {
                    sample: "sample", study_id: "",
                    data: [makeMutation({
                        driverFilter: "Putative_Driver",
                        driverFilterAnnotation: "annotation 1"
                    }), makeMutation({
                        driverFilter: "Putative_Driver",
                        driverFilterAnnotation: "annotation 2"
                    }), makeMutation({
                        driverFilter: "Putative_Driver",
                        driverFilterAnnotation: "3 annotation"
                    })],
                };
                const datum2 = {
                    sample: "sample", study_id: "",
                    data: [makeMutation({
                        driverFilter: "Putative_Driver",
                        driverFilterAnnotation: "annotation 1"
                    }), makeMutation({
                        driverFilter: "Putative_Driver",
                        driverFilterAnnotation: "annotation 2"
                    }), makeMutation({
                        driverFilter: "Putative_Driver",
                        driverFilterAnnotation: "3 annotation"
                    })],
                };
                const datum3 = {
                    sample: "sample", study_id: "",
                    data: [],
                };
                let tooltipOutput = tooltip([datum]);
                assert.equal(tooltipOutput.find("img[title='Putative_Driver: annotation 1']").length, 1);
                assert.equal(tooltipOutput.find("img[title='Putative_Driver: annotation 2']").length, 1);
                assert.equal(tooltipOutput.find("img[title='Putative_Driver: 3 annotation']").length, 1);
                assert.equal(tooltipOutput.find("img[alt='driver filter']").length, 3, "should be three icons");
                assert.isFalse(tooltipOutput.html().indexOf("(1)") > -1, "theres no (1) because theres only one datum to the tooltip");

                tooltipOutput = tooltip([datum, datum2]);
                assert.equal(tooltipOutput.find("img[title='Putative_Driver: annotation 1']").length, 1, "mutation 1 appears once");
                assert.equal(tooltipOutput.find("img[title='Putative_Driver: annotation 2']").length, 1, "mutation 2 appears once");
                assert.equal(tooltipOutput.find("img[title='Putative_Driver: 3 annotation']").length, 1, "mutation 3 appears once");
                assert.equal(tooltipOutput.find("img[alt='driver filter']").length, 3, "should be three icons");
                assert.equal(tooltipOutput.html().match(/\(2\)/g)!.length, 3, "the string (2) appears thrice, one for each mutation which occurs in 2 data");

                tooltipOutput = tooltip([datum, datum3]);
                assert.equal(tooltipOutput.find("img[title='Putative_Driver: annotation 1']").length, 1, "mutation 1 appears once");
                assert.equal(tooltipOutput.find("img[title='Putative_Driver: annotation 2']").length, 1, "mutation 2 appears once");
                assert.equal(tooltipOutput.find("img[title='Putative_Driver: 3 annotation']").length, 1, "mutation 3 appears once");
                assert.equal(tooltipOutput.find("img[alt='driver filter']").length, 3, "should be three icons");
                assert.equal(tooltipOutput.html().match(/\(1\)/g)!.length, 3, "the string (1) appears thrice, one for each mutation which occurs in 1 data");
            });

            it("should not show a binary custom driver icon with descriptive title, if theres a binary annotation of non-driver", () => {
                const datum = {
                    sample: "sample", study_id: "",
                    data: [makeMutation({
                        driverFilter: "Putative_Passenger",
                        driverFilterAnnotation: "paosidjp"
                    }), makeMutation({
                        driverFilter: "Unknown",
                        driverFilterAnnotation: "asdfas"
                    })],
                };
                const tooltipOutput = tooltip([datum]);
                assert.equal(tooltipOutput.find("img[alt='driver filter']").length, 0);
            });

            it("should show a tiers custom driver icon with descriptive title, if theres a tiers custom driver annotation", () => {
                const datum = {
                    sample: "sample", study_id: "",
                    data: [makeMutation({
                        driverTiersFilter: "tier1",
                        driverTiersFilterAnnotation: "tier1 mutation"
                    })],
                };
                const datum2 = {
                    sample: "sample", study_id: "",
                    data: [makeMutation({
                        driverTiersFilter: "tier1",
                        driverTiersFilterAnnotation: "tier1 mutation"
                    })],
                };
                const datum3 = {
                    sample: "sample", study_id: "",
                    data: [],
                };
                let tooltipOutput = tooltip([datum]);
                assert.equal(tooltipOutput.find("img[title='tier1: tier1 mutation']").length, 1);
                assert.equal(tooltipOutput.find("img[alt='driver tiers filter']").length, 1, "should only be one icon");
                assert.isFalse(tooltipOutput.html().indexOf("(1)") > -1, "theres no (1) because theres only one datum to the tooltip");

                tooltipOutput = tooltip([datum, datum2]);
                assert.equal(tooltipOutput.find("img[title='tier1: tier1 mutation']").length, 1);
                assert.equal(tooltipOutput.find("img[alt='driver tiers filter']").length, 1, "should only be one icon, one entry for the mutation");
                assert.isTrue(tooltipOutput.html().indexOf("(2)") > -1, "theres a (2) indicating 2 samples have that mutation");

                tooltipOutput = tooltip([datum, datum3]);
                assert.equal(tooltipOutput.find("img[title='tier1: tier1 mutation']").length, 1);
                assert.equal(tooltipOutput.find("img[alt='driver tiers filter']").length, 1, "should only be one icon");
                assert.isTrue(tooltipOutput.html().indexOf("(1)") > -1, "theres a (1) indicating 1 sample has that mutation");
            });

            it("should show multiple tiers icons with corresponding titles, if there are multiple annotated mutations", () => {
                const datum = {
                    sample: "sample", study_id: "",
                    data: [makeMutation({
                        driverTiersFilter: "tier2",
                        driverTiersFilterAnnotation: "tier2 mutation"
                    }), makeMutation({
                        driverTiersFilter: "tier1",
                        driverTiersFilterAnnotation: "tier1 mutation"
                    }), makeMutation({
                        driverTiersFilter: "tier4",
                        driverTiersFilterAnnotation: "mutation tier4"
                    })],
                };
                const datum2 = {
                    sample: "sample", study_id: "",
                    data: [makeMutation({
                        driverTiersFilter: "tier2",
                        driverTiersFilterAnnotation: "tier2 mutation"
                    }), makeMutation({
                        driverTiersFilter: "tier1",
                        driverTiersFilterAnnotation: "tier1 mutation"
                    }), makeMutation({
                        driverTiersFilter: "tier4",
                        driverTiersFilterAnnotation: "mutation tier4"
                    })]
                };
                const datum3 = {
                    sample: "sample", study_id: "",
                    data: []
                };
                let tooltipOutput = tooltip([datum]);
                assert.equal(tooltipOutput.find("img[title='tier1: tier1 mutation']").length, 1);
                assert.equal(tooltipOutput.find("img[title='tier2: tier2 mutation']").length, 1);
                assert.equal(tooltipOutput.find("img[title='tier4: mutation tier4']").length, 1);
                assert.equal(tooltipOutput.find("img[alt='driver tiers filter']").length, 3, "should be three icons");
                assert.isFalse(tooltipOutput.html().indexOf("(1)") > -1, "theres no (1) because theres only one datum to the tooltip");

                tooltipOutput = tooltip([datum, datum2]);
                assert.equal(tooltipOutput.find("img[title='tier1: tier1 mutation']").length, 1, "mutation 1 appears once");
                assert.equal(tooltipOutput.find("img[title='tier2: tier2 mutation']").length, 1, "mutation 2 appears once");
                assert.equal(tooltipOutput.find("img[title='tier4: mutation tier4']").length, 1, "mutation 3 appears once");
                assert.equal(tooltipOutput.find("img[alt='driver tiers filter']").length, 3, "should be three icons");
                assert.equal(tooltipOutput.html().match(/\(2\)/g)!.length, 3, "the string (2) appears thrice, one for each mutation which occurs in 2 data");

                tooltipOutput = tooltip([datum3, datum]);
                assert.equal(tooltipOutput.find("img[title='tier1: tier1 mutation']").length, 1, "mutation 1 appears once");
                assert.equal(tooltipOutput.find("img[title='tier2: tier2 mutation']").length, 1, "mutation 2 appears once");
                assert.equal(tooltipOutput.find("img[title='tier4: mutation tier4']").length, 1, "mutation 3 appears once");
                assert.equal(tooltipOutput.find("img[alt='driver tiers filter']").length, 3, "should be three icons");
                assert.equal(tooltipOutput.html().match(/\(1\)/g)!.length, 3, "the string (1) appears thrice, one for each mutation which occurs in 1 data");
            });

            it("should show both binary and tiers custom driver icons, with descriptive titles, if there are both annotations", () => {
                const datum = {
                    sample: "sample", study_id: "",
                    data: [makeMutation({
                        driverFilter: "Putative_Driver",
                        driverFilterAnnotation: "annotation 1"
                    }), makeMutation({
                        driverFilter: "Putative_Driver",
                        driverFilterAnnotation: "annotation 2"
                    }), makeMutation({
                        driverFilter: "Putative_Driver",
                        driverFilterAnnotation: "3 annotation"
                    }), makeMutation({
                        driverFilter: "Putative_Passenger",
                        driverFilterAnnotation: "paosidjp"
                    }), makeMutation({
                        driverFilter: "Unknown",
                        driverFilterAnnotation: "asdfas"
                    }), makeMutation({
                        driverTiersFilter: "tier2",
                        driverTiersFilterAnnotation: "tier2 mutation"
                    }), makeMutation({
                        driverTiersFilter: "tier1",
                        driverTiersFilterAnnotation: "tier1 mutation"
                    }), makeMutation({
                        driverTiersFilter: "tier4",
                        driverTiersFilterAnnotation: "mutation tier4"
                    })]
                };
                const tooltipOutput = tooltip([datum]);
                assert.equal(tooltipOutput.find("img[title='tier1: tier1 mutation']").length, 1);
                assert.equal(tooltipOutput.find("img[title='tier2: tier2 mutation']").length, 1);
                assert.equal(tooltipOutput.find("img[title='tier4: mutation tier4']").length, 1);
                assert.equal(tooltipOutput.find("img[alt='driver tiers filter']").length, 3, "should be three tiers icons");
                assert.equal(tooltipOutput.find("img[title='Putative_Driver: annotation 1']").length, 1);
                assert.equal(tooltipOutput.find("img[title='Putative_Driver: annotation 2']").length, 1);
                assert.equal(tooltipOutput.find("img[title='Putative_Driver: 3 annotation']").length, 1);
                assert.equal(tooltipOutput.find("img[alt='driver filter']").length, 3, "should be three binary icons");
            });

            it("should show neither icon if theres no custom driver annotations", () => {
                const datum = {
                    sample: "sample", study_id: "",
                    data: [makeMutation({
                        driverFilter: "Putative_Passenger",
                        driverFilterAnnotation: "paosidjp"
                    }), makeMutation({
                        driverFilter: "Unknown",
                        driverFilterAnnotation: "asdfas"
                    }), makeMutation({}), makeMutation({})]
                };
                const tooltipOutput = tooltip([datum]);
                assert.equal(tooltipOutput.find("img[alt='driver filter']").length, 0, "should be no binary icons");
                assert.equal(tooltipOutput.find("img[alt='driver tiers filter']").length, 0, "should be no tiers icons");
            });
        });
        describe("germline mutations", () => {
            it("should show Germline next to every germline mutation, not next to others", () => {
                const datum = {
                    sample: "sample", study_id: "",
                    data: [makeMutation({ mutationStatus: "germline", proteinChange: "mutation1" }), makeMutation({ mutationStatus: "germline", proteinChange: "mutation2" }), makeMutation({})],
                };
                const datum2 = {
                    sample: "sample", study_id: "",
                    data: [makeMutation({ mutationStatus: "germline", proteinChange: "mutation1" }), makeMutation({ proteinChange: "mutation2" })]
                };
                const datum3 = {
                    sample: "sample", study_id: "",
                    data: [makeMutation({ proteinChange: "mutation1" }), makeMutation({ mutationStatus: "germline", proteinChange: "mutation2" })]
                };
                let tooltipOutput = tooltip([datum]);
                assert.equal(tooltipOutput.html().match(/Germline/g)!.length, 2);
                assert.isFalse(tooltipOutput.html().indexOf("(1)") > -1, "theres no (1) because theres only one datum to the tooltip");

                tooltipOutput = tooltip([datum, datum2]);
                assert.equal(tooltipOutput.html().match(/Germline/g)!.length, 2, "mutation1 germline, mutation2 germline");
                assert.equal(tooltipOutput.html().match(/\(2\)/g)!.length, 1, "mutation 1 germline occurs in both data")
                assert.equal(tooltipOutput.html().match(/\(1\)/g)!.length, 3, "empty mutation, mutation 2 germline, mutation 2 each occur once");
                assert.equal(tooltipOutput.html().match(/mutation2/g)!.length, 2, "since one is germline and one is not, should appear twice in tooltip");

                tooltipOutput = tooltip([datum, datum3]);
                assert.equal(tooltipOutput.html().match(/Germline/g)!.length, 2, "mutation1 germline, mutation2 germline");
                assert.equal(tooltipOutput.html().match(/\(2\)/g)!.length, 1, "mutation 2 germline occurs in both data")
                assert.equal(tooltipOutput.html().match(/\(1\)/g)!.length, 3, "empty mutation, mutation 1 germline, mutation 1 each occur once");
                assert.equal(tooltipOutput.html().match(/mutation1/g)!.length, 2, "since one is germline and one is not, should appear twice in tooltip");

                tooltipOutput = tooltip([datum2, datum3]);
                assert.equal(tooltipOutput.html().match(/Germline/g)!.length, 2, "mutation1 germline, mutation2 germline");
                assert.equal(tooltipOutput.html().match(/\(2\)/g), null, "nothing occurs in both")
                assert.equal(tooltipOutput.html().match(/\(1\)/g)!.length, 4, "mutation 1 germline, mutation 1, mutation 2 germline, mutation 2 each occur once");
                assert.equal(tooltipOutput.html().match(/mutation1/g)!.length, 2, "since one is germline and one is not, should appear twice in tooltip");
                assert.equal(tooltipOutput.html().match(/mutation2/g)!.length, 2, "since one is germline and one is not, should appear twice in tooltip");
            });
        });
        describe("profiled and not profiled", () => {
            it("should say 'Not profiled' if 'profiled_in' is empty and 'not_profiled_in' is not", () => {
                const datum = {
                    sample: "sample", study_id: "",
                    data: [] as AnnotatedExtendedAlteration[],
                    na: true,
                    profiled_in: [],
                    not_profiled_in: [{ molecularProfileId: "profile" }]
                };
                let tooltipOutput = tooltip([datum]);
                assert.isTrue(tooltipOutput.html().indexOf("Not profiled in selected molecular profiles.") > -1);
                assert.equal(tooltipOutput.html().match(/\(1\)/g), null, "doesnt show (1) indicator for only one sample");

                tooltipOutput = tooltip([datum, datum]);
                assert.isTrue(tooltipOutput.html().indexOf("Not profiled in selected molecular profiles. (2)") > -1);

                tooltipOutput = tooltip([datum, datum, datum]);
                assert.isTrue(tooltipOutput.html().indexOf("Not profiled in selected molecular profiles. (3)") > -1);
            });
            it("should say 'profiled' if 'not_profiled_in' is empty and 'profiled_in' is not", () => {
                const datum = {
                    sample: "sample", study_id: "",
                    data: [] as AnnotatedExtendedAlteration[],
                    na: true,
                    profiled_in: [{ molecularProfileId: "profile", genePanelId: "panel" }],
                    not_profiled_in: []
                };
                let tooltipOutput = tooltip([datum]);
                assert.isTrue(tooltipOutput.html().indexOf("Profiled in all selected molecular profiles.") > -1);
                assert.equal(tooltipOutput.html().match(/\(1\)/g), null, "doesnt show (1) indicator for only one sample");

                tooltipOutput = tooltip([datum, datum]);
                assert.isTrue(tooltipOutput.html().indexOf("Profiled in all selected molecular profiles. (2)") > -1);

                tooltipOutput = tooltip([datum, datum, datum]);
                assert.isTrue(tooltipOutput.html().indexOf("Profiled in all selected molecular profiles. (3)") > -1);
            });
            it("should give the correct spread of 'Not profiled' and 'Profiled' over multiple data", () => {
                const notProfiled = {
                    sample: "sample", study_id: "",
                    data: [] as AnnotatedExtendedAlteration[],
                    na: true,
                    profiled_in: [],
                    not_profiled_in: [{ molecularProfileId: "profile" }, { molecularProfileId: "profile2" }, { molecularProfileId: "profile3" }]
                };
                const profiled = {
                    sample: "sample", study_id: "",
                    data: [] as AnnotatedExtendedAlteration[],
                    na: true,
                    profiled_in: [{ molecularProfileId: "profile" }, { molecularProfileId: "profile2" }, { molecularProfileId: "profile3" }],
                    not_profiled_in: []
                };
                const datum1 = {
                    sample: "sample", study_id: "",
                    data: [] as AnnotatedExtendedAlteration[],
                    na: true,
                    profiled_in: [{ molecularProfileId: "profile" }],
                    not_profiled_in: [{ molecularProfileId: "profile2" }, { molecularProfileId: "profile3" }]
                };
                const datum2 = {
                    sample: "sample", study_id: "",
                    data: [] as AnnotatedExtendedAlteration[],
                    na: true,
                    profiled_in: [{ molecularProfileId: "profile" }, { molecularProfileId: "profile2" }],
                    not_profiled_in: [{ molecularProfileId: "profile3" }]
                };
                const datum3 = {
                    sample: "sample", study_id: "",
                    data: [] as AnnotatedExtendedAlteration[],
                    na: true,
                    profiled_in: [{ molecularProfileId: "profile2" }, { molecularProfileId: "profile3" }],
                    not_profiled_in: [{ molecularProfileId: "profile" }]
                };

                let tooltipOutput = tooltip([notProfiled, profiled, notProfiled]);
                assert.isTrue(tooltipOutput.html().indexOf("Not profiled in selected molecular profiles. (2)") > -1);
                assert.isTrue(tooltipOutput.html().indexOf("Profiled in all selected molecular profiles. (1)") > -1);

                tooltipOutput = tooltip([notProfiled, profiled, profiled, profiled]);
                assert.isTrue(tooltipOutput.html().indexOf("Not profiled in selected molecular profiles. (1)") > -1);
                assert.isTrue(tooltipOutput.html().indexOf("Profiled in all selected molecular profiles. (3)") > -1);

                tooltipOutput = tooltip([notProfiled, profiled]);
                assert.isTrue(tooltipOutput.html().indexOf("Not profiled in selected molecular profiles. (1)") > -1);
                assert.isTrue(tooltipOutput.html().indexOf("Profiled in all selected molecular profiles. (1)") > -1);

                tooltipOutput = tooltip([notProfiled, profiled, notProfiled, profiled, profiled, profiled, notProfiled]);
                assert.isTrue(tooltipOutput.html().indexOf("Not profiled in selected molecular profiles. (3)") > -1);
                assert.isTrue(tooltipOutput.html().indexOf("Profiled in all selected molecular profiles. (4)") > -1);

                tooltipOutput = tooltip([datum1, datum2, datum3]);
                assert.isTrue(tooltipOutput.html().indexOf("Not profiled in selected molecular profiles.") === -1, "None are profiled in none");
                assert.isTrue(tooltipOutput.html().indexOf("Profiled in all selected molecular profiles.") === -1, "None are profiled in all");
                assert.isTrue(tooltipOutput.html().indexOf("Profiled in: Profile (2), Profile2 (2), Profile3 (1)") > -1, "all the counts are correct (order is arbitrary)");
                assert.isTrue(tooltipOutput.html().indexOf("Not profiled in: Profile2 (1), Profile3 (2), Profile (1)") > -1, "all the counts are correct (order is arbitrary)");

                tooltipOutput = tooltip([datum1, datum2, datum3, profiled, notProfiled, profiled]);
                // it shows the right number of "not profiled in any" and "profiled in all", and also adds those counts to the specific profile counts
                assert.isTrue(tooltipOutput.html().indexOf("Not profiled in selected molecular profiles. (1)") > -1);
                assert.isTrue(tooltipOutput.html().indexOf("Profiled in all selected molecular profiles. (2)") > -1);
                assert.isTrue(tooltipOutput.html().indexOf("Profiled in: Profile (4), Profile2 (4), Profile3 (3)") > -1, "all the counts are correct (order is arbitrary)");
                assert.isTrue(tooltipOutput.html().indexOf("Not profiled in: Profile2 (2), Profile3 (3), Profile (2)") > -1, "all the counts are correct (order is arbitrary)");
            });
        });
        describe("gene panel information", () => {
            it("should show the correct gene panel entries in the tooltip, single and multiple data", () => {
                const datum1 = {
                    sample: "sample", study_id: "",
                    data: [] as AnnotatedExtendedAlteration[],
                    na: true,
                    profiled_in: [{ molecularProfileId: "profile", genePanelId: "panel1" }, { molecularProfileId: "profile", genePanelId: "panel2" }, { molecularProfileId: "profile2", genePanelId: "panel3" }],
                    not_profiled_in: []
                };
                const datum2 = {
                    sample: "sample", study_id: "",
                    data: [] as AnnotatedExtendedAlteration[],
                    na: true,
                    profiled_in: [],
                    not_profiled_in: [{ molecularProfileId: "profile", genePanelId: "panel1" }, { molecularProfileId: "profile", genePanelId: "panel2" }, { molecularProfileId: "profile2", genePanelId: "panel3" }]
                };
                const datum3 = {
                    sample: "sample", study_id: "",
                    data: [] as AnnotatedExtendedAlteration[],
                    na: true,
                    profiled_in: [{ molecularProfileId: "profile", genePanelId: "panel1" }, { molecularProfileId: "profile", genePanelId: "panel2" }],
                    not_profiled_in: [{ molecularProfileId: "profile2", genePanelId: "panel3" }]
                };

                let tooltipOutput = tooltip([datum1]);
                assert.equal(tooltipOutput.text().match(/panel1/g)!.length, 1);
                assert.equal(tooltipOutput.text().match(/panel2/g)!.length, 1);
                assert.equal(tooltipOutput.text().match(/panel3/g)!.length, 1);
                assert.equal(tooltipOutput.text().match(/\(1\)/g), null);

                tooltipOutput = tooltip([datum1, datum2]);
                assert.equal(tooltipOutput.text().match(/panel1/g)!.length, 1);
                assert.equal(tooltipOutput.text().match(/panel2/g)!.length, 1);
                assert.equal(tooltipOutput.text().match(/panel3/g)!.length, 1);
                assert.equal(tooltipOutput.text().match(/panel1 \(1\)/g)!.length, 1);
                assert.equal(tooltipOutput.text().match(/panel2 \(1\)/g)!.length, 1);
                assert.equal(tooltipOutput.text().match(/panel3 \(1\)/g)!.length, 1);
                assert.notEqual(tooltipOutput.find('a:contains("panel1")').first().css("color"), "red");
                assert.notEqual(tooltipOutput.find('a:contains("panel2")').first().css("color"), "red");
                assert.notEqual(tooltipOutput.find('a:contains("panel3")').first().css("color"), "red");

                tooltipOutput = tooltip([datum1, datum3]);
                assert.equal(tooltipOutput.text().match(/panel1/g)!.length, 1);
                assert.equal(tooltipOutput.text().match(/panel2/g)!.length, 1);
                assert.equal(tooltipOutput.text().match(/panel3/g)!.length, 1);
                assert.equal(tooltipOutput.text().match(/panel1 \(2\)/g)!.length, 1);
                assert.equal(tooltipOutput.text().match(/panel2 \(2\)/g)!.length, 1);
                assert.equal(tooltipOutput.text().match(/panel3 \(1\)/g)!.length, 1);
                assert.notEqual(tooltipOutput.find('a:contains("panel1")').first().css("color"), "red");
                assert.notEqual(tooltipOutput.find('a:contains("panel2")').first().css("color"), "red");
                assert.notEqual(tooltipOutput.find('a:contains("panel3")').first().css("color"), "red");

                tooltipOutput = tooltip([datum3, datum2]);
                assert.equal(tooltipOutput.text().match(/panel1/g)!.length, 1);
                assert.equal(tooltipOutput.text().match(/panel2/g)!.length, 1);
                assert.equal(tooltipOutput.text().match(/panel3/g)!.length, 1);
                assert.equal(tooltipOutput.text().match(/panel1 \(1\)/g)!.length, 1);
                assert.equal(tooltipOutput.text().match(/panel2 \(1\)/g)!.length, 1);
                assert.equal(tooltipOutput.text().match(/panel3 \(2\)/g)!.length, 1);
                assert.notEqual(tooltipOutput.find('a:contains("panel1")').first().css("color"), "red");
                assert.notEqual(tooltipOutput.find('a:contains("panel2")').first().css("color"), "red");
                assert.equal(tooltipOutput.find('a:contains("panel3")').first().css("color"), "red", "red because Not profiled in that gene panel");

                tooltipOutput = tooltip([datum3, datum1, datum2]);
                assert.equal(tooltipOutput.text().match(/panel1/g)!.length, 1);
                assert.equal(tooltipOutput.text().match(/panel2/g)!.length, 1);
                assert.equal(tooltipOutput.text().match(/panel3/g)!.length, 1);
                assert.equal(tooltipOutput.text().match(/panel1 \(2\)/g)!.length, 1);
                assert.equal(tooltipOutput.text().match(/panel2 \(2\)/g)!.length, 1);
                assert.equal(tooltipOutput.text().match(/panel3 \(1\)/g)!.length, 1);
                assert.notEqual(tooltipOutput.find('a:contains("panel1")').first().css("color"), "red");
                assert.notEqual(tooltipOutput.find('a:contains("panel2")').first().css("color"), "red");
                assert.notEqual(tooltipOutput.find('a:contains("panel3")').first().css("color"), "red");
            });
        });
        describe("genetic alterations", () => {
            let datum: any;
            let emptyDatum: any;
            let tooltipOutput: JQuery;
            beforeEach(() => {
                datum = {
                    sample: "sample", study_id: "",
                    data: [] as AnnotatedExtendedAlteration[],
                    na: false,
                    profiled_in: [],
                    not_profiled_in: []
                };
                emptyDatum = {
                    sample: "sample", study_id: "",
                    data: [] as AnnotatedExtendedAlteration[],
                    na: false,
                    profiled_in: [],
                    not_profiled_in: []
                };
            });
            it("single genetic alteration in single case - mutation", () => {
                datum.data = [makeMutation({ proteinChange: "PC1" })];
                tooltipOutput = tooltip([datum]);
                assert.equal(tooltipOutput.text().match(/Mutation:/g)!.length, 1);
                assert.equal(tooltipOutput.text().match(/GENE PC1/g)!.length, 1);
                assert.equal(tooltipOutput.text().match(/\(\d+\)/g), null, "no number indicator for single case");

                datum.data = [makeMutation({ proteinChange: "PC1" }), makeMutation({ proteinChange: "PC1" })];
                tooltipOutput = tooltip([datum]);
                assert.equal(tooltipOutput.text().match(/Mutation:/g)!.length, 1);
                assert.equal(tooltipOutput.text().match(/GENE PC1/g)!.length, 1);
                assert.equal(tooltipOutput.text().match(/\(\d+\)/g), null, "no number indicator for single case");
            });
            it("single genetic alteration in single case - fusion", () => {
                datum.data = [makeFusion({ proteinChange: "PC1" })];
                tooltipOutput = tooltip([datum]);
                assert.equal(tooltipOutput.text().match(/Fusion:/g)!.length, 1);
                assert.equal(tooltipOutput.text().match(/GENE PC1/g)!.length, 1);
                assert.equal(tooltipOutput.text().match(/\(\d+\)/g), null, "no number indicator for single case");

                datum.data = [makeFusion({ proteinChange: "PC1" }), makeFusion({ proteinChange: "PC1" })];
                tooltipOutput = tooltip([datum]);
                assert.equal(tooltipOutput.text().match(/Fusion:/g)!.length, 1);
                assert.equal(tooltipOutput.text().match(/GENE PC1/g)!.length, 1);
                assert.equal(tooltipOutput.text().match(/\(\d+\)/g), null, "no number indicator for single case");
            });
            it("single genetic alteration in single case - cna", () => {
                const disp_cna: { [integerCN: string]: string } = { '-2': 'HOMODELETED', '-1': 'HETLOSS', '1': 'GAIN', '2': 'AMPLIFIED' };
                for (let i = -2; i <= 2; i++) {
                    datum.data = [makeCna({ value: i })];
                    tooltipOutput = tooltip([datum]);

                    if (i === 0) {
                        // nothing in tooltip for diploid
                        assert.equal(tooltipOutput.text().match(/Copy Number Alteration:/g), null);
                    } else {
                        assert.equal(tooltipOutput.text().match(/Copy Number Alteration:/g)!.length, 1);
                        assert.equal(tooltipOutput.text().match(new RegExp(`GENE ${disp_cna[i.toString()]}`, "g"))!.length, 1);
                        assert.equal(tooltipOutput.text().match(/\(\d+\)/g), null, "no number indicator for single case");
                    }

                    datum.data = [makeCna({ value: i }), makeCna({ value: i })];
                    tooltipOutput = tooltip([datum]);

                    if (i === 0) {
                        // nothing in tooltip for diploid
                        assert.equal(tooltipOutput.text().match(/Copy Number Alteration:/g), null);
                    } else {
                        assert.equal(tooltipOutput.text().match(/Copy Number Alteration:/g)!.length, 1);
                        assert.equal(tooltipOutput.text().match(new RegExp(`GENE ${disp_cna[i.toString()]}`, "g"))!.length, 1);
                        assert.equal(tooltipOutput.text().match(/\(\d+\)/g), null, "no number indicator for single case");
                    }
                }
            });
            it("single genetic alteration in single case - mrna", ()=>{
                datum.data = [makeMrna({ alterationSubType:"high"})];
                tooltipOutput = tooltip([datum]);
                assert.equal(tooltipOutput.text().match(/MRNA:/g)!.length, 1);
                assert.equal(tooltipOutput.text().match(/GENE HIGH/g)!.length, 1);
                assert.equal(tooltipOutput.text().match(/\(\d+\)/g), null, "no number indicator for single case");

                datum.data = [makeMrna({ alterationSubType:"high"}), makeMrna({ alterationSubType:"high"})];
                tooltipOutput = tooltip([datum]);
                assert.equal(tooltipOutput.text().match(/MRNA:/g)!.length, 1);
                assert.equal(tooltipOutput.text().match(/GENE HIGH/g)!.length, 1);
                assert.equal(tooltipOutput.text().match(/\(\d+\)/g), null, "no number indicator for single case");

                datum.data = [makeMrna({ alterationSubType:"low"})];
                tooltipOutput = tooltip([datum]);
                assert.equal(tooltipOutput.text().match(/MRNA:/g)!.length, 1);
                assert.equal(tooltipOutput.text().match(/GENE LOW/g)!.length, 1);
                assert.equal(tooltipOutput.text().match(/\(\d+\)/g), null, "no number indicator for single case");

                datum.data = [makeMrna({ alterationSubType:"low"}), makeMrna({ alterationSubType:"low"})];
                tooltipOutput = tooltip([datum]);
                assert.equal(tooltipOutput.text().match(/MRNA:/g)!.length, 1);
                assert.equal(tooltipOutput.text().match(/GENE LOW/g)!.length, 1);
                assert.equal(tooltipOutput.text().match(/\(\d+\)/g), null, "no number indicator for single case");
            });
            it("single genetic alteration in single case - prot", ()=>{
                datum.data = [makeProt({ alterationSubType:"high"})];
                tooltipOutput = tooltip([datum]);
                assert.equal(tooltipOutput.text().match(/PROT:/g)!.length, 1);
                assert.equal(tooltipOutput.text().match(/GENE HIGH/g)!.length, 1);
                assert.equal(tooltipOutput.text().match(/\(\d+\)/g), null, "no number indicator for single case");

                datum.data = [makeProt({ alterationSubType:"high"}), makeProt({ alterationSubType:"high"})];
                tooltipOutput = tooltip([datum]);
                assert.equal(tooltipOutput.text().match(/PROT:/g)!.length, 1);
                assert.equal(tooltipOutput.text().match(/GENE HIGH/g)!.length, 1);
                assert.equal(tooltipOutput.text().match(/\(\d+\)/g), null, "no number indicator for single case");

                datum.data = [makeProt({ alterationSubType:"low"})];
                tooltipOutput = tooltip([datum]);
                assert.equal(tooltipOutput.text().match(/PROT:/g)!.length, 1);
                assert.equal(tooltipOutput.text().match(/GENE LOW/g)!.length, 1);
                assert.equal(tooltipOutput.text().match(/\(\d+\)/g), null, "no number indicator for single case");

                datum.data = [makeProt({ alterationSubType:"low"}), makeProt({ alterationSubType:"low"})];
                tooltipOutput = tooltip([datum]);
                assert.equal(tooltipOutput.text().match(/PROT:/g)!.length, 1);
                assert.equal(tooltipOutput.text().match(/GENE LOW/g)!.length, 1);
                assert.equal(tooltipOutput.text().match(/\(\d+\)/g), null, "no number indicator for single case");
            });
            it("single genetic alteration across multiple cases - mutation", () => {
                datum.data = [makeMutation({ proteinChange: "PC1" })];
                tooltipOutput = tooltip([datum, datum, datum]);
                assert.equal(tooltipOutput.text().match(/Mutation:/g)!.length, 1);
                assert.equal(tooltipOutput.text().match(/GENE PC1\xa0\(3\)/g)!.length, 1);

                tooltipOutput = tooltip([datum, emptyDatum]);
                assert.equal(tooltipOutput.text().match(/Mutation:/g)!.length, 1);
                assert.equal(tooltipOutput.text().match(/GENE PC1\xa0\(1\)/g)!.length, 1);
            });
            it("single genetic alteration across multiple cases - fusion", () => {
                datum.data = [makeFusion({ proteinChange: "PC1" })];
                tooltipOutput = tooltip([datum, datum, datum]);
                assert.equal(tooltipOutput.text().match(/Fusion:/g)!.length, 1);
                assert.equal(tooltipOutput.text().match(/GENE PC1\xa0\(3\)/g)!.length, 1);

                tooltipOutput = tooltip([datum, emptyDatum]);
                assert.equal(tooltipOutput.text().match(/Fusion:/g)!.length, 1);
                assert.equal(tooltipOutput.text().match(/GENE PC1\xa0\(1\)/g)!.length, 1);
            });
            it("single genetic alteration across multiple cases - cna", () => {
                const disp_cna: { [integerCN: string]: string } = { '-2': 'HOMODELETED', '-1': 'HETLOSS', '1': 'GAIN', '2': 'AMPLIFIED' };
                for (let i = -2; i <= 2; i++) {
                    datum.data = [makeCna({ value: i })];
                    tooltipOutput = tooltip([emptyDatum, datum, datum, datum, datum]);

                    if (i === 0) {
                        // nothing in tooltip for diploid
                        assert.equal(tooltipOutput.text().match(/Copy Number Alteration:/g), null);
                    } else {
                        assert.equal(tooltipOutput.text().match(/Copy Number Alteration:/g)!.length, 1);
                        assert.equal(tooltipOutput.text().match(new RegExp(`GENE ${disp_cna[i.toString()]}\\xa0\\(4\\)`, "g"))!.length, 1);
                    }
                }
            });
            it("single genetic alteration across multiple cases - mrna", ()=>{
                datum.data = [makeMrna({ alterationSubType:"high"})];
                tooltipOutput = tooltip([datum, datum]);
                assert.equal(tooltipOutput.text().match(/MRNA:/g)!.length, 1);
                assert.equal(tooltipOutput.text().match(/GENE HIGH\xa0\(2\)/g)!.length, 1);

                datum.data = [makeMrna({ alterationSubType:"low"})];
                tooltipOutput = tooltip([datum, datum]);
                assert.equal(tooltipOutput.text().match(/MRNA:/g)!.length, 1);
                assert.equal(tooltipOutput.text().match(/GENE LOW\xa0\(2\)/g)!.length, 1);

                tooltipOutput = tooltip([emptyDatum, datum]);
                assert.equal(tooltipOutput.text().match(/MRNA:/g)!.length, 1);
                assert.equal(tooltipOutput.text().match(/GENE LOW\xa0\(1\)/g)!.length, 1);
            });
            it("single genetic alteration across multiple cases - prot", ()=>{
                datum.data = [makeProt({ alterationSubType:"high"})];
                tooltipOutput = tooltip([datum, datum, datum, datum, datum]);
                assert.equal(tooltipOutput.text().match(/PROT:/g)!.length, 1);
                assert.equal(tooltipOutput.text().match(/GENE HIGH\xa0\(5\)/g)!.length, 1);

                datum.data = [makeProt({ alterationSubType:"low"})];
                tooltipOutput = tooltip([datum, datum, datum, datum, datum]);
                assert.equal(tooltipOutput.text().match(/PROT:/g)!.length, 1);
                assert.equal(tooltipOutput.text().match(/GENE LOW\xa0\(5\)/g)!.length, 1);
            });
            it("multiple alterations of same type in single case - mutation", () => {
                datum.data = [makeMutation({ proteinChange: "PC1" }), makeMutation({ proteinChange: "PC2" })];
                tooltipOutput = tooltip([datum]);
                assert.equal(tooltipOutput.text().match(/Mutation:/g)!.length, 1);
                assert.equal(tooltipOutput.text().match(/GENE PC1/g)!.length, 1);
                assert.equal(tooltipOutput.text().match(/GENE PC2/g)!.length, 1);
                assert.equal(tooltipOutput.text().match(/\(\d+\)/g), null, "no number indicator for single case");
            });
            it("multiple alterations of same type in single case - fusion", () => {
                datum.data = [makeFusion({ proteinChange: "PC1" }), makeFusion({ proteinChange: "PC2" })];
                tooltipOutput = tooltip([datum]);
                assert.equal(tooltipOutput.text().match(/Fusion:/g)!.length, 1);
                assert.equal(tooltipOutput.text().match(/GENE PC1/g)!.length, 1);
                assert.equal(tooltipOutput.text().match(/GENE PC2/g)!.length, 1);
                assert.equal(tooltipOutput.text().match(/\(\d+\)/g), null, "no number indicator for single case");
            });
            it("multiple alterations of same type in single case - cna", () => {
                datum.data = [makeCna({ value: -2 }), makeCna({ value: -1 }), makeCna({ value: 1 })];
                tooltipOutput = tooltip([datum]);
                assert.equal(tooltipOutput.text().match(/Copy Number Alteration:/g)!.length, 1);
                assert.equal(tooltipOutput.text().match(/GENE HOMODELETED/g)!.length, 1);
                assert.equal(tooltipOutput.text().match(/GENE HETLOSS/g)!.length, 1);
                assert.equal(tooltipOutput.text().match(/GENE GAIN/g)!.length, 1);
                assert.equal(tooltipOutput.text().match(/\(\d+\)/g), null, "no number indicator for single case");
            });
            it("multiple alterations of same type in single case - mrna", ()=>{
                datum.data = [makeMrna({ alterationSubType:"high"}), makeMrna({ alterationSubType:"low"}), makeMrna({ alterationSubType:"high"})];
                tooltipOutput = tooltip([datum]);
                assert.equal(tooltipOutput.text().match(/MRNA:/g)!.length, 1);
                assert.equal(tooltipOutput.text().match(/GENE HIGH/g)!.length, 1);
                assert.equal(tooltipOutput.text().match(/GENE LOW/g)!.length, 1);
                assert.equal(tooltipOutput.text().match(/\(\d+\)/g), null, "no number indicator for single case");
            });
            it("multiple alterations of same type in single case - protein", ()=>{
                datum.data = [makeProt({ alterationSubType:"low"}), makeProt({ alterationSubType:"low"}), makeProt({ alterationSubType:"high"})];
                tooltipOutput = tooltip([datum]);
                assert.equal(tooltipOutput.text().match(/PROT:/g)!.length, 1);
                assert.equal(tooltipOutput.text().match(/GENE HIGH/g)!.length, 1);
                assert.equal(tooltipOutput.text().match(/GENE LOW/g)!.length, 1);
                assert.equal(tooltipOutput.text().match(/\(\d+\)/g), null, "no number indicator for single case");
            });
            it("multiple alterations of same type across multiple cases - mutation", () => {
                datum.data = [makeMutation({ proteinChange: "PC1" }), makeMutation({ proteinChange: "PC2" })];
                tooltipOutput = tooltip([datum, datum, datum]);
                assert.equal(tooltipOutput.text().match(/Mutation:/g)!.length, 1);
                assert.equal(tooltipOutput.text().match(/GENE PC1\xa0\(3\)/g)!.length, 1);
                assert.equal(tooltipOutput.text().match(/GENE PC2\xa0\(3\)/g)!.length, 1);

                tooltipOutput = tooltip([datum, emptyDatum]);
                assert.equal(tooltipOutput.text().match(/Mutation:/g)!.length, 1);
                assert.equal(tooltipOutput.text().match(/GENE PC1\xa0\(1\)/g)!.length, 1);
                assert.equal(tooltipOutput.text().match(/GENE PC2\xa0\(1\)/g)!.length, 1);
            });
            it("multiple alterations of same type across multiple cases - fusion", () => {
                datum.data = [makeFusion({ proteinChange: "PC1" }), makeFusion({ proteinChange: "PC2" })];
                tooltipOutput = tooltip([datum, datum, datum, datum]);
                assert.equal(tooltipOutput.text().match(/Fusion:/g)!.length, 1);
                assert.equal(tooltipOutput.text().match(/GENE PC1\xa0\(4\)/g)!.length, 1);
                assert.equal(tooltipOutput.text().match(/GENE PC2\xa0\(4\)/g)!.length, 1);

                tooltipOutput = tooltip([datum, datum, emptyDatum, emptyDatum]);
                assert.equal(tooltipOutput.text().match(/Fusion:/g)!.length, 1);
                assert.equal(tooltipOutput.text().match(/GENE PC1\xa0\(2\)/g)!.length, 1);
                assert.equal(tooltipOutput.text().match(/GENE PC2\xa0\(2\)/g)!.length, 1);
            });
            it("multiple alterations of same type across multiple cases - cna", () => {
                datum.data = [makeCna({ value: -2 }), makeCna({ value: -1 }), makeCna({ value: 1 })];
                tooltipOutput = tooltip([datum, datum, datum]);
                assert.equal(tooltipOutput.text().match(/Copy Number Alteration:/g)!.length, 1);
                assert.equal(tooltipOutput.text().match(/GENE HOMODELETED\xa0\(3\)/g)!.length, 1);
                assert.equal(tooltipOutput.text().match(/GENE HETLOSS\xa0\(3\)/g)!.length, 1);
                assert.equal(tooltipOutput.text().match(/GENE GAIN\xa0\(3\)/g)!.length, 1);

                tooltipOutput = tooltip([emptyDatum, emptyDatum, datum]);
                assert.equal(tooltipOutput.text().match(/Copy Number Alteration:/g)!.length, 1);
                assert.equal(tooltipOutput.text().match(/GENE HOMODELETED\xa0\(1\)/g)!.length, 1);
                assert.equal(tooltipOutput.text().match(/GENE HETLOSS\xa0\(1\)/g)!.length, 1);
                assert.equal(tooltipOutput.text().match(/GENE GAIN\xa0\(1\)/g)!.length, 1);
            });
            it("multiple alterations of same type across multiple cases - mrna", ()=>{
                datum.data = [makeMrna({ alterationSubType:"high"}), makeMrna({ alterationSubType:"low"}), makeMrna({ alterationSubType:"high"})];
                tooltipOutput = tooltip([datum, datum]);
                assert.equal(tooltipOutput.text().match(/MRNA:/g)!.length, 1);
                assert.equal(tooltipOutput.text().match(/GENE HIGH\xa0\(4\)/g)!.length, 1);
                assert.equal(tooltipOutput.text().match(/GENE LOW\xa0\(2\)/g)!.length, 1);

                tooltipOutput = tooltip([datum, datum, emptyDatum, emptyDatum, datum]);
                assert.equal(tooltipOutput.text().match(/MRNA:/g)!.length, 1);
                assert.equal(tooltipOutput.text().match(/GENE HIGH\xa0\(6\)/g)!.length, 1);
                assert.equal(tooltipOutput.text().match(/GENE LOW\xa0\(3\)/g)!.length, 1);
            });
            it("multiple alterations of same type across multiple cases - protein", ()=>{
                datum.data = [makeProt({ alterationSubType:"low"}), makeProt({ alterationSubType:"low"}), makeProt({ alterationSubType:"high"})];
                tooltipOutput = tooltip([datum, datum, datum]);
                assert.equal(tooltipOutput.text().match(/PROT:/g)!.length, 1);
                assert.equal(tooltipOutput.text().match(/GENE HIGH\xa0\(3\)/g)!.length, 1);
                assert.equal(tooltipOutput.text().match(/GENE LOW\xa0\(6\)/g)!.length, 1);

                tooltipOutput = tooltip([datum, emptyDatum]);
                assert.equal(tooltipOutput.text().match(/PROT:/g)!.length, 1);
                assert.equal(tooltipOutput.text().match(/GENE HIGH\xa0\(1\)/g)!.length, 1);
                assert.equal(tooltipOutput.text().match(/GENE LOW\xa0\(2\)/g)!.length, 1);
            });
            it("multiple alterations of different types in single case", () => {
                datum.data = [
                    makeMutation({proteinChange:"PC1"}), makeMutation({proteinChange:"PC2"}),
                    makeFusion({proteinChange:"fusion1"}), makeFusion({proteinChange:"fusion2"}),
                    makeCna({value:2}),makeCna({value:-2}),
                    makeMrna({ alterationSubType:"high"}), makeMrna({ alterationSubType:"low"}),
                    makeProt({ alterationSubType:"low"})
                ];
                tooltipOutput = tooltip([datum]);
                assert.equal(tooltipOutput.text().match(/Mutation:/g)!.length, 1);
                assert.equal(tooltipOutput.text().match(/GENE PC1/g)!.length, 1);
                assert.equal(tooltipOutput.text().match(/GENE PC2/g)!.length, 1);

                assert.equal(tooltipOutput.text().match(/Fusion:/g)!.length, 1);
                assert.equal(tooltipOutput.text().match(/GENE fusion1/g)!.length, 1);
                assert.equal(tooltipOutput.text().match(/GENE fusion2/g)!.length, 1);

                assert.equal(tooltipOutput.text().match(/Copy Number Alteration:/g)!.length, 1);
                assert.equal(tooltipOutput.text().match(/GENE AMPLIFIED/g)!.length, 1);
                assert.equal(tooltipOutput.text().match(/GENE HOMODELETED/g)!.length, 1);

                assert.equal(tooltipOutput.text().match(/MRNA:/g)!.length, 1);
                assert.equal(tooltipOutput.text().match(/GENE HIGH/g)!.length, 1);
                assert.equal(tooltipOutput.text().match(/PROT:/g)!.length, 1);
                assert.equal(tooltipOutput.text().match(/GENE LOW/g)!.length, 2); // (2 for mrna and protein)

                assert.equal(tooltipOutput.text().match(/\(\d+\)/g), null, "no number indicator for single case");
            });
            it("multiple alterations of different types across multiple cases", () => {
                datum.data = [
                    makeMutation({proteinChange:"PC1"}), makeMutation({proteinChange:"PC2"}),
                    makeFusion({proteinChange:"fusion1"}), makeFusion({proteinChange:"fusion2"}),
                    makeCna({value:2}),makeCna({value:-2}),
                    makeMrna({ alterationSubType:"high"}), makeMrna({ alterationSubType:"low"}),
                    makeProt({ alterationSubType:"low"})
                ];
                const datum2 = Object.assign({}, emptyDatum, { data:[
                    makeMutation({proteinChange:"PC1"}),
                    makeFusion({proteinChange:"fusion2"}),
                    makeCna({value:1}),
                    makeMrna({ alterationSubType:"low"}),
                    makeProt({ alterationSubType:"high"}), makeProt({ alterationSubType:"low"})
                ]});
                tooltipOutput = tooltip([datum, datum, emptyDatum, datum, datum2]);
                assert.equal(tooltipOutput.text().match(/Mutation:/g)!.length, 1);
                assert.equal(tooltipOutput.text().match(/GENE PC1\xa0\(4\)/g)!.length, 1);
                assert.equal(tooltipOutput.text().match(/GENE PC2\xa0\(3\)/g)!.length, 1);

                assert.equal(tooltipOutput.text().match(/Fusion:/g)!.length, 1);
                assert.equal(tooltipOutput.text().match(/GENE fusion1\xa0\(3\)/g)!.length, 1);
                assert.equal(tooltipOutput.text().match(/GENE fusion2\xa0\(4\)/g)!.length, 1);

                assert.equal(tooltipOutput.text().match(/Copy Number Alteration:/g)!.length, 1);
                assert.equal(tooltipOutput.text().match(/GENE AMPLIFIED\xa0\(3\)/g)!.length, 1);
                assert.equal(tooltipOutput.text().match(/GENE GAIN\xa0\(1\)/g)!.length, 1);
                assert.equal(tooltipOutput.text().match(/GENE HOMODELETED\xa0\(3\)/g)!.length, 1);

                assert.equal(tooltipOutput.text().match(/MRNA:/g)!.length, 1);
                assert.equal(tooltipOutput.text().match(/GENE HIGH\xa0\(3\)/g)!.length, 1);
                assert.equal(tooltipOutput.text().match(/PROT:/g)!.length, 1);
                assert.equal(tooltipOutput.text().match(/GENE HIGH\xa0\(1\)/g)!.length, 1);
                assert.equal(tooltipOutput.text().match(/GENE LOW\xa0\(4\)/g)!.length, 2); // (2 for mrna and protein)
            });
        });
    });
    describe("makeClinicalTrackTooltip", () => {
        describe("category track tooltip", () => {
            let trackLabel: string;
            let trackSpec: any;
            let tooltip: (dataUnderMouse: any[]) => JQuery;
            before(() => {
                trackLabel = "label1234";
                trackSpec = {
                    key: "",
                    label: trackLabel,
                    description: "",
                    data: [],
                    datatype: "string" as "string"
                };
                tooltip = makeClinicalTrackTooltip(trackSpec, false);
            });

            it("should show the given sample id", () => {
                const sampleTooltipResult = tooltip([{ attr_val_counts: { "a": 1 }, attr_val: "a", sample: "sampleID" }]);
                assert.isTrue(sampleTooltipResult.html().indexOf("<span>sampleID</span>") > -1);
            });
            it("should show the given patient id", () => {
                const patientTooltipResult = tooltip([{ attr_val_counts: { "a": 1 }, attr_val: "a", patient: "patientID" }]);
                assert.isTrue(patientTooltipResult.html().indexOf("<span>patientID</span>") > -1);
            });
            it("should show the correct output for a single value", () => {
                const tooltipResult = tooltip([{ attr_val_counts: { "a": 1 }, attr_val: "a", sample: "sampleID" }]);
                assert.isTrue(tooltipResult.html().indexOf(`label1234: <span style="white-space:nowrap"><b>a</b></span>`) > -1);
            });
            it("should show the correct output for multiple values", () => {
                const tooltipResult = tooltip([{ attr_val_counts: { "a": 1, "b": 3 }, attr_val: "a", sample: "sampleID" }]);
                assert.isTrue(tooltipResult.html().indexOf(`label1234:<br><span style="white-space:nowrap"><b>a</b>: 1 sample</span><br><span style="white-space:nowrap"><b>b</b>: 3 samples</span>`) > -1);
            });
            it("should show the correct output for multiple data, single value", () => {
                const tooltipResult = tooltip([
                    { attr_val_counts: { "a": 1 }, attr_val: "a", patient: "patientID" },
                    { attr_val_counts: { "a": 1 }, attr_val: "a", patient: "patientID" },
                    { attr_val_counts: { "a": 2 }, attr_val: "a", patient: "patientID" }
                ]);
                assert.isTrue(tooltipResult.html().indexOf(`label1234: <span style="white-space:nowrap"><b>a</b> (4 samples)</span><br>`) > -1);
            });
            it("should show the correct output for multiple data, multiple values", () => {
                const tooltip = makeClinicalTrackTooltip(trackSpec, false);
                const tooltipResult = tooltip([
                    { attr_val_counts: { "a": 1, "b": 5 }, attr_val: "a", patient: "patientID" },
                    { attr_val_counts: { "a": 1 }, attr_val: "a", patient: "patientID" },
                    { attr_val_counts: { "a": 2, "b": 1, "c": 1 }, attr_val: "a", patient: "patientID" }
                ]);
                assert.isTrue(tooltipResult.html().indexOf(
                    `label1234:<br><span style="white-space:nowrap"><b>a</b>: 4 samples</span><br><span style="white-space:nowrap"><b>b</b>: 6 samples</span><br><span style="white-space:nowrap"><b>c</b>: 1 sample</span>`
                ) > -1);
            });
        });
        describe("number track tooltip", () => {
            let trackSpec: any;
            let tooltip: (dataUnderMouse: any[]) => JQuery;
            before(() => {
                trackSpec = {
                    key: "",
                    label: "",
                    description: "",
                    data: [],
                    datatype: "number" as "number",
                    numberRange: [0, 0] as [number, number],
                    numberLogScale: false
                };
                tooltip = makeClinicalTrackTooltip(trackSpec, false);
            });
            it("should show numerical data rounded to 2 decimal digits", () => {
                // one data
                let tooltipResult = tooltip([{ attr_val_counts: { "0.13500013531": 1 }, attr_val: "0.13500013531", sample: "sampleID" }]);
                assert.isTrue(tooltipResult.html().indexOf("<b>0.14</b>") > -1, "correct result with no integer part");
                tooltipResult = tooltip([{ attr_val_counts: { "6.100032": 1 }, attr_val: "6.100032", sample: "sampleID" }]);
                assert.isTrue(tooltipResult.html().indexOf("<b>6.10</b>") > -1, "correct result with integer part");
                tooltipResult = tooltip([{ attr_val_counts: { "0": 1 }, attr_val: "0", sample: "sampleID" }]);
                assert.isTrue(tooltipResult.html().indexOf("<b>0</b>") > -1, "correct result for zero")
                tooltipResult = tooltip([{ attr_val_counts: { "-0.13500013531": 1 }, attr_val: "-0.13500013531", sample: "sampleID" }]);
                assert.isTrue(tooltipResult.html().indexOf("<b>-0.14</b>") > -1, "correct result with no integer part, negative");
                tooltipResult = tooltip([{ attr_val_counts: { "-6.100032": 1 }, attr_val: "-6.100032", sample: "sampleID" }]);
                assert.isTrue(tooltipResult.html().indexOf("<b>-6.10</b>") > -1, "correct result with integer part, negative");

                // multiple data
                // more than one data
                tooltipResult = tooltip([{ attr_val_counts: { "0.13500013531": 1 }, sample: "sampleID" }, { attr_val_counts: { "0.23500013531": 1 }, sample: "sampleID" }, { attr_val_counts: { "0.33500013531": 1 }, sample: "sampleID" }]);
                assert.isTrue(tooltipResult.html().indexOf("<b>0.24 (average of 3 values)</b>") > -1, "multiple - correct result with no integer part");
                tooltipResult = tooltip([{ attr_val_counts: { "6.100032": 1 }, sample: "sampleID" }, { attr_val_counts: { "8.100032": 1 }, sample: "sampleID" }]);
                assert.isTrue(tooltipResult.html().indexOf("<b>7.10 (average of 2 values)</b>") > -1, "multiple - correct result with integer part");
                tooltipResult = tooltip([{ attr_val_counts: { "0": 1 }, sample: "sampleID" }, { attr_val_counts: { "0": 1 }, sample: "sampleID" }, { attr_val_counts: { "0": 1 }, sample: "sampleID" }, { attr_val_counts: { "0": 1 }, sample: "sampleID" }]);
                assert.isTrue(tooltipResult.html().indexOf("<b>0 (average of 4 values)</b>") > -1, "multiple - correct result for zero")
                tooltipResult = tooltip([{ attr_val_counts: { "-0.03500013531": 2, "-0.23500013531": 2 }, sample: "sampleID" }]);
                assert.isTrue(tooltipResult.html().indexOf("<b>-0.14 (average of 4 values)</b>") > -1, "correct result with no integer part, negative");
                tooltipResult = tooltip([{ attr_val_counts: { "-5.100032": 1 }, sample: "sampleID" }, { attr_val_counts: { "-2.100032": 2 }, sample: "sampleID" }]);
                assert.isTrue(tooltipResult.html().indexOf("<b>-3.10 (average of 3 values)</b>") > -1, "correct result with integer part, negative");
            });
        });
    });
    describe("makeHeatmapTrackTooltip", () => {

        const tooltip = makeHeatmapTrackTooltip("MRNA_EXPRESSION", false);

        it("should show data rounded to 2 decimal digits", () => {
            // one data
            let tooltipResult = tooltip([{ profile_data: 0.13500013531, sample: "sampleID" }]);
            assert.isTrue(tooltipResult.html().indexOf("<b>0.14</b>") > -1, "correct result with no integer part");
            tooltipResult = tooltip([{ profile_data: 6.100032, sample: "sampleID" }]);
            assert.isTrue(tooltipResult.html().indexOf("<b>6.10</b>") > -1, "correct result with integer part");
            tooltipResult = tooltip([{ profile_data: 0, sample: "sampleID" }]);
            assert.isTrue(tooltipResult.html().indexOf("<b>0.00</b>") > -1, "correct result for zero")
            tooltipResult = tooltip([{ profile_data: -0.13500013531, sample: "sampleID" }]);
            assert.isTrue(tooltipResult.html().indexOf("<b>-0.14</b>") > -1, "correct result with no integer part, negative");
            tooltipResult = tooltip([{ profile_data: -6.100032, sample: "sampleID" }]);
            assert.isTrue(tooltipResult.html().indexOf("<b>-6.10</b>") > -1, "correct result with integer part, negative");

            // more than one data
            tooltipResult = tooltip([{ profile_data: 0.13500013531, sample: "sampleID" }, { profile_data: 0.23500013531, sample: "sampleID" }, { profile_data: 0.33500013531, sample: "sampleID" }]);
            assert.isTrue(tooltipResult.html().indexOf("<b>0.24 (average of 3 values)</b>") > -1, "multiple - correct result with no integer part");
            tooltipResult = tooltip([{ profile_data: 6.100032, sample: "sampleID" }, { profile_data: 8.100032, sample: "sampleID" }]);
            assert.isTrue(tooltipResult.html().indexOf("<b>7.10 (average of 2 values)</b>") > -1, "multiple - correct result with integer part");
            tooltipResult = tooltip([{ profile_data: 0, sample: "sampleID" }, { profile_data: 0, sample: "sampleID" }, { profile_data: 0, sample: "sampleID" }, { profile_data: 0, sample: "sampleID" }]);
            assert.isTrue(tooltipResult.html().indexOf("<b>0.00 (average of 4 values)</b>") > -1, "multiple - correct result for zero")
            tooltipResult = tooltip([{ profile_data: -0.03500013531, sample: "sampleID" }, { profile_data: -0.03500013531, sample: "sampleID" }, { profile_data: -0.23500013531, sample: "sampleID" }, { profile_data: -0.23500013531, sample: "sampleID" }]);
            assert.isTrue(tooltipResult.html().indexOf("<b>-0.14 (average of 4 values)</b>") > -1, "correct result with no integer part, negative");
            tooltipResult = tooltip([{ profile_data: -6.100032, sample: "sampleID" }, { profile_data: -2.100032, sample: "sampleID" }]);
            assert.isTrue(tooltipResult.html().indexOf("<b>-4.10 (average of 2 values)</b>") > -1, "correct result with integer part, negative");

        });

        it('Should not handle categories for molecular genetic alterations', () => {
            const tooltipResult = tooltip([{ profile_data: 8, sample: "sampleID", category: ">8.00" }]);
            assert.isTrue(tooltipResult.html().indexOf("<b>8.00</b>") > -1, "molecular track - category is ignored when available");
        });

        const fTreamentTooltip = makeHeatmapTrackTooltip("GENERIC_ASSAY", false);

        it('Should handle categories for treatment genetic alterations', () => {
            const tooltipResult = fTreamentTooltip([{ profile_data: 8, sample: "sampleID", category: ">8.00" }]);
            assert.isTrue(tooltipResult.html().indexOf("<b>&gt;8.00</b>") > -1, "treatment - category is displayed when available");
        });

        it('Should handle categories for multiple treatment genetic alterations', () => {
            const tooltipResult = fTreamentTooltip([{ profile_data: 8, sample: "sampleID", category: ">8.00" }, { profile_data: 7, sample: "sampleID", category: ">7.00" }]);
            assert.isTrue(tooltipResult.html().indexOf("<b>&gt;8.00, &gt;7.00 (2 data points)</b>") > -1, "treatment - multiple categories are displayed when under mouse");
        });

        it('Should handle single values and single category for multiple treatment genetic alterations', () => {
            const tooltipResult = fTreamentTooltip([{ profile_data: 8, sample: "sampleID", category: "" }, { profile_data: 7, sample: "sampleID", category: ">7.00" }]);
            assert.isTrue(tooltipResult.html().indexOf("<b>8.00</b> and <b>&gt;7.00</b>") > -1, "treatment - multiple categories are displayed when under mouse");
        });

        it('Should handle multiple values and multiple categories for multiple treatment genetic alterations', () => {
            const tooltipResult = fTreamentTooltip([{ profile_data: 6, sample: "sampleID", category: "" }, { profile_data: 8, sample: "sampleID", category: "" }, { profile_data: 7, sample: "sampleID", category: ">7.00" }, { profile_data: 7, sample: "sampleID", category: ">7.00" }, { profile_data: 9, sample: "sampleID", category: ">9.00" }]);
            assert.isTrue(tooltipResult.html().indexOf("<b>7.00 (average of 2 values)</b> and <b>&gt;7.00, &gt;9.00 (3 data points)</b>") > -1, "treatment - multiple values and categories (unique) are displayed when under mouse");
        });

    });
    describe("makeGeneticTrackTooltip_getCoverageInformation", () => {
        it("gives correct results on undefined input", () => {
            assert.deepEqual(
                makeGeneticTrackTooltip_getCoverageInformation(undefined, undefined),
                {
                    dispProfiledGenePanelIds: [],
                    dispNotProfiledGenePanelIds: [],
                    dispProfiledIn: undefined,
                    dispNotProfiledIn: undefined,
                    dispAllProfiled: false,
                    dispNotProfiled: false
                }
            );
        });
        it("gives correct results on empty input", () => {
            assert.deepEqual(
                makeGeneticTrackTooltip_getCoverageInformation([], []),
                {
                    dispProfiledGenePanelIds: [],
                    dispNotProfiledGenePanelIds: [],
                    dispProfiledIn: [],
                    dispNotProfiledIn: [],
                    dispAllProfiled: false,
                    dispNotProfiled: false
                }
            );
        });
        it("gives correct results with empty profiled_in but no not_profiled_in", () => {
            assert.deepEqual(
                makeGeneticTrackTooltip_getCoverageInformation([], undefined),
                {
                    dispProfiledGenePanelIds: [],
                    dispNotProfiledGenePanelIds: [],
                    dispProfiledIn: [],
                    dispNotProfiledIn: undefined,
                    dispAllProfiled: false,
                    dispNotProfiled: false
                }
            );
        });
        it("gives correct results with empty not_profiled_in but no profiled_in", () => {
            assert.deepEqual(
                makeGeneticTrackTooltip_getCoverageInformation(undefined, []),
                {
                    dispProfiledGenePanelIds: [],
                    dispNotProfiledGenePanelIds: [],
                    dispProfiledIn: undefined,
                    dispNotProfiledIn: [],
                    dispAllProfiled: false,
                    dispNotProfiled: false
                }
            );
        });
        it("gives correct results with nonempty profiled_in but no not_profiled_in", () => {
            assert.deepEqual(
                makeGeneticTrackTooltip_getCoverageInformation([{ genePanelId: "panel", molecularProfileId: "profile" }], undefined),
                {
                    dispProfiledGenePanelIds: ["panel"],
                    dispNotProfiledGenePanelIds: [],
                    dispProfiledIn: ["profile"],
                    dispNotProfiledIn: undefined,
                    dispAllProfiled: false,
                    dispNotProfiled: false
                }
            );
        });
        it("gives correct results with nonempty not_profiled_in but no profiled_in", () => {
            assert.deepEqual(
                makeGeneticTrackTooltip_getCoverageInformation(undefined, [{ molecularProfileId: "profile" }]),
                {
                    dispProfiledGenePanelIds: [],
                    dispNotProfiledGenePanelIds: [],
                    dispProfiledIn: undefined,
                    dispNotProfiledIn: ["profile"],
                    dispAllProfiled: false,
                    dispNotProfiled: false
                }
            );
        });
        it("gives correct results with nonempty profiled_in and empty not_profiled_in", () => {
            assert.deepEqual(
                makeGeneticTrackTooltip_getCoverageInformation([{ molecularProfileId: "profile" }], []),
                {
                    dispProfiledGenePanelIds: [],
                    dispNotProfiledGenePanelIds: [],
                    dispProfiledIn: ["profile"],
                    dispNotProfiledIn: [],
                    dispAllProfiled: true,
                    dispNotProfiled: false
                }
            );
        });
        it("gives correct results with nonempty not_profiled_in and empty profiled_in", () => {
            assert.deepEqual(
                makeGeneticTrackTooltip_getCoverageInformation([], [{ molecularProfileId: "profile" }]),
                {
                    dispProfiledGenePanelIds: [],
                    dispNotProfiledGenePanelIds: [],
                    dispProfiledIn: [],
                    dispNotProfiledIn: ["profile"],
                    dispAllProfiled: false,
                    dispNotProfiled: true
                }
            );
        });
        it("gives correct results with nonoverlapping profiled_in and not_profiled_in", () => {
            assert.deepEqual(
                makeGeneticTrackTooltip_getCoverageInformation([{ genePanelId: "panel", molecularProfileId: "profile1" }], [{ molecularProfileId: "profile" }]),
                {
                    dispProfiledGenePanelIds: ["panel"],
                    dispNotProfiledGenePanelIds: [],
                    dispProfiledIn: ["profile1"],
                    dispNotProfiledIn: ["profile"],
                    dispAllProfiled: false,
                    dispNotProfiled: false
                }
            );
        });
        it("gives correct results with overlapping profiled_in and not_profiled_in", () => {
            assert.deepEqual(
                makeGeneticTrackTooltip_getCoverageInformation([{ genePanelId: "panel", molecularProfileId: "profile" }], [{ genePanelId: "panel2", molecularProfileId: "profile" }]),
                {
                    dispProfiledGenePanelIds: ["panel"],
                    dispNotProfiledGenePanelIds: ["panel2"],
                    dispProfiledIn: ["profile"],
                    dispNotProfiledIn: [],
                    dispAllProfiled: true,
                    dispNotProfiled: false
                }
            );
        });
    });
});