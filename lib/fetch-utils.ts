/**
 * Enhanced fetch function with error handling and automatic JSON parsing
 */
export async function fetchWithErrorHandling<T>(
  url: string,
  options?: RequestInit,
): Promise<{ data: T | null; error: string | null }> {
  try {
    // Add a timeout to the fetch request
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout

    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        ...options?.headers,
        "Content-Type": "application/json",
      },
    })

    clearTimeout(timeoutId)

    // Handle non-JSON responses
    const contentType = response.headers.get("content-type")
    if (!contentType || !contentType.includes("application/json")) {
      console.error("Non-JSON response received:", await response.text())
      return {
        data: null,
        error: `Server returned non-JSON response: ${response.status} ${response.statusText}`,
      }
    }

    // Parse JSON response
    let data
    try {
      data = await response.json()
    } catch (parseError) {
      console.error("JSON parse error:", parseError)
      return {
        data: null,
        error: "Failed to parse server response. Please try again.",
      }
    }

    // Handle error responses
    if (!response.ok) {
      const errorMessage = data?.error || data?.message || `Server error: ${response.status} ${response.statusText}`
      console.error("API error:", errorMessage)
      return { data: null, error: errorMessage }
    }

    return { data: data as T, error: null }
  } catch (error) {
    console.error("Fetch error:", error)

    // Handle specific error types
    if (error instanceof TypeError) {
      return { data: null, error: "Network error. Please check your connection and try again." }
    } else if (error.name === "AbortError") {
      return { data: null, error: "Request timed out. Please try again." }
    } else if (error instanceof SyntaxError) {
      return { data: null, error: "Invalid response from server. Please try again." }
    }

    return {
      data: null,
      error: error instanceof Error ? error.message : "An unknown error occurred. Please try again.",
    }
  }
}

/**
 * Utility to handle authentication errors
 */
export function handleAuthError(error: string): string {
  const errorMessages: Record<string, string> = {
    CredentialsSignin: "Invalid email or password. Please try again.",
    SessionRequired: "Please sign in to access this page.",
    AccessDenied: "You do not have permission to access this page.",
    Configuration: "Authentication system configuration error. Please contact support.",
    DatabaseError: "Database connection error. Please try again later.",
    Default: "An authentication error occurred. Please try again.",
  }

  return errorMessages[error] || errorMessages.Default
}
