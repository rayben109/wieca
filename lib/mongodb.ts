import { MongoClient, type MongoClientOptions, ServerApiVersion } from "mongodb"

if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"')
}

const uri = process.env.MONGODB_URI
const options: MongoClientOptions = {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
  // Increase timeouts for production environments
  connectTimeoutMS: 30000, // 30 seconds timeout (increased from 10s)
  socketTimeoutMS: 60000, // 60 seconds timeout (increased from 45s)
  // Add retry capability
  retryWrites: true,
  retryReads: true,
  maxPoolSize: 50, // Increase connection pool size
  minPoolSize: 5, // Maintain minimum connections
}

let client
let clientPromise: Promise<MongoClient>

if (process.env.NODE_ENV === "development") {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  const globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>
  }

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options)
    globalWithMongo._mongoClientPromise = client.connect().catch((error) => {
      console.error("Failed to connect to MongoDB in development:", error)
      throw error
    })
  }
  clientPromise = globalWithMongo._mongoClientPromise
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options)
  clientPromise = client.connect().catch((error) => {
    console.error("Failed to connect to MongoDB in production:", error)
    throw error
  })
}

// Connection status tracking
let isConnected = false
let lastConnectionAttempt = 0
const CONNECTION_RETRY_INTERVAL = 30000 // 30 seconds

export async function connectToDatabase() {
  try {
    // Check if we've recently tried to connect and failed
    const now = Date.now()
    if (!isConnected && now - lastConnectionAttempt < CONNECTION_RETRY_INTERVAL) {
      console.log("Skipping connection attempt due to recent failure, will retry later")
      throw new Error("MongoDB connection temporarily unavailable, please try again later")
    }

    lastConnectionAttempt = now
    const client = await clientPromise

    // Test the connection with a ping
    await client.db("admin").command({ ping: 1 })

    isConnected = true
    console.log("MongoDB connection established successfully")

    const db = client.db("wieca_mentor_connect")
    return db
  } catch (error) {
    isConnected = false
    console.error("Failed to connect to database:", error)

    // Provide more specific error messages based on error type
    if (error.name === "MongoServerSelectionError") {
      throw new Error("Unable to connect to the database server. Please check your network connection and try again.")
    } else if (error.name === "MongoNetworkError") {
      throw new Error("Network error when connecting to database. Please check your internet connection.")
    } else {
      throw new Error(`Database connection failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
}

// Function to check database connection status
export async function checkDatabaseConnection() {
  try {
    if (!process.env.MONGODB_URI) {
      return {
        connected: false,
        error: "MONGODB_URI environment variable is not set",
      }
    }

    const client = await clientPromise
    await client.db("admin").command({ ping: 1 })

    return {
      connected: true,
      database: "wieca_mentor_connect",
      host: new URL(process.env.MONGODB_URI).host,
      lastConnectionAttempt,
    }
  } catch (error) {
    return {
      connected: false,
      error: error instanceof Error ? error.message : String(error),
      lastAttempt: lastConnectionAttempt,
    }
  }
}

// Function to get connection status without making a new connection
export function getConnectionStatus() {
  return { isConnected, lastConnectionAttempt }
}

// Function to reset connection status and force a new connection attempt
export function resetConnection() {
  isConnected = false
  lastConnectionAttempt = 0
  console.log("MongoDB connection status reset, will attempt new connection on next request")
}

// Export clientPromise for use with @auth/mongodb-adapter
export default clientPromise
