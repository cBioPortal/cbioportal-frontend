//All Clinical-Trials Studies that were looked at described the gender as either "Male", "Female" or "All"
//Other values are still checked for consistency reasons
const FEMALE_VALUES = ['f', 'F', 'Female', 'FEMALE'];
const MALE_VALUES = ['m', 'M', 'Male', 'MALE'];
const ALL_VALUES = ['a', 'A', 'All', 'ALL'];

const AGE_VALUES = [' Years', ' years', ' YEARS'];

//returns "Male" for male gender, "Female" for female Gender and "All" for all genders, undefined and not found
export function getGenderString(gender: string): string {
    if (!gender) {
        return 'ALL';
    }
    if (FEMALE_VALUES.includes(gender)) {
        return 'Female';
    }
    if (MALE_VALUES.includes(gender)) {
        return 'Male';
    }
    return 'All';
}

//in all clinicalTrials.gov studies that were looked at, the age was descibed as "<x> Years". For consistency reasons "<x> years" and "<x>" is also checked
//negative number is returned in case of undefined or invalid string
export function ageAsNumber(age: string): number {
    var str: string = age;
    var result: number = -1;

    if (!age) {
        return -1;
    }

    for (var a of AGE_VALUES) {
        str = str.replace(a, '');
    }

    var result = +str;

    if (isNaN(result)) {
        return -1;
    }

    return result;
}
