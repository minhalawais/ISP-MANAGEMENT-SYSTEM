"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Topbar } from "../../components/employee_portal/TopNavbar.tsx"
import { Sidebar } from "../../components/employee_portal/SideNavbar.tsx"
import { AlertCircle, CheckSquare, Package, BarChart2 } from "lucide-react"
import axiosInstance from "../../utils/axiosConfig.ts"
import { getToken } from "../../utils/auth.ts"

interface DashboardStats {
  open_complaints: number
  pending_tasks: number
  assigned_inventory: number
  inventory_transactions: number
}

interface Complaint {
  id: string;
  description: string;  // Changed from 'title' to 'description'
  customer: string;
  status: string;
}

interface Task {
  id: string
  title: string
  dueDate: string
}

interface InventoryTransaction {
  id: string
  itemName: string
  transactionType: string
  performedAt: string
}

const EmployeeDashboard: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [inventoryTransactions, setInventoryTransactions] = useState<InventoryTransaction[]>([])

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  const fetchDashboardData = async () => {
    try {
      const token = getToken()
      const headers = { Authorization: `Bearer ${token}` }

      const [statsResponse, complaintsResponse, tasksResponse, transactionsResponse] = await Promise.all([
        axiosInstance.get("/employee/dashboard/stats", { headers }),
        axiosInstance.get("/employee/dashboard/recent_complaints", { headers }),
        axiosInstance.get("/employee/dashboard/pending_tasks", { headers }),
        axiosInstance.get("/employee/dashboard/recent_inventory_transactions", { headers }),
      ])
      console.log("Stats:", statsResponse.data)
      setStats(statsResponse.data)
      setComplaints(complaintsResponse.data)
      setTasks(tasksResponse.data)
      setInventoryTransactions(transactionsResponse.data)
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, []) // Added fetchDashboardData to dependencies

  const handleCompleteTask = async (taskId: string) => {
    try {
      const token = getToken()
      await axiosInstance.patch(
        `/tasks/${taskId}`,
        { status: "completed" },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )
      fetchDashboardData()
    } catch (error) {
      console.error("Error completing task:", error)
    }
  }

  return (
    <div className="flex h-screen bg-[#F1F0E8]">
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} setIsOpen={setIsSidebarOpen} />
      <div className={`flex flex-col flex-1 overflow-hidden transition-all duration-300 ease-in-out`}>
        <Topbar toggleSidebar={toggleSidebar} />
        <main
          className={`flex-1 overflow-x-hidden overflow-y-auto bg-[#F1F0E8] p-6 pt-20 ${isSidebarOpen ? "ml-72" : "ml-20"}`}
        >
          <h1 className="text-3xl font-semibold text-[#89A8B2] mb-6">Employee Dashboard</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            <StatCard
              title="Open Complaints"
              value={stats?.open_complaints.toString() || "0"}
              icon={AlertCircle}
              color="#B3C8CF"
            />
            <StatCard
              title="Pending Tasks"
              value={stats?.pending_tasks.toString() || "0"}
              icon={CheckSquare}
              color="#E5E1DA"
            />
            <StatCard
              title="Assigned Inventory"
              value={stats?.assigned_inventory.toString() || "0"}
              icon={Package}
              color="#89A8B2"
            />
            <StatCard
              title="Inventory Transactions"
              value={stats?.inventory_transactions.toString() || "0"}
              icon={BarChart2}
              color="#B3C8CF"
            />
          </div>
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
            <RecentComplaints complaints={complaints} />
            <PendingTasks tasks={tasks} onCompleteTask={handleCompleteTask} />
            <RecentInventoryTransactions transactions={inventoryTransactions} />
          </div>
        </main>
      </div>
    </div>
  )
}

interface StatCardProps {
  title: string
  value: string
  icon: React.ElementType
  color: string
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 flex items-center" style={{ borderLeft: `4px solid ${color}` }}>
      <div className="mr-4">
        <Icon size={24} color={color} />
      </div>
      <div>
        <h2 className="text-lg font-semibold text-[#89A8B2]">{title}</h2>
        <p className="text-2xl font-bold text-[#B3C8CF]">{value}</p>
      </div>
    </div>
  )
}

interface RecentComplaintsProps {
  complaints: Complaint[]
}

const RecentComplaints: React.FC<RecentComplaintsProps> = ({ complaints }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-[#89A8B2] mb-4">Recent Complaints</h2>
      <ul className="space-y-4">
        {complaints.map((complaint) => (
          <li key={complaint.id} className="flex justify-between items-center border-b pb-2">
            <div>
              <p className="font-medium text-[#B3C8CF]">{complaint.description}</p>
              <p className="text-sm text-[#E5E1DA]">{complaint.customer}</p>
            </div>
            <span className={`px-2 py-1 rounded-full text-xs ${
              complaint.status === 'open' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
            }`}>
              {complaint.status}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

interface PendingTasksProps {
  tasks: Task[]
  onCompleteTask: (taskId: string) => void
}

const PendingTasks: React.FC<PendingTasksProps> = ({ tasks, onCompleteTask }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-[#89A8B2] mb-4">Pending Tasks</h2>
      <ul className="space-y-4">
        {tasks.map((task) => (
          <li key={task.id} className="flex justify-between items-center border-b pb-2">
            <div>
              <p className="font-medium text-[#B3C8CF]">{task.title}</p>
              <p className="text-sm text-[#E5E1DA]">Due: {task.dueDate}</p>
            </div>
            <button
              className="px-3 py-1 bg-[#89A8B2] text-white rounded-md text-sm hover:bg-[#7A97A0] transition-colors duration-200"
              onClick={() => onCompleteTask(task.id)}
            >
              Complete
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

interface RecentInventoryTransactionsProps {
  transactions: InventoryTransaction[]
}

const RecentInventoryTransactions: React.FC<RecentInventoryTransactionsProps> = ({ transactions }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-[#89A8B2] mb-4">Recent Inventory Transactions</h2>
      <ul className="space-y-4">
        {transactions.map((transaction) => (
          <li key={transaction.id} className="flex justify-between items-center border-b pb-2">
            <div>
              <p className="font-medium text-[#B3C8CF]">{transaction.itemName}</p>
              <p className="text-sm text-[#E5E1DA]">{transaction.transactionType}</p>
            </div>
            <span className="text-xs text-[#89A8B2]">{new Date(transaction.performedAt).toLocaleString()}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default EmployeeDashboard

