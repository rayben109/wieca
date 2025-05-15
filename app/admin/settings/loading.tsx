import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function SettingsLoading() {
  return (
    <div className="container mx-auto py-6">
      <Skeleton className="h-10 w-64 mb-6" />

      <div className="mb-6">
        <Skeleton className="h-10 w-full mb-6" />
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-6">
          {Array(5)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
        </CardContent>
      </Card>

      <div className="mt-6 flex justify-end">
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  )
}
