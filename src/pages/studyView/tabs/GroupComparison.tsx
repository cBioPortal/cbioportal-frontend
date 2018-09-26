import * as React from "react";
import { observer } from "mobx-react";
import * as _ from 'lodash';
import { Group, SurvivalType, AnalysisGroup } from "pages/studyView/StudyViewPageStore";
import { MSKTabs, MSKTab } from "shared/components/MSKTabs/MSKTabs";
import { observable, action, computed } from "mobx";
import styles from "./styles.module.scss";
import classNames from 'classnames';
import { bind } from "bind-decorator";
import SurvivalChart, { LegendLocation } from "pages/resultsView/survival/SurvivalChart";
import MobxPromise from "mobxpromise";
import { remoteData } from "shared/api/remoteData";
import { makeSurvivalChartData } from "pages/studyView/charts/survival/StudyViewSurvivalUtils";
import { COLORS } from "pages/studyView/StudyViewUtils";
import EnrichmentComponent from "../groupComparison/enrichmentComponent";
import { ExpressionEnrichment } from 'shared/api/generated/CBioPortalAPIInternal';
import GroupChart, { GroupChartData } from "pages/studyView/charts/groupChart/GroupChart";
import ReactSelect from 'react-select';
import { ClinicalAttribute, ClinicalDataMultiStudyFilter, ClinicalData } from "shared/api/generated/CBioPortalAPI";
import defaultClient from "shared/api/cbioportalClientInstance";

export interface IGroupComparisonProps {
    groups: Group[];
    survivalPlotData: MobxPromise<SurvivalType[]>;
    mRNAEnrichmentData: MobxPromise<ExpressionEnrichment[]>;
    clinicalAttributes: ClinicalAttribute[];
}

@observer
export class GroupComparison extends React.Component<IGroupComparisonProps, {}> {
    @observable activeTabId = 'survival';

    @observable private activeGroups = observable.map<boolean>();


    @bind
    @action private handleTabChange(id: string) {
        this.activeTabId = id;
    }

    @bind
    @action private toggleActive(name: string) {
        this.activeGroups.set(name, this.activeGroups.get(name) === undefined ? false : !this.activeGroups.get(name));
    }

    @computed get groupWithColors() {
        let count = -1;
        return this.props.groups.map(group => {
            count = count + 1;
            return {
                name: group.name,
                samples: group.samples,
                color: COLORS[count]
            }
        })
    }

    @computed get groups() {
        return this.groupWithColors.map(group => {
            let active = this.activeGroups.get(group.name) === undefined ? true : !!this.activeGroups.get(group.name);
            let numOfSamples = group.samples.length;
            let numOfPatients = _.uniq(group.samples.map(sample => sample.uniquePatientKey)).length;
            return (
                <GroupPill active={active} name={group.name} label={`${group.name} (${numOfSamples}/${numOfPatients})`} color={group.color} toggleActive={this.toggleActive} />
            )
        });
    }

    @computed get analysisGroups() {
        return _.reduce(this.groupWithColors, (acc, group) => {
            let isActive = this.activeGroups.get(group.name) === undefined ? true : !!this.activeGroups.get(group.name);
            if (isActive) {
                acc.push({
                    value: group.name,
                    color: group.color
                })
            }
            return acc;
        }, [] as AnalysisGroup[]);
    }

    @computed get patientToAnalysisGroup() {
        return _.reduce(this.groupWithColors, (acc, next) => {
            next.samples.forEach(sample => {
                acc[sample.uniquePatientKey] = next.name
            })
            return acc;
        }, {} as { [id: string]: string })
    }

    @computed get survivalCharts() {
        if (!_.isEmpty(this.patientToAnalysisGroup) && this.props.survivalPlotData.isComplete) {
            return _.map(this.props.survivalPlotData.result || [], (survivalData) => {
                let survivalChartData = makeSurvivalChartData(
                    survivalData.alteredGroup.concat(survivalData.unalteredGroup),
                    this.analysisGroups,
                    this.patientToAnalysisGroup,
                    true,
                    [],
                );
                return (
                    <div>
                        <span>{survivalData.title}</span>

                        <SurvivalChart
                            patientSurvivals={survivalChartData.patientSurvivals}
                            patientToAnalysisGroup={survivalChartData.patientToAnalysisGroup}
                            analysisGroups={survivalChartData.analysisGroups}
                            legendLocation={LegendLocation.TOOLTIP}
                            title={'Survival'}
                            xAxisLabel="Months Survival"
                            yAxisLabel="Surviving"
                            totalCasesHeader="Number of Cases, Total"
                            statusCasesHeader="Number of Cases, Deceased"
                            medianMonthsHeader="Median Months Survival"
                            yLabelTooltip="Survival estimate"
                            xLabelWithEventTooltip="Time of death"
                            xLabelWithoutEventTooltip="Time of last observation"
                            showDownloadButtons={false}
                            showTable={false}
                            fileName="Overall_Survival"
                            styleOpts={{
                                width: 400,
                                height: 380,
                                legend: {
                                    x: 190,
                                    y: 12
                                },
                                axis: {
                                    y: {
                                        axisLabel: {
                                            padding: 40
                                        }
                                    }
                                }
                            }}
                        />
                    </div>
                )
            })
        } else {
            return [];
        }
    };

    get mutationData() {
        return [{"x":-0.05638202717658558,"y":0.12128986145515953,"hugoGeneSymbol":"ARPIN","entrezGeneId":348110,"qValue":0.9862852898180069,"logRatio":-0.05638202717658558,"hovered":false},{"x":0.051876870595298996,"y":0.12117644638480983,"hugoGeneSymbol":"ABHD3","entrezGeneId":171586,"qValue":0.9862852898180069,"logRatio":0.051876870595298996,"hovered":false},{"x":0.04067472005209005,"y":0.1211279914996728,"hugoGeneSymbol":"COMMD7","entrezGeneId":149951,"qValue":0.9862852898180069,"logRatio":0.04067472005209005,"hovered":false},{"x":-0.03430468534901365,"y":0.12108021504387187,"hugoGeneSymbol":"PRKAA1","entrezGeneId":5562,"qValue":0.9862852898180069,"logRatio":-0.03430468534901365,"hovered":false},{"x":-0.12795379867822199,"y":0.12106245151985612,"hugoGeneSymbol":"SIGLEC7","entrezGeneId":27036,"qValue":0.9862852898180069,"logRatio":-0.12795379867822199,"hovered":false},{"x":0.07501390862265556,"y":0.1208887131062293,"hugoGeneSymbol":"ZNF44","entrezGeneId":51710,"qValue":0.9862852898180069,"logRatio":0.07501390862265556,"hovered":false},{"x":-0.03628697376965562,"y":0.12087796138342238,"hugoGeneSymbol":"TOLLIP","entrezGeneId":54472,"qValue":0.9862852898180069,"logRatio":-0.03628697376965562,"hovered":false},{"x":0.031123398171092553,"y":0.12087143277492052,"hugoGeneSymbol":"C1D","entrezGeneId":10438,"qValue":0.9862852898180069,"logRatio":0.031123398171092553,"hovered":false},{"x":-0.045475035003626374,"y":0.1206776157835544,"hugoGeneSymbol":"OAF","entrezGeneId":220323,"qValue":0.9862852898180069,"logRatio":-0.045475035003626374,"hovered":false},{"x":0.09300624622731934,"y":0.12066537272566424,"hugoGeneSymbol":"PRRG2","entrezGeneId":5639,"qValue":0.9862852898180069,"logRatio":0.09300624622731934,"hovered":false},{"x":-0.09388491932834597,"y":0.12060093764318665,"hugoGeneSymbol":"ZDHHC2","entrezGeneId":51201,"qValue":0.9862852898180069,"logRatio":-0.09388491932834597,"hovered":false},{"x":-0.0253220141179753,"y":0.1205515462536593,"hugoGeneSymbol":"USP15","entrezGeneId":9958,"qValue":0.9862852898180069,"logRatio":-0.0253220141179753,"hovered":false},{"x":-0.11042161153516794,"y":0.12051311102630942,"hugoGeneSymbol":"CAB39L","entrezGeneId":81617,"qValue":0.9862852898180069,"logRatio":-0.11042161153516794,"hovered":false},{"x":-0.04253980638108068,"y":0.12042164264009517,"hugoGeneSymbol":"C17ORF58","entrezGeneId":284018,"qValue":0.9862852898180069,"logRatio":-0.04253980638108068,"hovered":false},{"x":-0.07186612911881607,"y":0.12039204365577358,"hugoGeneSymbol":"SPACA6","entrezGeneId":147650,"qValue":0.9862852898180069,"logRatio":-0.07186612911881607,"hovered":false},{"x":0.031057271457887836,"y":0.12035714407049115,"hugoGeneSymbol":"BUD23","entrezGeneId":114049,"qValue":0.9862852898180069,"logRatio":0.031057271457887836,"hovered":false},{"x":0.02961279904365277,"y":0.12034687453230915,"hugoGeneSymbol":"AIDA","entrezGeneId":64853,"qValue":0.9862852898180069,"logRatio":0.02961279904365277,"hovered":false},{"x":0.04603781357630865,"y":0.12029863345099626,"hugoGeneSymbol":"TP53I13","entrezGeneId":90313,"qValue":0.9862852898180069,"logRatio":0.04603781357630865,"hovered":false},{"x":-0.04925426017632617,"y":0.12028986509854817,"hugoGeneSymbol":"PDK3","entrezGeneId":5165,"qValue":0.9862852898180069,"logRatio":-0.04925426017632617,"hovered":false},{"x":-0.014830517245425057,"y":0.12023172815670477,"hugoGeneSymbol":"PTBP1","entrezGeneId":5725,"qValue":0.9862852898180069,"logRatio":-0.014830517245425057,"hovered":false},{"x":0.05484165663466456,"y":0.12018503347184946,"hugoGeneSymbol":"PEBP1","entrezGeneId":5037,"qValue":0.9862852898180069,"logRatio":0.05484165663466456,"hovered":false},{"x":0.06542144180705733,"y":0.1201164216831316,"hugoGeneSymbol":"COL4A2","entrezGeneId":1284,"qValue":0.9862852898180069,"logRatio":0.06542144180705733,"hovered":false},{"x":-0.06624336524578567,"y":0.12007776439707037,"hugoGeneSymbol":"ARHGEF10L","entrezGeneId":55160,"qValue":0.9862852898180069,"logRatio":-0.06624336524578567,"hovered":false},{"x":0.09234063926763891,"y":0.1200571821256726,"hugoGeneSymbol":"FAM182B","entrezGeneId":728882,"qValue":0.9862852898180069,"logRatio":0.09234063926763891,"hovered":false},{"x":0.07591053868172715,"y":0.12004709899247676,"hugoGeneSymbol":"PLCB1","entrezGeneId":23236,"qValue":0.9862852898180069,"logRatio":0.07591053868172715,"hovered":false},{"x":-0.02982456298476599,"y":0.12003140921324883,"hugoGeneSymbol":"RAVER1","entrezGeneId":125950,"qValue":0.9862852898180069,"logRatio":-0.02982456298476599,"hovered":false},{"x":-0.04232245333463602,"y":0.12003139779104086,"hugoGeneSymbol":"KRTCAP2","entrezGeneId":200185,"qValue":0.9862852898180069,"logRatio":-0.04232245333463602,"hovered":false},{"x":0.04688034316532441,"y":0.119931622251299,"hugoGeneSymbol":"TBCEL","entrezGeneId":219899,"qValue":0.9862852898180069,"logRatio":0.04688034316532441,"hovered":false},{"x":-0.07449691878485787,"y":0.11983827176479302,"hugoGeneSymbol":"TOB2P1","entrezGeneId":222699,"qValue":0.9862852898180069,"logRatio":-0.07449691878485787,"hovered":false},{"x":0.06594833746336759,"y":0.11974003673844091,"hugoGeneSymbol":"RYR3","entrezGeneId":6263,"qValue":0.9862852898180069,"logRatio":0.06594833746336759,"hovered":false},{"x":-0.0327216231324261,"y":0.11970353838550597,"hugoGeneSymbol":"DCTN3","entrezGeneId":11258,"qValue":0.9862852898180069,"logRatio":-0.0327216231324261,"hovered":false}];
    }

    get cnaData() {
        return [{"x":-0.035991348245701715,"y":0.11850817671466751,"hugoGeneSymbol":"TIGD5","entrezGeneId":84948,"qValue":0.9862852898180069,"logRatio":-0.035991348245701715,"hovered":false},{"x":0.0632304562422874,"y":0.11850670327227805,"hugoGeneSymbol":"IGF1R","entrezGeneId":3480,"qValue":0.9862852898180069,"logRatio":0.0632304562422874,"hovered":false},{"x":0.04086561497513941,"y":0.11850515483983806,"hugoGeneSymbol":"FIGNL1","entrezGeneId":63979,"qValue":0.9862852898180069,"logRatio":0.04086561497513941,"hovered":false},{"x":0.07963645908305139,"y":0.11847634518367554,"hugoGeneSymbol":"MID1","entrezGeneId":4281,"qValue":0.9862852898180069,"logRatio":0.07963645908305139,"hovered":false},{"x":0.05554318619697707,"y":0.11846972667779465,"hugoGeneSymbol":"CARNMT1","entrezGeneId":138199,"qValue":0.9862852898180069,"logRatio":0.05554318619697707,"hovered":false},{"x":-0.07314587217608626,"y":0.11834232093053992,"hugoGeneSymbol":"DYNC2H1","entrezGeneId":79659,"qValue":0.9862852898180069,"logRatio":-0.07314587217608626,"hovered":false},{"x":-0.09333940028263665,"y":0.11832648339492785,"hugoGeneSymbol":"ADSSL1","entrezGeneId":122622,"qValue":0.9862852898180069,"logRatio":-0.09333940028263665,"hovered":false},{"x":0.03571104000919334,"y":0.11828995659523917,"hugoGeneSymbol":"TCTN2","entrezGeneId":79867,"qValue":0.9862852898180069,"logRatio":0.03571104000919334,"hovered":false},{"x":0.03007284704021629,"y":0.11824949036569857,"hugoGeneSymbol":"DDOST","entrezGeneId":1650,"qValue":0.9862852898180069,"logRatio":0.03007284704021629,"hovered":false},{"x":-0.10380787017986748,"y":0.11819307391469572,"hugoGeneSymbol":"ARHGAP15","entrezGeneId":55843,"qValue":0.9862852898180069,"logRatio":-0.10380787017986748,"hovered":false},{"x":-0.06643127234865087,"y":0.1181439114053912,"hugoGeneSymbol":"MPL","entrezGeneId":4352,"qValue":0.9862852898180069,"logRatio":-0.06643127234865087,"hovered":false},{"x":-0.09712052902508495,"y":0.11805478642894568,"hugoGeneSymbol":"KLF3-AS1","entrezGeneId":79667,"qValue":0.9862852898180069,"logRatio":-0.09712052902508495,"hovered":false},{"x":-0.04908285299825099,"y":0.11799368517228219,"hugoGeneSymbol":"NT5DC3","entrezGeneId":51559,"qValue":0.9862852898180069,"logRatio":-0.04908285299825099,"hovered":false},{"x":-0.12888139912395857,"y":0.11794311814828873,"hugoGeneSymbol":"SHISAL1","entrezGeneId":85352,"qValue":0.9862852898180069,"logRatio":-0.12888139912395857,"hovered":false},{"x":-0.045957912463484796,"y":0.11794102040428192,"hugoGeneSymbol":"ZNRD1ASP","entrezGeneId":80862,"qValue":0.9862852898180069,"logRatio":-0.045957912463484796,"hovered":false},{"x":-0.036914323338375965,"y":0.11779521391519361,"hugoGeneSymbol":"PMS2P4","entrezGeneId":5382,"qValue":0.9862852898180069,"logRatio":-0.036914323338375965,"hovered":false},{"x":0.02911691770356306,"y":0.11775662039282947,"hugoGeneSymbol":"ABI1","entrezGeneId":10006,"qValue":0.9862852898180069,"logRatio":0.02911691770356306,"hovered":false},{"x":-0.02523268201835549,"y":0.11772788754940325,"hugoGeneSymbol":"HGS","entrezGeneId":9146,"qValue":0.9862852898180069,"logRatio":-0.02523268201835549,"hovered":false},{"x":-0.11392116009387188,"y":0.11769616047659658,"hugoGeneSymbol":"SYNGR1","entrezGeneId":9145,"qValue":0.9862852898180069,"logRatio":-0.11392116009387188,"hovered":false},{"x":-0.038824835973464644,"y":0.117677327461925,"hugoGeneSymbol":"CTSA","entrezGeneId":5476,"qValue":0.9862852898180069,"logRatio":-0.038824835973464644,"hovered":false},{"x":0.0663429556161308,"y":0.11764711845357256,"hugoGeneSymbol":"VSIG10","entrezGeneId":54621,"qValue":0.9862852898180069,"logRatio":0.0663429556161308,"hovered":false},{"x":0.07270041011588546,"y":0.11761531401122871,"hugoGeneSymbol":"MICAL2","entrezGeneId":9645,"qValue":0.9862852898180069,"logRatio":0.07270041011588546,"hovered":false},{"x":-0.03704659529906351,"y":0.11757986358065364,"hugoGeneSymbol":"RAB6A","entrezGeneId":5870,"qValue":0.9862852898180069,"logRatio":-0.03704659529906351,"hovered":false},{"x":0.036716572295791394,"y":0.11754182184346144,"hugoGeneSymbol":"LDLRAP1","entrezGeneId":26119,"qValue":0.9862852898180069,"logRatio":0.036716572295791394,"hovered":false},{"x":-0.05596887547598861,"y":0.11749409695638177,"hugoGeneSymbol":"PHLDB1","entrezGeneId":23187,"qValue":0.9862852898180069,"logRatio":-0.05596887547598861,"hovered":false},{"x":0.04491001004471862,"y":0.11748498518028207,"hugoGeneSymbol":"SHLD1","entrezGeneId":149840,"qValue":0.9862852898180069,"logRatio":0.04491001004471862,"hovered":false},{"x":-0.03012472070436445,"y":0.11748358374685068,"hugoGeneSymbol":"SLC25A26","entrezGeneId":115286,"qValue":0.9862852898180069,"logRatio":-0.03012472070436445,"hovered":false},{"x":0.03644366465163884,"y":0.11745655901120546,"hugoGeneSymbol":"ZNF75D","entrezGeneId":7626,"qValue":0.9862852898180069,"logRatio":0.03644366465163884,"hovered":false},{"x":-0.031069998344092298,"y":0.1173906145805982,"hugoGeneSymbol":"WHAMM","entrezGeneId":123720,"qValue":0.9862852898180069,"logRatio":-0.031069998344092298,"hovered":false},{"x":-0.024726707685021054,"y":0.11734007751603831,"hugoGeneSymbol":"COPS7A","entrezGeneId":50813,"qValue":0.9862852898180069,"logRatio":-0.024726707685021054,"hovered":false},{"x":0.028933326000259996,"y":0.11723151885698051,"hugoGeneSymbol":"MAP2K4","entrezGeneId":6416,"qValue":0.9862852898180069,"logRatio":0.028933326000259996,"hovered":false},{"x":0.06724936980521079,"y":0.1171994855416459,"hugoGeneSymbol":"PRRG4","entrezGeneId":79056,"qValue":0.9862852898180069,"logRatio":0.06724936980521079,"hovered":false},{"x":-0.04727978418112588,"y":0.11715388346086271,"hugoGeneSymbol":"ZNF773","entrezGeneId":374928,"qValue":0.9862852898180069,"logRatio":-0.04727978418112588,"hovered":false},{"x":0.06685244411738278,"y":0.11703557817808004,"hugoGeneSymbol":"LHX6","entrezGeneId":26468,"qValue":0.9862852898180069,"logRatio":0.06685244411738278,"hovered":false},{"x":0.1312401191873498,"y":0.11701818061313585,"hugoGeneSymbol":"ACER2","entrezGeneId":340485,"qValue":0.9862852898180069,"logRatio":0.1312401191873498,"hovered":false},{"x":-0.035279120447698986,"y":0.11688467565040536,"hugoGeneSymbol":"PLEKHJ1","entrezGeneId":55111,"qValue":0.9862852898180069,"logRatio":-0.035279120447698986,"hovered":false},{"x":0.05109680149338125,"y":0.11688275747507089,"hugoGeneSymbol":"TLE3","entrezGeneId":7090,"qValue":0.9862852898180069,"logRatio":0.05109680149338125,"hovered":false},{"x":-0.06327986519538165,"y":0.1168819623378801,"hugoGeneSymbol":"ITPRIP","entrezGeneId":85450,"qValue":0.9862852898180069,"logRatio":-0.06327986519538165,"hovered":false},{"x":0.06360169557101258,"y":0.11681668140895464,"hugoGeneSymbol":"ZNF440","entrezGeneId":126070,"qValue":0.9862852898180069,"logRatio":0.06360169557101258,"hovered":false},{"x":0.03339449040525011,"y":0.11679991102668665,"hugoGeneSymbol":"ARHGAP5","entrezGeneId":394,"qValue":0.9862852898180069,"logRatio":0.03339449040525011,"hovered":false},{"x":0.06882236218246707,"y":0.116778646355459,"hugoGeneSymbol":"FANK1","entrezGeneId":92565,"qValue":0.9862852898180069,"logRatio":0.06882236218246707,"hovered":false},{"x":-0.03093569898303894,"y":0.11677033596950573,"hugoGeneSymbol":"CXORF38","entrezGeneId":159013,"qValue":0.9862852898180069,"logRatio":-0.03093569898303894,"hovered":false},{"x":-0.1331140061082703,"y":0.1166748654399912,"hugoGeneSymbol":"PAX8","entrezGeneId":7849,"qValue":0.9862852898180069,"logRatio":-0.1331140061082703,"hovered":false},{"x":0.06755479823113042,"y":0.11666590369068583,"hugoGeneSymbol":"DUBR","entrezGeneId":344595,"qValue":0.9862852898180069,"logRatio":0.06755479823113042,"hovered":false},{"x":-0.027569545353973268,"y":0.11664045974444132,"hugoGeneSymbol":"IMP3","entrezGeneId":55272,"qValue":0.9862852898180069,"logRatio":-0.027569545353973268,"hovered":false},{"x":0.03326151198860039,"y":0.11661750015866525,"hugoGeneSymbol":"YTHDC2","entrezGeneId":64848,"qValue":0.9862852898180069,"logRatio":0.03326151198860039,"hovered":false},{"x":-0.025773653116402784,"y":0.11661139693410774,"hugoGeneSymbol":"ATXN3","entrezGeneId":4287,"qValue":0.9862852898180069,"logRatio":-0.025773653116402784,"hovered":false},{"x":-0.23468197937680468,"y":0.11649933910073998,"hugoGeneSymbol":"MUC4","entrezGeneId":4585,"qValue":0.9862852898180069,"logRatio":-0.23468197937680468,"hovered":false},{"x":-0.07817910483592172,"y":0.11649773752541566,"hugoGeneSymbol":"GPR153","entrezGeneId":387509,"qValue":0.9862852898180069,"logRatio":-0.07817910483592172,"hovered":false},{"x":0.03843534065358156,"y":0.11644728709963909,"hugoGeneSymbol":"NPAT","entrezGeneId":4863,"qValue":0.9862852898180069,"logRatio":0.03843534065358156,"hovered":false},{"x":-0.03642673702469246,"y":0.11644176012301906,"hugoGeneSymbol":"HMGN2","entrezGeneId":3151,"qValue":0.9862852898180069,"logRatio":-0.03642673702469246,"hovered":false}];
    }

    get proteinData () {
        return [{"x":0.04460023837182092,"y":0.10664089064608803,"hugoGeneSymbol":"SKA3","entrezGeneId":221150,"qValue":0.9873702230670853,"logRatio":0.04460023837182092,"hovered":false},{"x":-0.08869094927465504,"y":0.10660726009625682,"hugoGeneSymbol":"PYCR1","entrezGeneId":5831,"qValue":0.9873702230670853,"logRatio":-0.08869094927465504,"hovered":false},{"x":-0.057294038249320334,"y":0.1065745921906566,"hugoGeneSymbol":"C7ORF61","entrezGeneId":402573,"qValue":0.9873702230670853,"logRatio":-0.057294038249320334,"hovered":false},{"x":-0.05810150305884498,"y":0.10655531266702971,"hugoGeneSymbol":"TBC1D8","entrezGeneId":11138,"qValue":0.9873702230670853,"logRatio":-0.05810150305884498,"hovered":false},{"x":0.1826578406678454,"y":0.10652760730153868,"hugoGeneSymbol":"JCHAIN","entrezGeneId":3512,"qValue":0.9873702230670853,"logRatio":0.1826578406678454,"hovered":false},{"x":-0.0456069421631371,"y":0.10650381383088225,"hugoGeneSymbol":"ZRANB3","entrezGeneId":84083,"qValue":0.9873702230670853,"logRatio":-0.0456069421631371,"hovered":false},{"x":0.023883973219369636,"y":0.10645037542544065,"hugoGeneSymbol":"PCIF1","entrezGeneId":63935,"qValue":0.9873702230670853,"logRatio":0.023883973219369636,"hovered":false},{"x":-0.08856054802647773,"y":0.10639587204688769,"hugoGeneSymbol":"DCLK2","entrezGeneId":166614,"qValue":0.9873702230670853,"logRatio":-0.08856054802647773,"hovered":false},{"x":0.045351401969885075,"y":0.10638468712700558,"hugoGeneSymbol":"TMEM254","entrezGeneId":80195,"qValue":0.9873702230670853,"logRatio":0.045351401969885075,"hovered":false},{"x":0.024199490461722206,"y":0.1062338277412538,"hugoGeneSymbol":"POLG","entrezGeneId":5428,"qValue":0.9873702230670853,"logRatio":0.024199490461722206,"hovered":false},{"x":-0.026444957696405424,"y":0.10615675709314903,"hugoGeneSymbol":"MPV17L2","entrezGeneId":84769,"qValue":0.9873702230670853,"logRatio":-0.026444957696405424,"hovered":false},{"x":-0.04999356477023831,"y":0.10613222858171455,"hugoGeneSymbol":"ZNF302","entrezGeneId":55900,"qValue":0.9873702230670853,"logRatio":-0.04999356477023831,"hovered":false},{"x":-0.03632972828991399,"y":0.10604848927341266,"hugoGeneSymbol":"NCK1","entrezGeneId":4690,"qValue":0.9873702230670853,"logRatio":-0.03632972828991399,"hovered":false},{"x":-0.03425049082896692,"y":0.10601697334618977,"hugoGeneSymbol":"GTPBP6","entrezGeneId":8225,"qValue":0.9873702230670853,"logRatio":-0.03425049082896692,"hovered":false},{"x":-0.07299634848145509,"y":0.10596591613685072,"hugoGeneSymbol":"SEC14L2","entrezGeneId":23541,"qValue":0.9873702230670853,"logRatio":-0.07299634848145509,"hovered":false},{"x":-0.040241806588522167,"y":0.10595092575915416,"hugoGeneSymbol":"NCKAP5L","entrezGeneId":57701,"qValue":0.9873702230670853,"logRatio":-0.040241806588522167,"hovered":false},{"x":0.02220983821200484,"y":0.1058234252443403,"hugoGeneSymbol":"UBE2N","entrezGeneId":7334,"qValue":0.9873702230670853,"logRatio":0.02220983821200484,"hovered":false},{"x":-0.07352840830629415,"y":0.10570973390284896,"hugoGeneSymbol":"FGF1","entrezGeneId":2246,"qValue":0.9873702230670853,"logRatio":-0.07352840830629415,"hovered":false},{"x":0.01959418290588566,"y":0.10569931250430865,"hugoGeneSymbol":"ARMC8","entrezGeneId":25852,"qValue":0.9873702230670853,"logRatio":0.01959418290588566,"hovered":false},{"x":0.05695699827320766,"y":0.10565022954131587,"hugoGeneSymbol":"TMEM86A","entrezGeneId":144110,"qValue":0.9873702230670853,"logRatio":0.05695699827320766,"hovered":false},{"x":0.03420444339548112,"y":0.10563652579322222,"hugoGeneSymbol":"CASP9","entrezGeneId":842,"qValue":0.9873702230670853,"logRatio":0.03420444339548112,"hovered":false},{"x":0.09465109675683525,"y":0.10562357156197125,"hugoGeneSymbol":"AHRR","entrezGeneId":57491,"qValue":0.9873702230670853,"logRatio":0.09465109675683525,"hovered":false},{"x":-0.0388234185923757,"y":0.1056138284627041,"hugoGeneSymbol":"CRTC1","entrezGeneId":23373,"qValue":0.9873702230670853,"logRatio":-0.0388234185923757,"hovered":false},{"x":0.05793591883686666,"y":0.10558911869203516,"hugoGeneSymbol":"VAV2","entrezGeneId":7410,"qValue":0.9873702230670853,"logRatio":0.05793591883686666,"hovered":false},{"x":-0.08093514074170916,"y":0.1055748127141381,"hugoGeneSymbol":"MEIS3","entrezGeneId":56917,"qValue":0.9873702230670853,"logRatio":-0.08093514074170916,"hovered":false},{"x":0.061496921024604134,"y":0.10556013446992236,"hugoGeneSymbol":"C3ORF58","entrezGeneId":205428,"qValue":0.9873702230670853,"logRatio":0.061496921024604134,"hovered":false},{"x":0.0727962747463371,"y":0.10555201378422022,"hugoGeneSymbol":"PROS1","entrezGeneId":5627,"qValue":0.9873702230670853,"logRatio":0.0727962747463371,"hovered":false}];
    }

    @computed get MRNAData() {
        if (this.props.mRNAEnrichmentData.isComplete) {
            if (this.props.mRNAEnrichmentData.result !== undefined) {
                return this.props.mRNAEnrichmentData.result;
            } else {
                return [];
            }
        } else {
            return [];
        }
    }

    @computed get clinicalAttributeSet() {
        return _.reduce(this.props.clinicalAttributes,(acc, clinicalAttribute)=>{
            if (clinicalAttribute.datatype === 'STRING') {
                let attributrType = clinicalAttribute.patientAttribute?'PATIENT':'SAMPLE'
                acc[`${attributrType}_${clinicalAttribute.clinicalAttributeId}`] = clinicalAttribute
            }
            return acc
        },{} as {[id:string]:ClinicalAttribute})
    }

    @computed get clinicalAttributeOptions() {
        return _.map(this.clinicalAttributeSet,(clinicalAttribute, key)=>{
            return {
                label: clinicalAttribute.displayName,
                value: key
            }
        })

    }

    @computed get sampleIdentifiers(){
        return _.flatMap(this.props.groups,group=>{
            return group.samples.map(sample=>{
                return {
                    entityId: sample.sampleId,
                    studyId: sample.studyId
                }
            })
        })
    }

    @computed get patientIdentifiers(){
        return _.flatMap(this.props.groups,group=>{
            return group.samples.map(sample=>{
                return {
                    entityId: sample.patientId,
                    studyId: sample.studyId
                }
            })
        })
    }

    readonly clinicalDataSet = remoteData<{[id:string]:ClinicalData}>({
        invoke: async () => {
            if(this.activeClinicalAttrribute){
                let clinicalAttribute = this.clinicalAttributeSet[this.activeClinicalAttrribute]
                let data = await defaultClient.fetchClinicalDataUsingPOST({
                    'clinicalDataType': clinicalAttribute.patientAttribute ? 'PATIENT' : 'SAMPLE',
                    'clinicalDataMultiStudyFilter': {
                        attributeIds: [clinicalAttribute.clinicalAttributeId],
                        identifiers: clinicalAttribute.patientAttribute ? this.patientIdentifiers : this.sampleIdentifiers
                    } as ClinicalDataMultiStudyFilter
                });
                const key = clinicalAttribute.patientAttribute ? 'uniquePatientKey' : 'uniqueSampleKey'
                return _.keyBy(data,obj=>obj[key])
            }
            return {};
        },
        default: {},
    });

    @computed get groupedClinicalData(){
        if(this.activeClinicalAttrribute && this.clinicalDataSet.isComplete && !_.isEmpty(this.clinicalDataSet.result)){
            let clinicalDataSet = this.clinicalDataSet.result
            let clinicalAttribute = this.clinicalAttributeSet[this.activeClinicalAttrribute]
            const uniqKey = clinicalAttribute.patientAttribute ? 'uniquePatientKey' : 'uniqueSampleKey'
            return _.reduce(this.groupWithColors, (acc, group) => {
                let isActive = this.activeGroups.get(group.name) === undefined ? true : !!this.activeGroups.get(group.name);
                if (isActive) {


                    let groupClinicalData = _.reduce(group.samples,(acc, sample)=>{
                        if(clinicalDataSet[sample[uniqKey]]){
                            acc.push(clinicalDataSet[sample[uniqKey]])
                        }
                        return acc
                    },[] as ClinicalData[])

                    let groupClinicalDataSet = _.groupBy(groupClinicalData,clinicalData=> clinicalData.value)

                    let categories = _.map(groupClinicalDataSet,(group, key)=>{
                        return {
                            name: key,
                            count: group.length
                        }
                    })

                    let _group = {
                        name: group.name,
                        color: group.color,
                        categories: categories
                    }

                    acc.push(_group)
                }
                return acc;
            }, [] as GroupChartData[]);
        }
        return []
    }

    @observable activeClinicalAttrribute: string | undefined = undefined;

    @bind
    @action
    private changeOption(option:any){
        if(option){
            this.activeClinicalAttrribute = option.value
        } else {
            this.activeClinicalAttrribute = undefined
        }
    }

    public render() {
        return (
            <div className={styles.main} style={{ margin: '10px' }} >
                <div className={styles.header}>
                    <span>Groups <span className={styles.sub}>(click to toggle, drag to re-order)</span></span>
                    <div className={styles.groups}>{this.groups}</div>
                </div>
                <MSKTabs id="groupComparisonTabs" activeTabId={this.activeTabId}
                    onTabClick={(id: string) => this.handleTabChange(id)}
                    vertical={true}
                    className="pillTabs">

                    <MSKTab key={0} id="overlap" linkText="Overlap">

                    </MSKTab>

                    {
                        this.survivalCharts.length > 0 &&
                        <MSKTab key={1} id="survival" linkText="Survival">
                            <div style={{ display: 'flex', padding: '0 10px' }}>
                                {this.survivalCharts}
                            </div>
                        </MSKTab>
                    }

                    <MSKTab key={2} id="differentialExpression" linkText="Expression">
                        <EnrichmentComponent mutationData={this.mutationData}
                            cnaData={this.cnaData}
                            mrnaData={this.MRNAData}
                            proteinData={this.proteinData}></EnrichmentComponent>
                    </MSKTab>
                    <MSKTab key={3} id="alterationFrequencies" linkText="Copy-Number">

                    </MSKTab>
                    <MSKTab key={5} id="clinicalAttributes" linkText="Clinical">

                        <div>

                            <ReactSelect
                                placeholder='select a symbol'
                                options={this.clinicalAttributeOptions}
                                onChange={this.changeOption}
                                value={this.activeClinicalAttrribute}
                                autosize
                            />

                            <GroupChart data={this.groupedClinicalData}
                                filters={[]} />

                        </div>


                    </MSKTab>

                </MSKTabs>

            </div>
        );
    }
}

export interface IGroupPillProps {
    active: boolean;
    name: string;
    color: string;
    label: string;
    toggleActive: (name: string) => void;

}

@observer
class GroupPill extends React.Component<IGroupPillProps, {}> {

    @bind
    @action private toggleActive() {
        this.props.toggleActive(this.props.name);
    }

    public render() {
        return (<div className={classNames(styles.groupPill, {
            [styles.active]: this.props.active
        })} style={{ backgroundColor: this.props.active ? this.props.color : '' }} onClick={this.toggleActive}>
            <span>{this.props.label}</span>
        </div>)
    }
}
