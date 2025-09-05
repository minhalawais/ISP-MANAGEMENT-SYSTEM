import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Users,
  AlertCircle,
  CheckSquare,
  RefreshCw,
  Package,
  CreditCard,
  Box,
  MessageSquare,
  BarChart2,
  User,
  LogOut,
  Search,
  ChevronLeft,
  Home
} from 'react-feather';

export const menuItems = [
  { 
    title: 'Dashboard', 
    icon: Home,
    description: 'Overview of key metrics and activities',
    path: '/employee_portal'
  },
  { 
    title: 'Customer Management', 
    icon: Users,
    description: 'Manage customer information and interactions',
    path: '/employee_portal/customer-management'
  },
  { 
    title: 'Complaint Handling', 
    icon: AlertCircle,
    description: 'Track and resolve customer complaints',
    path: '/employee_portal/complaint-handling'
  },
  { 
    title: 'Task Management', 
    icon: CheckSquare,
    description: 'Manage and track employee tasks',
    path: '/employee_portal/task-management'
  },
  { 
    title: 'Recovery Task Management', 
    icon: RefreshCw,
    description: 'Handle recovery tasks and track progress',
    path: '/employee_portal/recovery-task-management'
  },
  { 
    title: 'Service Plans', 
    icon: Package,
    description: 'View and manage service plans',
    path: '/employee_portal/service-plans'
  },
  { 
    title: 'Billing and Payments', 
    icon: CreditCard,
    description: 'Handle billing and payment operations',
    path: '/employee_portal/payments-management'
  },
  { 
    title: 'Billing & Invoices', 
    icon: CreditCard,
    description: 'Handle financial transactions and billing cycles',
    path: '/employee_portal/invoices-management'
  },
  { 
    title: 'Inventory Management', 
    icon: Box,
    description: 'Manage inventory and equipment',
    path: '/employee_portal/inventory-management'
  },
  { 
    title: 'Messaging', 
    icon: MessageSquare,
    description: 'Internal communication system',
    path: '/messaging'
  },
  { 
    title: 'Profile Management', 
    icon: User,
    description: 'Manage your profile and settings',
    path: '/profile'
  }
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

  const filteredMenuItems = menuItems.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

      {/* Search Input */}
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

      {/* Navigation */}
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

      {/* Logout */}
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
          onClick={() => {/* Implement logout logic */}}
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

