import { Coordinate } from './Coordinate';
import { City } from '../../ClinicalTrialMatchSelectUtil';
import { Location } from 'shared/api/ClinicalTrialsGovStudyStrucutre';

export function getDistanceBetweenCities(a: City, b: City): number {
    const EARTH_RADIUS = 6371;

    var rad_1 = (a.lat * Math.PI) / 180;
    var rad_2 = (b.lat * Math.PI) / 180;
    var rad_dp = (Math.abs(b.lat - a.lat) * Math.PI) / 180;
    var rad_dl = (Math.abs(b.lng - a.lng) * Math.PI) / 180;

    var x =
        Math.sin(rad_dp / 2) * Math.sin(rad_dp / 2) +
        Math.cos(rad_1) *
            Math.cos(rad_2) *
            Math.sin(rad_dl / 2) *
            Math.sin(rad_dl / 2);
    var y = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));

    return EARTH_RADIUS * y;
}

export function cityHasRecord(city: City): boolean {
    var worldCities: string[] = require('./worldCities.json').map(
        (worldCity: City) => worldCity.city
    );
    var result: boolean = false;
    result = worldCities.includes(city.city);
    return result;
}

export function findCity(city: Location): City | undefined {
    var worldCities = require('./worldCities.json');
    var cityMatches = worldCities.filter((cityObject: City) => {
        return city.LocationCity === cityObject.city;
    });
    if (cityMatches.length > 1) {
        var cityMatch: City = worldCities.find((cityObject: City) => {
            return (
                city.LocationCity === cityObject.city &&
                city.LocationState === cityObject.admin_name
            );
        });
    } else {
        var cityMatch: City = cityMatches[0];
    }

    return cityMatch;
}
