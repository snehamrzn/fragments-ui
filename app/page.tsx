'use client';

import { useAuth } from 'react-oidc-context';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUser } from '../services/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, List } from 'lucide-react';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { motion, AnimatePresence } from 'framer-motion';
import { getUserFragments, getFragmentById, getFragmentByIdWithExtension } from '@/services/api';
import { FormattedUser } from '../services/auth';
import Info from '../components/Info';

interface Fragment {
  id: string;
  type: string;
  size: number;
  created: string;
  updated: string;
}

export default function Home() {
  const [user, setUser] = useState<FormattedUser | null>(null);
  const [fragments, setFragments] = useState<Fragment[]>([]);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const [selectedFragment, setSelectedFragment] = useState<{
    id: string;
    content: string;
    type: string;
    isHtml?: boolean;
    htmlContent?: string;
  } | null>(null);
  const [loadingFragment, setLoadingFragment] = useState(false);
  const [convertingToHtml, setConvertingToHtml] = useState(false);

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
        // Request fragments with expanded metadata
        const response = await getUserFragments(currentUser, true);
        console.log(currentUser);

        setUser(currentUser);
        // The response contains a fragments array in the data object
        setFragments(response?.fragments || []);
      } else {
        setUser(null);
        setFragments([]);
      }
    } catch (error) {
      console.error('Error checking user:', error);
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
      console.log('Redirecting to logout URL:', logoutUrl);
    }
  };

  // Handle card click to fetch fragment content
  const handleCardClick = async (fragmentId: string, fragmentType: string) => {
    if (!user) return;

    setShowDrawer(false); // Close the drawer first to show the data
    setLoadingFragment(true);
    try {
      const content = await getFragmentById(user, fragmentId);
      setSelectedFragment({ id: fragmentId, content, type: fragmentType, isHtml: false });
    } catch (error) {
      console.error('Error fetching fragment content:', error);
    } finally {
      setLoadingFragment(false);
    }
  };

  // Handle converting markdown to HTML
  const handleConvertToHtml = async () => {
    if (!user || !selectedFragment) return;

    setConvertingToHtml(true);
    try {
      const htmlContent = await getFragmentByIdWithExtension(user, selectedFragment.id, 'html');
      setSelectedFragment({
        ...selectedFragment,
        htmlContent,
        isHtml: true,
      });
    } catch (error) {
      console.error('Error converting to HTML:', error);
    } finally {
      setConvertingToHtml(false);
    }
  };

  // Handle switching back to raw view
  const handleViewRaw = () => {
    if (!selectedFragment) return;
    setSelectedFragment({
      ...selectedFragment,
      isHtml: false,
    });
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
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 font-mono">
            Fragments UI
          </h1>
          <p className="text-lg text-slate-500 pt-3">Your personal fragment management system</p>
        </div>

        {/* Main Content Card */}
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-mono">
              {user ? 'Welcome Back!' : 'Get Started'}
            </CardTitle>
            <CardDescription>
              {user ? "You're successfully logged in" : 'Sign in to access your fragments'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Authentication Section */}
            <div className="flex justify-center">
              {!user ? (
                <Button size="lg" className="w-full" onClick={() => auth.signinRedirect()}>
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
                    Hello, <span className="text-purple-600">{user.username}</span>!
                  </div>
                  <div className="text-sm text-slate-600">{user.email}</div>
                </div>

                <div className="flex justify-center pt-2 space-x-2">
                  <Button variant="default" size="sm" onClick={() => setShowSendModal(true)}>
                    Send
                  </Button>

                  <Button variant="destructive" size="sm" onClick={handleLogout}>
                    Logout
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        {user && (
          <Button variant="secondary" size="sm" onClick={() => setShowDrawer(true)}>
            <List className="mr-2 h-4 w-4" />
            View Fragments
          </Button>
        )}
      </div>

      {/* Fragments Drawer */}
      <Drawer open={showDrawer} onOpenChange={setShowDrawer}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>FRAGMENTS DATA</DrawerTitle>
            <DrawerDescription>
              {fragments.length > 0
                ? `You have ${fragments.length} fragment${fragments.length !== 1 ? 's' : ''}`
                : 'No fragments yet'}
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-4 max-h-[60vh] overflow-y-auto">
            {fragments.length > 0 ? (
              <div className="space-y-4">
                {fragments.map((fragment) => (
                  <Card
                    key={fragment.id}
                    className="border cursor-pointer hover:bg-slate-50 transition-colors"
                    onClick={() => handleCardClick(fragment.id, fragment.type)}
                  >
                    <CardContent className="pt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="font-semibold">ID:</span>{' '}
                          <span className="font-mono text-xs">{fragment.id}</span>
                        </div>
                        <div>
                          <span className="font-semibold">Type:</span>{' '}
                          <Badge variant="outline">{fragment.type}</Badge>
                        </div>
                        <div>
                          <span className="font-semibold">Size:</span> {fragment.size} bytes
                        </div>
                        <div>
                          <span className="font-semibold">Created:</span>{' '}
                          {new Date(fragment.created).toLocaleString()}
                        </div>
                        <div className="md:col-span-2">
                          <span className="font-semibold">Updated:</span>{' '}
                          {new Date(fragment.updated).toLocaleString()}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No fragments found. Create your first fragment!</p>
              </div>
            )}
          </div>
          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="outline">Close</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Popup Modal with Framer Motion */}
      <AnimatePresence>
        {showSendModal && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 z-40 bg-black/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSendModal(false)}
            />

            {/* Modal content */}
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              initial={{ opacity: 0, scale: 0.98, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 8 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            >
              <Card className="w-full max-w-2xl">
                <CardHeader>
                  <CardTitle>Create New Fragment</CardTitle>
                  <CardDescription>
                    Choose a fragment type and provide content via text input or file upload.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Info
                    onClose={() => setShowSendModal(false)}
                    onCreated={() => {
                      setShowSendModal(false);
                      initializeApp();
                    }}
                  />
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Fragment Content Modal */}
      <AnimatePresence>
        {selectedFragment && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 z-40 bg-black/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedFragment(null)}
            />

            {/* Modal content */}
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              initial={{ opacity: 0, scale: 0.98, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 8 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            >
              <Card className="w-full max-w-4xl max-h-[90vh] flex flex-col">
                <CardHeader>
                  <CardTitle className="font-mono tracking-wider">
                    {selectedFragment.isHtml ? 'RENDERED HTML' : 'FRAGMENT CONTENT'}
                  </CardTitle>
                  <CardDescription>
                    <span className="font-mono text-xs">{selectedFragment.id}</span>
                    {' • '}
                    <Badge variant="outline" className="ml-1">
                      {selectedFragment.type}
                    </Badge>
                    {selectedFragment.isHtml && (
                      <Badge variant="secondary" className="ml-2">
                        Converted to HTML
                      </Badge>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 overflow-hidden">
                  <div className="bg-white border border-slate-200 rounded-lg p-6 max-h-[60vh] overflow-auto">
                    {selectedFragment.isHtml && selectedFragment.htmlContent ? (
                      <div
                        className="rendered-html space-y-4"
                        dangerouslySetInnerHTML={{ __html: selectedFragment.htmlContent }}
                      />
                    ) : (
                      <pre className="text-sm whitespace-pre-wrap break-words font-mono text-slate-800">
                        {selectedFragment.content}
                      </pre>
                    )}
                  </div>
                  <div className="flex justify-between items-center mt-4">
                    <div>
                      {selectedFragment.type === 'text/markdown' &&
                        (selectedFragment.isHtml ? (
                          <Button onClick={handleViewRaw} variant="secondary" size="sm">
                            View Raw Markdown
                          </Button>
                        ) : (
                          <Button
                            onClick={handleConvertToHtml}
                            variant="secondary"
                            size="sm"
                            disabled={convertingToHtml}
                          >
                            {convertingToHtml ? 'Converting...' : 'Convert to HTML'}
                          </Button>
                        ))}
                    </div>
                    <Button onClick={() => setSelectedFragment(null)} variant="outline">
                      Close
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Loading Modal */}
      {loadingFragment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <Loader2 className="animate-spin h-8 w-8 text-white" />
        </div>
      )}
    </div>
  );
}
