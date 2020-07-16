var assert = require('assert');
var expect = require('chai').expect;
var waitForOncoprint = require('../../../shared/specUtils').waitForOncoprint;
var setOncoprintMutationsMenuOpen = require('../../../shared/specUtils')
    .setOncoprintMutationsMenuOpen;
var goToUrlAndSetLocalStorage = require('../../../shared/specUtils')
    .goToUrlAndSetLocalStorage;
var waitForNetworkQuiet = require('../../../shared/specUtils')
    .waitForNetworkQuiet;
var sessionServiceIsEnabled = require('../../../shared/specUtils')
    .sessionServiceIsEnabled;
var assertScreenShotMatch = require('../../../shared/lib/testUtils')
    .assertScreenShotMatch;
var pasteToElement = require('../../../shared/specUtils').pasteToElement;
var checkOncoprintElement = require('../../../shared/specUtils')
    .checkOncoprintElement;

const TIMEOUT = 6000;

const ONCOPRINT_TIMEOUT = 60000;

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');

describe('oncoprinter screenshot tests', function() {
    it('oncoprinter genetic only example data', function() {
        goToUrlAndSetLocalStorage(`${CBIOPORTAL_URL}/oncoprinter`);
        browser.waitForExist('.oncoprinterGeneticExampleData');
        browser.click('.oncoprinterGeneticExampleData');
        browser.click('.oncoprinterSubmit');
        waitForOncoprint(TIMEOUT);

        var res = checkOncoprintElement();
        assertScreenShotMatch(res);
    });
    it('oncoprinter clinical only example data', function() {
        goToUrlAndSetLocalStorage(`${CBIOPORTAL_URL}/oncoprinter`);
        browser.waitForExist('.oncoprinterClinicalExampleData');
        browser.click('.oncoprinterClinicalExampleData');
        browser.click('.oncoprinterSubmit');
        waitForOncoprint(TIMEOUT);

        var res = checkOncoprintElement();
        assertScreenShotMatch(res);
    });
    it('oncoprinter heatmap only example data', function() {
        goToUrlAndSetLocalStorage(`${CBIOPORTAL_URL}/oncoprinter`);
        browser.waitForExist('.oncoprinterHeatmapExampleData');
        browser.click('.oncoprinterHeatmapExampleData');
        browser.click('.oncoprinterSubmit');
        waitForOncoprint(TIMEOUT);

        var res = checkOncoprintElement();
        assertScreenShotMatch(res);
    });
    it('oncoprinter example data', function() {
        goToUrlAndSetLocalStorage(`${CBIOPORTAL_URL}/oncoprinter`);
        browser.waitForExist('.oncoprinterGeneticExampleData');
        browser.waitForExist('.oncoprinterClinicalExampleData');
        browser.waitForExist('.oncoprinterHeatmapExampleData');
        browser.click('.oncoprinterGeneticExampleData');
        browser.click('.oncoprinterClinicalExampleData');
        browser.click('.oncoprinterHeatmapExampleData');
        browser.click('.oncoprinterSubmit');
        waitForOncoprint(TIMEOUT);

        var res = checkOncoprintElement();
        assertScreenShotMatch(res);
    });
    it('oncoprinter example data, annotated by oncokb', function() {
        goToUrlAndSetLocalStorage(`${CBIOPORTAL_URL}/oncoprinter`);
        browser.waitForExist('.oncoprinterGeneticExampleData');
        browser.waitForExist('.oncoprinterClinicalExampleData');
        browser.waitForExist('.oncoprinterHeatmapExampleData');
        browser.click('.oncoprinterGeneticExampleData');
        browser.click('.oncoprinterClinicalExampleData');
        browser.click('.oncoprinterHeatmapExampleData');
        browser.click('.oncoprinterSubmit');
        waitForOncoprint(TIMEOUT);

        setOncoprintMutationsMenuOpen(true);
        browser.click('input[data-test="annotateOncoKb"]');
        browser.waitUntil(() => {
            return (
                browser
                    .getText('.oncoprint-legend-div')
                    .indexOf('Inframe Mutation (putative driver)') > -1
            );
        });

        var res = checkOncoprintElement();
        assertScreenShotMatch(res);
    });
    it('oncoprinter clinical example data', function() {
        goToUrlAndSetLocalStorage(`${CBIOPORTAL_URL}/oncoprinter`);
        browser.waitForExist('.oncoprinterClinicalExampleData');
        browser.click('.oncoprinterClinicalExampleData');
        browser.click('.oncoprinterSubmit');
        waitForOncoprint(TIMEOUT);

        var res = checkOncoprintElement();
        assertScreenShotMatch(res);
    });
    it('oncoprinter example data, then set gene order, including all genes', function() {
        goToUrlAndSetLocalStorage(`${CBIOPORTAL_URL}/oncoprinter`);
        browser.waitForExist('.oncoprinterGeneticExampleData');
        browser.waitForExist('.oncoprinterClinicalExampleData');
        browser.waitForExist('.oncoprinterHeatmapExampleData');
        browser.click('.oncoprinterGeneticExampleData');
        browser.click('.oncoprinterClinicalExampleData');
        browser.click('.oncoprinterHeatmapExampleData');
        browser.click('.oncoprinterSubmit');
        waitForOncoprint(TIMEOUT);
        browser.waitForExist('.oncoprinterModifyInput', TIMEOUT);
        browser.click('.oncoprinterModifyInput');
        browser.waitForVisible('.oncoprinterGenesInput', TIMEOUT);
        browser.setValue('.oncoprinterGenesInput', 'BRCA1 PTEN TP53 BRCA2');
        browser.click('.oncoprinterSubmit');
        waitForOncoprint(TIMEOUT);

        var res = checkOncoprintElement();
        assertScreenShotMatch(res);
    });
    it('oncoprinter example data, then set gene order, not including all genes', function() {
        goToUrlAndSetLocalStorage(`${CBIOPORTAL_URL}/oncoprinter`);
        browser.waitForExist('.oncoprinterGeneticExampleData');
        browser.waitForExist('.oncoprinterClinicalExampleData');
        browser.waitForExist('.oncoprinterHeatmapExampleData');
        browser.click('.oncoprinterGeneticExampleData');
        browser.click('.oncoprinterClinicalExampleData');
        browser.click('.oncoprinterHeatmapExampleData');
        browser.click('.oncoprinterSubmit');
        waitForOncoprint(TIMEOUT);
        browser.waitForExist('.oncoprinterModifyInput', TIMEOUT);
        browser.click('.oncoprinterModifyInput');
        browser.waitForVisible('.oncoprinterGenesInput', TIMEOUT);
        browser.setValue('.oncoprinterGenesInput', 'BRCA1 PTEN');
        browser.click('.oncoprinterSubmit');
        waitForOncoprint(TIMEOUT);

        var res = checkOncoprintElement();
        assertScreenShotMatch(res);
    });
    it('oncoprinter example data, then set sample order, including all samples', function() {
        goToUrlAndSetLocalStorage(`${CBIOPORTAL_URL}/oncoprinter`);
        browser.waitForExist('.oncoprinterGeneticExampleData');
        browser.waitForExist('.oncoprinterClinicalExampleData');
        browser.waitForExist('.oncoprinterHeatmapExampleData');
        browser.click('.oncoprinterGeneticExampleData');
        browser.click('.oncoprinterClinicalExampleData');
        browser.click('.oncoprinterHeatmapExampleData');
        browser.click('.oncoprinterSubmit');
        waitForOncoprint(TIMEOUT);
        browser.waitForExist('.oncoprinterModifyInput', TIMEOUT);
        browser.click('.oncoprinterModifyInput');
        browser.waitForVisible('.oncoprinterSamplesInput', TIMEOUT);

        var sampleList =
            'TCGA-25-2392-01,TCGA-25-2393-01,TCGA-04-1331-01,TCGA-04-1365-01,TCGA-04-1648-01,TCGA-09-1666-01,TCGA-13-0720-01,TCGA-13-0801-01,TCGA-13-0905-01,TCGA-13-0924-01,TCGA-13-1405-01,TCGA-13-1408-01,TCGA-13-1488-01,TCGA-23-1023-01,TCGA-23-1032-01,TCGA-23-1107-01,TCGA-23-1114-01,TCGA-23-1118-01,TCGA-23-1121-01,TCGA-23-2084-01,TCGA-24-0968-01,TCGA-24-0970-01,TCGA-24-1103-01,TCGA-24-1474-01,TCGA-24-1567-01,TCGA-24-2030-01,TCGA-24-2036-01,TCGA-24-2262-01,TCGA-24-2297-01,TCGA-25-1322-01,TCGA-25-2391-01,TCGA-25-2401-01,TCGA-29-1697-01,TCGA-29-1702-01,TCGA-29-1761-01,TCGA-30-1860-01,TCGA-31-1951-01,TCGA-31-1959-01,TCGA-36-1570-01,TCGA-57-1586-01,TCGA-61-1728-01,TCGA-61-1895-01,TCGA-61-1907-01,TCGA-61-2012-01,TCGA-61-2094-01,TCGA-61-2097-01,TCGA-25-1625-01,TCGA-04-1357-01,TCGA-13-0893-01,TCGA-61-2109-01,TCGA-13-0761-01,TCGA-29-2427-01,TCGA-23-1122-01,TCGA-23-1027-01,TCGA-25-1632-01,TCGA-23-1026-01,TCGA-13-0804-01,TCGA-24-2298-01,TCGA-61-2008-01,TCGA-09-2045-01,TCGA-04-1356-01,TCGA-25-1630-01,TCGA-24-1470-01,TCGA-13-0730-01,TCGA-13-0883-01,TCGA-13-0903-01,TCGA-13-0887-01,TCGA-13-1494-01,TCGA-09-2051-01,TCGA-23-2078-01,TCGA-23-2079-01,TCGA-10-0931-01,TCGA-59-2348-01,TCGA-23-2077-01,TCGA-09-1669-01,TCGA-23-2081-01,TCGA-13-1489-01,TCGA-25-1318-01,TCGA-13-0793-01,TCGA-24-1463-01,TCGA-13-0913-01,TCGA-04-1367-01,TCGA-24-1562-01,TCGA-13-0885-01,TCGA-13-0890-01,TCGA-13-1512-01,TCGA-23-1030-01,TCGA-25-1634-01,TCGA-24-1555-01,TCGA-13-0886-01,TCGA-13-0792-01,TCGA-24-2293-01,TCGA-23-1120-01,TCGA-57-1584-01,TCGA-13-0900-01,TCGA-24-2280-01,TCGA-24-0975-01,TCGA-24-2288-01,TCGA-24-1417-01,TCGA-13-1498-01,TCGA-13-1499-01,TCGA-13-0726-01,TCGA-25-2404-01,TCGA-13-1481-01,TCGA-10-0930-01,TCGA-13-1492-01,TCGA-13-1505-01,TCGA-04-1336-01,TCGA-24-2261-01,TCGA-13-0912-01,TCGA-36-1580-01,TCGA-59-2352-01,TCGA-25-2409-01,TCGA-61-1919-01,TCGA-13-0919-01,TCGA-09-2050-01,TCGA-25-1626-01,TCGA-09-2049-01,TCGA-24-1422-01,TCGA-24-1416-01,TCGA-24-1564-01,TCGA-61-2088-01,TCGA-10-0934-01,TCGA-61-2003-01,TCGA-13-0714-01,TCGA-13-1510-01,TCGA-36-1576-01,TCGA-25-1329-01,TCGA-04-1337-01,TCGA-24-1428-01,TCGA-04-1332-01,TCGA-04-1349-01,TCGA-13-0791-01,TCGA-24-2019-01,TCGA-24-1425-01,TCGA-24-1423-01,TCGA-10-0926-01,TCGA-13-0760-01,TCGA-24-1556-01,TCGA-24-1558-01,TCGA-24-1616-01,TCGA-24-1604-01,TCGA-09-1659-01,TCGA-24-1413-01,TCGA-09-1662-01,TCGA-13-0724-01,TCGA-13-1484-01,TCGA-24-2254-01,TCGA-61-2101-01,TCGA-09-0366-01,TCGA-09-2053-01,TCGA-24-2024-01,TCGA-57-1993-01,TCGA-13-0751-01,TCGA-10-0928-01,TCGA-04-1525-01,TCGA-23-1022-01,TCGA-30-1862-01,TCGA-13-0765-01,TCGA-31-1953-01,TCGA-04-1514-01,TCGA-13-1509-01,TCGA-24-1419-01,TCGA-25-1321-01,TCGA-20-0987-01,TCGA-23-1024-01,TCGA-24-2290-01,TCGA-23-1124-01,TCGA-61-1736-01,TCGA-13-0800-01,TCGA-24-1434-01,TCGA-04-1517-01,TCGA-09-1661-01,TCGA-61-1995-01,TCGA-24-1614-01,TCGA-36-1569-01,TCGA-24-2271-01,TCGA-23-1123-01,TCGA-13-1507-01,TCGA-13-0899-01,TCGA-23-1110-01,TCGA-25-1319-01,TCGA-24-1548-01,TCGA-13-0910-01,TCGA-04-1346-01,TCGA-04-1350-01,TCGA-25-1326-01,TCGA-24-1549-01,TCGA-13-0891-01,TCGA-13-1411-01,TCGA-24-2260-01,TCGA-04-1342-01,TCGA-13-0723-01,TCGA-24-2289-01,TCGA-59-2354-01,TCGA-59-2350-01,TCGA-59-2363-01,TCGA-13-0762-01,TCGA-59-2351-01,TCGA-25-2398-01,TCGA-25-1315-01,TCGA-13-1497-01,TCGA-30-1853-01,TCGA-57-1582-01,TCGA-24-0966-01,TCGA-24-1557-01,TCGA-59-2355-01,TCGA-10-0927-01,TCGA-09-2044-01,TCGA-13-0906-01,TCGA-25-1627-01,TCGA-13-1482-01,TCGA-24-2281-01,TCGA-13-0889-01,TCGA-61-2016-01,TCGA-04-1362-01,TCGA-13-0717-01,TCGA-61-2104-01,TCGA-10-0938-01,TCGA-24-2035-01,TCGA-24-1105-01,TCGA-24-0979-01,TCGA-04-1361-01,TCGA-25-1628-01,TCGA-13-1491-01,TCGA-25-1635-01,TCGA-13-1506-01,TCGA-24-1560-01,TCGA-13-1410-01,TCGA-24-1464-01,TCGA-10-0935-01,TCGA-36-1568-01,TCGA-23-2072-01,TCGA-13-1487-01,TCGA-24-1426-01,TCGA-13-0920-01,TCGA-25-1320-01,TCGA-23-1021-01,TCGA-04-1348-01,TCGA-04-1338-01,TCGA-23-1117-01,TCGA-36-1578-01,TCGA-36-1575-01,TCGA-36-1574-01,TCGA-25-2399-01,TCGA-30-1891-01,TCGA-36-1577-01,TCGA-24-1466-01,TCGA-61-2092-01,TCGA-04-1347-01,TCGA-20-0990-01,TCGA-24-1104-01,TCGA-24-1418-01,TCGA-57-1583-01,TCGA-13-0795-01,TCGA-13-1496-01,TCGA-25-1623-01,TCGA-24-1551-01,TCGA-24-1431-01,TCGA-13-2060-01,TCGA-25-1631-01,TCGA-13-1495-01,TCGA-24-1603-01,TCGA-04-1530-01,TCGA-04-1542-01,TCGA-24-1471-01,TCGA-61-2102-01,TCGA-24-1469-01,TCGA-13-1407-01,TCGA-23-1028-01,TCGA-13-0894-01,TCGA-13-1409-01,TCGA-24-0982-01,TCGA-61-2000-01,TCGA-61-2110-01,TCGA-31-1950-01,TCGA-24-1424-01,TCGA-24-1427-01,TCGA-61-1998-01,TCGA-13-0904-01,TCGA-13-0923-01,TCGA-24-1563-01,TCGA-13-1504-01,TCGA-25-1324-01,TCGA-13-0897-01,TCGA-10-0937-01,TCGA-04-1364-01,TCGA-20-0991-01,TCGA-24-2267-01,TCGA-13-1404-01,TCGA-13-0911-01,TCGA-25-1313-01,TCGA-36-1571-01,TCGA-13-0884-01,TCGA-13-1412-01,TCGA-24-1545-01,TCGA-24-1436-01,TCGA-25-2400-01,TCGA-13-1403-01,TCGA-23-1116-01,TCGA-10-0925-01,TCGA-10-0933-01,TCGA-20-1684-01,TCGA-20-1685-01,TCGA-20-1686-01,TCGA-20-1687-01,TCGA-23-1029-01,TCGA-23-1031-01,TCGA-23-1109-01,TCGA-23-1111-01,TCGA-23-1113-01,TCGA-23-1119-01,TCGA-23-1809-01,TCGA-23-2641-01,TCGA-23-2643-01,TCGA-23-2645-01,TCGA-23-2647-01,TCGA-23-2649-01,TCGA-24-0980-01,TCGA-24-0981-01,TCGA-24-1430-01,TCGA-24-1435-01,TCGA-24-1467-01,TCGA-24-1544-01,TCGA-24-1546-01,TCGA-24-1550-01,TCGA-24-1552-01,TCGA-24-1553-01,TCGA-24-1565-01,TCGA-24-1842-01,TCGA-24-1843-01,TCGA-24-1844-01,TCGA-24-1845-01,TCGA-24-1846-01,TCGA-24-1847-01,TCGA-24-1849-01,TCGA-24-1850-01,TCGA-24-1852-01,TCGA-24-1920-01,TCGA-24-1923-01,TCGA-24-1924-01,TCGA-24-1927-01,TCGA-24-1928-01,TCGA-24-1930-01,TCGA-24-2020-01,TCGA-24-2023-01,TCGA-24-2026-01,TCGA-24-2027-01,TCGA-24-2029-01,TCGA-24-2033-01,TCGA-24-2038-01,TCGA-24-2295-01,TCGA-25-1312-01,TCGA-25-1314-01,TCGA-25-1316-01,TCGA-25-1317-01,TCGA-25-1323-01,TCGA-25-1325-01,TCGA-25-1328-01,TCGA-25-1633-01,TCGA-25-1870-01,TCGA-25-1871-01,TCGA-25-1877-01,TCGA-25-1878-01,TCGA-25-2042-01,TCGA-25-2390-01,TCGA-25-2396-01,TCGA-25-2397-01';

        pasteToElement('.oncoprinterSamplesInput', sampleList);

        browser.click('.oncoprinterSubmit');
        waitForOncoprint(TIMEOUT);

        var res = checkOncoprintElement();
        assertScreenShotMatch(res);
    });

    it('msk_impact_2017 query STK11:HOMDEL MUT', () => {
        goToUrlAndSetLocalStorage(
            `${CBIOPORTAL_URL}/index.do?cancer_study_id=msk_impact_2017&Z_SCORE_THRESHOLD=2&RPPA_SCORE_THRESHOLD=2&data_priority=0&case_set_id=msk_impact_2017_Non-Small_Cell_Lung_Cancer&gene_list=STK11%253A%2520HOMDEL%2520MUT&geneset_list=+&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=msk_impact_2017_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=msk_impact_2017_cna`
        );
        waitForOncoprint(ONCOPRINT_TIMEOUT);
        var res = browser.checkElement('.oncoprintContainer');
        assertScreenShotMatch(res);
    });

    it('oncoprinter example data, then set sample order, not including all samples', function() {
        goToUrlAndSetLocalStorage(`${CBIOPORTAL_URL}/oncoprinter`);
        browser.waitForExist('.oncoprinterGeneticExampleData');
        browser.waitForExist('.oncoprinterClinicalExampleData');
        browser.waitForExist('.oncoprinterHeatmapExampleData');
        browser.click('.oncoprinterGeneticExampleData');
        browser.click('.oncoprinterClinicalExampleData');
        browser.click('.oncoprinterHeatmapExampleData');
        browser.click('.oncoprinterSubmit');
        waitForOncoprint(TIMEOUT);
        browser.waitForExist('.oncoprinterModifyInput', TIMEOUT);
        browser.click('.oncoprinterModifyInput');
        browser.waitForVisible('.oncoprinterSamplesInput', TIMEOUT);
        browser.setValue(
            '.oncoprinterSamplesInput',
            'TCGA-25-2393-01,TCGA-13-0730-01,TCGA-13-0761-01'
        );
        browser.click('.oncoprinterSubmit');
        waitForOncoprint(TIMEOUT);

        var res = checkOncoprintElement();
        assertScreenShotMatch(res);
    });
    it('oncoprinter example data, start by set gene order, then set sample order', function() {
        goToUrlAndSetLocalStorage(`${CBIOPORTAL_URL}/oncoprinter`);
        browser.waitForExist('.oncoprinterGeneticExampleData');
        browser.waitForExist('.oncoprinterClinicalExampleData');
        browser.waitForExist('.oncoprinterHeatmapExampleData');
        browser.click('.oncoprinterGeneticExampleData');
        browser.click('.oncoprinterClinicalExampleData');
        browser.click('.oncoprinterHeatmapExampleData');
        browser.setValue('.oncoprinterGenesInput', 'BRCA1 PTEN TP53 BRCA2');
        browser.click('.oncoprinterSubmit');
        waitForOncoprint(TIMEOUT);
        browser.waitForExist('.oncoprinterModifyInput', TIMEOUT);
        browser.click('.oncoprinterModifyInput');
        browser.waitForVisible('.oncoprinterSamplesInput', TIMEOUT);
        pasteToElement(
            '.oncoprinterSamplesInput',
            'TCGA-25-2392-01,TCGA-25-2393-01,TCGA-04-1331-01,TCGA-04-1365-01,TCGA-04-1648-01,TCGA-09-1666-01,TCGA-13-0720-01,TCGA-13-0801-01,TCGA-13-0905-01,TCGA-13-0924-01,TCGA-13-1405-01,TCGA-13-1408-01,TCGA-13-1488-01,TCGA-23-1023-01,TCGA-23-1032-01,TCGA-23-1107-01,TCGA-23-1114-01,TCGA-23-1118-01,TCGA-23-1121-01,TCGA-23-2084-01,TCGA-24-0968-01,TCGA-24-0970-01,TCGA-24-1103-01,TCGA-24-1474-01,TCGA-24-1567-01,TCGA-24-2030-01,TCGA-24-2036-01,TCGA-24-2262-01,TCGA-24-2297-01,TCGA-25-1322-01,TCGA-25-2391-01,TCGA-25-2401-01,TCGA-29-1697-01,TCGA-29-1702-01,TCGA-29-1761-01,TCGA-30-1860-01,TCGA-31-1951-01,TCGA-31-1959-01,TCGA-36-1570-01,TCGA-57-1586-01,TCGA-61-1728-01,TCGA-61-1895-01,TCGA-61-1907-01,TCGA-61-2012-01,TCGA-61-2094-01,TCGA-61-2097-01,TCGA-25-1625-01,TCGA-04-1357-01,TCGA-13-0893-01,TCGA-61-2109-01,TCGA-13-0761-01,TCGA-29-2427-01,TCGA-23-1122-01,TCGA-23-1027-01,TCGA-25-1632-01,TCGA-23-1026-01,TCGA-13-0804-01,TCGA-24-2298-01,TCGA-61-2008-01,TCGA-09-2045-01,TCGA-04-1356-01,TCGA-25-1630-01,TCGA-24-1470-01,TCGA-13-0730-01,TCGA-13-0883-01,TCGA-13-0903-01,TCGA-13-0887-01,TCGA-13-1494-01,TCGA-09-2051-01,TCGA-23-2078-01,TCGA-23-2079-01,TCGA-10-0931-01,TCGA-59-2348-01,TCGA-23-2077-01,TCGA-09-1669-01,TCGA-23-2081-01,TCGA-13-1489-01,TCGA-25-1318-01,TCGA-13-0793-01,TCGA-24-1463-01,TCGA-13-0913-01,TCGA-04-1367-01,TCGA-24-1562-01,TCGA-13-0885-01,TCGA-13-0890-01,TCGA-13-1512-01,TCGA-23-1030-01,TCGA-25-1634-01,TCGA-24-1555-01,TCGA-13-0886-01,TCGA-13-0792-01,TCGA-24-2293-01,TCGA-23-1120-01,TCGA-57-1584-01,TCGA-13-0900-01,TCGA-24-2280-01,TCGA-24-0975-01,TCGA-24-2288-01,TCGA-24-1417-01,TCGA-13-1498-01,TCGA-13-1499-01,TCGA-13-0726-01,TCGA-25-2404-01,TCGA-13-1481-01,TCGA-10-0930-01,TCGA-13-1492-01,TCGA-13-1505-01,TCGA-04-1336-01,TCGA-24-2261-01,TCGA-13-0912-01,TCGA-36-1580-01,TCGA-59-2352-01,TCGA-25-2409-01,TCGA-61-1919-01,TCGA-13-0919-01,TCGA-09-2050-01,TCGA-25-1626-01,TCGA-09-2049-01,TCGA-24-1422-01,TCGA-24-1416-01,TCGA-24-1564-01,TCGA-61-2088-01,TCGA-10-0934-01,TCGA-61-2003-01,TCGA-13-0714-01,TCGA-13-1510-01,TCGA-36-1576-01,TCGA-25-1329-01,TCGA-04-1337-01,TCGA-24-1428-01,TCGA-04-1332-01,TCGA-04-1349-01,TCGA-13-0791-01,TCGA-24-2019-01,TCGA-24-1425-01,TCGA-24-1423-01,TCGA-10-0926-01,TCGA-13-0760-01,TCGA-24-1556-01,TCGA-24-1558-01,TCGA-24-1616-01,TCGA-24-1604-01,TCGA-09-1659-01,TCGA-24-1413-01,TCGA-09-1662-01,TCGA-13-0724-01,TCGA-13-1484-01,TCGA-24-2254-01,TCGA-61-2101-01,TCGA-09-0366-01,TCGA-09-2053-01,TCGA-24-2024-01,TCGA-57-1993-01,TCGA-13-0751-01,TCGA-10-0928-01,TCGA-04-1525-01,TCGA-23-1022-01,TCGA-30-1862-01,TCGA-13-0765-01,TCGA-31-1953-01,TCGA-04-1514-01,TCGA-13-1509-01,TCGA-24-1419-01,TCGA-25-1321-01,TCGA-20-0987-01,TCGA-23-1024-01,TCGA-24-2290-01,TCGA-23-1124-01,TCGA-61-1736-01,TCGA-13-0800-01,TCGA-24-1434-01,TCGA-04-1517-01,TCGA-09-1661-01,TCGA-61-1995-01,TCGA-24-1614-01,TCGA-36-1569-01,TCGA-24-2271-01,TCGA-23-1123-01,TCGA-13-1507-01,TCGA-13-0899-01,TCGA-23-1110-01,TCGA-25-1319-01,TCGA-24-1548-01,TCGA-13-0910-01,TCGA-04-1346-01,TCGA-04-1350-01,TCGA-25-1326-01,TCGA-24-1549-01,TCGA-13-0891-01,TCGA-13-1411-01,TCGA-24-2260-01,TCGA-04-1342-01,TCGA-13-0723-01,TCGA-24-2289-01,TCGA-59-2354-01,TCGA-59-2350-01,TCGA-59-2363-01,TCGA-13-0762-01,TCGA-59-2351-01,TCGA-25-2398-01,TCGA-25-1315-01,TCGA-13-1497-01,TCGA-30-1853-01,TCGA-57-1582-01,TCGA-24-0966-01,TCGA-24-1557-01,TCGA-59-2355-01,TCGA-10-0927-01,TCGA-09-2044-01,TCGA-13-0906-01,TCGA-25-1627-01,TCGA-13-1482-01,TCGA-24-2281-01,TCGA-13-0889-01,TCGA-61-2016-01,TCGA-04-1362-01,TCGA-13-0717-01,TCGA-61-2104-01,TCGA-10-0938-01,TCGA-24-2035-01,TCGA-24-1105-01,TCGA-24-0979-01,TCGA-04-1361-01,TCGA-25-1628-01,TCGA-13-1491-01,TCGA-25-1635-01,TCGA-13-1506-01,TCGA-24-1560-01,TCGA-13-1410-01,TCGA-24-1464-01,TCGA-10-0935-01,TCGA-36-1568-01,TCGA-23-2072-01,TCGA-13-1487-01,TCGA-24-1426-01,TCGA-13-0920-01,TCGA-25-1320-01,TCGA-23-1021-01,TCGA-04-1348-01,TCGA-04-1338-01,TCGA-23-1117-01,TCGA-36-1578-01,TCGA-36-1575-01,TCGA-36-1574-01,TCGA-25-2399-01,TCGA-30-1891-01,TCGA-36-1577-01,TCGA-24-1466-01,TCGA-61-2092-01,TCGA-04-1347-01,TCGA-20-0990-01,TCGA-24-1104-01,TCGA-24-1418-01,TCGA-57-1583-01,TCGA-13-0795-01,TCGA-13-1496-01,TCGA-25-1623-01,TCGA-24-1551-01,TCGA-24-1431-01,TCGA-13-2060-01,TCGA-25-1631-01,TCGA-13-1495-01,TCGA-24-1603-01,TCGA-04-1530-01,TCGA-04-1542-01,TCGA-24-1471-01,TCGA-61-2102-01,TCGA-24-1469-01,TCGA-13-1407-01,TCGA-23-1028-01,TCGA-13-0894-01,TCGA-13-1409-01,TCGA-24-0982-01,TCGA-61-2000-01,TCGA-61-2110-01,TCGA-31-1950-01,TCGA-24-1424-01,TCGA-24-1427-01,TCGA-61-1998-01,TCGA-13-0904-01,TCGA-13-0923-01,TCGA-24-1563-01,TCGA-13-1504-01,TCGA-25-1324-01,TCGA-13-0897-01,TCGA-10-0937-01,TCGA-04-1364-01,TCGA-20-0991-01,TCGA-24-2267-01,TCGA-13-1404-01,TCGA-13-0911-01,TCGA-25-1313-01,TCGA-36-1571-01,TCGA-13-0884-01,TCGA-13-1412-01,TCGA-24-1545-01,TCGA-24-1436-01,TCGA-25-2400-01,TCGA-13-1403-01,TCGA-23-1116-01,TCGA-10-0925-01,TCGA-10-0933-01,TCGA-20-1684-01,TCGA-20-1685-01,TCGA-20-1686-01,TCGA-20-1687-01,TCGA-23-1029-01,TCGA-23-1031-01,TCGA-23-1109-01,TCGA-23-1111-01,TCGA-23-1113-01,TCGA-23-1119-01,TCGA-23-1809-01,TCGA-23-2641-01,TCGA-23-2643-01,TCGA-23-2645-01,TCGA-23-2647-01,TCGA-23-2649-01,TCGA-24-0980-01,TCGA-24-0981-01,TCGA-24-1430-01,TCGA-24-1435-01,TCGA-24-1467-01,TCGA-24-1544-01,TCGA-24-1546-01,TCGA-24-1550-01,TCGA-24-1552-01,TCGA-24-1553-01,TCGA-24-1565-01,TCGA-24-1842-01,TCGA-24-1843-01,TCGA-24-1844-01,TCGA-24-1845-01,TCGA-24-1846-01,TCGA-24-1847-01,TCGA-24-1849-01,TCGA-24-1850-01,TCGA-24-1852-01,TCGA-24-1920-01,TCGA-24-1923-01,TCGA-24-1924-01,TCGA-24-1927-01,TCGA-24-1928-01,TCGA-24-1930-01,TCGA-24-2020-01,TCGA-24-2023-01,TCGA-24-2026-01,TCGA-24-2027-01,TCGA-24-2029-01,TCGA-24-2033-01,TCGA-24-2038-01,TCGA-24-2295-01,TCGA-25-1312-01,TCGA-25-1314-01,TCGA-25-1316-01,TCGA-25-1317-01,TCGA-25-1323-01,TCGA-25-1325-01,TCGA-25-1328-01,TCGA-25-1633-01,TCGA-25-1870-01,TCGA-25-1871-01,TCGA-25-1877-01,TCGA-25-1878-01,TCGA-25-2042-01,TCGA-25-2390-01,TCGA-25-2396-01,TCGA-25-2397-01'
        );
        browser.click('.oncoprinterSubmit');
        waitForOncoprint(TIMEOUT);

        var res = checkOncoprintElement();
        assertScreenShotMatch(res);
    });
    it('oncoprinter example data, start by set sample order, then set gene order', function() {
        goToUrlAndSetLocalStorage(`${CBIOPORTAL_URL}/oncoprinter`);
        browser.waitForExist('.oncoprinterGeneticExampleData');
        browser.waitForExist('.oncoprinterClinicalExampleData');
        browser.waitForExist('.oncoprinterHeatmapExampleData');
        browser.click('.oncoprinterGeneticExampleData');
        browser.click('.oncoprinterClinicalExampleData');
        browser.click('.oncoprinterHeatmapExampleData');
        pasteToElement(
            '.oncoprinterSamplesInput',
            'TCGA-25-2392-01,TCGA-25-2393-01,TCGA-04-1331-01,TCGA-04-1365-01,TCGA-04-1648-01,TCGA-09-1666-01,TCGA-13-0720-01,TCGA-13-0801-01,TCGA-13-0905-01,TCGA-13-0924-01,TCGA-13-1405-01,TCGA-13-1408-01,TCGA-13-1488-01,TCGA-23-1023-01,TCGA-23-1032-01,TCGA-23-1107-01,TCGA-23-1114-01,TCGA-23-1118-01,TCGA-23-1121-01,TCGA-23-2084-01,TCGA-24-0968-01,TCGA-24-0970-01,TCGA-24-1103-01,TCGA-24-1474-01,TCGA-24-1567-01,TCGA-24-2030-01,TCGA-24-2036-01,TCGA-24-2262-01,TCGA-24-2297-01,TCGA-25-1322-01,TCGA-25-2391-01,TCGA-25-2401-01,TCGA-29-1697-01,TCGA-29-1702-01,TCGA-29-1761-01,TCGA-30-1860-01,TCGA-31-1951-01,TCGA-31-1959-01,TCGA-36-1570-01,TCGA-57-1586-01,TCGA-61-1728-01,TCGA-61-1895-01,TCGA-61-1907-01,TCGA-61-2012-01,TCGA-61-2094-01,TCGA-61-2097-01,TCGA-25-1625-01,TCGA-04-1357-01,TCGA-13-0893-01,TCGA-61-2109-01,TCGA-13-0761-01,TCGA-29-2427-01,TCGA-23-1122-01,TCGA-23-1027-01,TCGA-25-1632-01,TCGA-23-1026-01,TCGA-13-0804-01,TCGA-24-2298-01,TCGA-61-2008-01,TCGA-09-2045-01,TCGA-04-1356-01,TCGA-25-1630-01,TCGA-24-1470-01,TCGA-13-0730-01,TCGA-13-0883-01,TCGA-13-0903-01,TCGA-13-0887-01,TCGA-13-1494-01,TCGA-09-2051-01,TCGA-23-2078-01,TCGA-23-2079-01,TCGA-10-0931-01,TCGA-59-2348-01,TCGA-23-2077-01,TCGA-09-1669-01,TCGA-23-2081-01,TCGA-13-1489-01,TCGA-25-1318-01,TCGA-13-0793-01,TCGA-24-1463-01,TCGA-13-0913-01,TCGA-04-1367-01,TCGA-24-1562-01,TCGA-13-0885-01,TCGA-13-0890-01,TCGA-13-1512-01,TCGA-23-1030-01,TCGA-25-1634-01,TCGA-24-1555-01,TCGA-13-0886-01,TCGA-13-0792-01,TCGA-24-2293-01,TCGA-23-1120-01,TCGA-57-1584-01,TCGA-13-0900-01,TCGA-24-2280-01,TCGA-24-0975-01,TCGA-24-2288-01,TCGA-24-1417-01,TCGA-13-1498-01,TCGA-13-1499-01,TCGA-13-0726-01,TCGA-25-2404-01,TCGA-13-1481-01,TCGA-10-0930-01,TCGA-13-1492-01,TCGA-13-1505-01,TCGA-04-1336-01,TCGA-24-2261-01,TCGA-13-0912-01,TCGA-36-1580-01,TCGA-59-2352-01,TCGA-25-2409-01,TCGA-61-1919-01,TCGA-13-0919-01,TCGA-09-2050-01,TCGA-25-1626-01,TCGA-09-2049-01,TCGA-24-1422-01,TCGA-24-1416-01,TCGA-24-1564-01,TCGA-61-2088-01,TCGA-10-0934-01,TCGA-61-2003-01,TCGA-13-0714-01,TCGA-13-1510-01,TCGA-36-1576-01,TCGA-25-1329-01,TCGA-04-1337-01,TCGA-24-1428-01,TCGA-04-1332-01,TCGA-04-1349-01,TCGA-13-0791-01,TCGA-24-2019-01,TCGA-24-1425-01,TCGA-24-1423-01,TCGA-10-0926-01,TCGA-13-0760-01,TCGA-24-1556-01,TCGA-24-1558-01,TCGA-24-1616-01,TCGA-24-1604-01,TCGA-09-1659-01,TCGA-24-1413-01,TCGA-09-1662-01,TCGA-13-0724-01,TCGA-13-1484-01,TCGA-24-2254-01,TCGA-61-2101-01,TCGA-09-0366-01,TCGA-09-2053-01,TCGA-24-2024-01,TCGA-57-1993-01,TCGA-13-0751-01,TCGA-10-0928-01,TCGA-04-1525-01,TCGA-23-1022-01,TCGA-30-1862-01,TCGA-13-0765-01,TCGA-31-1953-01,TCGA-04-1514-01,TCGA-13-1509-01,TCGA-24-1419-01,TCGA-25-1321-01,TCGA-20-0987-01,TCGA-23-1024-01,TCGA-24-2290-01,TCGA-23-1124-01,TCGA-61-1736-01,TCGA-13-0800-01,TCGA-24-1434-01,TCGA-04-1517-01,TCGA-09-1661-01,TCGA-61-1995-01,TCGA-24-1614-01,TCGA-36-1569-01,TCGA-24-2271-01,TCGA-23-1123-01,TCGA-13-1507-01,TCGA-13-0899-01,TCGA-23-1110-01,TCGA-25-1319-01,TCGA-24-1548-01,TCGA-13-0910-01,TCGA-04-1346-01,TCGA-04-1350-01,TCGA-25-1326-01,TCGA-24-1549-01,TCGA-13-0891-01,TCGA-13-1411-01,TCGA-24-2260-01,TCGA-04-1342-01,TCGA-13-0723-01,TCGA-24-2289-01,TCGA-59-2354-01,TCGA-59-2350-01,TCGA-59-2363-01,TCGA-13-0762-01,TCGA-59-2351-01,TCGA-25-2398-01,TCGA-25-1315-01,TCGA-13-1497-01,TCGA-30-1853-01,TCGA-57-1582-01,TCGA-24-0966-01,TCGA-24-1557-01,TCGA-59-2355-01,TCGA-10-0927-01,TCGA-09-2044-01,TCGA-13-0906-01,TCGA-25-1627-01,TCGA-13-1482-01,TCGA-24-2281-01,TCGA-13-0889-01,TCGA-61-2016-01,TCGA-04-1362-01,TCGA-13-0717-01,TCGA-61-2104-01,TCGA-10-0938-01,TCGA-24-2035-01,TCGA-24-1105-01,TCGA-24-0979-01,TCGA-04-1361-01,TCGA-25-1628-01,TCGA-13-1491-01,TCGA-25-1635-01,TCGA-13-1506-01,TCGA-24-1560-01,TCGA-13-1410-01,TCGA-24-1464-01,TCGA-10-0935-01,TCGA-36-1568-01,TCGA-23-2072-01,TCGA-13-1487-01,TCGA-24-1426-01,TCGA-13-0920-01,TCGA-25-1320-01,TCGA-23-1021-01,TCGA-04-1348-01,TCGA-04-1338-01,TCGA-23-1117-01,TCGA-36-1578-01,TCGA-36-1575-01,TCGA-36-1574-01,TCGA-25-2399-01,TCGA-30-1891-01,TCGA-36-1577-01,TCGA-24-1466-01,TCGA-61-2092-01,TCGA-04-1347-01,TCGA-20-0990-01,TCGA-24-1104-01,TCGA-24-1418-01,TCGA-57-1583-01,TCGA-13-0795-01,TCGA-13-1496-01,TCGA-25-1623-01,TCGA-24-1551-01,TCGA-24-1431-01,TCGA-13-2060-01,TCGA-25-1631-01,TCGA-13-1495-01,TCGA-24-1603-01,TCGA-04-1530-01,TCGA-04-1542-01,TCGA-24-1471-01,TCGA-61-2102-01,TCGA-24-1469-01,TCGA-13-1407-01,TCGA-23-1028-01,TCGA-13-0894-01,TCGA-13-1409-01,TCGA-24-0982-01,TCGA-61-2000-01,TCGA-61-2110-01,TCGA-31-1950-01,TCGA-24-1424-01,TCGA-24-1427-01,TCGA-61-1998-01,TCGA-13-0904-01,TCGA-13-0923-01,TCGA-24-1563-01,TCGA-13-1504-01,TCGA-25-1324-01,TCGA-13-0897-01,TCGA-10-0937-01,TCGA-04-1364-01,TCGA-20-0991-01,TCGA-24-2267-01,TCGA-13-1404-01,TCGA-13-0911-01,TCGA-25-1313-01,TCGA-36-1571-01,TCGA-13-0884-01,TCGA-13-1412-01,TCGA-24-1545-01,TCGA-24-1436-01,TCGA-25-2400-01,TCGA-13-1403-01,TCGA-23-1116-01,TCGA-10-0925-01,TCGA-10-0933-01,TCGA-20-1684-01,TCGA-20-1685-01,TCGA-20-1686-01,TCGA-20-1687-01,TCGA-23-1029-01,TCGA-23-1031-01,TCGA-23-1109-01,TCGA-23-1111-01,TCGA-23-1113-01,TCGA-23-1119-01,TCGA-23-1809-01,TCGA-23-2641-01,TCGA-23-2643-01,TCGA-23-2645-01,TCGA-23-2647-01,TCGA-23-2649-01,TCGA-24-0980-01,TCGA-24-0981-01,TCGA-24-1430-01,TCGA-24-1435-01,TCGA-24-1467-01,TCGA-24-1544-01,TCGA-24-1546-01,TCGA-24-1550-01,TCGA-24-1552-01,TCGA-24-1553-01,TCGA-24-1565-01,TCGA-24-1842-01,TCGA-24-1843-01,TCGA-24-1844-01,TCGA-24-1845-01,TCGA-24-1846-01,TCGA-24-1847-01,TCGA-24-1849-01,TCGA-24-1850-01,TCGA-24-1852-01,TCGA-24-1920-01,TCGA-24-1923-01,TCGA-24-1924-01,TCGA-24-1927-01,TCGA-24-1928-01,TCGA-24-1930-01,TCGA-24-2020-01,TCGA-24-2023-01,TCGA-24-2026-01,TCGA-24-2027-01,TCGA-24-2029-01,TCGA-24-2033-01,TCGA-24-2038-01,TCGA-24-2295-01,TCGA-25-1312-01,TCGA-25-1314-01,TCGA-25-1316-01,TCGA-25-1317-01,TCGA-25-1323-01,TCGA-25-1325-01,TCGA-25-1328-01,TCGA-25-1633-01,TCGA-25-1870-01,TCGA-25-1871-01,TCGA-25-1877-01,TCGA-25-1878-01,TCGA-25-2042-01,TCGA-25-2390-01,TCGA-25-2396-01,TCGA-25-2397-01'
        );

        browser.click('.oncoprinterSubmit');
        waitForOncoprint(TIMEOUT);
        browser.waitForExist('.oncoprinterModifyInput', TIMEOUT);
        browser.click('.oncoprinterModifyInput');
        browser.waitForVisible('.oncoprinterGenesInput', TIMEOUT);
        browser.setValue('.oncoprinterGenesInput', 'BRCA2 TP53 PTEN');
        browser.click('.oncoprinterSubmit');
        waitForOncoprint(TIMEOUT);

        var res = checkOncoprintElement();
        assertScreenShotMatch(res);
    });
    it('oncoprinter example data, dont color by mutation type', function() {
        goToUrlAndSetLocalStorage(`${CBIOPORTAL_URL}/oncoprinter`);
        browser.waitForExist('.oncoprinterGeneticExampleData');
        browser.waitForExist('.oncoprinterClinicalExampleData');
        browser.waitForExist('.oncoprinterHeatmapExampleData');
        browser.click('.oncoprinterGeneticExampleData');
        browser.click('.oncoprinterClinicalExampleData');
        browser.click('.oncoprinterHeatmapExampleData');
        browser.click('.oncoprinterSubmit');
        waitForOncoprint(TIMEOUT);
        setOncoprintMutationsMenuOpen(true);
        browser.click('input[data-test="ColorByType"]');
        waitForOncoprint(TIMEOUT);
        setOncoprintMutationsMenuOpen(false); // get it out of the way for screenshot

        var res = checkOncoprintElement();
        assertScreenShotMatch(res);
    });
    it('oncoprinter example data, dont color by driver vs VUS', function() {
        goToUrlAndSetLocalStorage(`${CBIOPORTAL_URL}/oncoprinter`);
        browser.waitForExist('.oncoprinterGeneticExampleData');
        browser.waitForExist('.oncoprinterClinicalExampleData');
        browser.waitForExist('.oncoprinterHeatmapExampleData');
        browser.click('.oncoprinterGeneticExampleData');
        browser.click('.oncoprinterClinicalExampleData');
        browser.click('.oncoprinterHeatmapExampleData');
        browser.click('.oncoprinterSubmit');
        waitForOncoprint(TIMEOUT);
        setOncoprintMutationsMenuOpen(true);
        browser.click('input[data-test="ColorByDriver"]');
        waitForOncoprint(TIMEOUT);
        setOncoprintMutationsMenuOpen(false); // get it out of the way for screenshot

        var res = checkOncoprintElement();
        assertScreenShotMatch(res);
    });
    it('oncoprinter example data, hide VUS', function() {
        goToUrlAndSetLocalStorage(`${CBIOPORTAL_URL}/oncoprinter`);
        browser.waitForExist('.oncoprinterGeneticExampleData');
        browser.waitForExist('.oncoprinterClinicalExampleData');
        browser.waitForExist('.oncoprinterHeatmapExampleData');
        browser.click('.oncoprinterGeneticExampleData');
        browser.click('.oncoprinterClinicalExampleData');
        browser.click('.oncoprinterHeatmapExampleData');
        browser.click('.oncoprinterSubmit');
        waitForOncoprint(TIMEOUT);
        setOncoprintMutationsMenuOpen(true);
        browser.click('input[data-test="HideVUS"]');
        waitForOncoprint(TIMEOUT);
        setOncoprintMutationsMenuOpen(false); // get it out of the way for screenshot

        var res = checkOncoprintElement();
        assertScreenShotMatch(res);
    });
});
