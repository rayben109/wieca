export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="sm:w-48">
            <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>

        <div className="p-8 flex flex-col items-center justify-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-gray-500">Loading users...</p>
        </div>
      </div>
    </div>
  )
}
