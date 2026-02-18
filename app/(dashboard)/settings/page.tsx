/**
 * SecureLogTI - Settings Page
 * User account settings and preferences
 */

"use client"

import { Header } from "@/components/layout/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/lib/auth-context"
import { useState } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle } from "lucide-react"

export default function SettingsPage() {
  const { user } = useAuth()
  const [saved, setSaved] = useState(false)

  // Get user initials
  const userInitials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U"

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="min-h-screen">
      <Header title="Settings" subtitle="Manage your account and preferences" />

      <div className="p-6 space-y-6">
        {saved && (
          <Alert className="bg-success/10 border-success/50 text-success">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>Settings saved successfully!</AlertDescription>
          </Alert>
        )}

        {/* User Profile */}
        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="text-card-foreground">Your Profile</CardTitle>
            <CardDescription>Your account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground text-2xl font-bold">
                {userInitials}
              </div>
              <div>
                <p className="text-lg font-medium text-card-foreground">{user?.name || "User"}</p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Display Name</Label>
                <Input id="name" defaultValue={user?.name} className="bg-secondary border-border" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  defaultValue={user?.email}
                  disabled
                  className="bg-secondary border-border opacity-60"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="text-card-foreground">Notification Preferences</CardTitle>
            <CardDescription>Configure how you receive security alerts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="critical-alerts" className="text-card-foreground">
                  High-Risk Threat Alerts
                </Label>
                <p className="text-sm text-muted-foreground">Get notified when high-risk threats are detected</p>
              </div>
              <Switch id="critical-alerts" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="weekly-report" className="text-card-foreground">
                  Weekly Summary
                </Label>
                <p className="text-sm text-muted-foreground">Receive a weekly summary of your security status</p>
              </div>
              <Switch id="weekly-report" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="learning-tips" className="text-card-foreground">
                  Security Tips
                </Label>
                <p className="text-sm text-muted-foreground">Get educational tips on cybersecurity best practices</p>
              </div>
              <Switch id="learning-tips" />
            </div>
          </CardContent>
        </Card>

        {/* Privacy & Data */}
        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="text-card-foreground">Privacy & Data</CardTitle>
            <CardDescription>Manage your data and privacy settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="data-retention" className="text-card-foreground">
                  Extended Data Retention
                </Label>
                <p className="text-sm text-muted-foreground">Keep your logs for 90 days instead of 30</p>
              </div>
              <Switch id="data-retention" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="anonymize" className="text-card-foreground">
                  Anonymize Reports
                </Label>
                <p className="text-sm text-muted-foreground">Mask sensitive IP addresses in reports</p>
              </div>
              <Switch id="anonymize" />
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="bg-card border-danger/30">
          <CardHeader>
            <CardTitle className="text-danger">Danger Zone</CardTitle>
            <CardDescription>Irreversible actions for your account</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-card-foreground">Delete All Data</p>
                <p className="text-sm text-muted-foreground">Permanently delete all your logs and threat data</p>
              </div>
              <Button variant="outline" className="text-danger border-danger/50 hover:bg-danger/10 bg-transparent">
                Delete Data
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-card-foreground">Delete Account</p>
                <p className="text-sm text-muted-foreground">Permanently delete your account and all associated data</p>
              </div>
              <Button variant="outline" className="text-danger border-danger/50 hover:bg-danger/10 bg-transparent">
                Delete Account
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-4">
          <Button className="bg-primary text-primary-foreground" onClick={handleSave}>
            Save Changes
          </Button>
          <Button variant="outline" className="bg-transparent">
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}
