"use client"

import type React from "react"
import { useEffect } from "react"
import { useParams, Link } from "react-router-dom"
import { motion } from "framer-motion"
import { FaTicketAlt, FaArrowLeft } from "react-icons/fa"

const TicketDisplayPage: React.FC = () => {
  const { ticketNumber } = useParams<{ ticketNumber: string }>()

  useEffect(() => {
    document.title = `Ticket ${ticketNumber} - MBA NET`
  }, [ticketNumber])

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E5E1DA] to-[#F1F0E8] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full"
      >
        <motion.div initial={{ y: -20 }} animate={{ y: 0 }} transition={{ delay: 0.2, type: "spring", stiffness: 120 }}>
          <FaTicketAlt className="text-6xl text-[#89A8B2] mx-auto mb-4" />
        </motion.div>
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-3xl font-bold text-center text-[#89A8B2] mb-4"
        >
          Complaint Submitted
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-xl text-center text-gray-600 mb-6"
        >
          Your ticket number is:
        </motion.p>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.5, type: "spring", stiffness: 120 }}
          className="bg-[#89A8B2] text-white text-3xl font-bold py-4 px-6 rounded-lg text-center mb-8"
        >
          {ticketNumber}
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center"
        >
          <Link
            to="/complaint-management"
            className="inline-flex items-center text-[#89A8B2] hover:text-[#7A97A1] transition duration-300"
          >
            <FaArrowLeft className="mr-2" />
            Back to Complaints
          </Link>
        </motion.div>
      </motion.div>
    </div>
  )
}

export default TicketDisplayPage

