import { Routes, Route, Navigate } from 'react-router-dom'
import Landing from './pages/Landing.tsx'
import LoginStudent from './pages/auth/LoginStudent.tsx'
import RegisterStudent from './pages/auth/RegisterStudent.tsx'
import LoginStaff from './pages/auth/LoginStaff.tsx'
import StudentDashboard from './pages/student/Dashboard.tsx'
import StaffDashboard from './pages/staff/Dashboard.tsx'
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase.ts'

function App() {
  const [session, setSession] = useState<any>(null)
  const [role, setRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session?.user) {
        fetchRole(session.user.id)
      } else {
        setLoading(false)
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session?.user) {
        fetchRole(session.user.id)
      } else {
        setRole(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchRole = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .maybeSingle()

    if (!error && data) {
      setRole(data.role)
    } else {
      setRole('student')
    }
    setLoading(false)
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen font-sans">
      <Routes>
        <Route path="/" element={<Landing />} />

        {/* Auth Routes */}
        <Route path="/login/student" element={!session ? <LoginStudent /> : <Navigate to={role === 'staff' ? '/staff' : '/student'} />} />
        <Route path="/register" element={!session ? <RegisterStudent /> : <Navigate to={role === 'staff' ? '/staff' : '/student'} />} />
        <Route path="/login/staff" element={!session ? <LoginStaff /> : <Navigate to={role === 'staff' ? '/staff' : '/student'} />} />

        {/* Protected Routes */}
        <Route
          path="/student/*"
          element={session && role === 'student' ? <StudentDashboard session={session} /> : <Navigate to="/login/student" />}
        />
        <Route
          path="/staff/*"
          element={session && role === 'staff' ? <StaffDashboard session={session} /> : <Navigate to="/login/staff" />}
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  )
}

export default App
