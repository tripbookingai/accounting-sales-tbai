"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Users, DollarSign, Star, Heart } from "lucide-react"

interface CustomerAnalysisData {
  totalCustomers: number
  totalRevenue: number
  averageRevenuePerCustomer: number
  topCustomers: Array<{
    name: string
    email: string
    phone: string
    totalAmount: number
    transactionCount: number
    averageTransaction: number
    lastTransaction: string
    totalProfit: number
    profitMargin: number
    customerSince: string
  }>
  customersByProduct: Array<{
    product: string
    customerCount: number
    totalRevenue: number
    averageRevenue: number
  }>
  loyaltyAnalysis: Array<{
    segment: string
    customerCount: number
    totalRevenue: number
    averageLifetimeValue: number
    retentionRate: number
  }>
  monthlyAcquisition: Array<{
    month: string
    newCustomers: number
    revenue: number
    averageValue: number
  }>
  customerRetention: {
    returning: number
    new: number
    total: number
    retentionRate: number
  }
  geographicDistribution: Array<{
    region: string
    customerCount: number
    revenue: number
    percentage: number
  }>
}

interface CustomerAnalysisReportProps {
  data: CustomerAnalysisData
  dateRange: string
}

export function CustomerAnalysisReport({ data, dateRange }: CustomerAnalysisReportProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'BDT',
      currencyDisplay: 'symbol'
    }).format(amount).replace('BDT', '৳')
  }

  const getSegmentColor = (segment: string) => {
    switch (segment.toLowerCase()) {
      case "vip":
      case "platinum":
        return "bg-purple-100 text-purple-800"
      case "gold":
      case "high-value":
        return "bg-yellow-100 text-yellow-800"
      case "silver":
      case "regular":
        return "bg-gray-100 text-gray-800"
      case "bronze":
      case "new":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getLoyaltyBadge = (transactionCount: number) => {
    if (transactionCount >= 10) return { label: "VIP", color: "bg-purple-100 text-purple-800" }
    if (transactionCount >= 5) return { label: "Loyal", color: "bg-green-100 text-green-800" }
    if (transactionCount >= 2) return { label: "Regular", color: "bg-blue-100 text-blue-800" }
    return { label: "New", color: "bg-gray-100 text-gray-800" }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Customer Analysis Report</h2>
        <p className="text-muted-foreground">Period: {dateRange}</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalCustomers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.totalRevenue)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Customer Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.averageRevenuePerCustomer)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Retention Rate</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{((data.customerRetention?.retentionRate || 0) * 100).toFixed(1)}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Customer Retention Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">New Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{data.customerRetention?.new || 0}</div>
            <p className="text-sm text-muted-foreground">
              {(((data.customerRetention?.new || 0) / (data.customerRetention?.total || 1)) * 100).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Returning Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{data.customerRetention?.returning || 0}</div>
            <p className="text-sm text-muted-foreground">
              {(((data.customerRetention?.returning || 0) / (data.customerRetention?.total || 1)) * 100).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Retention Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {((data.customerRetention?.retentionRate || 0) * 100).toFixed(1)}%
            </div>
            <p className="text-sm text-muted-foreground">Customer loyalty metric</p>
          </CardContent>
        </Card>
      </div>

      {/* Top Customers */}
      <Card>
        <CardHeader>
          <CardTitle>Top Customers by Revenue</CardTitle>
          <CardDescription>Highest value customers and their metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead className="text-right">Total Revenue</TableHead>
                <TableHead className="text-right">Transactions</TableHead>
                <TableHead className="text-right">Avg Transaction</TableHead>
                <TableHead className="text-right">Profit</TableHead>
                <TableHead>Loyalty</TableHead>
                <TableHead>Customer Since</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data.topCustomers || []).map((customer, index) => {
                const loyalty = getLoyaltyBadge(customer.transactionCount)
                return (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell>
                      <div className="text-xs">
                        <div>{customer.email}</div>
                        <div className="text-muted-foreground">{customer.phone}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(customer.totalAmount)}
                    </TableCell>
                    <TableCell className="text-right">{customer.transactionCount}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(customer.averageTransaction)}
                    </TableCell>
                    <TableCell className="text-right text-green-600">
                      {formatCurrency(customer.totalProfit)}
                    </TableCell>
                    <TableCell>
                      <Badge className={loyalty.color}>{loyalty.label}</Badge>
                    </TableCell>
                    <TableCell>{new Date(customer.customerSince).toLocaleDateString()}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Customer Segmentation */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Segmentation</CardTitle>
          <CardDescription>Customer analysis by loyalty segments</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Segment</TableHead>
                <TableHead className="text-right">Customer Count</TableHead>
                <TableHead className="text-right">Total Revenue</TableHead>
                <TableHead className="text-right">Avg Lifetime Value</TableHead>
                <TableHead className="text-right">Retention Rate</TableHead>
                <TableHead className="text-right">% of Total Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data.loyaltyAnalysis || []).map((segment, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Badge className={getSegmentColor(segment.segment)}>{segment.segment}</Badge>
                  </TableCell>
                  <TableCell className="text-right">{segment.customerCount}</TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatCurrency(segment.totalRevenue)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(segment.averageLifetimeValue)}
                  </TableCell>
                  <TableCell className="text-right">
                    {((segment.retentionRate || 0) * 100).toFixed(1)}%
                  </TableCell>
                  <TableCell className="text-right">
                    {(((segment.totalRevenue || 0) / (data.totalRevenue || 1)) * 100).toFixed(1)}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Product Preference Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Preferences by Product</CardTitle>
          <CardDescription>Customer distribution across product types</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product Type</TableHead>
                <TableHead className="text-right">Customer Count</TableHead>
                <TableHead className="text-right">Total Revenue</TableHead>
                <TableHead className="text-right">Avg Revenue per Customer</TableHead>
                <TableHead className="text-right">Market Share</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data.customersByProduct || []).map((product, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{product.product}</TableCell>
                  <TableCell className="text-right">{product.customerCount}</TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatCurrency(product.totalRevenue)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(product.averageRevenue)}
                  </TableCell>
                  <TableCell className="text-right">
                    {(((product.totalRevenue || 0) / (data.totalRevenue || 1)) * 100).toFixed(1)}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Monthly Customer Acquisition */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Customer Acquisition</CardTitle>
          <CardDescription>New customer trends and their initial value</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead className="text-right">New Customers</TableHead>
                <TableHead className="text-right">Revenue from New</TableHead>
                <TableHead className="text-right">Avg Initial Value</TableHead>
                <TableHead className="text-right">Acquisition Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data.monthlyAcquisition || []).map((month, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{month.month}</TableCell>
                  <TableCell className="text-right">{month.newCustomers}</TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatCurrency(month.revenue)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(month.averageValue)}
                  </TableCell>
                  <TableCell className="text-right">
                    {(((month.newCustomers || 0) / (data.totalCustomers || 1)) * 100).toFixed(1)}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Geographic Distribution */}
      {data.geographicDistribution && data.geographicDistribution.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Geographic Distribution</CardTitle>
            <CardDescription>Customer base and revenue by region</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Region</TableHead>
                  <TableHead className="text-right">Customer Count</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Avg per Customer</TableHead>
                  <TableHead className="text-right">% of Customers</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data.geographicDistribution || []).map((region, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{region.region}</TableCell>
                    <TableCell className="text-right">{region.customerCount}</TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(region.revenue)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency((region.revenue || 0) / (region.customerCount || 1))}
                    </TableCell>
                    <TableCell className="text-right">{(region.percentage || 0).toFixed(1)}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Customer Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Key Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">Top Customer Share</span>
                <span className="font-semibold">
                  {(data.topCustomers || []).length > 0 
                    ? (((data.topCustomers?.[0]?.totalAmount || 0) / (data.totalRevenue || 1)) * 100).toFixed(1) + '%'
                    : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Repeat Customer Rate</span>
                <span className="font-semibold">
                  {(((data.customerRetention?.returning || 0) / (data.customerRetention?.total || 1)) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Customer Concentration</span>
                <span className="font-semibold">
                  {(data.topCustomers || []).length >= 5
                    ? (((data.topCustomers || []).slice(0, 5).reduce((sum, c) => sum + (c?.totalAmount || 0), 0) / (data.totalRevenue || 1)) * 100).toFixed(1) + '%'
                    : 'N/A'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              {(data.customerRetention?.retentionRate || 0) < 0.6 && (
                <p className="text-red-600">🔴 Low retention rate - focus on customer satisfaction</p>
              )}
              {(data.topCustomers || []).length > 0 && (((data.topCustomers?.[0]?.totalAmount || 0) / (data.totalRevenue || 1)) * 100) > 30 && (
                <p className="text-yellow-600">⚠️ High dependency on top customer</p>
              )}
              {(data.customerRetention?.new || 0) > (data.customerRetention?.returning || 0) && (
                <p className="text-blue-600">💡 More new than returning - improve retention</p>
              )}
              {data.loyaltyAnalysis.some(s => s.segment.toLowerCase().includes('vip') && s.customerCount < 5) && (
                <p className="text-purple-600">⭐ Opportunity to grow VIP segment</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}