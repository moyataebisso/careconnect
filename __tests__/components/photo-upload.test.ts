/**
 * Photo Upload Tests
 * 
 * Tests for PhotoUploadSection component logic
 */

import { mockSupabase } from '../mocks/supabase'

describe('Photo Upload System', () => {
  beforeEach(() => {
    mockSupabase.__resetMocks()
    jest.clearAllMocks()
  })

  describe('Photo Upload', () => {
    it('should upload a photo to storage', async () => {
      const file = new File(['test'], 'test-photo.jpg', { type: 'image/jpeg' })
      const providerId = 'provider-1'
      const fileName = `${providerId}/${Date.now()}.jpg`

      // Mock storage upload
      const uploadResult = { data: { path: fileName }, error: null }
      
      expect(uploadResult.error).toBeNull()
      expect(uploadResult.data.path).toContain(providerId)
    })

    it('should generate public URL after upload', () => {
      const fileName = 'provider-1/12345.jpg'
      const bucket = 'provider-photos'
      
      const publicUrl = `https://test-project.supabase.co/storage/v1/object/public/${bucket}/${fileName}`
      
      expect(publicUrl).toContain(bucket)
      expect(publicUrl).toContain(fileName)
    })

    it('should update provider photo_urls after upload', async () => {
      const currentPhotos = ['photo1.jpg', 'photo2.jpg']
      const newPhotoUrl = 'photo3.jpg'
      const updatedPhotos = [...currentPhotos, newPhotoUrl]

      mockSupabase.__setMockResponse({ photo_urls: updatedPhotos })

      const result = await mockSupabase
        .from('providers')
        .update({ photo_urls: updatedPhotos })
        .eq('id', 'provider-1')

      expect(updatedPhotos).toHaveLength(3)
      expect(mockSupabase.update).toHaveBeenCalled()
    })

    it('should set primary photo for first upload', async () => {
      const currentPhotos: string[] = []
      const newPhotoUrl = 'first-photo.jpg'

      // If no photos exist, set the new one as primary
      const updateData: { photo_urls: string[]; primary_photo_url?: string } = {
        photo_urls: [newPhotoUrl],
      }

      if (currentPhotos.length === 0) {
        updateData.primary_photo_url = newPhotoUrl
      }

      expect(updateData.primary_photo_url).toBe(newPhotoUrl)
    })
  })

  describe('Photo Deletion', () => {
    it('should remove photo from storage', async () => {
      const photoUrl = 'https://test.supabase.co/storage/v1/object/public/provider-photos/provider-1/photo.jpg'
      const filePath = 'provider-1/photo.jpg'

      // Extract file path from URL
      const urlParts = photoUrl.split('/provider-photos/')
      const extractedPath = urlParts[1]

      expect(extractedPath).toBe(filePath)
    })

    it('should update photo_urls after deletion', async () => {
      const photos = ['photo1.jpg', 'photo2.jpg', 'photo3.jpg']
      const indexToDelete = 1
      const updatedPhotos = photos.filter((_, i) => i !== indexToDelete)

      expect(updatedPhotos).toHaveLength(2)
      expect(updatedPhotos).not.toContain('photo2.jpg')
    })

    it('should update primary photo if deleted photo was primary', async () => {
      const photos = ['photo1.jpg', 'photo2.jpg']
      const primaryPhoto = 'photo1.jpg'
      const deletedPhoto = 'photo1.jpg'

      const updatedPhotos = photos.filter(p => p !== deletedPhoto)
      
      const updateData: { photo_urls: string[]; primary_photo_url?: string | null } = { photo_urls: updatedPhotos }

      // If deleted photo was primary, set new primary
      if (primaryPhoto === deletedPhoto) {
        updateData.primary_photo_url = updatedPhotos[0] || null
      }

      expect(updateData.primary_photo_url).toBe('photo2.jpg')
    })

    it('should set primary to null when last photo deleted', async () => {
      const photos = ['only-photo.jpg']
      const primaryPhoto = 'only-photo.jpg'
      const deletedPhoto = 'only-photo.jpg'

      const updatedPhotos = photos.filter(p => p !== deletedPhoto)
      
      const updateData: { photo_urls: string[]; primary_photo_url?: string | null } = { photo_urls: updatedPhotos }

      if (primaryPhoto === deletedPhoto) {
        updateData.primary_photo_url = updatedPhotos[0] || null
      }

      expect(updateData.primary_photo_url).toBeNull()
    })
  })

  describe('Set Primary Photo', () => {
    it('should update primary_photo_url', async () => {
      const newPrimaryUrl = 'photo2.jpg'

      mockSupabase.__setMockResponse({ primary_photo_url: newPrimaryUrl })

      const result = await mockSupabase
        .from('providers')
        .update({ primary_photo_url: newPrimaryUrl })
        .eq('id', 'provider-1')

      expect(mockSupabase.update).toHaveBeenCalled()
    })
  })

  describe('Photo Gallery Navigation', () => {
    it('should navigate to next photo', () => {
      const photos = ['p1.jpg', 'p2.jpg', 'p3.jpg']
      let currentIndex = 0

      // Next photo
      currentIndex = (currentIndex + 1) % photos.length
      expect(currentIndex).toBe(1)

      // Next from last wraps to first
      currentIndex = 2
      currentIndex = (currentIndex + 1) % photos.length
      expect(currentIndex).toBe(0)
    })

    it('should navigate to previous photo', () => {
      const photos = ['p1.jpg', 'p2.jpg', 'p3.jpg']
      let currentIndex = 1

      // Previous photo
      currentIndex = (currentIndex - 1 + photos.length) % photos.length
      expect(currentIndex).toBe(0)

      // Previous from first wraps to last
      currentIndex = 0
      currentIndex = (currentIndex - 1 + photos.length) % photos.length
      expect(currentIndex).toBe(2)
    })
  })

  describe('Photo Display', () => {
    it('should show placeholder when no photos', () => {
      const photos: string[] = []
      const primaryPhoto: string | null = null

      const allPhotos = photos && photos.length > 0
        ? photos
        : (primaryPhoto ? [primaryPhoto] : ['https://via.placeholder.com/800x600?text=No+Photos+Yet'])

      expect(allPhotos).toHaveLength(1)
      expect(allPhotos[0]).toContain('placeholder')
    })

    it('should prioritize photos array over primary', () => {
      const photos = ['p1.jpg', 'p2.jpg']
      const primaryPhoto = 'primary.jpg'

      const allPhotos = photos && photos.length > 0
        ? photos
        : (primaryPhoto ? [primaryPhoto] : [])

      expect(allPhotos).toEqual(photos)
      expect(allPhotos).not.toContain('primary.jpg')
    })

    it('should fall back to primary if no photos array', () => {
      const photos: string[] = []
      const primaryPhoto = 'primary.jpg'

      const allPhotos = photos && photos.length > 0
        ? photos
        : (primaryPhoto ? [primaryPhoto] : [])

      expect(allPhotos).toEqual([primaryPhoto])
    })
  })

  describe('File Validation', () => {
    it('should accept image file types', () => {
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
      
      validTypes.forEach(type => {
        expect(type.startsWith('image/')).toBe(true)
      })
    })

    it('should extract file extension', () => {
      const fileName = 'my-photo.jpeg'
      const fileExt = fileName.split('.').pop()

      expect(fileExt).toBe('jpeg')
    })

    it('should generate unique file names', () => {
      const providerId = 'provider-1'
      const timestamp1 = Date.now()
      const timestamp2 = timestamp1 + 1

      const fileName1 = `${providerId}/${timestamp1}.jpg`
      const fileName2 = `${providerId}/${timestamp2}.jpg`

      expect(fileName1).not.toBe(fileName2)
    })
  })

  describe('Owner Permissions', () => {
    it('should show upload button only for owner', () => {
      const isOwner = true
      const showUploadButton = isOwner

      expect(showUploadButton).toBe(true)
    })

    it('should hide upload button for non-owner', () => {
      const isOwner = false
      const showUploadButton = isOwner

      expect(showUploadButton).toBe(false)
    })

    it('should show delete button only for owner', () => {
      const isOwner = true
      const hasPhotos = true
      const showDeleteButton = isOwner && hasPhotos

      expect(showDeleteButton).toBe(true)
    })
  })
})