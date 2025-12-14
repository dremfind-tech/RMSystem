"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { ThemeToggle } from "@/components/ThemeToggle"
import { createClient } from "@/lib/supabaseClient"
import { useEffect, useState } from "react"

export default function SettingsPage() {
    const [user, setUser] = useState<any>(null)
    const supabase = createClient()

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => setUser(data.user))
    }, [])

    return (
        <div className="space-y-6">
            <div className="space-y-0.5">
                <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
                <p className="text-muted-foreground">
                    Manage your account settings and set e-mail preferences.
                </p>
            </div>
            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Appearance</CardTitle>
                        <CardDescription>Customize the look and feel of the admin panel.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-center justify-between">
                        <div className="space-y-1">
                            <Label>Theme</Label>
                            <p className="text-sm text-muted-foreground">Select your preferred theme (Light, Dark, or System).</p>
                        </div>
                        <ThemeToggle />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Account Information</CardTitle>
                        <CardDescription>Your current session details.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="font-semibold">Email</div>
                            <div>{user?.email}</div>
                            <div className="font-semibold">User ID</div>
                            <div className="truncate font-mono text-xs">{user?.id}</div>
                            <div className="font-semibold">Role</div>
                            <div>
                                {user?.user_metadata?.role || user?.app_metadata?.role || 'User'}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
