"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Camera, Loader2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

interface ProfileImageUploadProps {
  currentImage?: string
  name: string
  onImageUpload: (imageUrl: string) => void
}

export function ProfileImageUpload({ currentImage, name, onImageUpload }: ProfileImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImage || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file (JPEG, PNG, etc.)",
        variant: "destructive",
      })
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)

    try {
      // Create a preview URL for immediate feedback
      const objectUrl = URL.createObjectURL(file)
      setPreviewUrl(objectUrl)

      // In a real implementation, you would upload the file to a storage service
      // For this example, we'll simulate an upload delay and return a placeholder URL
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // This is a placeholder. In a real app, you would get the URL from your storage service
      const uploadedUrl = objectUrl

      onImageUpload(uploadedUrl)
      toast({
        title: "Image uploaded",
        description: "Your profile image has been updated",
      })
    } catch (error) {
      console.error("Upload error:", error)
      toast({
        title: "Upload failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      })
      setPreviewUrl(currentImage || null)
    } finally {
      setIsUploading(false)
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  // Get initials for avatar fallback
  const getInitials = () => {
    if (!name) return "U"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <Avatar className="h-24 w-24">
          <AvatarImage src={previewUrl || undefined} alt={name} />
          <AvatarFallback className="text-lg">{getInitials()}</AvatarFallback>
        </Avatar>
        <Button
          type="button"
          size="icon"
          variant="secondary"
          className="absolute bottom-0 right-0 h-8 w-8 rounded-full"
          onClick={triggerFileInput}
          disabled={isUploading}
        >
          {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
        </Button>
      </div>
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleFileChange}
        disabled={isUploading}
      />
      <input type="hidden" name="profileImage" value={previewUrl || ""} />
    </div>
  )
}
