import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase.ts'
import { Button } from '../../components/ui/Button.tsx'
import { Input } from '../../components/ui/Input.tsx'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/Card.tsx'
import { toast } from 'sonner'
import { Utensils } from 'lucide-react'

export default function LoginStudent() {
    const [isLogin, setIsLogin] = useState(false)
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
            setLoading(false)
            return
        }

        toast.success('Registration successful!')
        setFullName('')
        setEmail('')
        setPassword('')
        setIsLogin(true)
    }

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
                .maybeSingle()

            if (profile?.role === 'staff') {
                toast.error('This is a staff account. Please login through the staff portal.')
                await supabase.auth.signOut()
                setLoading(false)
                return
            }

            toast.success('Logged in successfully!')
            navigate('/student')
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
                    <CardTitle className="text-2xl font-bold flex items-center gap-2">
                        <Utensils className="text-primary h-6 w-6" />
                        {isLogin ? 'Student Login' : 'Student Registration'}
                    </CardTitle>
                    <CardDescription>
                        {isLogin ? 'Access your student portal' : 'Create a new account'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={isLogin ? handleLogin : handleRegister} className="space-y-4">
                        {!isLogin && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none">Full Name</label>
                                <Input
                                    placeholder="John Doe"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    required
                                />
                            </div>
                        )}
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
                            {loading ? (isLogin ? 'Authenticating...' : 'Creating account...') : (isLogin ? 'Sign In' : 'Register')}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex justify-center text-center">
                    <p className="text-sm text-muted-foreground w-full">
                        {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
                        <button
                            type="button"
                            onClick={() => {
                                setIsLogin(!isLogin)
                                setEmail('')
                                setPassword('')
                                setFullName('')
                            }}
                            className="text-primary hover:underline cursor-pointer"
                        >
                            {isLogin ? 'Register here' : 'Sign in here'}
                        </button>
                    </p>
                </CardFooter>
            </Card>
        </div>
    )
}
