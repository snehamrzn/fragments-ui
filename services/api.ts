const apiUrl:string = process.env.API_URL || 'http://localhost:8080';
import {FormattedUser} from '../services/auth';
/**
 * Given an authenticated user, request all fragments for this user from the
 * fragments microservice (currently only running locally). We expect a user
 * to have an `idToken` attached, so we can send that along with the request.
 */

export async function getUserFragments(user : FormattedUser) {
    console.log('Requesting user fragments data...');
    try{
        const fragmentsUrl = new URL('v1/fragments', apiUrl);
        const res =await fetch(fragmentsUrl,{
    // Generate headers with the proper Authorization bearer token to pass.
    // We are using the `authorizationHeaders()` helper method we defined
    // earlier, to automatically attach the user's ID token.
      headers: user.authorizationHeaders(),
        });
        if(!res.ok){
            throw new Error(`Unable to call GET /v1/fragments: ${res.status} ${res.statusText}`);
        }
        const data = await res.json();
        console.log('Successfully got user fragments data', {data});
        return data;
    }catch(err){
        console.error('Unable to call GET /v1/fragments', { err });

    }
}