"use client";

import { useAuth } from "react-oidc-context";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUser } from "../services/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { getUserFragments } from "@/services/api";
import { FormattedUser } from "../services/auth";

export default function Home() {
  const [user, setUser] = useState<FormattedUser | null>(null);
  const [fragments, setFragments] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const auth = useAuth();

  // console.log("UserInfo:", user);
  // console.log("Fragments:", fragments);

  const initializeApp = async () => {
    try {
      // Check if we're signed in
      const currentUser = await getUser();
      if (currentUser) {
        const userFragments = await getUserFragments(currentUser);
        setUser(currentUser);
        setFragments(userFragments);
      } else {
        setUser(null);
        setFragments([]);
      }
    } catch (error) {
      console.error("Error checking user:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initializeApp();
  }, []);

  // // Handle login click
  // const handleLogin = () => {
  //   auth?.signinRedirect();
  // };

  // Handle logout click
  const handleLogout = () => {
    auth.removeUser();

    if (user?.idToken) {
      const logoutUrl = `https://us-east-1vsp84um72.auth.us-east-1.amazoncognito.com/logout?client_id=${process.env.NEXT_PUBLIC_AWS_COGNITO_CLIENT_ID}&logout_uri=${process.env.NEXT_PUBLIC_OAUTH_SIGN_IN_REDIRECT_URL}&id_token_hint=${user.idToken}`;
      router.replace(logoutUrl);
      console.log("Redirecting to logout URL:", logoutUrl);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin mx-auto my-20" />
      </div>
    );
  }

  return (
    <div className="container mx-auto ">
      <div className="flex flex-col items-center justify-center min-h-[80vh] space-y-8">
        {/* Header */}
        <div className="text-center px-3 py-6">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900">
            Fragments UI
          </h1>
          <p className="text-lg text-slate-500 pt-3">
            Your personal fragment management system
          </p>
        </div>

        {/* Main Content Card */}
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">
              {user ? "Welcome Back!" : "Get Started"}
            </CardTitle>
            <CardDescription>
              {user
                ? "You're successfully logged in"
                : "Sign in to access your fragments"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Authentication Section */}
            <div className="flex justify-center">
              {!user ? (
                <Button
                  size="lg"
                  className="w-full"
                  onClick={() => auth.signinRedirect()}
                >
                  Login to Continue
                </Button>
              ) : (
                <Badge variant="secondary" className="px-4 py-2">
                  ✓ Logged In
                </Badge>
              )}
            </div>

            {/* User Info Section */}
            {user && (
              <div className="space-y-3 pt-4 border-t">
                <div className="text-center space-y-2">
                  <div className="text-lg font-medium text-slate-900">
                    Hello,{" "}
                    <span className="text-purple-600">{user.username}</span>!
                  </div>
                  <div className="text-sm text-slate-600">{user.email}</div>
                </div>

                {/* <div className="flex justify-center pt-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleLogout}
                  >
                    Logout
                  </Button>
                </div> */}
                <div className="flex justify-center pt-2 space-x-2">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => router.push("/Info")}
                  >
                    Send
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleLogout}
                  >
                    Logout
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
