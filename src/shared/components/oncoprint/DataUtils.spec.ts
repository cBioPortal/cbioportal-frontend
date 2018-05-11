import { assert } from 'chai';
import {
    fillClinicalTrackDatum, fillGeneticTrackDatum, fillHeatmapTrackDatum, getOncoprintMutationType,
    selectDisplayValue
} from "./DataUtils";
import {
    GeneticTrackDatum,
    IGeneHeatmapTrackDatum,
    IGenesetHeatmapTrackDatum
} from "shared/components/oncoprint/Oncoprint";
import {AlterationTypeConstants, AnnotatedExtendedAlteration} from "../../../pages/resultsView/ResultsViewPageStore";
import {ClinicalAttribute, NumericGeneMolecularData, Mutation, Sample} from "../../api/generated/CBioPortalAPI";
import {OncoprintClinicalAttribute} from "./ResultsViewOncoprint";
import {MutationSpectrum} from "../../api/generated/CBioPortalAPIInternal";
import {SpecialAttribute} from "../../cache/OncoprintClinicalDataCache";

/* Type assertions are used throughout this file to force functions to accept
/* mocked parameters known to be sufficient. */
/* tslint:disable no-object-literal-type-assertion */

describe("DataUtils", ()=>{
   describe("getOncoprintMutationType", ()=>{
       it("correctly gets `promoter` type based on mutation.proteinChange", ()=>{
           assert.equal(getOncoprintMutationType({ proteinChange:"Promoter", mutationType:"asdjfpoai" } as Mutation), "promoter");
           assert.equal(getOncoprintMutationType({ proteinChange:"PROMOTER", mutationType:"asdfjii"} as Mutation), "promoter");
           assert.equal(getOncoprintMutationType({ proteinChange:"promoter", mutationType:"Asdfasl" } as Mutation), "promoter");
           assert.equal(getOncoprintMutationType({ proteinChange:"Promoter" } as Mutation), "promoter");
       });
   });
   describe("selectDisplayValue", ()=>{
       it("returns undefined if no values", ()=>{
           assert.equal(selectDisplayValue({}, {}), undefined);
       });
       it("returns the lone value if one value", ()=>{
           assert.equal(selectDisplayValue({"a":0}, {"a":0}), "a");
       });
       it("returns the lowest priority value if two values", ()=>{
           assert.equal(selectDisplayValue({"a":0, "b":0}, {"a":0, "b":1}), "a");
           assert.equal(selectDisplayValue({"a":0, "b":0}, {"a":1, "b":0}), "b");
       });
       it("returns the lowest priority value if several values", ()=>{
           assert.equal(selectDisplayValue({"a":0, "b":0, "c":5}, {"a":0, "b":1, "c":2}), "a");
           assert.equal(selectDisplayValue({"a":20, "b":0, "c":10}, {"a":2, "b":1, "c":0}), "c");
       });
       it("returns the lowest priority, highest count value if two values w same priority", ()=>{
           assert.equal(selectDisplayValue({"a":1, "b":0}, {"a":0, "b":0}), "a");
           assert.equal(selectDisplayValue({"a":0, "b":1}, {"a":0, "b":0}), "b");
       });
       it("returns the lowest priority, highest count value if several values w same priority", ()=>{
           assert.equal(selectDisplayValue({"a":1, "b":0, "c":5}, {"a":0, "b":0, "c":2}), "a");
           assert.equal(selectDisplayValue({"a":20, "b":0, "c":10}, {"a":0, "b":1, "c":0}), "a");
       });
   });

   describe("fillGeneticTrackDatum", ()=>{
       it("fills a datum w no data correctly", ()=>{
           assert.deepEqual(
               fillGeneticTrackDatum({}, "gene", []),
               {
                   gene:"gene",
                   data: [],
                   disp_cna: undefined,
                   disp_mrna: undefined,
                   disp_prot: undefined,
                   disp_mut: undefined,
                   disp_germ: undefined
               } as any);
       });
       it("fills a datum w one mutation data correctly", ()=>{
           let data = [
               {
               mutationType: "missense",
               putativeDriver: true,
               molecularProfileAlterationType: AlterationTypeConstants.MUTATION_EXTENDED
                } as AnnotatedExtendedAlteration];
           assert.deepEqual(
               fillGeneticTrackDatum({}, "gene", data),
               {
                   gene:"gene",
                   data: data,
                   disp_cna: undefined,
                   disp_mrna: undefined,
                   disp_prot: undefined,
                   disp_mut: "missense_rec",
                   disp_germ: false
               } as any, "missense driver with no germline");

           data = [{
               mutationType: "in_frame_del",
               putativeDriver: false,
               molecularProfileAlterationType: AlterationTypeConstants.MUTATION_EXTENDED
           } as AnnotatedExtendedAlteration];
           assert.deepEqual(
               fillGeneticTrackDatum({}, "gene", data),
               {
                   gene:"gene",
                   data: data,
                   disp_cna: undefined,
                   disp_mrna: undefined,
                   disp_prot: undefined,
                   disp_mut: "inframe",
                   disp_germ: false
               } as any, "inframe non-driver");

           data = [{
               mutationType: "truncating",
               putativeDriver: false,
               molecularProfileAlterationType: AlterationTypeConstants.MUTATION_EXTENDED
           } as AnnotatedExtendedAlteration];
           assert.deepEqual(
               fillGeneticTrackDatum({}, "gene", data),
               {
                   gene:"gene",
                   data: data,
                   disp_cna: undefined,
                   disp_mrna: undefined,
                   disp_prot: undefined,
                   disp_mut: "trunc",
                   disp_germ: false
               } as any, "truncating non-driver");

           data = [{
               mutationType: "fusion",
               putativeDriver: false,
               molecularProfileAlterationType: AlterationTypeConstants.MUTATION_EXTENDED
           } as AnnotatedExtendedAlteration];
           assert.deepEqual(
               fillGeneticTrackDatum({}, "gene", data),
               {
                   gene:"gene",
                   data: data,
                   disp_cna: undefined,
                   disp_mrna: undefined,
                   disp_prot: undefined,
                   disp_mut: undefined,
                   disp_fusion: true,
                   disp_germ: undefined
               } as any, "fusion non-driver");
       });


       it("fills a datum w one cna data correctly", ()=>{
           let data = [{
               value: 2,
               molecularProfileAlterationType: AlterationTypeConstants.COPY_NUMBER_ALTERATION
           } as AnnotatedExtendedAlteration];
           assert.deepEqual(
               fillGeneticTrackDatum({}, "gene", data),
               {
                   gene:"gene",
                   data: data,
                   disp_cna: "amp",
                   disp_mrna: undefined,
                   disp_prot: undefined,
                   disp_mut: undefined,
                   disp_germ: undefined
               } as any, "amplification");

           data = [{
               value: 1,
               molecularProfileAlterationType: AlterationTypeConstants.COPY_NUMBER_ALTERATION
           } as AnnotatedExtendedAlteration];
           assert.deepEqual(
               fillGeneticTrackDatum({}, "gene", data),
               {
                   gene:"gene",
                   data: data,
                   disp_cna: "gain",
                   disp_mrna: undefined,
                   disp_prot: undefined,
                   disp_mut: undefined,
                   disp_germ: undefined
               } as any, "gain");

           data = [{
               value: -1,
               alterationType: "",
               molecularProfileAlterationType: AlterationTypeConstants.COPY_NUMBER_ALTERATION
           } as AnnotatedExtendedAlteration];
           assert.deepEqual(
               fillGeneticTrackDatum({}, "gene", data),
               {
                   gene:"gene",
                   data: data,
                   disp_cna: "hetloss",
                   disp_mrna: undefined,
                   disp_prot: undefined,
                   disp_mut: undefined,
                   disp_germ: undefined
               } as any, "hetloss");

           data = [{
               value: -2,
               alterationType: "",
               molecularProfileAlterationType: AlterationTypeConstants.COPY_NUMBER_ALTERATION
           } as AnnotatedExtendedAlteration];
           assert.deepEqual(
               fillGeneticTrackDatum({}, "gene", data),
               {
                   gene:"gene",
                   data: data,
                   disp_cna: "homdel",
                   disp_mrna: undefined,
                   disp_prot: undefined,
                   disp_mut: undefined,
                   disp_germ: undefined
               } as any, "homdel");

           data = [{
               value: 0,
               molecularProfileAlterationType: AlterationTypeConstants.COPY_NUMBER_ALTERATION
           } as AnnotatedExtendedAlteration];
           assert.deepEqual(
               fillGeneticTrackDatum({}, "gene", data),
               {
                   gene:"gene",
                   data: data,
                   disp_cna: undefined,
                   disp_mrna: undefined,
                   disp_prot: undefined,
                   disp_mut: undefined,
                   disp_germ: undefined
               } as any, "diploid");
       });

       it("fills a datum w one germline data correctly", ()=>{
           let data = [{
               mutationType: "missense",
               putativeDriver: true,
               mutationStatus: 'Germline',
               molecularProfileAlterationType: AlterationTypeConstants.MUTATION_EXTENDED
           } as AnnotatedExtendedAlteration];
           assert.deepEqual(
               fillGeneticTrackDatum({}, "gene", data),
               {
                   gene:"gene",
                   data: data,
                   disp_cna: undefined,
                   disp_mrna: undefined,
                   disp_prot: undefined,
                   disp_mut: "missense_rec",
                   disp_germ: true
               } as any, "missense driver with germline");

            data = [{
               mutationType: "missense",
               putativeDriver: true,
               molecularProfileAlterationType: AlterationTypeConstants.MUTATION_EXTENDED
           } as AnnotatedExtendedAlteration];
           assert.deepEqual(
               fillGeneticTrackDatum({}, "gene", data),
               {
                   gene:"gene",
                   data: data,
                   disp_cna: undefined,
                   disp_mrna: undefined,
                   disp_prot: undefined,
                   disp_mut: "missense_rec",
                   disp_germ: false
               } as any, "missense driver without germline");
       });

       it("fills a datum w one germline and one non-germline data correctly", ()=>{
           let data = [{
               mutationType: "missense",
               putativeDriver: true,
               mutationStatus: 'Germline',
               molecularProfileAlterationType: AlterationTypeConstants.MUTATION_EXTENDED
           } as AnnotatedExtendedAlteration, {
               mutationType: "missense",
               putativeDriver: false,
               molecularProfileAlterationType: AlterationTypeConstants.MUTATION_EXTENDED
           } as AnnotatedExtendedAlteration];

           assert.deepEqual(
               fillGeneticTrackDatum({}, "gene", data),
               {
                   gene:"gene",
                   data: data,
                   disp_cna: undefined,
                   disp_mrna: undefined,
                   disp_prot: undefined,
                   disp_mut: "missense_rec",
                   disp_germ: true
               } as any, "missense driver with germline is stronger than missense passenger");

           data = [{
               mutationType: "missense",
               putativeDriver: false,
               mutationStatus: 'Germline',
               molecularProfileAlterationType: AlterationTypeConstants.MUTATION_EXTENDED
           } as AnnotatedExtendedAlteration, {
               mutationType: "truncating",
               putativeDriver: true,
               molecularProfileAlterationType: AlterationTypeConstants.MUTATION_EXTENDED
           } as AnnotatedExtendedAlteration];

           assert.deepEqual(
               fillGeneticTrackDatum({}, "gene", data),
               {
                   gene:"gene",
                   data: data,
                   disp_cna: undefined,
                   disp_mrna: undefined,
                   disp_prot: undefined,
                   disp_mut: "trunc_rec",
                   disp_germ: false
               } as any, "trunc driver is stronger than missense passenger w germline");
       });

       it("fills a datum w one mrna data correctly", ()=>{
           let data = [{
               alterationSubType:"up",
               molecularProfileAlterationType: AlterationTypeConstants.MRNA_EXPRESSION
           } as AnnotatedExtendedAlteration];
           assert.deepEqual(
               fillGeneticTrackDatum({}, "gene", data),
               {
                   gene:"gene",
                   data: data,
                   disp_cna: undefined,
                   disp_mrna: "up",
                   disp_prot: undefined,
                   disp_mut: undefined,
                   disp_germ: undefined
               } as any, "up");

           data = [{
               alterationSubType:"down",
               molecularProfileAlterationType: AlterationTypeConstants.MRNA_EXPRESSION
           } as AnnotatedExtendedAlteration];
           assert.deepEqual(
               fillGeneticTrackDatum({}, "gene", data),
               {
                   gene:"gene",
                   data: data,
                   disp_cna: undefined,
                   disp_mrna: "down",
                   disp_prot: undefined,
                   disp_mut: undefined,
                   disp_germ: undefined
               } as any, "down");
       });
       it("fills a datum w one protein data correctly", ()=>{
           let data = [{
               alterationSubType:"up",
               molecularProfileAlterationType: AlterationTypeConstants.PROTEIN_LEVEL
           } as AnnotatedExtendedAlteration];
           assert.deepEqual(
               fillGeneticTrackDatum({}, "gene", data),
               {
                   gene:"gene",
                   data: data,
                   disp_cna: undefined,
                   disp_mrna: undefined,
                   disp_prot: "up",
                   disp_mut: undefined,
                   disp_germ: undefined
               } as any, "up");

           data = [{
               alterationSubType:"down",
               molecularProfileAlterationType: AlterationTypeConstants.PROTEIN_LEVEL
           } as AnnotatedExtendedAlteration];
           assert.deepEqual(
               fillGeneticTrackDatum({}, "gene", data),
               {
                   gene:"gene",
                   data: data,
                   disp_cna: undefined,
                   disp_mrna: undefined,
                   disp_prot: "down",
                   disp_mut: undefined,
                   disp_germ: undefined
               } as any, "down");
       });
       it("fills a datum w two mutation data w correct priority", ()=>{
           let data = [{
               mutationType: "missense",
               putativeDriver: true,
               molecularProfileAlterationType: AlterationTypeConstants.MUTATION_EXTENDED
           } as AnnotatedExtendedAlteration,{
               mutationType: "truncating",
               putativeDriver: true,
               molecularProfileAlterationType: AlterationTypeConstants.MUTATION_EXTENDED
           } as AnnotatedExtendedAlteration];
           assert.deepEqual(
               fillGeneticTrackDatum({}, "gene", data),
               {
                   gene:"gene",
                   data: data,
                   disp_cna: undefined,
                   disp_mrna: undefined,
                   disp_prot: undefined,
                   disp_mut: "trunc_rec",
                   disp_germ: false
               } as any, "truncating driver beats missense driver");

           data = [{
               mutationType: "missense",
               putativeDriver: true,
               molecularProfileAlterationType: AlterationTypeConstants.MUTATION_EXTENDED
           } as AnnotatedExtendedAlteration,{
               mutationType: "truncating",
               putativeDriver: false,
               molecularProfileAlterationType: AlterationTypeConstants.MUTATION_EXTENDED
           } as AnnotatedExtendedAlteration];
           assert.deepEqual(
               fillGeneticTrackDatum({}, "gene", data),
               {
                   gene:"gene",
                   data: data,
                   disp_cna: undefined,
                   disp_mrna: undefined,
                   disp_prot: undefined,
                   disp_mut: "missense_rec",
                   disp_germ: false
               } as any, "missense driver beats truncating non-driver");

           data = [{
               mutationType: "missense",
               putativeDriver: false,
               molecularProfileAlterationType: AlterationTypeConstants.MUTATION_EXTENDED
           } as AnnotatedExtendedAlteration,{
               mutationType: "truncating",
               putativeDriver: false,
               molecularProfileAlterationType: AlterationTypeConstants.MUTATION_EXTENDED
           } as AnnotatedExtendedAlteration];
           assert.deepEqual(
               fillGeneticTrackDatum({}, "gene", data),
               {
                   gene:"gene",
                   data: data,
                   disp_cna: undefined,
                   disp_mrna: undefined,
                   disp_prot: undefined,
                   disp_mut: "trunc",
                   disp_germ: false
               } as any, "truncating non-driver beats missense non-driver");
       });
       it("fills a datum w multiple cna data w correct priority", ()=>{
           let data = [{
               value: 2,
               molecularProfileAlterationType: AlterationTypeConstants.COPY_NUMBER_ALTERATION
           } as AnnotatedExtendedAlteration,{
               value: 1,
               molecularProfileAlterationType: AlterationTypeConstants.COPY_NUMBER_ALTERATION
           } as AnnotatedExtendedAlteration];
           assert.deepEqual(
               fillGeneticTrackDatum({}, "gene", data),
               {
                   gene:"gene",
                   data: data,
                   disp_cna: "amp",
                   disp_mrna: undefined,
                   disp_prot: undefined,
                   disp_mut: undefined,
                   disp_germ: undefined
               } as any, "amplification beats gain");

           data = [{
               value: -2,
               molecularProfileAlterationType: AlterationTypeConstants.COPY_NUMBER_ALTERATION
           } as AnnotatedExtendedAlteration,{
               value: 0,
               molecularProfileAlterationType: AlterationTypeConstants.COPY_NUMBER_ALTERATION
           } as AnnotatedExtendedAlteration];
           assert.deepEqual(
               fillGeneticTrackDatum({}, "gene", data),
               {
                   gene:"gene",
                   data: data,
                   disp_cna: "homdel",
                   disp_mrna: undefined,
                   disp_prot: undefined,
                   disp_mut: undefined,
                   disp_germ: undefined
               } as any, "homdel beats diploid");

           data = [{
               value: -2,
               molecularProfileAlterationType: AlterationTypeConstants.COPY_NUMBER_ALTERATION
           } as AnnotatedExtendedAlteration,{
               value: -2,
               molecularProfileAlterationType: AlterationTypeConstants.COPY_NUMBER_ALTERATION
           } as AnnotatedExtendedAlteration, {
               value: 2,
               molecularProfileAlterationType: AlterationTypeConstants.COPY_NUMBER_ALTERATION
           } as AnnotatedExtendedAlteration];
           assert.deepEqual(
               fillGeneticTrackDatum({}, "gene", data),
               {
                   gene:"gene",
                   data: data,
                   disp_cna: "homdel",
                   disp_mrna: undefined,
                   disp_prot: undefined,
                   disp_mut: undefined,
                   disp_germ: undefined
               } as any, "two homdels beats one amp");

           data = [{
               value: -2,
               molecularProfileAlterationType: AlterationTypeConstants.COPY_NUMBER_ALTERATION
           } as AnnotatedExtendedAlteration,{
               value: 2,
               molecularProfileAlterationType: AlterationTypeConstants.COPY_NUMBER_ALTERATION
           } as AnnotatedExtendedAlteration, {
               value: 2,
               molecularProfileAlterationType: AlterationTypeConstants.COPY_NUMBER_ALTERATION
           } as AnnotatedExtendedAlteration];
           assert.deepEqual(
               fillGeneticTrackDatum({}, "gene", data),
               {
                   gene:"gene",
                   data: data,
                   disp_cna: "amp",
                   disp_mrna: undefined,
                   disp_prot: undefined,
                   disp_mut: undefined,
                   disp_germ: undefined
               } as any, "two amps beats one homdel");
       });
       it("fills a datum w multiple mrna data w correct priority", ()=>{
           let data = [{
               alterationSubType:"up",
               molecularProfileAlterationType: AlterationTypeConstants.MRNA_EXPRESSION
           } as AnnotatedExtendedAlteration, {
               alterationSubType:"down",
               molecularProfileAlterationType: AlterationTypeConstants.MRNA_EXPRESSION
           } as AnnotatedExtendedAlteration, {
               alterationSubType:"down",
               molecularProfileAlterationType: AlterationTypeConstants.MRNA_EXPRESSION
           } as AnnotatedExtendedAlteration];
           assert.deepEqual(
               fillGeneticTrackDatum({}, "gene", data),
               {
                   gene:"gene",
                   data: data,
                   disp_cna: undefined,
                   disp_mrna: "down",
                   disp_prot: undefined,
                   disp_mut: undefined,
                   disp_germ: undefined
               } as any, "two downs beats one up");

           data = [{
               alterationSubType:"up",
               molecularProfileAlterationType: AlterationTypeConstants.MRNA_EXPRESSION
           } as AnnotatedExtendedAlteration, {
               alterationSubType:"up",
               molecularProfileAlterationType: AlterationTypeConstants.MRNA_EXPRESSION
           } as AnnotatedExtendedAlteration, {
               alterationSubType:"down",
               molecularProfileAlterationType: AlterationTypeConstants.MRNA_EXPRESSION
           } as AnnotatedExtendedAlteration];
           assert.deepEqual(
               fillGeneticTrackDatum({}, "gene", data),
               {
                   gene:"gene",
                   data: data,
                   disp_cna: undefined,
                   disp_mrna: "up",
                   disp_prot: undefined,
                   disp_mut: undefined,
                   disp_germ: undefined
               } as any, "two ups beats one down");
       });
       it("fills a datum w multiple protein data w correct priority", ()=>{
           let data = [{
               alterationSubType:"up",
               molecularProfileAlterationType: AlterationTypeConstants.PROTEIN_LEVEL
           } as AnnotatedExtendedAlteration, {
               alterationSubType:"down",
               molecularProfileAlterationType: AlterationTypeConstants.PROTEIN_LEVEL
           } as AnnotatedExtendedAlteration, {
               alterationSubType:"down",
               molecularProfileAlterationType: AlterationTypeConstants.PROTEIN_LEVEL
           } as AnnotatedExtendedAlteration];
           assert.deepEqual(
               fillGeneticTrackDatum({}, "gene", data),
               {
                   gene:"gene",
                   data: data,
                   disp_cna: undefined,
                   disp_mrna: undefined,
                   disp_prot: "down",
                   disp_mut: undefined,
                   disp_germ: undefined
               } as any, "two downs beats one up");

           data = [{
               alterationSubType:"up",
               molecularProfileAlterationType: AlterationTypeConstants.PROTEIN_LEVEL
           } as AnnotatedExtendedAlteration, {
               alterationSubType:"up",
               molecularProfileAlterationType: AlterationTypeConstants.PROTEIN_LEVEL
           } as AnnotatedExtendedAlteration, {
               alterationSubType:"down",
               molecularProfileAlterationType: AlterationTypeConstants.PROTEIN_LEVEL
           } as AnnotatedExtendedAlteration];
           assert.deepEqual(
               fillGeneticTrackDatum({}, "gene", data),
               {
                   gene:"gene",
                   data: data,
                   disp_cna: undefined,
                   disp_mrna: undefined,
                   disp_prot: "up",
                   disp_mut: undefined,
                   disp_germ: undefined
               } as any, "two ups beats one down");
       });
       it("fills a datum w several data of different types correctly", ()=>{
           let data = [{
               alterationSubType:"up",
               molecularProfileAlterationType: AlterationTypeConstants.PROTEIN_LEVEL
           } as AnnotatedExtendedAlteration, {
               alterationSubType:"down",
               molecularProfileAlterationType: AlterationTypeConstants.PROTEIN_LEVEL
           } as AnnotatedExtendedAlteration, {
               alterationSubType:"down",
               molecularProfileAlterationType: AlterationTypeConstants.PROTEIN_LEVEL
           } as AnnotatedExtendedAlteration, {
               alterationSubType:"up",
               molecularProfileAlterationType: AlterationTypeConstants.MRNA_EXPRESSION
           } as AnnotatedExtendedAlteration, {
               alterationSubType:"up",
               molecularProfileAlterationType: AlterationTypeConstants.MRNA_EXPRESSION
           } as AnnotatedExtendedAlteration, {
               alterationSubType:"down",
               molecularProfileAlterationType: AlterationTypeConstants.MRNA_EXPRESSION
           } as AnnotatedExtendedAlteration, {
               value: -2,
               molecularProfileAlterationType: AlterationTypeConstants.COPY_NUMBER_ALTERATION
           } as AnnotatedExtendedAlteration,{
               value: -2,
               molecularProfileAlterationType: AlterationTypeConstants.COPY_NUMBER_ALTERATION
           } as AnnotatedExtendedAlteration, {
               value: 2,
               molecularProfileAlterationType: AlterationTypeConstants.COPY_NUMBER_ALTERATION
           } as AnnotatedExtendedAlteration,{
               mutationType: "missense",
               putativeDriver: true,
               molecularProfileAlterationType: AlterationTypeConstants.MUTATION_EXTENDED
           } as AnnotatedExtendedAlteration,{
               mutationType: "truncating",
               putativeDriver: true,
               molecularProfileAlterationType: AlterationTypeConstants.MUTATION_EXTENDED
           } as AnnotatedExtendedAlteration];
           assert.deepEqual(
               fillGeneticTrackDatum({}, "gene", data),
               {
                   gene:"gene",
                   data: data,
                   disp_cna: "homdel",
                   disp_mrna: "up",
                   disp_prot: "down",
                   disp_mut: "trunc_rec",
                   disp_germ: false
               } as any);
       });
   });

   describe("fillHeatmapTrackDatum", ()=>{
       it("sets na true if no data", ()=>{
           assert.isTrue(
               fillHeatmapTrackDatum<IGeneHeatmapTrackDatum, "hugo_gene_symbol">(
                   {}, "hugo_gene_symbol", "", {} as Sample
               ).na
           );
       });
       it("sets data for sample", ()=>{
           const data:any[] = [
               {value:3}
           ];
           assert.deepEqual(
               fillHeatmapTrackDatum<IGeneHeatmapTrackDatum, "hugo_gene_symbol">(
                   {},
                   "hugo_gene_symbol",
                   "gene",
                   {sampleId:"sample", studyId:"study"} as Sample,
                   data
               ),
               {hugo_gene_symbol:"gene", study:"study", profile_data:3}
           );
       });
       it("throws exception if more than one data given for sample",()=>{
           const data:any[] = [
               {value:3},
               {value:2}
           ];
           try {
               fillHeatmapTrackDatum<IGeneHeatmapTrackDatum, "hugo_gene_symbol">(
                   {},
                   "hugo_gene_symbol",
                   "gene",
                   {sampleId:"sample", studyId:"study"} as Sample,
                   data
               );
               assert(false);
           } catch(e) {
               // Succeed if an exception occurred before asserting false
           }
       });
       it("sets data for patient, if multiple then maximum in abs value", ()=>{
           let data:any[] = [
               {value:3},
               {value:2}
           ];
           assert.deepEqual(
               fillHeatmapTrackDatum<IGeneHeatmapTrackDatum, "hugo_gene_symbol">(
                   {},
                   "hugo_gene_symbol",
                   "gene",
                   {patientId:"patient", studyId:"study"} as Sample,
                   data
               ),
               {hugo_gene_symbol:"gene", study:"study", profile_data:3}
           );

           data = [
               {value:2}
           ];
           assert.deepEqual(
               fillHeatmapTrackDatum<IGeneHeatmapTrackDatum, "hugo_gene_symbol">(
                   {},
                   "hugo_gene_symbol",
                   "gene",
                   {patientId:"patient", studyId:"study"} as Sample,
                   data
               ),
               {hugo_gene_symbol:"gene", study:"study", profile_data:2}
           );

           data = [
               {value:2},
               {value:3},
               {value:4}
           ];
           assert.deepEqual(
               fillHeatmapTrackDatum<IGeneHeatmapTrackDatum, "hugo_gene_symbol">(
                   {},
                   "hugo_gene_symbol",
                   "gene",
                   {patientId:"patient", studyId:"study"} as Sample,
                   data
               ),
               {hugo_gene_symbol:"gene", study:"study", profile_data:4}
           );

           data = [
               {value:-10},
               {value:3},
               {value:4}
           ];
           assert.deepEqual(
               fillHeatmapTrackDatum<IGeneHeatmapTrackDatum, "hugo_gene_symbol">(
                   {},
                   "hugo_gene_symbol",
                   "gene",
                   {patientId:"patient", studyId:"study"} as Sample,
                   data
               ),
               {hugo_gene_symbol:"gene", study:"study", profile_data:-10}
           );
       });
       it("fills data for a gene set if that's requested", ()=>{
           const partialTrackDatum = {};
           fillHeatmapTrackDatum<IGenesetHeatmapTrackDatum, "geneset_id">(
               partialTrackDatum,
               "geneset_id",
               "MY_FAVORITE_GENE_SET-3",
               {sampleId:"sample", studyId:"study"} as Sample,
               [{value: 7}]
           );
           console.log(partialTrackDatum);
           assert.deepEqual(
               partialTrackDatum,
               {geneset_id:"MY_FAVORITE_GENE_SET-3", study:"study", profile_data:7}
           );
       });
   });

   describe("fillClinicalTrackDatum", ()=>{
        it("creates datum correctly when no data given", ()=>{
            assert.deepEqual(
                fillClinicalTrackDatum(
                    {},
                    {clinicalAttributeId:"clinicalAttribute"} as ClinicalAttribute,
                    {sampleId:"sample", studyId:"study"} as Sample
                ),
                {
                    attr_id: "clinicalAttribute",
                    study_id:"study",
                    attr_val_counts: {},
                    na: true
                }, "NA in general"
            );

            assert.deepEqual(
                fillClinicalTrackDatum(
                    {},
                    {clinicalAttributeId:SpecialAttribute.MutationCount} as any,
                    {sampleId:"sample", studyId:"study"} as Sample
                ),
                {
                    attr_id: SpecialAttribute.MutationCount,
                    study_id:"study",
                    attr_val_counts: {},
                    attr_val: 0
                }, "0 for Mutation Count"
            );
        });
        it("creates data correctly for number data",()=>{
            assert.deepEqual(
                fillClinicalTrackDatum(
                    {},
                    {clinicalAttributeId:"clinicalAttribute", datatype:"number"} as any,
                    {sampleId:"sample", studyId:"study"} as Sample,
                    [{value:3}] as any[]
                ),
                {
                    attr_id: "clinicalAttribute",
                    study_id: "study",
                    attr_val_counts:{3:1},
                    attr_val: 3
                }
            );

            assert.deepEqual(
                fillClinicalTrackDatum(
                    {},
                    {clinicalAttributeId:"clinicalAttribute", datatype:"number"} as any,
                    {sampleId:"sample", studyId:"study"} as Sample,
                    [{value:"abc"}] as any[]
                ),
                {
                    attr_id: "clinicalAttribute",
                    study_id: "study",
                    attr_val_counts:{},
                    na: true
                }
            );

            assert.deepEqual(
                fillClinicalTrackDatum(
                    {},
                    {clinicalAttributeId:"clinicalAttribute", datatype:"number"} as any,
                    {sampleId:"sample", studyId:"study"} as Sample,
                    [{value:3}, {value:2}] as any[]
                ),
                {
                    attr_id: "clinicalAttribute",
                    study_id: "study",
                    attr_val_counts:{2.5:1},
                    attr_val: 2.5
                }
            );

            assert.deepEqual(
                fillClinicalTrackDatum(
                    {},
                    {clinicalAttributeId:"clinicalAttribute", datatype:"number"} as any,
                    {sampleId:"sample", studyId:"study"} as Sample,
                    [{mutationCount:3}] as any[]
                ),
                {
                    attr_id: "clinicalAttribute",
                    study_id: "study",
                    attr_val_counts:{3:1},
                    attr_val: 3
                }
            );

            assert.deepEqual(
                fillClinicalTrackDatum(
                    {},
                    {clinicalAttributeId:"clinicalAttribute", datatype:"number"} as any,
                    {sampleId:"sample", studyId:"study"} as Sample,
                    [{mutationCount:3}, {mutationCount:2}] as any[]
                ),
                {
                    attr_id: "clinicalAttribute",
                    study_id: "study",
                    attr_val_counts:{2.5:1},
                    attr_val: 2.5
                }
            );
        });
        it("creates data correctly for string data",()=>{
            assert.deepEqual(
                fillClinicalTrackDatum(
                    {},
                    {clinicalAttributeId:"clinicalAttribute", datatype:"string"} as any,
                    {sampleId:"sample", studyId:"study"} as Sample,
                    [{value:"a"}, {value:"a"}] as any[]
                ),
                {
                    attr_id: "clinicalAttribute",
                    study_id: "study",
                    attr_val_counts:{"a":2},
                    attr_val: "a"
                }
            );

            assert.deepEqual(
                fillClinicalTrackDatum(
                    {},
                    {clinicalAttributeId:"clinicalAttribute", datatype:"string"} as any,
                    {sampleId:"sample", studyId:"study"} as Sample,
                    [{value:"a"}, {value:"b"}] as any[]
                ),
                {
                    attr_id: "clinicalAttribute",
                    study_id: "study",
                    attr_val_counts:{"a":1, "b":1},
                    attr_val: "Mixed"
                }
            );

            assert.deepEqual(
                fillClinicalTrackDatum(
                    {},
                    {clinicalAttributeId:"clinicalAttribute", datatype:"string"} as any,
                    {sampleId:"sample", studyId:"study"} as Sample,
                    [{value:"a"}, {value:"b"}, {value:"b"}] as any[]
                ),
                {
                    attr_id: "clinicalAttribute",
                    study_id: "study",
                    attr_val_counts:{"a":1, "b":2},
                    attr_val: "Mixed"
                }
            );
        });
        it("creates data correctly for mutation spectrum data",()=>{
            assert.deepEqual(
                fillClinicalTrackDatum(
                    {},
                    {clinicalAttributeId:SpecialAttribute.MutationSpectrum} as any,
                    {sampleId:"sample", studyId:"study"} as Sample,
                    [] as MutationSpectrum[]
                ),
                {
                    attr_id: SpecialAttribute.MutationSpectrum,
                    study_id: "study",
                    attr_val_counts:{},
                    na:true
                },
                "NA if no data given"
            );
            assert.deepEqual(
                fillClinicalTrackDatum(
                    {},
                    {clinicalAttributeId:SpecialAttribute.MutationSpectrum, datatype:""} as any,
                    {sampleId:"sample", studyId:"study"} as Sample,
                    [{CtoA:0, CtoG:0, CtoT:0, TtoA:0, TtoC:0, TtoG:0}] as MutationSpectrum[]
                ),
                {
                    attr_id: SpecialAttribute.MutationSpectrum,
                    study_id: "study",
                    attr_val_counts:{"C>A":0, "C>G":0, "C>T":0, "T>A":0, "T>C":0,"T>G":0},
                    attr_val: {"C>A":0, "C>G":0, "C>T":0, "T>A":0, "T>C":0,"T>G":0},
                    na:true
                }, "NA if no mutations"
            );
            assert.deepEqual(
                fillClinicalTrackDatum(
                    {},
                    {clinicalAttributeId:SpecialAttribute.MutationSpectrum, datatype:""} as any,
                    {sampleId:"sample", studyId:"study"} as Sample,
                    [{CtoA:1, CtoG:0, CtoT:0, TtoA:0, TtoC:0, TtoG:0},
                        {CtoA:0, CtoG:2, CtoT:0, TtoA:0, TtoC:0, TtoG:0},
                        {CtoA:0, CtoG:0, CtoT:3, TtoA:0, TtoC:0, TtoG:0},
                        {CtoA:0, CtoG:0, CtoT:0, TtoA:0, TtoC:6, TtoG:4}] as MutationSpectrum[]
                ),
                {
                    attr_id: SpecialAttribute.MutationSpectrum,
                    study_id: "study",
                    attr_val_counts:{"C>A":1,"C>G":2,"C>T":3,"T>A":0,"T>C":6,"T>G":4},
                    attr_val: {"C>A":1,"C>G":2,"C>T":3,"T>A":0,"T>C":6,"T>G":4}
                }, "sum"
            );
        });
   });
});
