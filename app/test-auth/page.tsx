'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { AuthError } from '@supabase/supabase-js'

export default function TestAuthPage() {
  const [result, setResult] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  
  const testAuth = async () => {
    setLoading(true)
    setResult('Testing...')
    
    // Use a completely valid email format
    const randomNum = Math.floor(Math.random() * 100000)
    const testEmail = `johndoe${randomNum}@gmail.com`
    const testPassword = 'TestPassword123!'
    
    try {
      console.log('Testing with:', testEmail)
      
      // Try to sign up
      const { data, error } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
      })
      
      if (error) {
        console.error('Auth error:', error)
        const authError = error as AuthError
        setResult(`Auth Error: ${authError.message}\nCode: ${authError.code || 'unknown'}\nStatus: ${authError.status || 'unknown'}`)
      } else {
        console.log('Success:', data)
        setResult(`Success! User created: ${data.user?.id}\nEmail: ${data.user?.email}`)
        
        // Clean up - sign out
        await supabase.auth.signOut()
      }
    } catch (err) {
      console.error('Unexpected error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setResult(`Unexpected Error: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }
  
  const checkConnection = async () => {
    setLoading(true)
    try {
      // Try a simple query
      const { data, error } = await supabase
        .from('providers')
        .select('count')
        .limit(1)
        .single()
      
      if (error) {
        setResult(`Database connection error: ${error.message}`)
      } else {
        setResult('Database connection successful!')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown connection error'
      setResult(`Connection error: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Test Supabase Auth</h1>
        
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600 mb-2">Environment:</p>
            <p className="font-mono text-xs break-all">
              URL: {process.env.NEXT_PUBLIC_SUPABASE_URL}
            </p>
            <p className="font-mono text-xs">
              Key: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20)}...
            </p>
          </div>
          
          <div className="flex gap-4">
            <button
              onClick={testAuth}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              Test Auth Sign Up
            </button>
            
            <button
              onClick={checkConnection}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              Test Database Connection
            </button>
          </div>
          
          {result && (
            <div className="bg-white p-4 rounded-lg shadow">
              <pre className="whitespace-pre-wrap text-sm">{result}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}