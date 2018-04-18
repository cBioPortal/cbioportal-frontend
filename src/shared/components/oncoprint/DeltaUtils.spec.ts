import {assert} from "chai";
import {
    heatmapClusterValueFn, numTracksWhoseDataChanged, transitionSortConfig,
    transition,
    transitionTrackGroupSortPriority
} from "./DeltaUtils";
import {createStubInstance, SinonStub, spy} from "sinon";
import OncoprintJS from "oncoprintjs";
import {
    CLINICAL_TRACK_GROUP_INDEX,
    GENETIC_TRACK_GROUP_INDEX,
    IGeneHeatmapTrackSpec,
    IOncoprintProps
} from "./Oncoprint";

describe("Oncoprint DeltaUtils", ()=>{
    describe("numTracksWhoseDataChanged", ()=>{
        it("should return 0 for empty inputs", ()=>{
            assert.equal(numTracksWhoseDataChanged([], []), 0);
        });
        it("should return 2 for one empty input and one with two (both added/deleted)", ()=>{
            assert.equal(numTracksWhoseDataChanged([{key:"a", data:[]},{key:"b", data:[]}], []), 2, "tracks added");
            assert.equal(numTracksWhoseDataChanged([], [{key:"a", data:[]},{key:"b", data:[]}]), 2, "tracks deleted");
        });
        it("should return 3 for one track deleted, one track added, one track changed", ()=>{
            let state1 = [{key:"a", data:[]}, {key:"b", data:[]}];
            let state2 = [{key:"b", data:[1]}, {key:"c", data:[]}];
            assert.equal(numTracksWhoseDataChanged(state1, state2), 3, "test one direction");
            assert.equal(numTracksWhoseDataChanged(state2, state1), 3, "test other direction");
        });
        it("should return X for X tracks changed", ()=>{
            let state1 = [{key:"a", data:[1]}, {key:"b", data:[3,4]}, {key:"c", data:[6,1]}, {key:"d",data:[10]}];
            let state2 = [{key:"a", data:[]}, {key:"b", data:[33,3,4]}, {key:"c", data:[10,20]}, {key:"d",data:[-6,-3,1,0]}];
            for (let i=0; i<state1.length; i++) {
                assert.equal(numTracksWhoseDataChanged(state1.slice(i), state2.slice(i)), state1.length - i);
                assert.equal(numTracksWhoseDataChanged(state2.slice(i), state1.slice(i)), state1.length - i);
            }
        });
    });

    describe("transition", () => {
        const makeMinimalOncoprintProps = (): IOncoprintProps => ({
            clinicalTracks: [],
            geneticTracks: [],
            genesetHeatmapTracks: [],
            heatmapTracks: [],
            divId: 'myDomId',
            width: 1000,
        });
        const makeMinimalProfileMap = () => undefined;

        it("renders an expandable genetic track if an expansion callback is provided for it", () => {
            // given a genetic track specification with an expandCallback
            const expansionCallback = spy();
            const newProps: IOncoprintProps = {
                ...makeMinimalOncoprintProps(),
                geneticTracks: [{
                    key: 'GENETICTRACK_1',
                    label: 'GENE1 / GENE2',
                    oql: '[GENE1: AMP; GENE2: AMP;]',
                    info: '10%',
                    data: [],
                    expansionCallback: expansionCallback
                }]
            };
            const oncoprint: OncoprintJS<any> = createStubInstance(OncoprintJS);
            (oncoprint.addTracks as SinonStub).returns([1]);
            const trackIdsByKey = {};
            // when instructed to render the track from scratch
            transition(
                newProps,
                makeMinimalOncoprintProps(),
                oncoprint,
                () => trackIdsByKey,
                () => makeMinimalProfileMap()
            );
            // then it adds a track with an expandCallback track property that
            // calls the provided function
            assert.isTrue((oncoprint.addTracks as SinonStub).called);
            (oncoprint.addTracks as SinonStub).args.forEach(([trackParamArray]) => {
                trackParamArray.forEach((trackParams: any) => {
                    if (trackParams.expandCallback !== undefined) {
                        trackParams.expandCallback();
                    }
                });
            });
            assert.isTrue(
                expansionCallback.called,
                'calling the expand callbacks of added tracks should invoke the one provided'
            );
        });
    });

    describe("transitionTrackGroupSortPriority", ()=>{
        let oncoprint:any;
        beforeEach(()=>{
            oncoprint = {setTrackGroupSortPriority: spy()};
        });
        it("should not do anything if the heatmap tracks are both empty", ()=>{
           transitionTrackGroupSortPriority(
               {heatmapTracks:[], genesetHeatmapTracks:[]},
               {heatmapTracks:[], genesetHeatmapTracks:[]},
               oncoprint
           );
           assert.equal(oncoprint.setTrackGroupSortPriority.callCount, 0);
        });
        it("should not do anything on initialisation if no heatmap tracks are added", ()=>{
           transitionTrackGroupSortPriority(
               {heatmapTracks:[], genesetHeatmapTracks:[]},
               {},
               oncoprint
           );
           assert.equal(oncoprint.setTrackGroupSortPriority.callCount, 0);
        });
        it("should not do anything if the heatmap tracks are the same", ()=>{
            transitionTrackGroupSortPriority(
                {heatmapTracks:[{trackGroupIndex: 2}, {trackGroupIndex: 3}], genesetHeatmapTracks: []},
                {heatmapTracks:[{trackGroupIndex: 2}, {trackGroupIndex: 3}], genesetHeatmapTracks: []},
                oncoprint
            );
            assert.equal(oncoprint.setTrackGroupSortPriority.callCount, 0);
        });
        it("should not do anything if the gene set heatmap tracks are the same", ()=>{
            transitionTrackGroupSortPriority(
                {heatmapTracks:[], genesetHeatmapTracks: [{trackGroupIndex: 2}]},
                {heatmapTracks:[], genesetHeatmapTracks: [{trackGroupIndex: 2}]},
                oncoprint
            );
            assert.equal(oncoprint.setTrackGroupSortPriority.callCount, 0);
        });
        it("should not do anything if the heatmap tracks are different but same groups", ()=>{
            transitionTrackGroupSortPriority(
                {heatmapTracks:[{trackGroupIndex: 2}, {trackGroupIndex: 3}, {trackGroupIndex: 3}, {trackGroupIndex: 3}], genesetHeatmapTracks: []},
                {heatmapTracks:[{trackGroupIndex: 2}, {trackGroupIndex: 2}, {trackGroupIndex: 2}, {trackGroupIndex: 3}], genesetHeatmapTracks: []},
                oncoprint
            );
            assert.equal(oncoprint.setTrackGroupSortPriority.callCount, 0);
        });
        it("should set the track group sort priority if the heatmap track groups have changed and no gene set heatmap is present", ()=>{
            transitionTrackGroupSortPriority(
                {heatmapTracks:[{trackGroupIndex: 2}, {trackGroupIndex: 4}, {trackGroupIndex: 2}, {trackGroupIndex: 3}], genesetHeatmapTracks: []},
                {heatmapTracks:[{trackGroupIndex: 2}, {trackGroupIndex: 3}, {trackGroupIndex: 3}, {trackGroupIndex: 3}], genesetHeatmapTracks: []},
                oncoprint
            );
            assert.equal(oncoprint.setTrackGroupSortPriority.callCount, 1, "called once");
            assert.deepEqual(
                oncoprint.setTrackGroupSortPriority.args[0][0],
                [CLINICAL_TRACK_GROUP_INDEX, 2, 3, 4, GENETIC_TRACK_GROUP_INDEX],
                "right priority order"
            );
        });
        it("should set the track group sort priority including gene set heatmaps if heatmap track groups have changed", ()=>{
            transitionTrackGroupSortPriority(
                {
                    heatmapTracks: [{trackGroupIndex: 2}, {trackGroupIndex: 4}, {trackGroupIndex: 2}, {trackGroupIndex: 3}],
                    genesetHeatmapTracks: [{trackGroupIndex: 5}]
                },
                {
                    heatmapTracks:[{trackGroupIndex: 2}, {trackGroupIndex: 3}, {trackGroupIndex: 3}, {trackGroupIndex: 3}],
                    genesetHeatmapTracks: [{trackGroupIndex: 4}]
                },
                oncoprint
            );
            assert.equal(oncoprint.setTrackGroupSortPriority.callCount, 1, "called once");
            assert.deepEqual(
                oncoprint.setTrackGroupSortPriority.args[0][0],
                [CLINICAL_TRACK_GROUP_INDEX, 2, 3, 4, 5, GENETIC_TRACK_GROUP_INDEX],
                "right priority order"
            );
        });
        it("should set the track group sort priority on initialisation if only a gene set heatmap is present", ()=>{
            transitionTrackGroupSortPriority(
                {heatmapTracks:[], genesetHeatmapTracks: [{trackGroupIndex: 2}, {trackGroupIndex: 2}]},
                {},
                oncoprint
            );
            assert.equal(oncoprint.setTrackGroupSortPriority.callCount, 1, "called once");
            assert.deepEqual(
                oncoprint.setTrackGroupSortPriority.args[0][0],
                [CLINICAL_TRACK_GROUP_INDEX, 2, GENETIC_TRACK_GROUP_INDEX],
                "right priority order"
            );
        });
    });

    describe("transitionSortConfig", ()=>{
        let oncoprint:any;
        beforeEach(()=>{
            oncoprint = { setSortConfig:spy(()=>{}) };
        });
        it("should not do anything if no sortConfig specified", ()=>{
            transitionSortConfig({}, {}, oncoprint);
            assert.equal(oncoprint.setSortConfig.callCount, 0);
        });
        it("should not do anything if the given sort configs have no order or cluster heatmap group specified, regardless of changes", ()=>{
            transitionSortConfig({sortConfig:{}}, {sortConfig:{}}, oncoprint);
            transitionSortConfig({sortConfig:{sortByMutationType:true}}, {sortConfig:{sortByMutationType:false}}, oncoprint);
            transitionSortConfig({sortConfig:{sortByMutationType:true}}, {sortConfig:{sortByMutationType:true}}, oncoprint);
            transitionSortConfig({sortConfig:{sortByDrivers:true}}, {sortConfig:{sortByMutationType:false, sortByDrivers: false}}, oncoprint);
            transitionSortConfig({sortConfig:{}}, {sortConfig:{sortByMutationType:false}}, oncoprint);
            transitionSortConfig({}, {sortConfig:{sortByMutationType:false}}, oncoprint);
            transitionSortConfig({sortConfig:{sortByMutationType:false}}, {}, oncoprint);
            assert.equal(oncoprint.setSortConfig.callCount, 0);
        });
        it("should set the config to new order if order is specified, no sort config specified before", ()=>{
            transitionSortConfig({sortConfig:{order:["5","3","2"]}},{}, oncoprint);
            assert.equal(oncoprint.setSortConfig.callCount, 1, "called once");
            assert.deepEqual(oncoprint.setSortConfig.args[0][0], {type:"order", order:["5","3","2"]}, "correct sort config used");
        });
        it("should set the config to new order if order is specified, no order specified before", ()=>{
            transitionSortConfig({sortConfig:{order:["5","3","2"]}},{sortConfig:{}}, oncoprint);
            assert.equal(oncoprint.setSortConfig.callCount, 1, "called once");
            assert.deepEqual(oncoprint.setSortConfig.args[0][0], {type:"order", order:["5","3","2"]}, "correct sort config used");
        });
        it("should set the config to new order if order is specified, different order specified before", ()=>{
            transitionSortConfig({sortConfig:{order:["6","4","0","2"]}},{sortConfig:{order:["1"]}}, oncoprint);
            assert.equal(oncoprint.setSortConfig.callCount, 1, "called once");
            assert.deepEqual(oncoprint.setSortConfig.args[0][0], {type:"order", order:["6","4","0","2"]}, "correct sort config used");
        });
        it("should not do anything if same order given (same object, shallow equality)", ()=>{
            const order = "0,1,2,3,4".split(",");
            transitionSortConfig({sortConfig:{order}},{sortConfig:{order}}, oncoprint);
            assert.equal(oncoprint.setSortConfig.callCount, 0);
        });
        it("should set the config to order, if order and cluster heatmap group specified", ()=>{
            const order = "0,1,2,3,4".split(",");
            transitionSortConfig({sortConfig:{order, clusterHeatmapTrackGroupIndex:1}},{sortConfig:{order}}, oncoprint);
            assert.equal(oncoprint.setSortConfig.callCount, 0, "no change registered bc order overrides heatmap");

            transitionSortConfig({sortConfig:{order, clusterHeatmapTrackGroupIndex:1}}, {}, oncoprint);
            assert.equal(oncoprint.setSortConfig.callCount, 1, "called once");
            assert.deepEqual(oncoprint.setSortConfig.args[0][0], { type: "order", order}, "correct sort config used");
        });
        it("should set the config to heatmap if heatmap index specified, no sort config specified before", ()=>{
            transitionSortConfig({sortConfig:{clusterHeatmapTrackGroupIndex:1}}, {}, oncoprint);
            assert.equal(oncoprint.setSortConfig.callCount, 1, "called once");
            assert.deepEqual(oncoprint.setSortConfig.args[0][0], {type:"cluster", track_group_index:1, clusterValueFn: heatmapClusterValueFn}, "correct sort config used");
        });
        it("should set the config to heatmap if heatmap index specified, no heatmap index or order specified before", ()=>{
            transitionSortConfig({sortConfig:{clusterHeatmapTrackGroupIndex:1}}, {sortConfig:{}}, oncoprint);
            assert.equal(oncoprint.setSortConfig.callCount, 1, "called once");
            assert.deepEqual(oncoprint.setSortConfig.args[0][0], {type:"cluster", track_group_index:1, clusterValueFn: heatmapClusterValueFn}, "correct sort config used");
        });
        it("should set the config to heatmap if heatmap index specified, no heatmap index specified before, order specified before", ()=>{
            transitionSortConfig({sortConfig:{clusterHeatmapTrackGroupIndex:1}}, {sortConfig:{order:["1"]}}, oncoprint);
            assert.equal(oncoprint.setSortConfig.callCount, 1, "called once");
            assert.deepEqual(oncoprint.setSortConfig.args[0][0], {type:"cluster", track_group_index:1, clusterValueFn: heatmapClusterValueFn}, "correct sort config used");
        });
        it("should set the config to heatmap if heatmap index specified, different heatmap index specified before", ()=>{
            transitionSortConfig({sortConfig:{clusterHeatmapTrackGroupIndex:5}}, {sortConfig:{clusterHeatmapTrackGroupIndex:2}}, oncoprint);
            assert.equal(oncoprint.setSortConfig.callCount, 1, "called once");
            assert.deepEqual(oncoprint.setSortConfig.args[0][0], {type:"cluster", track_group_index:5, clusterValueFn: heatmapClusterValueFn}, "correct sort config used");
        });
        it("should not do anything if heatmap index specified, same heatmap index specified before", ()=>{
            transitionSortConfig({sortConfig:{clusterHeatmapTrackGroupIndex:2}}, {sortConfig:{clusterHeatmapTrackGroupIndex:2}}, oncoprint);
            assert.equal(oncoprint.setSortConfig.callCount, 0);
        });
    });
});