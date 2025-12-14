"use client"

import { ThemeToggle } from "@/components/ThemeToggle"
import { Button } from "./ui/button"
import { Menu, User } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Sidebar } from "@/components/Sidebar"

export function Header() {
    return (
        <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:h-[60px] lg:px-6">
            <Sheet>
                <SheetTrigger asChild>
                    <Button
                        variant="outline"
                        size="icon"
                        className="shrink-0 lg:hidden"
                    >
                        <Menu className="h-5 w-5" />
                        <span className="sr-only">Toggle navigation menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="flex flex-col p-0 w-[240px] sm:w-[300px]">
                    <Sidebar />
                </SheetContent>
            </Sheet>
            <div className="flex-1">
            </div>
            <div className="flex items-center gap-4">
                <ThemeToggle />
                <Button variant="ghost" size="icon" className="rounded-full">
                    <User className="h-5 w-5" />
                    <span className="sr-only">User profile</span>
                </Button>
            </div>
        </header>
    )
}
