import HttpResponse = Parse.Cloud.HttpResponse;
import * as _ from 'lodash';
import {API_BASE, API_KEY} from "./google.constants";

export const API_GOOGLE_PLACE_DETAILS = "googlePlaceDetails";

Parse.Cloud.define(API_GOOGLE_PLACE_DETAILS,  async (request, response) => {
    let params = request.params;

    let place_id: string = _.get(params, 'place_id');

    if (!place_id) {
        throw 'Missing place_id param';
    }

    try {
        let result = await googlePlaceDetails(place_id);

        response.success(result);
    } catch (e) {
        response.error(e);
    }
});



export const googlePlaceDetails = async (place_id: string, output: 'json' | 'xml' = 'json'): Promise<Object> => {

    let httpResponse: HttpResponse = await Parse.Cloud.httpRequest({
        url: `${API_BASE}/maps/api/place/details/${output}`,
        params: {
            placeid: place_id,
            key: API_KEY
        }
    });

    let body = httpResponse.data;

    if (body.status !== "OK") {
        throw 'Non OK status from Google:\n' + JSON.stringify(body);
    }

    if (body.results) {
        throw 'Empty result set';
    }

    return body.result;
};