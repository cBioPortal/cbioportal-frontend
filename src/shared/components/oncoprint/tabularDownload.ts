import Oncoprint, {ClinicalTrackSpec, GeneticTrackSpec, IGeneHeatmapTrackSpec} from "./Oncoprint";
import fileDownload from "react-file-download";

export default function tabularDownload(
    geneticTracks:GeneticTrackSpec[],
    clinicalTracks:ClinicalTrackSpec[],
    heatmapTracks:IGeneHeatmapTrackSpec[],
    uidOrder:string[],
    getCaseId:(uid:string)=>string,
    columnMode:"sample"|"patient",
    distinguishDrivers:boolean
) {
    const caseNames = uidOrder.map(getCaseId);
    const prefixName = (columnMode === "sample" ? "SAMPLE_DATA_" : "PATIENT_DATA_"); //Name depending on the type of case

    //Gather all the Oncoprint data
    const oncoprintData:any = {
        'CLINICAL': {},
        'CNA': {},
        'MUTATIONS': {},
        'MRNA': {},
        'PROTEIN': {},
        'FUSION': {},
    };

    //Create maps for genetic data
    const cnaMap:any = {
        'amp': 'Amplification',
        'gain': 'Gain',
        'hetloss': 'Shallow Deletion',
        'homdel': 'Deep Deletion'
    };
    let mutationMap:any = {};
    if (distinguishDrivers) {
        mutationMap = {
            'inframe': 'Inframe Mutation (putative passenger)',
            'inframe_rec': 'Inframe Mutation (putative driver)',
            'missense': 'Missense Mutation (putative passenger)',
            'missense_rec': 'Missense Mutation (putative driver)',
            'promoter': 'Promoter Mutation',
            'promoter_rec': 'Promoter Mutation',
            'trunc': 'Truncating mutation (putative passenger)',
            'trunc_rec': 'Truncating mutation (putative driver)'
        };
    } else {
        mutationMap = {
            'inframe': 'Inframe Mutation',
            'inframe_rec': 'Inframe Mutation',
            'missense': 'Missense Mutation',
            'missense_rec': 'Missense Mutation',
            'promoter': 'Promoter Mutation',
            'promoter_rec': 'Promoter Mutation',
            'trunc': 'Truncating mutation',
            'trunc_rec': 'Truncating mutation'
        };
    }
    const mrnaMap:any = {
        'up': 'mRNA Upregulation',
        'down': 'mRNA Downregulation'
    };
    const proteinMap:any = {
        'down': 'Protein Downregulation',
        'up': 'Protein Upregulation'
    };
    const fusionMap:any = {
        'true': 'Fusion'
    };

    //Add genetic data
    for (const geneticTrack of geneticTracks) {
        const currentTrackData = geneticTrack.data;
        const currentGeneName = currentTrackData[0].gene; //The gene is the same for all entries of the track
        //Add the currentGeneName to the oncoprintData if it does not exist
        if (oncoprintData.CNA[currentGeneName] === undefined) {
            oncoprintData.CNA[currentGeneName] = {};
        }
        if (oncoprintData.MUTATIONS[currentGeneName] === undefined) {
            oncoprintData.MUTATIONS[currentGeneName] = {};
        }
        if (oncoprintData.MRNA[currentGeneName] === undefined) {
            oncoprintData.MRNA[currentGeneName] = {};
        }
        if (oncoprintData.PROTEIN[currentGeneName] === undefined) {
            oncoprintData.PROTEIN[currentGeneName] = {};
        }
        if (oncoprintData.FUSION[currentGeneName] === undefined) {
            oncoprintData.FUSION[currentGeneName] = {};
        }
        //Iterate over all patients/samples of the track and add them to oncoprintData
        for (const geneticTrackDatum of currentTrackData) {
            let id:string = (columnMode === "sample" ? geneticTrackDatum.sample! : geneticTrackDatum.patient!);
            oncoprintData.CNA[currentGeneName][id] = "";
            oncoprintData.MUTATIONS[currentGeneName][id] = "";
            oncoprintData.MRNA[currentGeneName][id] = "";
            oncoprintData.PROTEIN[currentGeneName][id] = "";
            oncoprintData.FUSION[currentGeneName][id] = "";
            if (geneticTrackDatum.disp_cna !== undefined) {
                oncoprintData.CNA[currentGeneName][id] = cnaMap[geneticTrackDatum.disp_cna] ? cnaMap[geneticTrackDatum.disp_cna] : geneticTrackDatum.disp_cna;
            }
            if (geneticTrackDatum.disp_fusion !== undefined) {
                oncoprintData.FUSION[currentGeneName][id] = fusionMap[geneticTrackDatum.disp_fusion+""] ? fusionMap[geneticTrackDatum.disp_fusion+""] : geneticTrackDatum.disp_fusion;
            }
            if (geneticTrackDatum.disp_mrna !== undefined) {
                oncoprintData.MRNA[currentGeneName][id] = mrnaMap[geneticTrackDatum.disp_mrna] ? mrnaMap[geneticTrackDatum.disp_mrna] : geneticTrackDatum.disp_mrna;
            }
            if (geneticTrackDatum.disp_prot !== undefined) {
                oncoprintData.PROTEIN[currentGeneName][id] = proteinMap[geneticTrackDatum.disp_prot] ? proteinMap[geneticTrackDatum.disp_prot] : geneticTrackDatum.disp_prot;
            }
            if (geneticTrackDatum.disp_mut !== undefined) {
                oncoprintData.MUTATIONS[currentGeneName][id] = mutationMap[geneticTrackDatum.disp_mut] ? mutationMap[geneticTrackDatum.disp_mut] : geneticTrackDatum.disp_mut;
            }
        }
    }

    //Add clinical data
    for (const clinicalTrack of clinicalTracks) {
        const currentClinicalTrackData = clinicalTrack.data;
        const currentAttributeName = clinicalTrack.label;
        //Add the currentAttributeName to the oncoprintData if it does not exist
        if (oncoprintData.CLINICAL[currentAttributeName] === undefined) {
            oncoprintData.CLINICAL[currentAttributeName] = {};
        }
        //Iterate over all patients/samples of the track and add them to oncoprintData
        for (const clinicalTrackDatum of currentClinicalTrackData) {
            let id:string = (columnMode === "sample" ? clinicalTrackDatum.sample! : clinicalTrackDatum.patient!);
            oncoprintData.CLINICAL[currentAttributeName][id] = "";
            if (clinicalTrackDatum.attr_val !== undefined) {
                oncoprintData.CLINICAL[currentAttributeName][id] = clinicalTrackDatum.attr_val;
            }
        }
    }

    //Add heatmap data
    for (const heatmapTrack of heatmapTracks) {
        const currentHeatmapGene = heatmapTrack.label;
        const currentHeatmapType = "HEATMAP "+heatmapTrack.molecularAlterationType+' '+ heatmapTrack.datatype;
        const currentHeatmapTrackData = heatmapTrack.data;
        for (const heatmapTrackDatum of currentHeatmapTrackData) {
            if (oncoprintData[currentHeatmapType] === undefined) {
                oncoprintData[currentHeatmapType] = {};
            }
            if (oncoprintData[currentHeatmapType][currentHeatmapGene] === undefined) {
                oncoprintData[currentHeatmapType][currentHeatmapGene] = {};
            }
            let id:string = (columnMode === "sample" ? heatmapTrackDatum.sample! : heatmapTrackDatum.patient!);
            oncoprintData[currentHeatmapType][currentHeatmapGene][id] = heatmapTrackDatum.profile_data === null ? "" : heatmapTrackDatum.profile_data;
        }
    }

    //Put all the information of the oncoprintData in a variable with tabular form
    let content = 'track_name\ttrack_type';
    //Add the cases to the content
    for (let i=0; i<caseNames.length; i++) {
        content += '\t'+caseNames[i];
    }
    //Add final header line
    content += '\n';

    //Iterate over oncoprintData and write it to content
    Object.keys(oncoprintData).forEach(function (j) {
        Object.keys(oncoprintData[j]).forEach(function(k) {
            content += k+'\t'+j;
            for (let l=0; l<caseNames.length; l++) {
                content += '\t'+oncoprintData[j][k][caseNames[l]];
            }
            content += '\n';
        });
    });

    fileDownload(
        content,
        prefixName + 'oncoprint.tsv'
    );
}