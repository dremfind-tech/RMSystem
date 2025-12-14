import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function UnauthorizedPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background">
            <h1 className="text-4xl font-bold mb-4">Unauthorized</h1>
            <p className="mb-8 text-muted-foreground">You do not have permission to access this page.</p>
            <Button asChild>
                <Link href="/login">Back to Login</Link>
            </Button>
        </div>
    )
}
