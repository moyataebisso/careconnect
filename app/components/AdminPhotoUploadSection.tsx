'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface AdminPhotoUploadSectionProps {
  providerId: string
  photos: string[]
  primaryPhoto: string | null | undefined
  onPhotosUpdate: (photos: string[], primaryPhoto: string | null) => void
}

interface UpdateData {
  photo_urls?: string[]
  primary_photo_url?: string | null
}

export default function AdminPhotoUploadSection({
  providerId,
  photos,
  primaryPhoto,
  onPhotosUpdate
}: AdminPhotoUploadSectionProps) {
  const [uploading, setUploading] = useState(false)
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const supabase = createClient()

  const allPhotos = photos && photos.length > 0
    ? photos
    : (primaryPhoto ? [primaryPhoto] : [])

  const hasPhotos = allPhotos.length > 0 && allPhotos[0] !== ''

  const nextPhoto = () => {
    if (allPhotos.length > 0) {
      setCurrentPhotoIndex((prev) => (prev + 1) % allPhotos.length)
    }
  }

  const prevPhoto = () => {
    if (allPhotos.length > 0) {
      setCurrentPhotoIndex((prev) => (prev - 1 + allPhotos.length) % allPhotos.length)
    }
  }

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true)

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.')
      }

      const file = event.target.files[0]
      const fileExt = file.name.split('.').pop()
      const fileName = `${providerId}/${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('provider-photos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('provider-photos')
        .getPublicUrl(fileName)

      const currentPhotos = photos || []
      const updatedPhotos = [...currentPhotos, publicUrl]

      const updateData: UpdateData = {
        photo_urls: updatedPhotos
      }

      let newPrimaryPhoto = primaryPhoto
      if (currentPhotos.length === 0) {
        updateData.primary_photo_url = publicUrl
        newPrimaryPhoto = publicUrl
      }

      const { error: updateError } = await supabase
        .from('providers')
        .update(updateData)
        .eq('id', providerId)

      if (updateError) throw updateError

      onPhotosUpdate(updatedPhotos, newPrimaryPhoto || null)
      alert('Photo uploaded successfully!')

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred'
      alert(`Error uploading photo: ${errorMessage}`)
    } finally {
      setUploading(false)
    }
  }

  const handleDeletePhoto = async (photoUrl: string, index: number) => {
    if (!confirm('Are you sure you want to delete this photo?')) return

    try {
      const urlParts = photoUrl.split('/provider-photos/')
      if (urlParts.length >= 2) {
        const filePath = urlParts[1]
        const { error: deleteError } = await supabase.storage
          .from('provider-photos')
          .remove([filePath])

        if (deleteError && deleteError.message !== 'Object not found') {
          console.error('Storage delete error:', deleteError)
        }
      }

      const updatedPhotos = (photos || []).filter((_, i) => i !== index)

      const updateData: UpdateData = {
        photo_urls: updatedPhotos
      }

      let newPrimaryPhoto = primaryPhoto
      if (primaryPhoto === photoUrl) {
        newPrimaryPhoto = updatedPhotos[0] || null
        updateData.primary_photo_url = newPrimaryPhoto
      }

      const { error: updateError } = await supabase
        .from('providers')
        .update(updateData)
        .eq('id', providerId)

      if (updateError) throw updateError

      setCurrentPhotoIndex(0)
      onPhotosUpdate(updatedPhotos, newPrimaryPhoto || null)
      alert('Photo deleted successfully!')

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred'
      alert(`Error deleting photo: ${errorMessage}`)
    }
  }

  const handleSetPrimary = async (photoUrl: string) => {
    try {
      const { error } = await supabase
        .from('providers')
        .update({ primary_photo_url: photoUrl })
        .eq('id', providerId)

      if (error) throw error

      onPhotosUpdate(photos, photoUrl)
      alert('Primary photo updated!')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred'
      alert(`Error setting primary photo: ${errorMessage}`)
    }
  }

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
      <div className="p-4 border-b border-gray-200 bg-white">
        <h3 className="text-lg font-semibold">Provider Photos</h3>
        <p className="text-sm text-gray-500">Upload, manage, and set the primary photo for this provider</p>
      </div>

      {hasPhotos ? (
        <div className="relative h-64 bg-gray-100">
          <img
            src={allPhotos[currentPhotoIndex]}
            alt={`Photo ${currentPhotoIndex + 1}`}
            className="w-full h-full object-contain"
          />

          {allPhotos.length > 1 && (
            <>
              <button
                onClick={prevPhoto}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={nextPhoto}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-2">
                {allPhotos.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentPhotoIndex(index)}
                    className={`w-2 h-2 rounded-full ${
                      index === currentPhotoIndex ? 'bg-white' : 'bg-white bg-opacity-50'
                    }`}
                  />
                ))}
              </div>
            </>
          )}

          {/* Delete button */}
          <button
            onClick={() => handleDeletePhoto(allPhotos[currentPhotoIndex], currentPhotoIndex)}
            className="absolute top-2 right-2 bg-red-500 bg-opacity-90 hover:bg-opacity-100 text-white p-2 rounded-full shadow-lg"
            title="Delete this photo"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>

          {/* Primary badge */}
          {allPhotos[currentPhotoIndex] === primaryPhoto && (
            <span className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
              Primary
            </span>
          )}
        </div>
      ) : (
        <div className="h-48 bg-gray-100 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p>No photos uploaded yet</p>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="p-4 bg-white border-t border-gray-200">
        <div className="flex flex-wrap gap-2">
          <label className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg cursor-pointer transition-colors">
            <span className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {uploading ? 'Uploading...' : 'Upload Photo'}
            </span>
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>

          {hasPhotos && allPhotos[currentPhotoIndex] !== primaryPhoto && (
            <button
              onClick={() => handleSetPrimary(allPhotos[currentPhotoIndex])}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Set as Primary
            </button>
          )}
        </div>
      </div>

      {/* Thumbnail grid */}
      {hasPhotos && photos.length > 0 && (
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <h4 className="text-sm font-medium mb-2">All Photos ({photos.length})</h4>
          <div className="grid grid-cols-6 gap-2">
            {photos.map((photo, index) => (
              <div
                key={index}
                className={`relative group cursor-pointer rounded overflow-hidden border-2 ${
                  index === currentPhotoIndex ? 'border-blue-500' : 'border-transparent'
                }`}
                onClick={() => setCurrentPhotoIndex(index)}
              >
                <img
                  src={photo}
                  alt={`Thumbnail ${index + 1}`}
                  className="w-full h-14 object-cover bg-gray-100"
                />
                {photo === primaryPhoto && (
                  <span className="absolute top-0 right-0 bg-blue-500 text-white text-xs px-1 rounded-bl">
                    P
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
