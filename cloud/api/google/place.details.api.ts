import HttpResponse = Parse.Cloud.HttpResponse;
import * as _ from 'lodash';
import {API_BASE, API_KEY} from "./google.constants";

export const API_GOOGLE_GEOCODE = "googleGeocode";

Parse.Cloud.define(API_GOOGLE_GEOCODE,  async (request, response) => {
    let params = request.params;

    let address: string = _.get(params, 'address');
    let place_id: string = _.get(params, 'place_id');

    if (!address && !place_id) {
        throw 'Missing address or place_id param';
    }

    try {
        let results = await googleGeocode({
            place_id: place_id,
            address: address
        });

        response.success(results);
    } catch (e) {
        response.error(e);
    }
});

export type GeocodeParams = {
    place_id?: string;
    address?: string;
}

export const googleGeocode = async (params: GeocodeParams, output: 'json' | 'xml' = 'json'): Promise<Object[]> => {

    let httpResponse: HttpResponse = await Parse.Cloud.httpRequest({
        url: `${API_BASE}/maps/api/geocode/${output}`,
        params: _.pickBy({
            place_id: params.place_id,
            address: params.address,
            key: API_KEY
        }, _.identity)
    });

    let body = httpResponse.data;

    if (body.status !== "OK") {
        throw 'Non OK status from Google:\n' + JSON.stringify(body);
    }

    if (body.results.length === 0) {
        throw 'Empty result set';
    }

    return body.results;
};