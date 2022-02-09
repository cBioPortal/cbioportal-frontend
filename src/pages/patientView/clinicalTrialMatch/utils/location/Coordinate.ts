const EARTH_RADIUS = 6371;

export class Coordinate {
    private latitude: number;
    private longitude: number;

    constructor(latitude: number, longitude: number) {
        this.latitude = latitude;
        this.longitude = longitude;
    }

    public getLatitude(): number {
        return this.latitude;
    }

    public getLongitude(): number {
        return this.longitude;
    }

    getDistance(other: Coordinate): number {
        var rad_1 = (this.getLatitude() * Math.PI) / 180;
        var rad_2 = (other.getLatitude() * Math.PI) / 180;
        var rad_dp =
            (Math.abs(other.getLatitude() - this.getLatitude()) * Math.PI) /
            180;
        var rad_dl =
            (Math.abs(other.getLongitude() - this.getLongitude()) * Math.PI) /
            180;

        var a =
            Math.sin(rad_dp / 2) * Math.sin(rad_dp / 2) +
            Math.cos(rad_1) *
                Math.cos(rad_2) *
                Math.sin(rad_dl / 2) *
                Math.sin(rad_dl / 2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return EARTH_RADIUS * c;
    }
}
