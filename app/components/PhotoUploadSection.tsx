'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface PhotoUploadSectionProps {
  providerId: string
  photos: string[]
  primaryPhoto: string | null | undefined
  onPhotosUpdate: () => void
  isOwner: boolean
}

interface UpdateData {
  photo_urls?: string[]
  primary_photo_url?: string | null
}

export default function PhotoUploadSection({ 
  providerId, 
  photos, 
  primaryPhoto,
  onPhotosUpdate,
  isOwner 
}: PhotoUploadSectionProps) {
  const [uploading, setUploading] = useState(false)
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const supabase = createClient()

  const allPhotos = photos && photos.length > 0 
    ? photos 
    : (primaryPhoto ? [primaryPhoto] : ['/placeholder-facility.jpg'])

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

      const { data, error: uploadError } = await supabase.storage
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
      
      if (currentPhotos.length === 0) {
        updateData.primary_photo_url = publicUrl
      }

      const { error: updateError } = await supabase
        .from('providers')
        .update(updateData)
        .eq('id', providerId)

      if (updateError) throw updateError

      onPhotosUpdate()
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
      if (urlParts.length < 2) throw new Error('Invalid photo URL')
      
      const filePath = urlParts[1]

      const { error: deleteError } = await supabase.storage
        .from('provider-photos')
        .remove([filePath])

      if (deleteError && deleteError.message !== 'Object not found') {
        throw deleteError
      }

      const updatedPhotos = (photos || []).filter((_, i) => i !== index)
      
      const updateData: UpdateData = {
        photo_urls: updatedPhotos
      }

      if (primaryPhoto === photoUrl) {
        updateData.primary_photo_url = updatedPhotos[0] || null
      }

      const { error: updateError } = await supabase
        .from('providers')
        .update(updateData)
        .eq('id', providerId)

      if (updateError) throw updateError

      setCurrentPhotoIndex(0)
      onPhotosUpdate()
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

      onPhotosUpdate()
      alert('Primary photo updated!')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred'
      alert(`Error setting primary photo: ${errorMessage}`)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
      <div className="relative h-96">
        <img
          src={allPhotos[currentPhotoIndex]}
          alt={`Photo ${currentPhotoIndex + 1}`}
          className="w-full h-full object-cover"
        />
        
        {allPhotos.length > 1 && (
          <>
            <button
              onClick={prevPhoto}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={nextPhoto}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
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

        {isOwner && (
          <>
            <div className="absolute bottom-4 left-4 flex gap-2">
              <label className="bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-800 px-4 py-2 rounded-lg cursor-pointer shadow-lg transition-all">
                <span className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  {uploading ? 'Uploading...' : 'Add Photo'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>

              {allPhotos[currentPhotoIndex] !== '/placeholder-facility.jpg' && (
                <button
                  onClick={() => handleSetPrimary(allPhotos[currentPhotoIndex])}
                  className="bg-blue-500 bg-opacity-90 hover:bg-opacity-100 text-white px-4 py-2 rounded-lg shadow-lg"
                  title="Set as primary photo"
                >
                  Set Primary
                </button>
              )}
            </div>

            {allPhotos[currentPhotoIndex] !== '/placeholder-facility.jpg' && (
              <button
                onClick={() => handleDeletePhoto(allPhotos[currentPhotoIndex], currentPhotoIndex)}
                className="absolute top-4 right-4 bg-red-500 bg-opacity-90 hover:bg-opacity-100 text-white p-2 rounded-full shadow-lg"
                title="Delete this photo"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </>
        )}
      </div>

      {isOwner && photos && photos.length > 0 && (
        <div className="p-4 bg-gray-50">
          <h4 className="text-sm font-medium mb-2">All Photos ({photos.length})</h4>
          <div className="grid grid-cols-6 gap-2">
            {photos.map((photo, index) => (
              <div key={index} className="relative group">
                <img
                  src={photo}
                  alt={`Thumbnail ${index + 1}`}
                  className="w-full h-16 object-cover rounded cursor-pointer"
                  onClick={() => setCurrentPhotoIndex(index)}
                />
                {photo === primaryPhoto && (
                  <span className="absolute top-0 right-0 bg-blue-500 text-white text-xs px-1 rounded">
                    Primary
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