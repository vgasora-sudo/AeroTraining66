// src/supabase.js
import { createClient } from '@supabase/supabase-js'

// 🔥 CLAVES DIRECTAS
const supabaseUrl = 'https://llxqiampzlibdsmkfxzp.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxseHFpYW1wemxpYmRzbWtmeHpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM5MjgzNTgsImV4cCI6MjA5OTUwNDM1OH0.CU0GGlPn6CbtsPyEVXKPHn0bFys15VII2Wz19dhYOig'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const getAlumnoProfile = async (userId) => {
  const { data, error } = await supabase
    .from('alumnos')
    .select('*')
    .eq('user_id', userId)
    .single()
  
  if (error) return null
  return data
}

export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}
