'use client'

import React, { useState, useEffect } from 'react';
import { supabaseBrowser } from '../lib/supabase-client';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Loader2, Camera, Utensils, MessageSquare, User, Scan, Activity, Settings, AlertTriangle, Eye, EyeOff, LogOut } from 'lucide-react';
import { useToast } from '../components/ui/use-toast';
import { SimpleProfilePopup } from '../components/SimpleProfilePopup';

// Utility function for safe JSON parsing
async function safeJson(response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch (error) {
    console.error('JSON parse error:', error, 'Raw text:', text.slice(0, 200));
    throw new Error(`Invalid JSON response: ${text.slice(0, 100)}...`);
  }
}

// AUTHENTICATION: Email/Password (NO OTP/Magic Link)
async function handleSignUp(email, password) {
  const supabase = supabaseBrowser();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: window.location.origin
    }
  });
  
  if (error) throw error;
  return data;
}

async function handleSignIn(email, password) {
  const supabase = supabaseBrowser();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  
  if (error) throw error;
  return data;
}

async function handleSignOut() {
  const supabase = supabaseBrowser();
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export default function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('scanner');
  const [authMode, setAuthMode] = useState('signin'); // signin, signup
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showProfilePopup, setShowProfilePopup] = useState(false);

  const { toast } = useToast();

  // Initialize authentication
  useEffect(() => {
    const supabase = supabaseBrowser();
    
    // Get initial session
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          await loadUserProfile(session.user);
        }
      } catch (error) {
        console.error('Session initialization error:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        await loadUserProfile(session.user);
      } else {
        setUser(null);
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load user profile (optional - app works without it)
  const loadUserProfile = async (currentUser) => {
    if (!currentUser) return;

    try {
      const supabase = supabaseBrowser();
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (token) {
        const response = await fetch('/api/me/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const profileData = await safeJson(response);
          setProfile(profileData);
        }
      }
    } catch (error) {
      console.error('Profile load error:', error);
      // Don't show error - profile is optional
    }
  };

  // Save profile (simple API call)
  const saveProfile = async (profileData) => {
    const supabase = supabaseBrowser();
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch('/api/me/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(profileData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Save failed: ${response.status} - ${errorText.slice(0, 200)}`);
    }

    const savedProfile = await safeJson(response);
    setProfile(savedProfile);
    
    toast({
      title: "Profile Saved!",
      description: "Your profile has been saved successfully.",
    });

    return savedProfile;
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (authMode === 'signup') {
        await handleSignUp(formData.email, formData.password);
        toast({
          title: "Account created!",
          description: "You can now sign in with your credentials.",
        });
        setAuthMode('signin');
      } else {
        const result = await handleSignIn(formData.email, formData.password);
        if (result.user) {
          toast({
            title: "Welcome back!",
            description: "Successfully signed in.",
          });
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
      toast({
        title: "Authentication Error",
        description: error.message || "Please check your credentials and try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Show auth form if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">
              {authMode === 'signin' ? 'Sign In' : 'Create Account'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleAuthSubmit} className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="email"
                  placeholder="Email address"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>
              
              <div className="space-y-2 relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-0 h-full px-2"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>

              <Button 
                type="submit" 
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {authMode === 'signin' ? 'Signing In...' : 'Creating Account...'}
                  </>
                ) : (
                  authMode === 'signin' ? 'Sign In' : 'Create Account'
                )}
              </Button>
            </form>

            <div className="text-center">
              <Button
                variant="link"
                onClick={() => {
                  setAuthMode(authMode === 'signin' ? 'signup' : 'signin');
                  setFormData({ email: '', password: '' });
                }}
                className="text-sm"
              >
                {authMode === 'signin' 
                  ? "Don't have an account? Sign up" 
                  : "Already have an account? Sign in"
                }
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main app interface - ALWAYS accessible once authenticated
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">Fitbear AI</h1>
              {profile?.name ? (
                <Badge variant="secondary">Welcome, {profile.name}!</Badge>
              ) : (
                <Badge variant="outline">Welcome!</Badge>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              {!profile && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowProfilePopup(true)}
                  className="flex items-center gap-2"
                >
                  <User className="h-4 w-4" />
                  Set Up Profile
                </Button>
              )}
              
              {profile && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowProfilePopup(true)}
                  className="flex items-center gap-2"
                >
                  <User className="h-4 w-4" />
                  Edit Profile
                </Button>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  try {
                    await handleSignOut();
                    toast({
                      title: "Signed Out",
                      description: "You have been successfully signed out.",
                    });
                  } catch (error) {
                    toast({
                      title: "Error",
                      description: "Failed to sign out. Please try again.",
                      variant: "destructive",
                    });
                  }
                }}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Optional Profile Popup */}
      <SimpleProfilePopup
        isOpen={showProfilePopup}
        onClose={() => setShowProfilePopup(false)}
        onSave={saveProfile}
        user={user}
      />

      {/* Main App Content - Always Available */}
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {!profile && (
          <Alert className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Set up your profile for personalized recommendations! 
              <Button 
                variant="link" 
                className="ml-2 p-0 h-auto"
                onClick={() => setShowProfilePopup(true)}
              >
                Click here
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="scanner" className="flex items-center gap-2">
              <Scan className="h-4 w-4" />
              Menu Scanner
            </TabsTrigger>
            <TabsTrigger value="photo" className="flex items-center gap-2">
              <Camera className="h-4 w-4" />
              Meal Photo
            </TabsTrigger>
            <TabsTrigger value="coach" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Coach C
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="scanner" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scan className="h-5 w-5" />
                  Menu Scanner
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Upload a restaurant menu photo to get personalized food recommendations.
                </p>
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Menu scanning feature ready. Upload menu images for AI-powered recommendations.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="photo" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  Meal Photo Analyzer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Take or upload a photo of your meal for nutritional analysis.
                </p>
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Photo analysis feature ready. Upload meal photos for nutritional insights.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="coach" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Coach C - Your AI Nutrition Assistant
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Chat with Coach C for personalized nutrition advice and meal planning.
                </p>
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    AI Coach ready. Ask questions about nutrition, meal planning, and health goals.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Health History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Track your daily nutrition progress and meal history.
                </p>
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    History tracking ready. Your meal logs and progress will appear here.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}