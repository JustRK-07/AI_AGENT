"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AiOutlineLoading3Quarters, AiOutlineUser, AiOutlineMail, AiOutlineLock } from "react-icons/ai";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Mock data for profile
const mockProfile = {
  id: "user-123",
  email: "admin@ytel.com",
  username: "administrator",
  firstName: "Administrator",
  lastName: "",
  createdAt: new Date().toISOString(),
  lastLoginAt: new Date().toISOString(),
  tenant: {
    id: "tenant-123",
    name: "Ytel Demo Organization",
    domain: "demo.ytel.com"
  }
};

interface UserProfile {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  createdAt: string;
  lastLoginAt: string;
  tenant?: {
    id: string;
    name: string;
    domain: string;
  };
}

export default function Profile() {
  const router = useRouter();
  const logout = () => router.push("/auth");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const [profileForm, setProfileForm] = useState({
    firstName: "",
    lastName: "",
    username: "",
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    // Load mock profile data
    setProfile(mockProfile);
    setProfileForm({
      firstName: mockProfile.firstName,
      lastName: mockProfile.lastName,
      username: mockProfile.username,
    });
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    // Simulate API delay
    setTimeout(() => {
      // Update mock profile
      setProfile({
        ...mockProfile,
        firstName: profileForm.firstName,
        lastName: profileForm.lastName,
        username: profileForm.username,
      });
      toast.success("Profile updated successfully");
      setIsSaving(false);
    }, 500);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsChangingPassword(true);

    // Validation
    if (passwordForm.newPassword.length < 8) {
      toast.error("New password must be at least 8 characters long");
      setIsChangingPassword(false);
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New passwords do not match");
      setIsChangingPassword(false);
      return;
    }

    // Simulate password change
    setTimeout(() => {
      toast.success("Password changed successfully. Please login again.");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setIsChangingPassword(false);
      setTimeout(() => {
        router.push("/auth");
      }, 2000);
    }, 500);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <AiOutlineLoading3Quarters className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Profile - Ytel</title>
        <meta name="description" content="User Profile" />
      </Head>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 dark:bg-slate-900 py-12">
        <div className="max-w-4xl mx-auto px-4">
          {/* Profile Header with Avatar */}
          <div className="mb-8">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center space-x-6">
                <div className="relative group">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                    <AiOutlineUser className="h-12 w-12 text-white" />
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-white dark:border-slate-800 animate-pulse"></div>
                  <button
                    className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs"
                    onClick={() => toast.info("Profile picture upload coming soon!")}
                  >
                    Change
                  </button>
                </div>
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                    {profile?.firstName}{profile?.lastName ? ` ${profile.lastName}` : ''}
                  </h1>
                  <p className="text-blue-600 dark:text-blue-400 mt-1">@{profile?.username}</p>
                  <p className="text-slate-600 dark:text-slate-400 mt-2">
                    {profile?.email}
                  </p>
                  <div className="flex items-center space-x-4 mt-3">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                      Active
                    </span>
                    {profile?.tenant && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                        {profile.tenant.name}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 bg-white dark:bg-slate-800 p-1 rounded-lg shadow-sm">
              <TabsTrigger value="profile" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                <AiOutlineUser className="h-4 w-4 mr-2" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="password" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                <AiOutlineLock className="h-4 w-4 mr-2" />
                Password
              </TabsTrigger>
              <TabsTrigger value="info" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                <AiOutlineMail className="h-4 w-4 mr-2" />
                Account Info
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <Card className="border-slate-200 dark:border-slate-700 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800">
                  <CardTitle className="text-slate-900 dark:text-slate-100">Profile Information</CardTitle>
                  <CardDescription>
                    Update your personal information
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          value={profileForm.firstName}
                          onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                          className="bg-slate-50 dark:bg-slate-900"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          value={profileForm.lastName}
                          onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                          className="bg-slate-50 dark:bg-slate-900"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <AiOutlineUser className="h-5 w-5 text-slate-400" />
                        </div>
                        <Input
                          id="username"
                          value={profileForm.username}
                          onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })}
                          className="pl-10 bg-slate-50 dark:bg-slate-900"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <AiOutlineMail className="h-5 w-5 text-slate-400" />
                        </div>
                        <Input
                          id="email"
                          value={profile?.email || ""}
                          disabled
                          className="pl-10 bg-slate-100 dark:bg-slate-800 cursor-not-allowed"
                        />
                      </div>
                      <p className="text-xs text-slate-500">Email cannot be changed</p>
                    </div>

                    <div className="flex justify-end pt-4">
                      <Button
                        type="submit"
                        disabled={isSaving}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {isSaving ? (
                          <AiOutlineLoading3Quarters className="h-5 w-5 animate-spin" />
                        ) : (
                          "Save Changes"
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="password">
              <Card className="border-slate-200 dark:border-slate-700 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800">
                  <CardTitle className="text-slate-900 dark:text-slate-100">Change Password</CardTitle>
                  <CardDescription>
                    Update your password to keep your account secure
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <AiOutlineLock className="h-5 w-5 text-slate-400" />
                        </div>
                        <Input
                          id="currentPassword"
                          type="password"
                          value={passwordForm.currentPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                          className="pl-10 bg-slate-50 dark:bg-slate-900"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <AiOutlineLock className="h-5 w-5 text-slate-400" />
                        </div>
                        <Input
                          id="newPassword"
                          type="password"
                          value={passwordForm.newPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                          className="pl-10 bg-slate-50 dark:bg-slate-900"
                          placeholder="Minimum 8 characters"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <AiOutlineLock className="h-5 w-5 text-slate-400" />
                        </div>
                        <Input
                          id="confirmPassword"
                          type="password"
                          value={passwordForm.confirmPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                          className="pl-10 bg-slate-50 dark:bg-slate-900"
                          required
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-4">
                      <Button
                        type="submit"
                        disabled={isChangingPassword}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {isChangingPassword ? (
                          <AiOutlineLoading3Quarters className="h-5 w-5 animate-spin" />
                        ) : (
                          "Change Password"
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="info">
              <Card className="border-slate-200 dark:border-slate-700 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800">
                  <CardTitle className="text-slate-900 dark:text-slate-100">Account Information</CardTitle>
                  <CardDescription>
                    View your account details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                      <Label className="text-slate-500 text-xs uppercase font-semibold">User ID</Label>
                      <p className="text-sm font-mono mt-2 text-slate-900 dark:text-slate-100">{profile?.id}</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                      <Label className="text-slate-500 text-xs uppercase font-semibold">Email</Label>
                      <p className="text-sm mt-2 text-slate-900 dark:text-slate-100">{profile?.email}</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                      <Label className="text-slate-500 text-xs uppercase font-semibold">Account Created</Label>
                      <p className="text-sm mt-2 text-slate-900 dark:text-slate-100">
                        {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
                      </p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                      <Label className="text-slate-500 text-xs uppercase font-semibold">Last Login</Label>
                      <p className="text-sm mt-2 text-slate-900 dark:text-slate-100">
                        {profile?.lastLoginAt ? new Date(profile.lastLoginAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
                      </p>
                    </div>
                  </div>

                  {profile?.tenant && (
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-900 p-6 rounded-lg border border-blue-200 dark:border-slate-700">
                      <Label className="text-slate-700 dark:text-slate-300 text-xs uppercase font-semibold flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        Organization
                      </Label>
                      <div className="mt-3 space-y-2">
                        <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{profile.tenant.name}</p>
                        <p className="text-sm text-blue-600 dark:text-blue-400">{profile.tenant.domain}</p>
                        <p className="text-xs font-mono text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-2 py-1 rounded inline-block">
                          ID: {profile.tenant.id}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}
