import { Study } from 'shared/api/ClinicalTrialsGovStudyStrucutre';
import { ageAsNumber, getGenderString } from './AgeSexConverter';
import { ClinicalTrialsPNorm } from './PNorm/ClinicalTrialsPNorm';
import {
    Location,
    LocationList,
} from 'shared/api/ClinicalTrialsGovStudyStrucutre';
import {
    cityHasRecord,
    getDistanceBetweenCities,
} from './location/CoordinateList';

export class StudyListEntry {
    private numberFound: number;
    private keywordsFound: string[];
    private study: Study;
    private score: number;
    private minimumAge: number;
    private maximumAge: number;
    private sex: string;
    private explanations: string[];
    private distance: number;

    constructor(study: Study, keyword: string) {
        this.numberFound = 1;
        this.keywordsFound = [keyword];
        this.study = study;
        this.score = 0;
        this.distance = -1;

        try {
            var minimumAgeString =
                study.ProtocolSection.EligibilityModule.MinimumAge;
            this.minimumAge = ageAsNumber(minimumAgeString);
        } catch (e) {
            this.minimumAge = -1;
        }

        try {
            var maximumAgeString =
                study.ProtocolSection.EligibilityModule.MaximumAge;
            this.maximumAge = ageAsNumber(maximumAgeString);
        } catch (e) {
            this.maximumAge = -1;
        }

        try {
            this.sex = getGenderString(
                study.ProtocolSection.EligibilityModule.Gender
            );
        } catch (e) {
            this.sex = 'ALL';
        }
    }

    addFound(keyword: string) {
        this.numberFound += 1;
        this.keywordsFound.push(keyword);
    }

    getNumberFound(): number {
        return this.numberFound;
    }

    getDistance(): number {
        return this.distance;
    }

    getCities(): string[] {
        var loc: string[] = [];
        var locationModule: Location[] = [];

        try {
            locationModule = this.getStudy().ProtocolSection
                .ContactsLocationsModule.LocationList.Location;
        } catch (e) {
            //no location module in study
            locationModule = [];
        }

        for (let i = 0; i < locationModule.length; i++) {
            let location: Location = locationModule[i];
            loc.push(location.LocationCity);
        }

        return loc;
    }

    getKeywords(): string[] {
        return this.keywordsFound;
    }

    getStudy(): Study {
        return this.study;
    }

    getScore(): number {
        return this.score;
    }

    getSex(): string {
        return this.sex;
    }

    getMaximumAge(): number {
        return this.maximumAge;
    }

    getMinimumAge(): number {
        return this.minimumAge;
    }

    getExplanations(): string[] {
        return this.explanations;
    }

    calculateScore(
        isConditionMatching: boolean,
        isSexMatching: boolean,
        isAgeMatching: boolean,
        patientDistance: number,
        closestCity: string
    ): number {
        var res: number = 0;
        var sexDocValue: number = 0;
        var ageDocValue: number = 0;
        var locDocValue: number = 0;
        var conDocValue: number = 0;
        var distanceDocValue: number = -1;

        if (isConditionMatching) {
            conDocValue = 1;
        }

        if (isSexMatching) {
            sexDocValue = 1;
        }

        if (isAgeMatching) {
            ageDocValue = 1;
        }

        locDocValue = patientDistance;

        var pnorm: ClinicalTrialsPNorm = new ClinicalTrialsPNorm(
            ageDocValue,
            sexDocValue,
            conDocValue,
            locDocValue,
            this.getKeywords(),
            closestCity
        );

        this.explanations = pnorm.getExplanations();
        this.distance = patientDistance;
        this.score = pnorm.getRank();
        return this.score;
    }
}

export class StudyList {
    private list = new Map<string, StudyListEntry>();

    addStudy(study: Study, keyword: string) {
        var nct_id = study.ProtocolSection.IdentificationModule.NCTId;

        if (this.list.has(nct_id)) {
            //study is allready in list. Just add new keyword an increase numver
            this.list.get(nct_id)!.addFound(keyword);
        } else {
            //study not yet in list, add it
            this.list.set(nct_id, new StudyListEntry(study, keyword));
        }
    }

    getStudyListEntires(): Map<string, StudyListEntry> {
        return this.list;
    }

    filterByDistance(maxDistance: number) {
        this.list.forEach((value: StudyListEntry, key: string) => {
            if (value.getDistance() > maxDistance) {
                this.list.delete(key);
            }
        });
    }

    calculateScores(
        nct_ids: string[],
        patient_age: number,
        patient_sex: string,
        patientLocation: string,
        nctds_with_tumor_type: string[]
    ) {
        this.list.forEach((value: StudyListEntry, key: string) => {
            var nct_id = value.getStudy().ProtocolSection.IdentificationModule
                .NCTId;
            var isConditionMatching: boolean = false;
            var isAgeMatching: boolean = false;
            var isSexMatching: boolean = false;
            var pSex = getGenderString(patient_sex);
            var patientDistance: number = -1;
            var studyCities: string[] = value.getCities();
            var closestCity: string = '';

            if (nct_ids.includes(nct_id)) {
                isConditionMatching = true;
                console.log('Match found');
            }

            if (nctds_with_tumor_type.includes(nct_id)) {
                isConditionMatching = true;
                console.log('Match found');
            }

            if (pSex == 'All' || value.getSex() == 'All') {
                isSexMatching = true;
            } else if (pSex == value.getSex()) {
                isSexMatching = true;
            }

            if (patient_age <= 0) {
                isAgeMatching = true;
            } else {
                if (value.getMinimumAge() >= 0) {
                    if (value.getMaximumAge() >= 0) {
                        isAgeMatching =
                            value.getMinimumAge() <= patient_age &&
                            patient_age <= value.getMaximumAge();
                    } else {
                        isAgeMatching = value.getMinimumAge() <= patient_age;
                    }
                } else if (value.getMaximumAge() >= 0) {
                    isAgeMatching = patient_age <= value.getMaximumAge();
                } else {
                    isAgeMatching = true;
                }
            }

            if (cityHasRecord(patientLocation)) {
                studyCities.forEach(function(c) {
                    var currDistance: number = getDistanceBetweenCities(
                        patientLocation,
                        c
                    );
                    if (currDistance >= 0) {
                        if (
                            currDistance < patientDistance ||
                            patientDistance < 0
                        ) {
                            patientDistance = currDistance;
                            closestCity = c;
                        }
                    }
                });
            } else {
                patientDistance = -1;
            }

            value.calculateScore(
                isConditionMatching,
                isSexMatching,
                isAgeMatching,
                patientDistance,
                closestCity
            );
        });
    }
}
