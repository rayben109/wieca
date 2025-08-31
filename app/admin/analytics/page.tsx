"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Loader2, Users, UserCheck, Clock, Calendar } from "lucide-react"
import { getAnalyticsData } from "@/lib/actions/admin-actions"
import { BarChart, LineChart, PieChart } from "@/components/charts"

export default function AnalyticsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [timeRange, setTimeRange] = useState("30days")
  const [analyticsData, setAnalyticsData] = useState<any>(null)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const data = await getAnalyticsData()
        setAnalyticsData(data)
      } catch (error) {
        console.error("Error fetching analytics data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [timeRange])

  // Sample data for charts (replace with actual data from API)
  const userGrowthData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      {
        label: "Mentors",
        data: [12, 19, 25, 32, 39, 45],
        backgroundColor: "rgba(53, 162, 235, 0.5)",
      },
      {
        label: "Mentees",
        data: [24, 38, 50, 61, 72, 85],
        backgroundColor: "rgba(255, 99, 132, 0.5)",
      },
    ],
  }

  const mentorshipStatusData = [
    { name: "Active", value: 65 },
    { name: "Pending", value: 20 },
    { name: "Completed", value: 10 },
    { name: "Declined", value: 5 },
  ]

  const mentorshipStatusColors = [
    "rgba(75, 192, 192, 0.6)",
    "rgba(255, 206, 86, 0.6)",
    "rgba(54, 162, 235, 0.6)",
    "rgba(255, 99, 132, 0.6)",
  ]

  const activityData = {
    labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
    datasets: [
      {
        label: "Messages",
        data: [120, 190, 150, 240],
        borderColor: "rgb(75, 192, 192)",
        backgroundColor: "rgba(75, 192, 192, 0.5)",
        tension: 0.3,
      },
      {
        label: "Meetings",
        data: [20, 25, 18, 30],
        borderColor: "rgb(255, 99, 132)",
        backgroundColor: "rgba(255, 99, 132, 0.5)",
        tension: 0.3,
      },
    ],
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>

        <div className="flex items-center space-x-2">
          <Label htmlFor="timeRange" className="mr-2">
            Time Range:
          </Label>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 Days</SelectItem>
              <SelectItem value="30days">Last 30 Days</SelectItem>
              <SelectItem value="90days">Last 90 Days</SelectItem>
              <SelectItem value="year">Last Year</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                    <h3 className="text-2xl font-bold">247</h3>
                  </div>
                  <div className="p-2 bg-primary/10 rounded-full">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <div className="mt-4 text-xs text-muted-foreground">
                  <span className="text-green-500 font-medium">↑ 12%</span> from last month
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active Mentorships</p>
                    <h3 className="text-2xl font-bold">86</h3>
                  </div>
                  <div className="p-2 bg-primary/10 rounded-full">
                    <UserCheck className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <div className="mt-4 text-xs text-muted-foreground">
                  <span className="text-green-500 font-medium">↑ 8%</span> from last month
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Avg. Session Duration</p>
                    <h3 className="text-2xl font-bold">42 min</h3>
                  </div>
                  <div className="p-2 bg-primary/10 rounded-full">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <div className="mt-4 text-xs text-muted-foreground">
                  <span className="text-red-500 font-medium">↓ 3%</span> from last month
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Scheduled Meetings</p>
                    <h3 className="text-2xl font-bold">93</h3>
                  </div>
                  <div className="p-2 bg-primary/10 rounded-full">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <div className="mt-4 text-xs text-muted-foreground">
                  <span className="text-green-500 font-medium">↑ 15%</span> from last month
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="users">User Growth</TabsTrigger>
              <TabsTrigger value="activity">Platform Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Mentorship Status</CardTitle>
                    <CardDescription>Distribution of mentorship relationships by status</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <PieChart data={mentorshipStatusData} colors={mentorshipStatusColors} />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>User Demographics</CardTitle>
                      <PieChart data={mentorshipStatusData} colors={mentorshipStatusColors} />
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <BarChart
                        data={userGrowthData.datasets.map((dataset, idx) => ({
                          label: dataset.label,
                          value: dataset.data.reduce((a, b) => a + b, 0),
                          backgroundColor: dataset.backgroundColor,
                        }))}
                        xAxisKey="label"
                        yAxisKey="value"
                        categories={userGrowthData.labels}
                        colors={userGrowthData.datasets.map(ds => ds.backgroundColor)}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="users">
              <Card>
                <CardHeader>
                  <CardTitle>User Growth</CardTitle>
                  <CardDescription>New user registrations over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-96">
                    <BarChart
                      data={userGrowthData.datasets.map((dataset, idx) =>
                        dataset.data.map((value, i) => ({
                          label: dataset.label,
                          category: userGrowthData.labels[i],
                          value,
                          backgroundColor: dataset.backgroundColor,
                        }))
                      ).flat()}
                      xAxisKey="category"
                      yAxisKey="value"
                      categories={userGrowthData.labels}
                      colors={userGrowthData.datasets.map(ds => ds.backgroundColor)}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity">
              <Card>
                <CardHeader>
                  <CardTitle>Platform Activity</CardTitle>
                  <CardDescription>Messages and meetings over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-96">
                    <LineChart
                      data={activityData.datasets.map((dataset) =>
                        activityData.labels.map((label, i) => ({
                          label: dataset.label,
                          category: label,
                          value: dataset.data[i],
                          borderColor: dataset.borderColor,
                          backgroundColor: dataset.backgroundColor,
                          tension: dataset.tension,
                        }))
                      ).flat()}
                      xAxisKey="category"
                      yAxisKey="value"
                      categories={activityData.labels}
                      colors={activityData.datasets.map(ds => ds.borderColor)}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}
