"use client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useOrganization } from "@/lib/organizations/useOrganization";
import useOrganizations from "@/lib/organizations/useOrganizations";
import useCredits from "@/lib/users/useCredits";
import useCurrentPlan from "@/lib/users/useCurrentPlan";
import useUser from "@/lib/users/useUser";
import {
  BookOpenIcon,
  CreditCardIcon,
  DatabaseIcon,
  ExternalLinkIcon,
  SettingsIcon,
  ShieldCheckIcon,
  UserIcon,
} from "lucide-react";
import Link from "next/link";
import React from "react";

function AppHomepage() {
  const { currentPlan, isLoading: planLoading, error: planError } = useCurrentPlan();
  const { credits, isLoading: creditsLoading, error: creditsError } = useCredits();
  const { user, isLoading: userLoading, error: userError } = useUser();
  const {
    organization,
    isLoading: organizationLoading,
    error: organizationError,
    switchOrganization,
  } = useOrganization();
  const { organizations } = useOrganizations();

  const hasError = planError || userError || creditsError || organizationError;

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">In app dashboard</h1>
        <p className="text-muted-foreground">
          Explore the features and data available in your app. This demo showcases the hooks and
          utilities you can use throughout your application.
        </p>
      </div>

      {/* Error State */}
      {hasError && (
        <Alert variant="destructive">
          <AlertDescription>
            Error loading data:{" "}
            {planError?.message ||
              userError?.message ||
              creditsError?.message ||
              organizationError?.message}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DatabaseIcon className="h-5 w-5" />
            useOrganization() Hook Output
          </CardTitle>
          <CardDescription>현재 활성 조직 컨텍스트와 역할 기반 접근 정보</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {organizationLoading ? (
            <div className="flex flex-col gap-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : organization ? (
            <>
              <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto max-h-60">
                {JSON.stringify(organization, null, 2)}
              </pre>
              {organizations.length > 1 && (
                <select
                  className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={organization.id}
                  onChange={(event) => {
                    void switchOrganization(event.target.value);
                  }}
                >
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name} ({org.role})
                    </option>
                  ))}
                </select>
              )}
            </>
          ) : (
            <p className="text-muted-foreground">
              아직 활성 조직이 없습니다. 조직을 생성하거나 초대를 수락하세요.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Data Display Section */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* User Data Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserIcon className="h-5 w-5" />
              useUser() Hook Output
            </CardTitle>
            <CardDescription>Current user data from the /api/app/me endpoint</CardDescription>
          </CardHeader>
          <CardContent>
            {userLoading ? (
              <div className="flex flex-col gap-3">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : user ? (
              <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto max-h-80">
                {JSON.stringify(user, null, 2)}
              </pre>
            ) : (
              <p className="text-muted-foreground">No user data available</p>
            )}
          </CardContent>
        </Card>

        {/* Current Plan Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DatabaseIcon className="h-5 w-5" />
              useCurrentPlan() Hook Output
            </CardTitle>
            <CardDescription>Current subscription plan and quotas</CardDescription>
          </CardHeader>
          <CardContent>
            {planLoading ? (
              <div className="flex flex-col gap-3">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : currentPlan ? (
              <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto max-h-80">
                {JSON.stringify(currentPlan, null, 2)}
              </pre>
            ) : (
              <p className="text-muted-foreground">No plan data available</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Credits Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCardIcon className="h-5 w-5" />
            useCredits() Hook Output
          </CardTitle>
          <CardDescription>Current credits data from the /api/app/me endpoint</CardDescription>
        </CardHeader>
        <CardContent>
          {creditsLoading ? (
            <div className="flex flex-col gap-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : credits ? (
            <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto max-h-80">
              {JSON.stringify(credits, null, 2)}
            </pre>
          ) : (
            <p className="text-muted-foreground">No credits data available</p>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="h-5 w-5" />
            Quick Actions
          </CardTitle>
          <CardDescription>Navigate to different sections of the application</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              nativeButton={false}
              className="flex-1"
              render={
                <Link
                  href="https://indiekit.pro/app/docs"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <BookOpenIcon className="mr-2 h-4 w-4" />
                  View Documentation
                  <ExternalLinkIcon className="ml-2 h-3 w-3" />
                </Link>
              }
            />
            <Button
              nativeButton={false}
              variant="outline"
              className="flex-1"
              render={
                <Link href="/app/profile">
                  <UserIcon className="mr-2 h-4 w-4" />
                  View User Profile
                </Link>
              }
            />

            <Button
              nativeButton={false}
              variant="outline"
              className="flex-1"
              render={
                <Link href="/app/credits/history">
                  <CreditCardIcon className="mr-2 h-4 w-4" />
                  Credits History
                </Link>
              }
            />

            <Button
              nativeButton={false}
              variant="default"
              className="flex-1"
              render={
                <Link href="/super-admin">
                  <ShieldCheckIcon className="mr-2 h-4 w-4" />
                  Super Admin
                </Link>
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Development Info */}
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-sm">🔧 Development Notes</CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground">
          <ul className="list-disc list-inside flex flex-col gap-1">
            <li>Both hooks use TanStack Query for caching and automatic revalidation</li>
            <li>
              Data is fetched from <code>/api/app/me</code> endpoint
            </li>
            <li>Super admin status is determined by SUPER_ADMIN_EMAILS environment variable</li>
            <li>
              All components follow the &apos;use client&apos; directive for client-side
              interactivity
            </li>
            <li>Error handling and loading states are built-in to both hooks</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

export default AppHomepage;
