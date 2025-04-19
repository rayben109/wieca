"use server"

import { hash } from "bcryptjs"
import { connectToDatabase } from "@/lib/mongodb"
import crypto from "crypto"
import { sendEmailNotification } from "@/lib/email"

interface RegisterUserParams {
  email: string
  password: string
  role: string
}

export async function registerUser({ email, password, role }: RegisterUserParams) {
  try {
    const db = await connectToDatabase()
    const usersCollection = db.collection("users")

    // Check if user already exists
    const existingUser = await usersCollection.findOne({ email })
    if (existingUser) {
      return { success: false, error: "User with this email already exists" }
    }

    // Hash the password
    const hashedPassword = await hash(password, 12)

    // Create the user
    const result = await usersCollection.insertOne({
      email,
      password: hashedPassword,
      role,
      createdAt: new Date(),
    })

    return { success: true, userId: result.insertedId.toString() }
  } catch (error) {
    console.error("Registration error:", error)
    return { success: false, error: "Failed to register user" }
  }
}

export async function requestPasswordReset(email: string) {
  try {
    if (!email) {
      return { success: false, error: "Email is required" }
    }

    const db = await connectToDatabase()
    const usersCollection = db.collection("users")
    const resetTokensCollection = db.collection("passwordResetTokens")

    // Check if user exists
    const user = await usersCollection.findOne({ email })

    // For security reasons, we don't want to reveal if a user exists or not
    // So we'll return success even if the user doesn't exist
    if (!user) {
      return { success: true }
    }

    // Generate a reset token
    const token = crypto.randomBytes(32).toString("hex")
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex")

    // Set expiration to 1 hour from now
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 1)

    // Store the token
    await resetTokensCollection.deleteMany({ userId: user._id }) // Remove any existing tokens
    await resetTokensCollection.insertOne({
      userId: user._id,
      token: hashedToken,
      expiresAt,
      createdAt: new Date(),
    })

    // Send reset email
    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`
    console.log("NEXTAUTH_URL", resetUrl)

    await sendEmailNotification({
      to: email,
      subject: "Reset your WIECA Mentor Connect password",
      template: "new-message", // Reusing the message template for now
      data: {
        recipientName: user.name || email,
        senderName: "WIECA Mentor Connect",
        messagePreview: `You requested a password reset. Click the button below to reset your password. If you didn't request this, please ignore this email.`,
        conversationUrl: resetUrl,
      },
    })

    return { success: true }
  } catch (error) {
    console.error("Password reset request error:", error)
    return { success: false, error: "Failed to process password reset request" }
  }
}

export async function verifyResetToken(token: string) {
  try {
    if (!token) {
      return { valid: false }
    }

    const db = await connectToDatabase()
    const resetTokensCollection = db.collection("passwordResetTokens")

    // Hash the token to compare with stored hash
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex")

    // Find the token
    const resetToken = await resetTokensCollection.findOne({
      token: hashedToken,
      expiresAt: { $gt: new Date() }, // Token must not be expired
    })

    return { valid: !!resetToken }
  } catch (error) {
    console.error("Token verification error:", error)
    return { valid: false }
  }
}

export async function resetPassword(token: string, newPassword: string) {
  try {
    if (!token || !newPassword) {
      return { success: false, error: "Token and new password are required" }
    }

    const db = await connectToDatabase()
    const usersCollection = db.collection("users")
    const resetTokensCollection = db.collection("passwordResetTokens")

    // Hash the token to compare with stored hash
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex")

    // Find the token
    const resetToken = await resetTokensCollection.findOne({
      token: hashedToken,
      expiresAt: { $gt: new Date() }, // Token must not be expired
    })

    if (!resetToken) {
      return { success: false, error: "Invalid or expired token" }
    }

    // Hash the new password
    const hashedPassword = await hash(newPassword, 12)

    // Update the user's password
    await usersCollection.updateOne(
      { _id: resetToken.userId },
      { $set: { password: hashedPassword, updatedAt: new Date() } },
    )

    // Delete the used token
    await resetTokensCollection.deleteOne({ _id: resetToken._id })

    return { success: true }
  } catch (error) {
    console.error("Password reset error:", error)
    return { success: false, error: "Failed to reset password" }
  }
}
