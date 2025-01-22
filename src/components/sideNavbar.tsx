import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Users,
  FileText,
  CreditCard,
  AlertCircle,
  Package,
  Truck,
  BarChart,
  Settings,
  Map,
  UserCheck,
  MessageSquare,
  CheckSquare,
  LogOut,
  Menu,
  Search,
  ChevronLeft,
  ChevronRight,
  Clipboard
} from 'react-feather';
import { removeToken } from '../utils/auth.ts';
import axiosInstance from '../utils/axiosConfig.ts';

export const menuItems = [
  { 
    title: 'Employee Management', 
    icon: Users,
    description: 'Manage and track employee records and performance',
    path: '/employee-management'
  },
  { 
    title: 'Customer Management', 
    icon: Users,
    description: 'Comprehensive customer relationship management',
    path: '/customer-management'
  },
  { 
    title: 'Service Plan Management', 
    icon: FileText,
    description: 'Create, update, and monitor service plans',
    path: '/service-plan-management'
  },
  { 
    title: 'Payment Management', 
    icon: CreditCard,
    description: 'Track and manage customer payments',
    path: '/payment-management'
  },
  { 
    title: 'Billing & Invoices', 
    icon: CreditCard,
    description: 'Handle financial transactions and billing cycles',
    path: '/billing-invoices'
  },
  { 
    title: 'Complaint Management', 
    icon: AlertCircle,
    description: 'Track and resolve customer complaints efficiently',
    path: '/complaint-management'
  },
  { 
    title: 'Inventory Management', 
    icon: Package,
    description: 'Real-time tracking of inventory and stock levels',
    path: '/inventory-management'
  },
  { 
    title: 'Supplier Management', 
    icon: Truck,
    description: 'Manage supplier relationships and procurement',
    path: '/supplier-management'
  },
  { 
    title: 'Reporting & Analytics', 
    icon: BarChart,
    description: 'Generate insights with comprehensive reports',
    path: '/reporting-analytics'
  },
  { 
    title: 'Area/Zone Management', 
    icon: Map,
    description: 'Define and manage operational zones',
    path: '/area-zone-management'
  },
  { 
    title: 'Recovery Task Management', 
    icon: UserCheck,
    description: 'Monitor and track recovery-related tasks',
    path: '/recovery-task-management'
  },
  { 
    title: 'Messaging', 
    icon: MessageSquare,
    description: 'Internal communication and messaging system',
    path: '/message-management'
  },
  { 
    title: 'Task Management', 
    icon: CheckSquare,
    description: 'Organize and prioritize organizational tasks',
    path: '/task-management'
  },
  { 
    title: 'Logs Management', 
    icon: Clipboard,
    description: 'View and manage system logs',
    path: '/logs-management'
  },
];

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar, setIsOpen }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeItem, setActiveItem] = useState('');
  const location = useLocation();
  const [isHovered, setIsHovered] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  const navRef = useRef<HTMLElement>(null);
  const navigate = useNavigate();

  const filteredMenuItems = menuItems.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleLogout = async () => {
    try {
      await axiosInstance.post('http://147.93.53.119:5000/auth/logout');
      removeToken();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  useEffect(() => {
    if ((isOpen || isHovered) && navRef.current) {
      navRef.current.scrollTop = scrollPosition;
    }
  }, [isOpen, isHovered, scrollPosition]);

  return (
    <aside 
      className={`
        bg-white 
        ${isOpen || isHovered ? 'w-72' : 'w-20'} 
        h-[calc(100vh-3.5rem)] 
        flex 
        flex-col 
        shadow-xl 
        transition-all 
        duration-300 
        ease-in-out 
        fixed 
        z-30
        top-14
        left-0
        overflow-y-auto
        hide-scrollbar
      `}
      onMouseEnter={() => {
        setIsHovered(true);
        if (navRef.current) {
          setScrollPosition(navRef.current.scrollTop);
        }
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        if (navRef.current) {
          setScrollPosition(navRef.current.scrollTop);
        }
      }}
    >
      <button
        className="md:hidden absolute top-2 right-2 text-[#8b5cf6]"
        onClick={() => setIsOpen(false)}
      >
        <ChevronLeft className="h-6 w-6" />
      </button>

      {(isOpen || isHovered) && (
        <div className="p-4">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search modules..." 
              className="w-full px-4 py-2 bg-[#ede9fe] text-[#8b5cf6] border border-[#8b5cf6] rounded-full focus:outline-none focus:ring-2 focus:ring-[#8b5cf6] transition-all duration-200"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute right-4 top-3 text-[#8b5cf6]" />
          </div>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto px-2 py-2 hide-scrollbar" ref={navRef}>
        {filteredMenuItems.map((item, index) => (
          <Link
            key={index}
            to={item.path}
            className={`
              group
              flex 
              items-center 
              px-4 
              py-3 
              my-1 
              rounded-lg 
              text-[#8b5cf6]
              hover:bg-[#ede9fe]
              hover:text-[#7c3aed] 
              transition-all 
              duration-200
              ${!isOpen && !isHovered ? 'justify-center' : ''}
              ${location.pathname === item.path ? 'bg-[#ede9fe] text-[#7c3aed]' : ''}
              relative
            `}
            onClick={() => {
              setActiveItem(item.title);
              if (navRef.current) {
                setScrollPosition(navRef.current.scrollTop);
              }
            }}
          >
            <item.icon className={`h-5 w-5 ${isOpen || isHovered ? 'mr-3' : ''}`} />
            {(isOpen || isHovered) ? (
              <div>
                <span className="font-medium">{item.title}</span>
                <p className="text-xs text-gray-500 mt-1">{item.description}</p>
              </div>
            ) : (
              <span className="sr-only">{item.title}</span>
            )}
            {!isOpen && !isHovered && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                {item.title}
              </div>
            )}
          </Link>
        ))}
      </nav>

      <div className={`p-4 border-t border-gray-200 ${!isOpen && !isHovered ? 'flex justify-center' : ''} mt-auto`}>
        <button
          className={`
            group
            flex 
            items-center 
            ${isOpen || isHovered ? 'w-full px-4' : 'justify-center'} 
            py-2 
            text-[#8b5cf6]
            hover:bg-[#8b5cf6] 
            hover:text-white
            rounded-lg 
            transition-all 
            duration-200
            relative
          `}
          onClick={handleLogout}
        >
          <LogOut className={`h-5 w-5 ${isOpen || isHovered ? 'mr-3' : ''}`} />
          {isOpen || isHovered ? (
            'Logout'
          ) : (
            <>
              <span className="sr-only">Logout</span>
              <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                Logout
              </div>
            </>
          )}
        </button>
      </div>
    </aside>
  );
};

