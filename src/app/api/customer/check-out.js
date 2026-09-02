
import { getSession } from '@/lib/session'

export default async function handler(req, res) {
  const session = await getSession(req, res)
  
  if (session.customer) {
    return res.status(200).json({ 
      isAuthenticated: true,
      customer: session.customer
    })
  }
  
  return res.status(200).json({ 
    isAuthenticated: false 
  })
}