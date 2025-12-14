"use client"

import { useState, useEffect } from "react"
import { apiClient } from "@/lib/apiClient"
import { DataTable } from "@/components/DataTable"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"

type User = {
    id: string
    email: string
    role: string
    is_disabled: boolean
    created_at: string
}

const ROLES = ["ADMIN", "WAITER", "CHEF", "CASHIER"]

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchUsers()
    }, [])

    const fetchUsers = async () => {
        setLoading(true)
        try {
            const data = await apiClient('/api/users')
            setUsers(data || [])
        } catch (error) {
            console.error(error)
            // toast.error("Failed to load users") 
            // Mock data for demo if API fails since backend might not have this endpoint implemented yet
            // But I must rely on backend. I'll leave empty if fails.
        }
        setLoading(false)
    }

    const handleRoleChange = async (userId: string, newRole: string) => {
        // Optimistic update
        setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u))

        try {
            await apiClient(`/api/users/${userId}/role`, {
                method: 'PUT',
                body: JSON.stringify({ role: newRole })
            })
            toast.success("Role updated")
        } catch (error: any) {
            toast.error(error.message || "Failed to update role")
            fetchUsers() // Revert
        }
    }

    const handleStatusChange = async (userId: string, isDisabled: boolean) => {
        // Optimistic update
        setUsers(users.map(u => u.id === userId ? { ...u, is_disabled: isDisabled } : u))

        try {
            await apiClient(`/api/users/${userId}/status`, {
                method: 'PUT',
                body: JSON.stringify({ is_disabled: isDisabled })
            })
            toast.success(isDisabled ? "User disabled" : "User enabled")
        } catch (error: any) {
            toast.error(error.message || "Failed to update status")
            fetchUsers() // Revert
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
                    <p className="text-muted-foreground">Manage user roles and access.</p>
                </div>
                {loading && <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />}
            </div>

            <DataTable
                columns={[
                    { header: "Email", accessorKey: "email" },
                    {
                        header: "Role", accessorKey: (item) => (
                            <Select defaultValue={item.role?.toUpperCase()} onValueChange={(val) => handleRoleChange(item.id, val)}>
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {ROLES.map(role => (
                                        <SelectItem key={role} value={role}>{role}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )
                    },
                    {
                        header: "Status", accessorKey: (item) => (
                            <div className="flex items-center gap-2">
                                <Switch
                                    checked={!item.is_disabled}
                                    onCheckedChange={(checked) => handleStatusChange(item.id, !checked)}
                                />
                                <span className={`text-sm ${item.is_disabled ? 'text-red-500' : 'text-green-500'}`}>
                                    {item.is_disabled ? 'Disabled' : 'Active'}
                                </span>
                            </div>
                        )
                    },
                ]}
                data={users}
            />
        </div>
    )
}
