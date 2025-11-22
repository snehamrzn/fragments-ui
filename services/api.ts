const buildTimeApiUrl: string = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
import { FormattedUser } from '../services/auth';
// this tells the compiler that inside the global namespace, the browser’s window
// object has an optional property __ENV, and that object may have an optional
// API_ORIGIN string.
declare global {
  interface Window {
    __ENV?: {
      API_ORIGIN?: string;
    };
  }
}

// Prefer the runtime API_ORIGIN injected by nginx, fall back to the build-time env.
export const getApiUrl = (): string => {
  if (typeof window !== 'undefined') {
    const runtimeUrl = window.__ENV?.API_ORIGIN;
    if (runtimeUrl) {
      return runtimeUrl;
    }
  }

  return buildTimeApiUrl;
};
/**
 * Given an authenticated user, request all fragments for this user from the
 * fragments microservice (currently only running locally). We expect a user
 * to have an `idToken` attached, so we can send that along with the request.
 */

export async function getUserFragments(user: FormattedUser, expand: boolean = false) {
  console.log('Requesting user fragments data...');
  // console.log("ID Token:", user.idToken);
  //console.log("Authorization Headers:", user.authorizationHeaders());
  // console.log("DEBUG----------: ", apiUrl)

  try {
    const fragmentsUrl = new URL('v1/fragments', getApiUrl());
    // Add expand parameter to get full metadata
    if (expand) {
      fragmentsUrl.searchParams.set('expand', '1');
    }
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
 * Create a new fragment for the authenticated user
 * @param user - The authenticated user object with auth headers
 * @param fragmentContent - The content for the fragment (string or File)
 * @param contentType - The MIME type of the fragment (e.g., 'text/plain', 'application/json')
 * @returns Promise<any> - The created fragment data
 */
export async function createFragment(
  user: FormattedUser,
  fragmentContent: string | File,
  contentType: string = 'text/plain'
) {
  console.log('Creating new fragment...');
  console.log('Content type:', contentType);
  console.log('Fragment content type:', fragmentContent instanceof File ? 'File' : 'String');

  try {
    const fragmentsUrl = new URL('v1/fragments', getApiUrl());
    let body: BodyInit;

    // Handle File objects by reading them
    if (fragmentContent instanceof File) {
      console.log('Reading file:', fragmentContent.name, 'Type:', fragmentContent.type);
      // For text-based content types (including JSON), read as text
      if (contentType.startsWith('text/') || contentType === 'application/json') {
        body = await fragmentContent.text();
        console.log('File read as text, length:', body.length);
      } else if (contentType.startsWith('image/')) {
        body = await fragmentContent.arrayBuffer();
        console.log('Image read as arrayBuffer, byteLength:', body.byteLength);
      } else {
        // For binary content, use arrayBuffer
        body = await fragmentContent.arrayBuffer();
        console.log('File read as arrayBuffer, byteLength:', body.byteLength);
      }
    } else {
      body = fragmentContent;
      console.log('Using string content, length:', body.length);
    }

    const headers = user.authorizationHeaders(contentType);
    console.log('Request headers:', headers);
    console.log('Request URL:', fragmentsUrl.toString());

    const res = await fetch(fragmentsUrl, {
      method: 'POST',
      headers: headers,
      body: body,
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
    const fragmentUrl = new URL(`v1/fragments/${fragmentId}`, getApiUrl());
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

/**
 * Get a specific fragment by ID with extension conversion
 * @param user - The authenticated user object with auth headers
 * @param fragmentId - The ID of the fragment to retrieve
 * @param extension - The extension to convert to (e.g., 'html' for markdown conversion)
 * @returns Promise<string> - The converted fragment content
 */
export async function getFragmentByIdWithExtension(
  user: FormattedUser,
  fragmentId: string,
  extension: string
) {
  console.log(`Getting fragment by ID with extension: ${fragmentId}.${extension}`);

  try {
    const fragmentUrl = new URL(`v1/fragments/${fragmentId}.${extension}`, getApiUrl());
    const res = await fetch(fragmentUrl, {
      headers: user.authorizationHeaders(),
    });

    if (!res.ok) {
      throw new Error(`Unable to get fragment: ${res.status} ${res.statusText}`);
    }

    const fragmentContent = await res.text();
    console.log('Successfully got converted fragment content');
    return fragmentContent;
  } catch (err) {
    console.error('Unable to get fragment with extension', err);
    throw err;
  }
}

/**
 * Delete a specific fragment by ID
 * @param user - The authenticated user object with auth headers
 * @param fragmentId - The ID of the fragment to delete
 * @returns Promise<void>
 */
export async function deleteFragment(user: FormattedUser, fragmentId: string) {
  console.log('Deleting fragment by ID:', fragmentId);

  try {
    const fragmentUrl = new URL(`v1/fragments/${fragmentId}`, getApiUrl());
    const res = await fetch(fragmentUrl, {
      method: 'DELETE',
      headers: user.authorizationHeaders(),
    });

    if (!res.ok) {
      throw new Error(`Unable to delete fragment: ${res.status} ${res.statusText}`);
    }

    console.log('Successfully deleted fragment');
  } catch (err) {
    console.error('Unable to delete fragment', err);
    throw err;
  }
}
/**
 * Update an existing fragment by ID
 * @param user - The authenticated user object with auth headers
 * @param fragmentId - The ID of the fragment to update
 * @param fragmentContent - The new content for the fragment (string or File)
 * @param contentType - The MIME type of the fragment
 * @returns Promise<any> - The updated fragment data
 */

export async function updateFragment(
  user: FormattedUser,
  fragmentId: string,
  fragmentContent: string | File,
  contentType: string
) {
  console.log('Updating fragment:', fragmentId);
  console.log('Content type:', contentType);
  try {
    const fragmentUrl = new URL(`v1/fragments/${fragmentId}`, getApiUrl());
    let body: BodyInit;

    // Handle File objects by reading them
    if (fragmentContent instanceof File) {
      console.log('Reading file:', fragmentContent.name, 'Type:', fragmentContent.type);
      // For text-based content types (including JSON), read as text
      if (contentType.startsWith('text/') || contentType === 'application/json') {
        body = await fragmentContent.text();
        console.log('File read as text, length:', body.length);
      } else if (contentType.startsWith('image/')) {
        body = await fragmentContent.arrayBuffer();
        console.log('Image read as arrayBuffer, byteLength:', body.byteLength);
      } else {
        // For other binary content, use arrayBuffer
        body = await fragmentContent.arrayBuffer();
        console.log('File read as arrayBuffer, byteLength:', body.byteLength);
      }
    } else {
      body = fragmentContent;
      console.log('Using string content, length:', body.length);
    }

    const headers = user.authorizationHeaders(contentType);
    console.log('Request headers:', headers);
    console.log('Request URL:', fragmentUrl.toString());

    const res = await fetch(fragmentUrl, {
      method: 'PUT',
      headers: headers,
      body: body,
    });

    if (!res.ok) {
      throw new Error(`Unable to update fragment: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    console.log('Successfully updated fragment', { data });
    return data;
  } catch (err) {
    console.error('Unable to update fragment', err);
    throw err;
  }
}
