import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase.ts'
import { Button } from '../../components/ui/Button.tsx'
import { Input } from '../../components/ui/Input.tsx'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/Card.tsx'
import { toast } from 'sonner'
import { Utensils } from 'lucide-react'

export default function RegisterStudent() {
    const [fullName, setFullName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                    role: 'student'
                }
            }
        })

        if (error) {
            toast.error(error.message)
        } else {
            toast.success('Registration successful. Please login.')
            navigate('/login/student')
        }
        setLoading(false)
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
            <div className="absolute top-8 left-8">
                <Link to="/" className="flex items-center space-x-2 text-primary font-bold text-xl">
                    <Utensils className="h-6 w-6" />
                    <span>MealMate</span>
                </Link>
            </div>

            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold">Create an Account</CardTitle>
                    <CardDescription>Enter your details to register as a student</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleRegister} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none">Full Name</label>
                            <Input
                                placeholder="John Doe"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none">Email</label>
                            <Input
                                type="email"
                                placeholder="student@college.edu"
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
                                minLength={6}
                            />
                        </div>
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? 'Creating account...' : 'Register'}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex justify-center">
                    <p className="text-sm text-muted-foreground">
                        Already have an account?{' '}
                        <Link to="/login/student" className="text-primary hover:underline">
                            Sign in here
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    )
}
