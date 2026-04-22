import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL,
  process.env.PUBLIC_SUPABASE_ANON_KEY
)

async function checkTables() {
  const { data, error } = await supabase.schema('nutricionista').from('tarjetas').select('id').limit(1)
  console.log('Tarjetas exists:', !!data)
  
  const { data: admins, error: adminError } = await supabase.schema('nutricionista').from('admins').select('*')
  console.log('Admins table exists:', !adminError)
  if (adminError) console.error(adminError.message)
  else console.log('Admins:', admins)
}

checkTables()
