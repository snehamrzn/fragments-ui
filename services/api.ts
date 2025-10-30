const apiUrl: string = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
// const apiUrl:string = process.env.NEXT_PUBLIC_API_URL || "http://ec2-54-92-212-27.compute-1.amazonaws.com:8080";
import { FormattedUser } from '../services/auth';
/**
 * Given an authenticated user, request all fragments for this user from the
 * fragments microservice (currently only running locally). We expect a user
 * to have an `idToken` attached, so we can send that along with the request.
 */

export async function getUserFragments(user: FormattedUser) {
  console.log('Requesting user fragments data...');
  // console.log("ID Token:", user.idToken);
  //console.log("Authorization Headers:", user.authorizationHeaders());
  // console.log("DEBUG----------: ", apiUrl)

  try {
    const fragmentsUrl = new URL('v1/fragments', apiUrl);
    const res = await fetch(fragmentsUrl, {
      // Generate headers with the proper Authorization bearer token to pass.
      // We are using the `authorizationHeaders()` helper method we defined
      // earlier, to automatically attach the user's ID token.
      headers: user.authorizationHeaders(),
    });
    if (!res.ok) {
      throw new Error(`Unable to call GET /v1/fragments: ${res.status} ${res.statusText}`);
      // throw new Error(`Unable to call GET /v1/fragments: ${res.status} ${res.statusText}`);
    }
    const data = await res.json();
    console.log('Successfully got user fragments data', { data });
    return data;
  } catch (err) {
    console.error('Unable to call GET /v1/fragments', err);
  }
}

/**
 * Create a new text fragment for the authenticated user
 * @param user - The authenticated user object with auth headers
 * @param fragmentText - The text content for the fragment
 * @returns Promise<any> - The created fragment data
 */
export async function createFragment(user: FormattedUser, fragmentText: string) {
  console.log('Creating new fragment...');
  console.log('Fragment text:', fragmentText);

  try {
    const fragmentsUrl = new URL('v1/fragments', apiUrl);
    const res = await fetch(fragmentsUrl, {
      method: 'POST',
      headers: user.authorizationHeaders('text/plain'),
      body: fragmentText,
    });

    if (!res.ok) {
      throw new Error(`Unable to create fragment: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    console.log('Successfully created fragment', { data });
    return data;
  } catch (err) {
    console.error('Unable to create fragment', err);
    throw err;
  }
}

/**
 * Get a specific fragment by ID
 * @param user - The authenticated user object with auth headers
 * @param fragmentId - The ID of the fragment to retrieve
 * @returns Promise<string> - The fragment text content
 */
export async function getFragmentById(user: FormattedUser, fragmentId: string) {
  console.log('Getting fragment by ID:', fragmentId);

  try {
    const fragmentUrl = new URL(`v1/fragments/${fragmentId}`, apiUrl);
    const res = await fetch(fragmentUrl, {
      headers: user.authorizationHeaders(),
    });

    if (!res.ok) {
      throw new Error(`Unable to get fragment: ${res.status} ${res.statusText}`);
    }

    const fragmentText = await res.text();
    console.log('Successfully got fragment content');
    return fragmentText;
  } catch (err) {
    console.error('Unable to get fragment', err);
    throw err;
  }
}
