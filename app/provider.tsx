"use client";

import { AuthProvider } from "react-oidc-context";
import type { UserManagerSettings } from "oidc-client-ts";

const cognitoAuthConfig: UserManagerSettings = {
  authority: `https://cognito-idp.us-east-1.amazonaws.com/${process.env.NEXT_PUBLIC_AWS_COGNITO_POOL_ID}`,
  client_id: process.env.NEXT_PUBLIC_AWS_COGNITO_CLIENT_ID || "",
  redirect_uri: process.env.NEXT_PUBLIC_OAUTH_SIGN_IN_REDIRECT_URL || "",
  response_type: "code",
  scope: "phone openid email",
  // no revoke of "access token" (https://github.com/authts/oidc-client-ts/issues/262)
  revokeTokenTypes: ["refresh_token"],
  // no silent renew via "prompt=none" (https://github.com/authts/oidc-client-ts/issues/366)
  automaticSilentRenew: false,
};

const Provider = ({ children }: { children: React.ReactNode }) => {
  return <AuthProvider {...cognitoAuthConfig}>{children}</AuthProvider>;
};
export default Provider;
