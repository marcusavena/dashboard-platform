'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function Dashboard() {
  const [deals, setDeals] = useState([])
  const [loading, setLoading] = useState(true)
  const [totalFunded, setTotalFunded] = useState(0)
  
  const supabase = createClientComponentClient()

  useEffect(() => {
    async function fetchDeals() {
      try {
        const { data, error } = await supabase
          .from('mca_deals')
          .select('*')
          .order('date_funded', { ascending: false })

        if (error) {
          console.error('Error fetching deals:', error)
          setLoading(false)
          return
        }

        if (data) {
          setDeals(data)
          const total = data.reduce((sum, deal) => {
            const amount = Number(deal.funded_amount || 0)
            return sum + amount
          }, 0)
          setTotalFunded(total)
        }
      } catch (err) {
        console.error('Unexpected error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchDeals()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#E8DCC4' }}>
        <div className="p-8 text-center">
          <p style={{ color: '#536878' }}>Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#E8DCC4' }}>
      {/* Header */}
      <header style={{ backgroundColor: '#2C3E50' }} className="shadow-lg">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold tracking-tight" style={{ 
                color: '#E8DCC4',
                fontFamily: 'Georgia, serif',
                position: 'relative',
                display: 'inline-block'
              }}>
                FRONTIER
                <span style={{
                  position: 'absolute',
                  bottom: '-4px',
                  left: '30%',
                  width: '40%',
                  height: '2px',
                  backgroundColor: '#8B6F47'
                }}></span>
              </h1>
              <p className="text-sm tracking-widest mt-2" style={{ 
                color: '#E8DCC4',
                opacity: 0.8,
                letterSpacing: '4px'
              }}>
                CAPITAL
              </p>
            </div>
            <div>
              <p className="text-sm" style={{ color: '#8B6F47' }}>
                MCA Deal Dashboard
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="p-8">
        {/* Page Title */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold" style={{ 
            color: '#404040',
            fontFamily: 'Georgia, serif' 
          }}>
            Portfolio Performance
          </h2>
          <p className="mt-2" style={{ color: '#536878' }}>
            Track your merchant cash advance investments
          </p>
        </div>
        
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <h3 className="text-sm font-medium" style={{ color: '#834333' }}>
                TOTAL FUNDED
              </h3>
              <p className="text-3xl font-bold mt-2" style={{ 
                color: '#2C3E50',
                fontFamily: 'Georgia, serif' 
              }}>
                ${totalFunded.toLocaleString()}
              </p>
              <p className="text-sm mt-2" style={{ color: '#8B6F47' }}>
                Year to Date
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <h3 className="text-sm font-medium" style={{ color: '#834333' }}>
                TOTAL DEALS
              </h3>
              <p className="text-3xl font-bold mt-2" style={{ 
                color: '#2C3E50',
                fontFamily: 'Georgia, serif' 
              }}>
                {deals.length}
              </p>
              <p className="text-sm mt-2" style={{ color: '#8B6F47' }}>
                Active Positions
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <h3 className="text-sm font-medium" style={{ color: '#834333' }}>
                AVERAGE DEAL SIZE
              </h3>
              <p className="text-3xl font-bold mt-2" style={{ 
                color: '#2C3E50',
                fontFamily: 'Georgia, serif' 
              }}>
                ${deals.length > 0 ? Math.round(totalFunded / deals.length).toLocaleString() : 0}
              </p>
              <p className="text-sm mt-2" style={{ color: '#8B6F47' }}>
                Per Investment
              </p>
            </div>
          </div>
        </div>

        {/* Deals Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4" style={{ 
            backgroundColor: '#404040',
            borderBottom: '3px solid #8B6F47' 
          }}>
            <h2 className="text-xl font-semibold" style={{ 
              color: '#E8DCC4',
              fontFamily: 'Georgia, serif' 
            }}>
              Recent Investment Activity
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead style={{ backgroundColor: '#F8F8F8' }}>
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider" 
                      style={{ color: '#536878' }}>
                    Company
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider" 
                      style={{ color: '#536878' }}>
                    Funded Amount
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider" 
                      style={{ color: '#536878' }}>
                    Factor Rate
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider" 
                      style={{ color: '#536878' }}>
                    Term
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider" 
                      style={{ color: '#536878' }}>
                    Funding Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: '#E8DCC4' }}>
                {deals.map((deal) => (
                  <tr key={deal.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap font-medium" 
                        style={{ color: '#404040' }}>
                      {deal.company_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap" 
                        style={{ color: '#2C3E50', fontWeight: '600' }}>
                      ${Number(deal.funded_amount).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap" 
                        style={{ color: '#536878' }}>
                      {deal.rate}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap" 
                        style={{ color: '#536878' }}>
                      {deal.term_days} days
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap" 
                        style={{ color: '#536878' }}>
                      {deal.date_funded ? new Date(deal.date_funded).toLocaleDateString() : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t" style={{ borderColor: '#8B6F47' }}>
          <p className="text-center text-sm" style={{ color: '#536878' }}>
            © {new Date().getFullYear()} Frontier Capital. All Rights Reserved.
          </p>
        </div>
      </div>
    </div>
  )
}