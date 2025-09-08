"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, FileText, Users, Download, Upload } from "lucide-react"
import Link from "next/link"

export function QuickActions() {
  const actions = [
    {
      title: "Add Expense",
      description: "Record a new business expense",
      icon: Plus,
      href: "/expenses",
      color: "bg-red-50 text-red-600 hover:bg-red-100",
    },
    {
      title: "Add Sale",
      description: "Record a new sale transaction",
      icon: Plus,
      href: "/sales",
      color: "bg-green-50 text-green-600 hover:bg-green-100",
    },
    {
      title: "Generate Report",
      description: "Create financial reports",
      icon: FileText,
      href: "/reports",
      color: "bg-blue-50 text-blue-600 hover:bg-blue-100",
    },
    {
      title: "View Dashboard",
      description: "See financial overview",
      icon: Users,
      href: "/",
      color: "bg-purple-50 text-purple-600 hover:bg-purple-100",
    },
    {
      title: "Expense Reports",
      description: "View expense analytics",
      icon: Download,
      href: "/reports",
      color: "bg-orange-50 text-orange-600 hover:bg-orange-100",
    },
    {
      title: "Sales Reports",
      description: "View sales analytics",
      icon: Upload,
      href: "/reports",
      color: "bg-teal-50 text-teal-600 hover:bg-teal-100",
    },
  ]

  return (
    <Card className="bg-[#fafbfc] border border-[#e5e7eb] rounded-2xl shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-[#22223b]">Quick Actions</CardTitle>
        <CardDescription className="text-[#6c6f80]">Frequently used actions for efficient workflow</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {actions.map((action) => {
            const Icon = action.icon
            return (
              <Link key={action.title} href={action.href}>
                <div className="transition-all duration-150">
                  <Button
                    variant="outline"
                    className="h-32 w-full p-0 flex flex-col items-center justify-center gap-3 rounded-xl border border-[#e5e7eb] bg-white hover:shadow-lg hover:-translate-y-1 transition-all"
                  >
                    <div className={`mb-2 p-2 rounded-lg ${action.color} text-2xl flex items-center justify-center`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-base text-[#22223b]">{action.title}</div>
                      <div className="text-xs text-[#6c6f80]">{action.description}</div>
                    </div>
                  </Button>
                </div>
              </Link>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
