import { Coordinate } from './Coordinate';

export function getDistanceBetweenCities(a: string, b: string): number {
    var city_a: Coordinate;
    var city_b: Coordinate;
    var distance: number = 0;

    if (!(a in CITIES_AND_COORDINATES) || !(b in CITIES_AND_COORDINATES)) {
        return -1;
    }

    if (a == b) {
        return 1;
    }

    city_a = CITIES_AND_COORDINATES[a];
    city_b = CITIES_AND_COORDINATES[b];

    distance = Math.abs(city_a.getDistance(city_b));

    return distance;
}

export function cityHasRecord(city: string): boolean {
    return city in CITIES_AND_COORDINATES;
}

export const CITIES_AND_COORDINATES: { [name: string]: Coordinate } = {
    Aachen: new Coordinate(50.783, 6.083),
    Augsburg: new Coordinate(48.367, 10.9),
    Berlin: new Coordinate(52.523, 13.413),
    Bielefeld: new Coordinate(52.017, 8.533),
    Bochum: new Coordinate(51.483, 7.217),
    Bonn: new Coordinate(50.733, 7.1),
    Bremen: new Coordinate(53.083, 8.817),
    Dresden: new Coordinate(51.05, 13.739),
    Dortmund: new Coordinate(51.517, 7.467),
    Duisburg: new Coordinate(51.433, 6.767),
    Düsseldorf: new Coordinate(51.233, 6.783),
    Erlangen: new Coordinate(49.6, 11.0),
    Essen: new Coordinate(51.467, 7.017),
    Frankfurt_am_Main: new Coordinate(50.117, 8.683),
    Frankfurt: new Coordinate(50.117, 8.683),
    Freiburg: new Coordinate(48.0, 7.85),
    Freiburg_im_Breisgau: new Coordinate(48.0, 7.85),
    Giessen: new Coordinate(50.583, 8.683),
    Greiswald: new Coordinate(54.089, 13.383),
    Göttingen: new Coordinate(51.533, 9.933),
    Heidelberg: new Coordinate(49.4, 8.683),
    Halle_Saale: new Coordinate(51.496, 1.968),
    Hannover: new Coordinate(52.383, 9.733),
    Hamburg: new Coordinate(53.567, 10.0339),
    Jena: new Coordinate(50.933, 11.591),
    Köln: new Coordinate(50.95, 6.95),
    Leipzig: new Coordinate(51.359, 12.377),
    Magdeburg: new Coordinate(52.122, 11.619),
    Mannheim: new Coordinate(49.483, 8.467),
    Mainz: new Coordinate(50.0, 8.267),
    Marburg: new Coordinate(50.817, 8.767),
    München: new Coordinate(48.133, 11.567),
    Münster: new Coordinate(49.933, 8.867),
    Mönchengladbach: new Coordinate(51.2, 6.433),
    Nürnberg: new Coordinate(49.45, 11.083),
    Ravensburg: new Coordinate(47.783, 9.617),
    Regensburg: new Coordinate(49.017, 12.1),
    Rostock: new Coordinate(54.089, 12.125),
    Stuttgart: new Coordinate(48.783, 9.183),
    Tübingen: new Coordinate(48.517, 9.067),
    Ulm: new Coordinate(48.4, 9.983),
    Wuppertal: new Coordinate(51.267, 7.2),
    Würzburg: new Coordinate(49.48, 9.56),
};
