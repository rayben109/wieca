import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function AnalyticsLoading() {
  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-48" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {Array(4)
          .fill(0)
          .map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                  <Skeleton className="h-10 w-10 rounded-full" />
                </div>
                <Skeleton className="h-4 w-32 mt-4" />
              </CardContent>
            </Card>
          ))}
      </div>

      <div className="mb-6">
        <Skeleton className="h-10 w-full mb-6" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-80 w-full" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-80 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
