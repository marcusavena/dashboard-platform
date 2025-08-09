'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// Simple Dashboard Component
export default function Dashboard() {
  const [deals, setDeals] = useState([])
  const [loading, setLoading] = useState(true)
  const [totalFunded, setTotalFunded] = useState(0)
  
  // Create supabase client
  const supabase = createClientComponentClient()

  useEffect(() => {
    // Fetch MCA deals from database
    async function fetchDeals() {
      try {
        const { data, error } = await supabase
          .from('mca_deals')
          .select('*')
          .order('date_funded', { ascending: false })

        if (error) {
          console.error('Error fetching deals:', error)
          return
        }

        if (data) {
          setDeals(data)
          // Calculate total funded amount
          const total = data.reduce((sum, deal) => sum + Number(deal.funded_amount || 0), 0)
          setTotalFunded(total)
        }
      } catch (err) {
        console.error('Unexpected error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchDeals()
  }, [supabase])

  if (loading) {
    return <div className="p-8">Loading your dashboard...</div>
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold mb-8">MCA Dashboard</h1>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm text-gray-600">Total Funded</h3>
          <p className="text-2xl font-bold">${totalFunded.toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm text-gray-600">Total Deals</h3>
          <p className="text-2xl font-bold">{deals.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm text-gray-600">Average Deal Size</h3>
          <p className="text-2xl font-bold">
            ${deals.length > 0 ? Math.round(totalFunded / deals.length).toLocaleString() : 0}
          </p>
        </div>
      </div>

      {/* Deals Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-xl font-semibold">Recent Deals</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rate</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Term</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {deals.map((deal) => (
                <tr key={deal.id}>
                  <td className="px-6 py-4 whitespace-nowrap">{deal.company_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">${Number(deal.funded_amount).toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{deal.rate}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{deal.term_days} days</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {new Date(deal.date_funded).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}