"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, ShoppingCart, UtensilsCrossed, List, Users, Settings, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabaseClient"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

const sidebarItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
    { icon: ShoppingCart, label: "Orders", href: "/orders" },
    { icon: UtensilsCrossed, label: "Menu Items", href: "/menu-items" },
    { icon: List, label: "Categories", href: "/categories" },
    { icon: Users, label: "Users", href: "/users" },
]

export function Sidebar() {
    const pathname = usePathname()
    const router = useRouter()
    const supabase = createClient()

    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut()
        if (error) {
            toast.error("Error signing out")
            return
        }
        toast.success("Signed out successfully")
        router.push("/login")
    }

    return (
        <div className="flex h-full flex-col border-r bg-card text-card-foreground">
            <div className="flex h-14 items-center border-b px-6 lg:h-[60px]">
                <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl">
                    <span className="text-primary">ROMS</span> Admin
                </Link>
            </div>
            <div className="flex-1 overflow-auto py-4">
                <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
                    {sidebarItems.map((item, index) => (
                        <Link
                            key={index}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
                                pathname.startsWith(item.href)
                                    ? "bg-muted text-primary"
                                    : "text-muted-foreground"
                            )}
                        >
                            <item.icon className="h-4 w-4" />
                            {item.label}
                        </Link>
                    ))}
                </nav>
            </div>
            <div className="border-t p-4">
                <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground" onClick={handleLogout}>
                    <LogOut className="h-4 w-4" />
                    Logout
                </Button>
            </div>
        </div>
    )
}
