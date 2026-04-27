import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [role, setRole] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // 1. Check active session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null)
            if (session?.user) fetchProfile(session.user.id)
            else setLoading(false)
        })

        // 2. Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null)
            if (session?.user) {
                fetchProfile(session.user.id)
            } else {
                setRole(null)
                setLoading(false)
            }
        })

        return () => subscription.unsubscribe()
    }, [])

    async function fetchProfile(userId) {
        try {
            // We assume a 'profiles' table exists with a 'role' column. 
            // If not, we might default to 'TECH' or check metadata.
            const { data, error } = await supabase
                .from('profiles')
                .select('role, name')
                .eq('id', userId)
                .single()

            if (data) {
                setRole(data.role)
                setUser(prev => ({
                    ...prev,
                    user_metadata: {
                        ...prev?.user_metadata,
                        name: data.name || prev?.user_metadata?.name
                    }
                }))
            } else {
                // Fallback if no profile found (optional: create one or default to basic role)
                console.log('No profile found, defaulting role')
                setRole('TECH')
            }
        } catch (err) {
            console.error('Error fetching profile:', err)
        } finally {
            setLoading(false)
        }
    }

    const value = {
        user,
        role,
        loading,
        signIn: (email, password) => supabase.auth.signInWithPassword({ email, password }),
        signOut: async () => {
            try { await supabase.auth.signOut({ scope: 'local' }) } catch (_) {}
            setUser(null)
            setRole(null)
        },
    }

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    return useContext(AuthContext)
}
