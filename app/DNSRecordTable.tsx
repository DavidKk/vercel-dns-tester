'use client'

import { DNSRecord } from '@/services/dns/types'

export interface DNSRecordTableProps {
  records: DNSRecord[]
  loading?: boolean
}

export default function DNSRecordTable(props: DNSRecordTableProps) {
  const { records, loading } = props

  return (
    <div className="bg-white mt-8 p-6 rounded-lg shadow-md w-full max-w-4xl space-y-4">
      <h2 className="text-xl font-semibold text-gray-700 mb-4">DNS Records</h2>
      {loading ? (
        <div className="flex flex-col justify-center items-center py-8">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-blue-500 animate-pulse"></div>
            <div className="w-4 h-4 rounded-full bg-blue-500 animate-pulse animation-delay-200"></div>
            <div className="w-4 h-4 rounded-full bg-blue-500 animate-pulse animation-delay-400"></div>
          </div>

          <div className="ml-3 mt-4 text-blue-600 font-medium">Loading...</div>
        </div>
      ) : records && records.length === 0 ? (
        <p className="text-gray-500">No records found.</p>
      ) : (
        <table className="w-full table-auto border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-4 py-2 text-left">Name</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Type</th>
              <th className="border border-gray-300 px-4 py-2 text-left">TTL</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Data</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record, index) => (
              <tr key={index} className={`${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-gray-100`}>
                <td className="border border-gray-300 px-4 py-2">{record.name}</td>
                <td className="border border-gray-300 px-4 py-2">{record.type}</td>
                <td className="border border-gray-300 px-4 py-2">{record.ttl}</td>
                <td className="border border-gray-300 px-4 py-2">{record.data}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
