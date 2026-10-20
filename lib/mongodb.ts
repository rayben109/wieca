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

// Use a global variable so the client is preserved across module reloads caused by
// HMR in development and reused across invocations of a warm serverless instance.
const globalWithMongo = global as typeof globalThis & {
  _mongoClientPromise?: Promise<MongoClient>
}

// Returns the cached client promise, creating a new one if none exists.
// A failed connection is cleared from the cache so the next call retries
// instead of re-throwing the same rejected promise for the life of the instance.
function getClientPromise(): Promise<MongoClient> {
  if (!globalWithMongo._mongoClientPromise) {
    const client = new MongoClient(uri, options)
    globalWithMongo._mongoClientPromise = client.connect().catch((error) => {
      console.error(`Failed to connect to MongoDB in ${process.env.NODE_ENV}:`, error)
      globalWithMongo._mongoClientPromise = undefined
      throw error
    })
  }
  return globalWithMongo._mongoClientPromise
}

const clientPromise = getClientPromise()

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
    const client = await getClientPromise()

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

    const client = await getClientPromise()
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
