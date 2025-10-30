// services/auth.ts

import { UserManager, UserManagerSettings, User } from 'oidc-client-ts';

// Define a TypeScript interface for the formatted user object
export interface FormattedUser {
  username: string;
  email: string;
  idToken: string;
  accessToken: string;
  authorizationHeaders: (type?: string) => { [key: string]: string };
}

const cognitoAuthConfig: UserManagerSettings = {
  authority: `https://cognito-idp.us-east-1.amazonaws.com/${process.env.NEXT_PUBLIC_AWS_COGNITO_POOL_ID}`,
  client_id: process.env.NEXT_PUBLIC_AWS_COGNITO_CLIENT_ID || '',
  redirect_uri: process.env.NEXT_PUBLIC_OAUTH_SIGN_IN_REDIRECT_URL || '',
  post_logout_redirect_uri: process.env.NEXT_PUBLIC_OAUTH_SIGN_IN_REDIRECT_URL || '',
  response_type: 'code',
  scope: 'phone openid email',
  // no revoke of "access token" (https://github.com/authts/oidc-client-ts/issues/262)
  revokeTokenTypes: ['refresh_token'],
  // no silent renew via "prompt=none" (https://github.com/authts/oidc-client-ts/issues/366)
  automaticSilentRenew: false,
};

// Create a UserManager instance
const userManager = new UserManager({ ...cognitoAuthConfig });
// const userManager = new UserManager({
//   ...cognitoAuthConfig,
// });

// Create a simplified view of the user, with an extra method for creating the auth headers
function formatUser(user: User): FormattedUser {
  console.log('User Authenticated', { user });

  if (!user) return null as any;

  return {
    // If you add any other profile scopes, you can include them here
    username: user.profile['cognito:username'] as string,
    email: user.profile.email as string,
    idToken: user.id_token ?? '',
    accessToken: user.access_token,
    authorizationHeaders: (type?: string) => {
      const headers: Record<string, string> = {
        Authorization: `Bearer ${user.id_token}`,
      };

      if (type) {
        headers['Content-Type'] = type;
      }

      return headers;
    },
  };
}

export async function getUser(): Promise<FormattedUser | null> {
  // First, check if we're handling a signin redirect callback (e.g., is ?code=... in URL)
  if (window.location.search.includes('code=')) {
    const user = await userManager.signinCallback();
    // Remove the auth code from the URL without triggering a reload
    window.history.replaceState({}, document.title, window.location.pathname);
    return formatUser(user as User);
  }

  // Otherwise, get the current user
  const user = await userManager.getUser();
  return formatUser(user as User);
}
