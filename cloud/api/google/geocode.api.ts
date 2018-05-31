import HttpResponse = Parse.Cloud.HttpResponse;
import * as _ from 'lodash';
import {API_BASE, API_KEY} from "./google.constants";

export const API_GOOGLE_GEOCODE = "googleGeocode";

Parse.Cloud.define(API_GOOGLE_GEOCODE,  async (request, response) => {
    let params = request.params;

    let output: 'json' | 'xml' = _.get(params, 'output') || 'json';
    let address: string = _.get(params, 'address');

    if (!_.includes(['json', 'xml'], output)) {
        throw 'Output must be either "json" or "xml"';
    }
    if (!address) {
        throw 'Missing address param';
    }

    try {
        let results = await googleGeocode(address, output);

        response.success(results);
    } catch (e) {
        response.error(e);
    }
});

export const googleGeocode = async (address: string, output: 'json' | 'xml' = 'json'): Promise<Object[]> => {

    let httpResponse: HttpResponse = await Parse.Cloud.httpRequest({
        url: `${API_BASE}/maps/api/geocode/${output}`,
        params: {
            address: address,
            key: API_KEY
        }
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