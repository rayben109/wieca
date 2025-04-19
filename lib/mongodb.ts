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
  connectTimeoutMS: 10000, // 10 seconds timeout
  socketTimeoutMS: 45000, // 45 seconds timeout
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
    globalWithMongo._mongoClientPromise = client.connect()
  }
  clientPromise = globalWithMongo._mongoClientPromise
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options)
  clientPromise = client.connect()
}

// Connection status tracking
let isConnected = false

export async function connectToDatabase() {
  try {
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
    throw new Error(`Database connection failed: ${error instanceof Error ? error.message : String(error)}`)
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
    }
  } catch (error) {
    return {
      connected: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

// Function to get connection status without making a new connection
export function getConnectionStatus() {
  return { isConnected }
}

// Export clientPromise for use with @auth/mongodb-adapter
export default clientPromise
