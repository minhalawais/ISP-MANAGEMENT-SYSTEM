import React, { useState } from 'react'

interface TabsProps {
  defaultValue: string
  className?: string
  children: React.ReactNode
}

export function Tabs({ defaultValue, className, children }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultValue)

  return (
    <div className={className}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child) && child.type === TabsList) {
          return React.cloneElement(child, { activeTab, setActiveTab })
        }
        if (React.isValidElement(child) && child.type === TabsContent) {
          return React.cloneElement(child, { activeTab })
        }
        return child
      })}
    </div>
  )
}

export function TabsList({ children, activeTab, setActiveTab }: { children: React.ReactNode; activeTab: string; setActiveTab: (value: string) => void }) {
  return (
    <div className="flex space-x-2 mb-4">
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child) && child.type === TabsTrigger) {
          return React.cloneElement(child, { activeTab, setActiveTab })
        }
        return child
      })}
    </div>
  )
}

export function TabsTrigger({ value, children, activeTab, setActiveTab }: { value: string; children: React.ReactNode; activeTab: string; setActiveTab: (value: string) => void }) {
  return (
    <button
      className={`px-4 py-2 rounded-md ${activeTab === value ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
      onClick={() => setActiveTab(value)}
    >
      {children}
    </button>
  )
}

export function TabsContent({ value, children, activeTab }: { value: string; children: React.ReactNode; activeTab: string }) {
  if (value !== activeTab) return null
  return <div>{children}</div>
}
