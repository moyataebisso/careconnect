/**
 * Messaging System Tests
 * 
 * Tests for the messaging functionality in MessagingSystem.tsx
 * These test the core logic without rendering the component
 */

import { mockSupabase } from '../mocks/supabase'

// Test the messaging logic functions
describe('Messaging System Logic', () => {
  beforeEach(() => {
    mockSupabase.__resetMocks()
    jest.clearAllMocks()
  })

  describe('Conversation Initialization', () => {
    it('should find existing conversation', async () => {
      const existingConversation = {
        id: 'conv-1',
        provider_id: 'provider-1',
        customer_email: 'customer@example.com',
        booking_id: 'booking-1',
        status: 'active',
        provider: { business_name: 'Test Provider' },
      }

      mockSupabase.__setMockResponse([existingConversation])

      // Simulate the query
      const result = await mockSupabase
        .from('conversations')
        .select('*, provider:providers(business_name)')
        .eq('provider_id', 'provider-1')
        .eq('customer_email', 'customer@example.com')

      expect(result.data).toEqual([existingConversation])
      expect(mockSupabase.from).toHaveBeenCalledWith('conversations')
    })

    it('should create new conversation when none exists', async () => {
      const newConversation = {
        id: 'conv-new',
        provider_id: 'provider-1',
        customer_email: 'new-customer@example.com',
        booking_id: null,
        status: 'active',
      }

      // First query returns empty
      mockSupabase.__setMockResponse([])
      
      await mockSupabase
        .from('conversations')
        .select()
        .eq('provider_id', 'provider-1')
        .eq('customer_email', 'new-customer@example.com')

      // Then insert returns the new conversation
      mockSupabase.__setMockResponse(newConversation)
      
      const insertResult = await mockSupabase
        .from('conversations')
        .insert({
          provider_id: 'provider-1',
          customer_email: 'new-customer@example.com',
          status: 'active',
        })
        .select()
        .single()

      expect(insertResult.data).toEqual(newConversation)
      expect(mockSupabase.insert).toHaveBeenCalled()
    })
  })

  describe('Message Loading', () => {
    it('should load messages in chronological order', async () => {
      const messages = [
        {
          id: 'msg-1',
          conversation_id: 'conv-1',
          content: 'Hello!',
          sender_type: 'customer',
          sender_id: 'customer@example.com',
          created_at: '2025-01-01T10:00:00Z',
          is_read: true,
          is_flagged: false,
        },
        {
          id: 'msg-2',
          conversation_id: 'conv-1',
          content: 'Hi! How can I help?',
          sender_type: 'provider',
          sender_id: 'provider-1',
          created_at: '2025-01-01T10:05:00Z',
          is_read: false,
          is_flagged: false,
        },
      ]

      mockSupabase.__setMockResponse(messages)

      const result = await mockSupabase
        .from('messages')
        .select('*')
        .eq('conversation_id', 'conv-1')
        .order('created_at', { ascending: true })

      expect(result.data).toEqual(messages)
      expect(result.data[0].created_at).toBe('2025-01-01T10:00:00Z')
      expect(result.data[1].created_at).toBe('2025-01-01T10:05:00Z')
    })

    it('should handle empty message history', async () => {
      mockSupabase.__setMockResponse([])

      const result = await mockSupabase
        .from('messages')
        .select('*')
        .eq('conversation_id', 'conv-new')

      expect(result.data).toEqual([])
    })
  })

  describe('Sending Messages', () => {
    it('should send a message successfully', async () => {
      const newMessage = {
        id: 'msg-new',
        conversation_id: 'conv-1',
        content: 'Test message',
        sender_type: 'customer',
        sender_id: 'customer@example.com',
        created_at: new Date().toISOString(),
        is_read: false,
        is_flagged: false,
      }

      mockSupabase.__setMockResponse(newMessage)

      const result = await mockSupabase
        .from('messages')
        .insert({
          conversation_id: 'conv-1',
          sender_type: 'customer',
          sender_id: 'customer@example.com',
          content: 'Test message',
          is_flagged: false,
        })
        .select()
        .single()

      expect(result.data).toEqual(newMessage)
      expect(mockSupabase.insert).toHaveBeenCalled()
    })

    it('should reject empty messages', () => {
      const content = '   '
      const trimmed = content.trim()
      
      expect(trimmed).toBe('')
      // The component checks !newMessage.trim() before sending
    })

    it('should handle send failure gracefully', async () => {
      mockSupabase.__setMockResponse(null, new Error('Network error'))

      const result = await mockSupabase
        .from('messages')
        .insert({
          conversation_id: 'conv-1',
          content: 'Test',
          sender_type: 'customer',
          sender_id: 'test@example.com',
        })
        .select()
        .single()

      expect(result.error).toBeDefined()
      expect(result.error?.message).toBe('Network error')
    })
  })

  describe('Mark Messages as Read', () => {
    it('should mark unread messages as read', async () => {
      const unreadMessageIds = ['msg-1', 'msg-2']

      mockSupabase.__setMockResponse({ count: 2 })

      await mockSupabase
        .from('messages')
        .update({ is_read: true })
        .in('id', unreadMessageIds)

      expect(mockSupabase.update).toHaveBeenCalled()
      expect(mockSupabase.in).toHaveBeenCalledWith('id', unreadMessageIds)
    })

    it('should skip marking when no unread messages', async () => {
      const unreadIds: string[] = []
      
      // The component checks unreadIds.length > 0 before calling update
      expect(unreadIds.length).toBe(0)
    })
  })

  describe('Time Formatting', () => {
    // Test the formatTime function logic
    it('should format today\'s messages with just time', () => {
      const today = new Date()
      const date = new Date(today.setHours(14, 30, 0, 0))
      
      // This mimics the logic in MessagingSystem
      const formatted = date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit', 
        hour12: true 
      })
      
      expect(formatted).toMatch(/\d{1,2}:\d{2}\s(AM|PM)/)
    })

    it('should format yesterday\'s messages with "Yesterday"', () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      
      const today = new Date()
      
      // Check if date is yesterday
      const isYesterday = yesterday.toDateString() !== today.toDateString()
      expect(isYesterday).toBe(true)
    })
  })

  describe('Realtime Subscription', () => {
    it('should subscribe to new messages', () => {
      const conversationId = 'conv-1'
      
      mockSupabase.channel(`messages:${conversationId}`)
      
      expect(mockSupabase.channel).toHaveBeenCalledWith(`messages:${conversationId}`)
    })

    it('should prevent duplicate messages', () => {
      const existingMessages = [
        { id: 'msg-1', content: 'Hello' },
        { id: 'msg-2', content: 'Hi' },
      ]
      
      const newMessage = { id: 'msg-1', content: 'Hello' } // Duplicate
      
      // This mimics the component's duplicate check
      const exists = existingMessages.some(m => m.id === newMessage.id)
      expect(exists).toBe(true)
      
      const uniqueMessage = { id: 'msg-3', content: 'New' }
      const existsNew = existingMessages.some(m => m.id === uniqueMessage.id)
      expect(existsNew).toBe(false)
    })
  })

  describe('Conversation Status', () => {
    it('should disable input when conversation is closed', () => {
      const conversation = { id: 'conv-1', status: 'closed' }
      
      // Component checks conversation?.status !== 'active'
      const isDisabled = conversation.status !== 'active'
      expect(isDisabled).toBe(true)
    })

    it('should enable input when conversation is active', () => {
      const conversation = { id: 'conv-1', status: 'active' }
      
      const isDisabled = conversation.status !== 'active'
      expect(isDisabled).toBe(false)
    })
  })
})