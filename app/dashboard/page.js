'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export default function Dashboard() {
  const [deals, setDeals] = useState([])
  const [loading, setLoading] = useState(true)
  const [totalFunded, setTotalFunded] = useState(0)
  const [revenueData, setRevenueData] = useState([])
  const [revenueLoading, setRevenueLoading] = useState(true)
  const [dateRange, setDateRange] = useState(30)
  const [hiddenCompanies, setHiddenCompanies] = useState(new Set())
  
  const supabase = createClientComponentClient()

  // Frontier brand colors for the chart
  const chartColors = [
    '#834333', // Cognac
    '#2C3E50', // Graphite Blue
    '#8B6F47', // Warm Bronze
    '#536878', // Gunmetal
    '#404040', // Warm Charcoal
    '#9B7653', // Lighter Bronze
    '#3E5266', // Lighter Blue
    '#6B4A3D', // Darker Cognac
  ]

  // Fetch MCA deals
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

  // Fetch revenue data
  useEffect(() => {
    async function fetchRevenueData() {
      setRevenueLoading(true)
      try {
        // Calculate date range in Eastern Time
        const endDate = new Date()
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - dateRange)
        
        // Format dates for SQL query
        const startDateStr = startDate.toISOString().split('T')[0]
        const endDateStr = endDate.toISOString().split('T')[0]

        const { data, error } = await supabase
          .from('frontier_revenue_details')
          .select('date, company_name, frontier_revenue_day')
          .gte('date', startDateStr)
          .lte('date', endDateStr)
          .order('date', { ascending: true })

        if (error) {
          console.error('Error fetching revenue data:', error)
          setRevenueLoading(false)
          return
        }

        if (data) {
          // Process data for stacked bar chart
          const processedData = processRevenueData(data)
          setRevenueData(processedData)
        }
      } catch (err) {
        console.error('Unexpected error:', err)
      } finally {
        setRevenueLoading(false)
      }
    }

    fetchRevenueData()
  }, [dateRange])

  // Process revenue data for chart
  function processRevenueData(rawData) {
    // Group by date
    const groupedByDate = {}
    const allCompanies = new Set()

    rawData.forEach(row => {
      const dateStr = new Date(row.date).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        timeZone: 'America/New_York'
      })
      const revenue = Number(row.frontier_revenue_day || 0)
      
      if (revenue > 0) { // Only include non-zero revenues
        if (!groupedByDate[dateStr]) {
          groupedByDate[dateStr] = { date: dateStr, total: 0 }
        }
        
        groupedByDate[dateStr][row.company_name] = revenue
        groupedByDate[dateStr].total += revenue
        allCompanies.add(row.company_name)
      }
    })

    // Convert to array and ensure all companies are represented
    const chartData = Object.values(groupedByDate).map(dayData => {
      const result = { ...dayData }
      allCompanies.forEach(company => {
        if (!result[company]) {
          result[company] = 0
        }
      })
      return result
    })

    return chartData
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const total = payload.reduce((sum, entry) => sum + entry.value, 0)
      const visiblePayload = payload.filter(entry => !hiddenCompanies.has(entry.dataKey))
      
      return (
        <div className="bg-white p-4 rounded shadow-lg" style={{ border: '1px solid #E8DCC4' }}>
          <p className="font-semibold" style={{ color: '#404040' }}>{label}</p>
          {visiblePayload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: ${entry.value.toLocaleString()}
            </p>
          ))}
          <p className="font-semibold mt-2 pt-2" style={{ 
            color: '#2C3E50',
            borderTop: '1px solid #E8DCC4'
          }}>
            Total: ${total.toLocaleString()}
          </p>
        </div>
      )
    }
    return null
  }

  // Format Y-axis
  const formatYAxis = (value) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`
    }
    return `$${value}`
  }

  // Handle legend click
  const handleLegendClick = (dataKey) => {
    setHiddenCompanies(prev => {
      const newSet = new Set(prev)
      if (newSet.has(dataKey)) {
        newSet.delete(dataKey)
      } else {
        newSet.add(dataKey)
      }
      return newSet
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#E8DCC4' }}>
        <div className="p-8 text-center">
          <p style={{ color: '#536878' }}>Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  // Get unique companies for the chart
  const companies = [...new Set(revenueData.flatMap(d => 
    Object.keys(d).filter(k => k !== 'date' && k !== 'total')
  ))]

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

        {/* Daily Revenue Chart */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
          <div className="px-6 py-4" style={{ 
            backgroundColor: '#404040',
            borderBottom: '3px solid #8B6F47' 
          }}>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold" style={{ 
                color: '#E8DCC4',
                fontFamily: 'Georgia, serif' 
              }}>
                Daily Revenue
              </h2>
              <div className="flex gap-2">
                {[
                  { label: '7D', value: 7 },
                  { label: '14D', value: 14 },
                  { label: '30D', value: 30 },
                  { label: '90D', value: 90 }
                ].map(range => (
                  <button
                    key={range.value}
                    onClick={() => setDateRange(range.value)}
                    className="px-3 py-1 rounded text-sm transition-colors"
                    style={{
                      backgroundColor: dateRange === range.value ? '#8B6F47' : 'transparent',
                      color: dateRange === range.value ? '#FFFFFF' : '#E8DCC4',
                      border: `1px solid ${dateRange === range.value ? '#8B6F47' : '#E8DCC4'}`
                    }}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="p-6">
            {revenueLoading ? (
              <div className="text-center py-8">
                <p style={{ color: '#536878' }}>Loading revenue data...</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={revenueData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8DCC4" />
                  <XAxis 
                    dataKey="date" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    tick={{ fill: '#536878', fontSize: 12 }}
                  />
                  <YAxis 
                    tickFormatter={formatYAxis}
                    tick={{ fill: '#536878' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    onClick={(e) => handleLegendClick(e.dataKey)}
                    wrapperStyle={{
                      paddingTop: '20px',
                      cursor: 'pointer'
                    }}
                    formatter={(value) => (
                      <span style={{
                        textDecoration: hiddenCompanies.has(value) ? 'line-through' : 'none',
                        opacity: hiddenCompanies.has(value) ? 0.5 : 1
                      }}>
                        {value}
                      </span>
                    )}
                  />
                  {companies.map((company, index) => (
                    <Bar
                      key={company}
                      dataKey={company}
                      stackId="revenue"
                      fill={chartColors[index % chartColors.length]}
                      hide={hiddenCompanies.has(company)}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            )}
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