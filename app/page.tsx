'use client';

import { useAuth } from 'react-oidc-context';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUser } from '../services/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, List, Search } from 'lucide-react';
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
import {
  getUserFragments,
  getFragmentById,
  getFragmentByIdWithExtension,
  deleteFragment,
  getApiUrl,
} from '@/services/api';
import { FormattedUser } from '../services/auth';
import Info from '../components/Info';
import AnimatedButton from '../components/AnimatedButton';
import EditFragmentModal from '../components/EditFragmentModal';

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
    imageUrl?: string;
    convertedImageUrl?: string;
    convertedFormat?: string;
    convertedContent?: string;
    convertedType?: string;
  } | null>(null);
  const [loadingFragment, setLoadingFragment] = useState(false);
  const [convertingToHtml, setConvertingToHtml] = useState(false);
  const [convertingImage, setConvertingImage] = useState(false);
  const [convertingText, setConvertingText] = useState(false);
  const [deleteButtonStates, setDeleteButtonStates] = useState<
    Record<string, 'idle' | 'loading' | 'success' | 'error'>
  >({});
  const [editingFragment, setEditingFragment] = useState<{
    id: string;
    type: string;
    content: string;
  } | null>(null);
  const [loadingEditContent, setLoadingEditContent] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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

  // Cleanup blob URLs when component unmounts or when selectedFragment changes
  useEffect(() => {
    return () => {
      if (selectedFragment?.imageUrl) {
        URL.revokeObjectURL(selectedFragment.imageUrl);
      }
      if (selectedFragment?.convertedImageUrl) {
        URL.revokeObjectURL(selectedFragment.convertedImageUrl);
      }
    };
  }, [selectedFragment]);

  // Handle login click
  const handleLogin = () => {
    auth.signinRedirect();
  };

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
      // Check if the fragment is an image
      if (fragmentType.startsWith('image/')) {
        // For images, we need to fetch as blob and create an object URL
        const fragmentUrl = new URL(`v1/fragments/${fragmentId}`, getApiUrl());
        const response = await fetch(fragmentUrl.toString(), {
          headers: user.authorizationHeaders(),
        });
        const blob = await response.blob();
        const imageUrl = URL.createObjectURL(blob);
        setSelectedFragment({
          id: fragmentId,
          content: '',
          type: fragmentType,
          isHtml: false,
          imageUrl,
        });
      } else {
        const content = await getFragmentById(user, fragmentId);
        setSelectedFragment({ id: fragmentId, content, type: fragmentType, isHtml: false });
      }
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
      convertedContent: undefined,
      convertedType: undefined,
    });
  };

  // Generic text conversion handler
  const handleConvertText = async (targetExtension: string, targetType: string) => {
    if (!user || !selectedFragment) return;

    setConvertingText(true);
    try {
      const convertedContent = await getFragmentByIdWithExtension(
        user,
        selectedFragment.id,
        targetExtension
      );
      setSelectedFragment({
        ...selectedFragment,
        convertedContent,
        convertedType: targetType,
        isHtml: targetType === 'text/html',
      });
    } catch (error) {
      console.error('Error converting text:', error);
      alert(`Failed to convert to ${targetType}. Please try again.`);
    } finally {
      setConvertingText(false);
    }
  };

  // Handle image format conversion
  const handleConvertImage = async (targetFormat: string) => {
    if (!user || !selectedFragment) return;

    setConvertingImage(true);
    try {
      // Map format names to extensions
      const formatToExtension: Record<string, string> = {
        'PNG': 'png',
        'JPEG': 'jpg',
        'WebP': 'webp',
        'GIF': 'gif',
        'AVIF': 'avif',
      };

      const extension = formatToExtension[targetFormat];
      const fragmentUrl = new URL(`v1/fragments/${selectedFragment.id}.${extension}`, getApiUrl());
      const response = await fetch(fragmentUrl.toString(), {
        headers: user.authorizationHeaders(),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to convert image: ${response.statusText}`);
      }

      const blob = await response.blob();
      const convertedImageUrl = URL.createObjectURL(blob);
      
      // Clean up old converted image URL if it exists
      if (selectedFragment.convertedImageUrl) {
        URL.revokeObjectURL(selectedFragment.convertedImageUrl);
      }

      setSelectedFragment({
        ...selectedFragment,
        convertedImageUrl,
        convertedFormat: targetFormat,
      });
    } catch (error) {
      console.error('Error converting image:', error);
      alert('Failed to convert image. Please try again.');
    } finally {
      setConvertingImage(false);
    }
  };

  // Handle viewing original image
  const handleViewOriginalImage = () => {
    if (!selectedFragment) return;
    setSelectedFragment({
      ...selectedFragment,
      convertedImageUrl: undefined,
      convertedFormat: undefined,
    });
  };

  // Handle fragment deletion
  const handleDeleteFragment = async (fragmentId: string, event: React.MouseEvent) => {
    // Stop propagation to prevent card click event
    event.stopPropagation();

    if (!user) return;
    const currentState = deleteButtonStates[fragmentId] || 'idle';

    // Only proceed if idle
    if (currentState !== 'idle') return;

    // Set loading state
    setDeleteButtonStates((prev) => ({ ...prev, [fragmentId]: 'loading' }));

    try {
      await deleteFragment(user, fragmentId);
      console.log('Fragment deleted successfully');

      // Show success state
      setDeleteButtonStates((prev) => ({ ...prev, [fragmentId]: 'success' }));

      // Wait a bit to show success, then refresh
      setTimeout(async () => {
        await initializeApp();
        // Reset state after refresh (fragment will be gone)
        setDeleteButtonStates((prev) => {
          const newStates = { ...prev };
          delete newStates[fragmentId];
          return newStates;
        });
      }, 1000);
    } catch (error) {
      console.error('Error deleting fragment:', error);

      // Show error state
      setDeleteButtonStates((prev) => ({ ...prev, [fragmentId]: 'error' }));

      // Reset to idle after showing error
      setTimeout(() => {
        setDeleteButtonStates((prev) => ({ ...prev, [fragmentId]: 'idle' }));
      }, 2000);
    }
  };

  // Handle edit button click
  const handleEditFragment = async (
    fragmentId: string,
    fragmentType: string,
    event: React.MouseEvent
  ) => {
    // Stop propagation to prevent card click event
    event.stopPropagation();

    if (!user) return;

    // Close the drawer first
    setShowDrawer(false);

    setLoadingEditContent(true);
    try {
      // For images, don't fetch content (it's binary data)
      // For text-based fragments, fetch the current content
      let content = '';
      if (!fragmentType.startsWith('image/')) {
        content = await getFragmentById(user, fragmentId);
      }
      
      setEditingFragment({
        id: fragmentId,
        type: fragmentType,
        content,
      });
    } catch (error) {
      console.error('Error fetching fragment for edit:', error);
      alert('Failed to load fragment content. Please try again.');
    } finally {
      setLoadingEditContent(false);
    }
  };

  // Filter fragments based on search query
  const filteredFragments = fragments.filter((fragment) => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    const searchableText = [
      fragment.id,
      fragment.type,
      fragment.size.toString(),
      new Date(fragment.created).toLocaleString(),
      new Date(fragment.updated).toLocaleString(),
    ].join(' ').toLowerCase();
    
    return searchableText.includes(query);
  });

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
                <Button size="lg" className="w-full" onClick={handleLogin}>
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
            <div className="flex items-start justify-between">
              <div>
                <DrawerTitle>FRAGMENTS DATA</DrawerTitle>
                <DrawerDescription>
                  {fragments.length > 0
                    ? `You have ${fragments.length} fragment${fragments.length !== 1 ? 's' : ''}`
                    : 'No fragments yet'}
                </DrawerDescription>
              </div>
              {fragments.length > 0 && (
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search fragments..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              )}
            </div>
          </DrawerHeader>
          <div className="px-4 pb-4 max-h-[60vh] overflow-y-auto">
            {filteredFragments.length > 0 ? (
              <div className="space-y-4">
                {filteredFragments.map((fragment) => (
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
                      <div className="mt-4 flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => handleEditFragment(fragment.id, fragment.type, e)}
                        >
                          Edit
                        </Button>
                        <AnimatedButton
                          state={deleteButtonStates[fragment.id] || 'idle'}
                          onClick={(e) => handleDeleteFragment(fragment.id, e)}
                          idleText=" Delete"
                          successText="✓ Deleted"
                          errorText="✗ Failed"
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                {searchQuery.trim() ? (
                  <div>
                    <p className="font-medium text-gray-700">No fragments match your search</p>
                    <p className="text-sm mt-1">Try a different search term</p>
                  </div>
                ) : (
                  <p>No fragments found. Create your first fragment!</p>
                )}
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
                    {selectedFragment.convertedType
                      ? `CONVERTED TO ${selectedFragment.convertedType.toUpperCase()}`
                      : selectedFragment.convertedFormat
                      ? `CONVERTED TO ${selectedFragment.convertedFormat}`
                      : 'FRAGMENT CONTENT'}
                  </CardTitle>
                  <CardDescription>
                    <span className="font-mono text-xs">{selectedFragment.id}</span>
                    {' • '}
                    <Badge variant="outline" className="ml-1">
                      {selectedFragment.type}
                    </Badge>
                    {selectedFragment.convertedType && (
                      <Badge variant="secondary" className="ml-2">
                        Converted to {selectedFragment.convertedType}
                      </Badge>
                    )}
                    {selectedFragment.convertedFormat && (
                      <Badge variant="secondary" className="ml-2">
                        Converted to {selectedFragment.convertedFormat}
                      </Badge>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 overflow-hidden">
                  <div className="bg-white border border-slate-200 rounded-lg p-6 max-h-[60vh] overflow-auto">
                    {selectedFragment.imageUrl || selectedFragment.convertedImageUrl ? (
                      <div className="flex justify-center items-center">
                        <img
                          src={selectedFragment.convertedImageUrl || selectedFragment.imageUrl}
                          alt="Fragment"
                          className="max-w-full max-h-[50vh] object-contain rounded-lg"
                        />
                      </div>
                    ) : selectedFragment.convertedType === 'text/html' && selectedFragment.convertedContent ? (
                      <div
                        className="rendered-html space-y-4"
                        dangerouslySetInnerHTML={{ __html: selectedFragment.convertedContent }}
                      />
                    ) : selectedFragment.isHtml && selectedFragment.htmlContent ? (
                      <div
                        className="rendered-html space-y-4"
                        dangerouslySetInnerHTML={{ __html: selectedFragment.htmlContent }}
                      />
                    ) : selectedFragment.convertedContent ? (
                      <pre className="text-sm whitespace-pre-wrap break-words font-mono text-slate-800">
                        {selectedFragment.convertedContent}
                      </pre>
                    ) : (
                      <pre className="text-sm whitespace-pre-wrap break-words font-mono text-slate-800">
                        {selectedFragment.content}
                      </pre>
                    )}
                  </div>
                  <div className="flex justify-between items-center mt-4">
                    <div className="flex gap-2 flex-wrap">
                      {/* Text conversions - Markdown */}
                      {selectedFragment.type === 'text/markdown' && (
                        <div className="flex gap-2 items-center flex-wrap">
                          {selectedFragment.convertedType || selectedFragment.isHtml ? (
                            <Button onClick={handleViewRaw} variant="secondary" size="sm">
                              View Original
                            </Button>
                          ) : (
                            <>
                              <span className="text-sm text-slate-600">Convert to:</span>
                              <Button
                                onClick={() => handleConvertText('html', 'text/html')}
                                variant="outline"
                                size="sm"
                                disabled={convertingText}
                              >
                                HTML
                              </Button>
                              <Button
                                onClick={() => handleConvertText('txt', 'text/plain')}
                                variant="outline"
                                size="sm"
                                disabled={convertingText}
                              >
                                Plain Text
                              </Button>
                            </>
                          )}
                        </div>
                      )}

                      {/* Text conversions - HTML */}
                      {selectedFragment.type === 'text/html' && (
                        <div className="flex gap-2 items-center flex-wrap">
                          {selectedFragment.convertedType ? (
                            <Button onClick={handleViewRaw} variant="secondary" size="sm">
                              View Original
                            </Button>
                          ) : (
                            <>
                              <span className="text-sm text-slate-600">Convert to:</span>
                              <Button
                                onClick={() => handleConvertText('txt', 'text/plain')}
                                variant="outline"
                                size="sm"
                                disabled={convertingText}
                              >
                                Plain Text
                              </Button>
                            </>
                          )}
                        </div>
                      )}
                      
                      {/* Image conversion buttons */}
                      {selectedFragment.type.startsWith('image/') && (
                        <div className="flex gap-2 items-center">
                          {selectedFragment.convertedFormat ? (
                            <Button
                              onClick={handleViewOriginalImage}
                              variant="secondary"
                              size="sm"
                            >
                              View Original
                            </Button>
                          ) : (
                            <>
                              <span className="text-sm text-slate-600">Convert to:</span>
                              {['PNG', 'JPEG', 'WebP', 'GIF', 'AVIF'].map((format) => {
                                // Don't show button for current format
                                const currentFormat = selectedFragment.type.split('/')[1].toUpperCase();
                                if (currentFormat === format || 
                                    (currentFormat === 'JPEG' && format === 'JPEG') ||
                                    (currentFormat === 'JPG' && format === 'JPEG')) {
                                  return null;
                                }
                                return (
                                  <Button
                                    key={format}
                                    onClick={() => handleConvertImage(format)}
                                    variant="outline"
                                    size="sm"
                                    disabled={convertingImage}
                                  >
                                    {format}
                                  </Button>
                                );
                              })}
                            </>
                          )}
                        </div>
                      )}
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

      {/* Edit Fragment Modal */}
      <AnimatePresence>
        {editingFragment && user && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 z-40 bg-black/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingFragment(null)}
            />

            {/* Modal content */}
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              initial={{ opacity: 0, scale: 0.98, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 8 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            >
              <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <CardHeader>
                  <CardTitle>Edit Fragment</CardTitle>
                  <CardDescription>Update the content of your fragment below.</CardDescription>
                </CardHeader>
                <CardContent>
                  <EditFragmentModal
                    fragmentId={editingFragment.id}
                    fragmentType={editingFragment.type}
                    initialContent={editingFragment.content}
                    user={user}
                    onClose={() => setEditingFragment(null)}
                    onUpdated={() => {
                      setEditingFragment(null);
                      initializeApp();
                    }}
                  />
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Loading Modal */}
      {(loadingFragment || loadingEditContent) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <Loader2 className="animate-spin h-8 w-8 text-white" />
        </div>
      )}
    </div>
  );
}
