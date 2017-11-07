import OncoprintJS, {RuleSetParams, TrackSortComparator} from "oncoprintjs";
import {ClinicalTrackSpec, GeneticTrackDatum, GeneticTrackSpec, HeatmapTrackSpec} from "./Oncoprint";
import {ClinicalAttribute} from "../../api/generated/CBioPortalAPI";
import {genetic_rule_set_same_color_for_all_no_recurrence,
    genetic_rule_set_same_color_for_all_recurrence,
    genetic_rule_set_different_colors_no_recurrence,
    genetic_rule_set_different_colors_recurrence} from "./geneticrules";
import {OncoprintPatientGeneticTrackData, OncoprintSampleGeneticTrackData} from "../../lib/QuerySession";

export function doWithRenderingSuppressedAndSortingOff(oncoprint:OncoprintJS<any>, task:()=>void) {
    oncoprint.suppressRendering();
    oncoprint.keepSorted(false);
    task();
    oncoprint.keepSorted(true);
    oncoprint.releaseRendering();
}

export function getHeatmapTrackRuleSetParams() {
    return {
        type: 'gradient' as 'gradient',
        legend_label: 'Heatmap',
        value_key: "profile_data",
        value_range: [-3,3] as [number, number],
        colors: [[0,0,255,1], [0,0,0,1], [255,0,0,1]],
        value_stop_points: [-3, 0, 3],
        null_color: 'rgba(224,224,224,1)'
    };
}

export function getGeneticTrackRuleSetParams(distinguishMutationType?:boolean, distinguishDrivers?:boolean):RuleSetParams {
    if (!distinguishMutationType && !distinguishDrivers) {
        return genetic_rule_set_same_color_for_all_no_recurrence;
    } else if (!distinguishMutationType && distinguishDrivers) {
        return genetic_rule_set_same_color_for_all_recurrence;
    } else if (distinguishMutationType && !distinguishDrivers) {
        return genetic_rule_set_different_colors_no_recurrence;
    } else {
        return genetic_rule_set_different_colors_recurrence;
    }
}

export function getClinicalTrackRuleSetParams(track:ClinicalTrackSpec<any>) {
    if (track.datatype === "number") {
        return {
            type: 'bar',
            value_key: track.valueKey,
            value_range: track.numberRange,
            log_scale: track.numberLogScale
        };
    } else if (track.datatype === "counts") {
        return {
            type: "stacked_bar",
            value_key: track.valueKey,
            categories: track.countsCategoryLabels,
            fills: track.countsCategoryFills
        };
    } else {
        return {
            type: 'categorical',
            category_key: track.valueKey
        };
    }
}

export function percentAltered(altered:number, sequenced:number) {
    const p = altered/sequenced;
    const percent = 100*p;
    let fixed:string;
    if (p < 0.03) {
        // if less than 3%, use one decimal digit
        fixed = percent.toFixed(1);
        // if last digit is a 0, use no decimal digits
        if (fixed[fixed.length-1] === "0") {
            fixed = percent.toFixed();
        }
    } else {
        fixed = percent.toFixed();
    }
    return fixed+"%";
}

export function getPercentAltered(oncoprintTrackData:OncoprintSampleGeneticTrackData|OncoprintPatientGeneticTrackData):string {
    if (oncoprintTrackData.hasOwnProperty("altered_samples")) {
        return percentAltered((oncoprintTrackData as OncoprintSampleGeneticTrackData).altered_sample_uids.length,
                            (oncoprintTrackData as OncoprintSampleGeneticTrackData).sequenced_samples.length);
    } else {
        return percentAltered((oncoprintTrackData as OncoprintPatientGeneticTrackData).altered_patient_uids.length,
            (oncoprintTrackData as OncoprintPatientGeneticTrackData).sequenced_patients.length);
    }
}

export function addClinicalTracks(oncoprint:OncoprintJS<any>, tracks:ClinicalTrackSpec<any>) {
}

export function addGeneticTracks(oncoprint:OncoprintJS<any>, tracks:GeneticTrackSpec) {
}

export function addHeatmapTracks(oncoprint:OncoprintJS<any>, tracks:HeatmapTrackSpec) {
}