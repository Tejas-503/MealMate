import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase.ts'
import { Button } from '../../components/ui/Button.tsx'
import { Input } from '../../components/ui/Input.tsx'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/Card.tsx'
import { toast } from 'sonner'
import { ChefHat } from 'lucide-react'

export default function LoginStaff() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) {
            toast.error(error.message)
            setLoading(false)
            return
        }

        if (data.user) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', data.user.id)
                .single()

            if (profile?.role !== 'staff') {
                toast.error('Not a staff account.')
                await supabase.auth.signOut()
            } else {
                toast.success('Logged in successfully!')
                navigate('/staff')
            }
        }
        setLoading(false)
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
            <div className="absolute top-8 left-8">
                <Link to="/" className="flex items-center space-x-2 text-secondary font-bold text-xl">
                    <ChefHat className="h-6 w-6" />
                    <span>MealMate</span>
                </Link>
            </div>

            <Card className="w-full max-w-md border-secondary/20">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold flex items-center gap-2">
                        <ChefHat className="text-secondary h-6 w-6" />
                        Staff Login
                    </CardTitle>
                    <CardDescription>Access the administration dashboard</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none">Staff Email</label>
                            <Input
                                type="email"
                                placeholder="staff@college.edu"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none">Password</label>
                            <Input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        <Button type="submit" variant="secondary" className="w-full" disabled={loading}>
                            {loading ? 'Authenticating...' : 'Sign in to Dashboard'}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex justify-center text-center">
                    <p className="text-sm text-muted-foreground w-full">
                        Not a staff member?{' '}
                        <Link to="/login/student" className="text-secondary hover:underline">
                            Student portal
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    )
}
