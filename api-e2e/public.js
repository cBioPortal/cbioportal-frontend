const csv = require('csvtojson');
let csvFilePath = './extract-2024-10-11T11_47_07.957Z.csv';

//csvFilePath = 'extract-2024-10-12T19_34_07.810Z.csv';

//csvFilePath = 'extract-2024-10-13T07_41_15.227Z.csv'; //BIG ONE

csvFilePath = 'public/extract-2024-10-17T11_47_33.789Z.csv'; // 100k public

// these are genie
//'genie/extract-2024-10-17T05_29_43.435Z.csv' passing as of 10/18
//'genie/extract-2024-10-14T16_35_15.134Z.csv' passing as of 10/18
//`genie/extract-2024-10-14T20_29_07.301Z.csv` passing as of 10/18 (20 supressed)
//'genie/extract-2024-10-14T20_29_07.301Z.csv' passing as of 10/18 (20 supressed)
//'genie/extract-2024-10-17T18_26_53.439Z.csv' 2 failures 10/18  -1413667366,767115642 (one is violin, other 1 missing mutation)

csvFilePath = 'genie/extract-2024-10-17T18_26_53.439Z.csv'; // 'genie/extract-2024-10-14T20_29_07.301Z.csv';

const _ = require('lodash');
const formatCurl = require('format-curl');

var axios = require('axios');
var { runSpecs } = require('./validation');

var exclusions = [];

const cliArgs = parseArgs();

const filters = [];

let hashes = [];

// these are for
// const moos = `-673406526,-2005371191,-517670758,-297044990,-1843047838,1806024553,-1144748981,-253195460,1612090123,1325352156,-969783118,-1532898703,-1252166631,-1970080199,1099177506,-208575755,111369452,-2105827951,1488562009,120267065,-292313552,836959411,-1704732196,-1555792159,-1320441691,1224210290,1270362153,10730406,-1899514961,288956321,-2113817139,-1413994933,-297626343,-1453024695,612255788,294196227,334389772,-390181133,1488680884,-2136697383,-1851989700,-355198818,-1309800115,152983341,397284593,-273143411,-1898646363,-1222068354,768740376,506650358,-1978121826,-400232064,-854603647,966120768,1595526137,82293504,1693730585,1103112135,-130897992,982465581,-546396458,202736822,200577571,-1458390145,-1842559442,2115230890,1689773109,1260579686,608735328,-897823386,-1572279128,-2124788882,-1395582859,100764153,-2082231907,955387813,-86796820,-1959670828,-98020122,1989522734,-1386302838,494569046,-1578480035,-1264908277,1158398385,-305101900,2048745056,-262932598,-850356102,-1792777678,1168983298,1411967402,1061979373,1035914715,180953340,1514094747,-1552113269,-1918506884,1008528915,-199052613,871245308,-1630089717,816765258,470830618,1442340714,590580569,-2008281110,455817433,-306067334,-301861134,732000609,-307109378,-961046683,1155220653,585398983,-1081770754,-46214137,-421841122,460740961,-1055177488,2062576853,616789385,913376734,1290285048,809096332,89467101,-310960451,-807914063,-485028167,-1534017795,-1167921147,936974935,-1555192267,-333794387,-2073853723,-505694523,-519244572,1142105423,-363435083,643026493,-1428593845,-1043873486,1977120,1146520892,-1587618066,202915433,-1756538928,-1203647954,1982015438,1113600170,1014223356,1291985665,-806867521,-1361531574,367815258,-1558930374,255383726,203998497,-1550855951,-1391593582,1610595048,1763472544,1853556760,-1839313216,649214677,899056493,1899934755,-670025579,1816938667,-5089684,260489931,1002976033,887308081,-1360456087,-7628346,1638022655,466748715,1107722551,1256401318,1251220339,-425181581,471868808,-337108571,-1825470371,308297064,-735124612,-1442353336,-1137827504,-1436856030,-349080261,225299066,-382489202,-1968597541`.split(
//     ','
// );

// these are for public 100k
const moos = `776162948,1791582317,1051626596,1090390722,1634096744,-1357626028,-517670758,-297044990,-723148861,-887269158,-157223238,-1609018360,688132288,-1012605014,663602026,1144436202,2080416722,2102636334,1616351403,116697458,-1145140218,440961037,1788201866,64435906,1526226372,954198833,-333224080,-77262384,-969783118,-2092699827,1122708088,705191799,-910997525,369597899,-589249907,-1733269776,532408117,793803824,2005451592,1946034863,1348899627,1736153850,2004861981,1069675380,-2104618878,-1375780045,-1436966818,-1498011539,-1840476236,1636322635,128823282,712950665,-1807144066,-760096379,1806024553,-1843047838,-1380244121,1908080601,2049138719,75325645,-1564433337,214093972,1584368526,739417518,788541298,-1388038023,-476428894,-1214473123,1798846884,-1336448229,-1479102524,1188628176,1211735112,267198007,-1042782005,1595526137,966120768,-1318775387,-770140034,458149073,-1320441691,1768280517,795362073,440551502,-1083874499,860411865,-1922049418,799514642,2103810746,344484572,-22512484,2075871805,1492814359,2086203791,1046746847,780773665,-1592145833,-1575752643,1528265113,-1374458187,-1474139020,582526768,-2074481817,-1628958227,-2005572217,701108624,-793717747,2078439121,903680661,604898834,1159409033,1376551148,-1025123895,406726936,-1451816705,844353247,-1086596952,-524277403,-1173492647,-263714217,-1961112625,173857178,810614460,776625487,-31077333,-407077673,1152625827,-1204029497,-89652514,950808923,1051361409,655075270,1268317673,-429080735,-180799065,-1918582159,1007754487,445434938,-925144313,-753993222,-828029157,80215185,422205512,-418276888,286347826,1427361749,1841103889,195201275,-278082425,808983848,-558350133,-1982884570,1793886130,104465905,2020005969,-707477776,-1978778776,-146997675,-1605436757,-1288011598,1892578715,-421733597,-2058737510,80797926,2011748125,643117475,656010203,-1838584313,-1379158149,751580838,-300376426,651701037,-284421827,1414588548,1578030439,-1507068659,-552803979,2003360028,1012087380,1119495128,-1018724775,721889439,-1386470488,264752805,-1135621441,53685031,1749320410,-936382059,-271726321,-162436654,-967499791,-924355432,-1967807980,790912582,104911974,105129966,-1015598432,-1547063844,766139610,186806395,1609106547,1137458771,-79793169,-366866963,403522477,1692625915,1918102498,1948188379,1638022655,-7628346,859917518,984138719,-1727165229,-909568546,-1384377258,-1102903634,651279273,-621859020,50108050,721556658,-971350762,55114441,710343427,-1000493817,2065459736,-2010309650,-642014706,1673252949,1288568484,-673406526,-2005371191,1763472544,-1839313216,584288761,899056493,1853556760,-1017785218,-375634338,-217771303,332837231,519954103,-1260921458,1770567231,-848340841,-1575059881,1702190015,1767257846,-90449809,617363688,2134508661,-1353337156,-553248058,1465520871,-2088091542,441238581,263322615,-1243420049,-90200341,533957831,1315006521,1178063322,166833031,-557402244,1128260157,-2090759291,1960991180,-2143298382,2061460930,540705850,-891152750,551129118,364406009,1221598853,788481188,305474268,1341878576,-1625668352,-778412359,-1155472560,463536766,1955600881,-1339515224,1010291232,-1923309873,1182161716,-1303867461,20329773,1116578757,1408885855,1550380971,-1325200994,-941248117,1182607929,-475796764,-1396246057,-93501061,317029493,-960086759,-614052829,-106281559,-1543588030,-490981905,-583187386,-1698981871,452337345,-1946046494,726060739,2076629381`
    .split(',')
    .map(h => new RegExp(h));

//hashes = moos.map(s => new RegExp(s));

if (cliArgs.h) {
    hashes = cliArgs.h.split(',').map(h => new RegExp(h));
}

const START = cliArgs.s || 0;
const LIMIT = cliArgs.l || 10000000;

async function main() {
    const files = await csv()
        .fromFile(csvFilePath)
        .then(async jsonObj => {
            // clean out errant leading single quote
            jsonObj.forEach(d => (d['@hash'] = d['@hash'].replace(/^'/, '')));

            let uniq = _.uniqBy(jsonObj, '@hash')
                .filter(d => {
                    return _.every(
                        exclusions.map(re => re.test(d['@url']) === false)
                    );
                })
                .filter(d => {
                    return (
                        filters.length === 0 ||
                        _.every(filters.map(re => re.test(d['@url']) === true))
                    );
                })
                .filter(d => {
                    return (
                        hashes.length === 0 ||
                        _.some(hashes.map(re => re.test(d['@hash']) === true))
                    );
                });

            const tests = uniq.slice(START, START + LIMIT).reduce((aggr, d) => {
                //delete data.genomicProfiles;
                //delete data.genomicDataFilters;

                try {
                    let data = JSON.parse(d['@data']);

                    const url = d['@url']
                        .replace(/^"|"$/g, '')
                        .replace(/^\/\/[^\/]*/, '')
                        .replace(/\/api\//, '/api/column-store/');

                    const label = d['@url']
                        .match(/\/api\/[^\/]*/i)[0]
                        .replace(/\/api\//, '')
                        .split('-')
                        .map(s => s.replace(/^./, ss => ss.toUpperCase()))
                        .join('');

                    aggr.push({
                        hash: d['@hash'],
                        label,
                        data,
                        url,
                    });
                } catch (err) {
                    console.log(err);
                }
                return aggr;
            }, []);

            // tests.forEach((t)=>{
            //     console.log(t.data.studyIds || t.data.studyViewFilter.studyIds);
            // })

            const fakeFiles = [
                {
                    file: 'fake',
                    suites: [
                        {
                            tests,
                        },
                    ],
                },
            ];

            return fakeFiles;
        });

    runSpecs(
        files,
        axios,
        'http://localhost:8082',
        cliArgs.v ? 'verbose' : '',
        onFail,
        supressors
    );
}

main();

const onFail = (args, report) => {
    try {
        //console.log(report.clDataSorted[0]);
        //console.log(report.legacyDataSorted[0]);
    } catch (ex) {}

    //console.log(report.legacyDataSorted[0].counts);

    //console.log(JSON.stringify(args.data, null, 5));

    //console.log(args.data.studyIds || args.data.studyViewFilter.studyIds);

    const url = 'http://localhost:8082' + args.url;

    const curl = `
        curl '${url}' 
          -H 'accept: application/json, text/plain, */*' 
          -H 'accept-language: en-US,en;q=0.9' 
          -H 'cache-control: no-cache' 
          -H 'content-type: application/json' 
          -H 'cookie: _ga_ET18FDC3P1=GS1.1.1727902893.87.0.1727902893.0.0.0; _gid=GA1.2.1570078648.1728481898; _ga_CKJ2CEEFD8=GS1.1.1728589307.172.1.1728589613.0.0.0; _ga_5260NDGD6Z=GS1.1.1728612388.318.1.1728612389.0.0.0; _gat_gtag_UA_17134933_2=1; _ga=GA1.1.1260093286.1710808634; _ga_334HHWHCPJ=GS1.1.1728647421.32.1.1728647514.0.0.0' 
          -H 'pragma: no-cache' 
          -H 'priority: u=1, i'  
          -H 'sec-ch-ua: "Google Chrome";v="129", "Not=A?Brand";v="8", "Chromium";v="129"' 
          -H 'sec-ch-ua-mobile: ?0' 
          -H 'sec-ch-ua-platform: "macOS"' 
          -H 'sec-fetch-dest: empty' 
          -H 'user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36' 
          --data-raw '${JSON.stringify(args.data)}';
    `;

    cliArgs.c &&
        console.log(
            curl
                .trim()
                .split('\n')
                .join('')
        );
    //
    const studyIds = args.data.studyIds || args.data.studyViewFilter.studyIds;
    cliArgs.u &&
        console.log(
            `http://localhost:8082/study/summary?id=${studyIds.join(
                ','
            )}#filterJson=${encodeURIComponent(JSON.stringify(args.data))}`
        );
};

function parseArgs() {
    const args = process.argv.slice(2);

    const pairs = args.filter(s => /=/.test(s));

    const single = args.filter(s => !/=/.test(s));

    const obj = {};

    single.forEach(a => {
        obj[a.replace(/^-/, '')] = true;
    });

    pairs.forEach(p => {
        const tuple = p.split('=');
        obj[tuple[0].replace(/^-/, '')] = tuple[1];
    });

    return obj;
}

const supressorsPublic = [
    function(report) {
        // @ts-ignore
        return (
            report.clDataSorted[0].counts.length !==
            report.legacyDataSorted[0].counts.length
        );
    },
    function(report) {
        return report.test.data.customDataFilters;
    },
];

const supressors = [
    function(report) {
        return (
            report.clDataSorted[0].counts.find(m => m.value == 'not_mutated')
                .count ===
            report.legacyDataSorted[0].counts.find(
                m => m.value == 'not_profiled'
            ).count
        );
    },
    function(report) {
        return (
            report.test.data.studyViewFilter.clinicalDataFilters[0].values
                .length > 10
        );
    },
    function(report) {
        return report.test.data.clinicalDataFilters[0].values.length > 10;
    },
    function(report) {
        return (
            report.test.data.customDataFilters ||
            report.test.data.studyViewFilter.customDataFilters
        );
    },

    function(report) {
        return report.test.data.studyIds.includes('genie_private');
    },
];
