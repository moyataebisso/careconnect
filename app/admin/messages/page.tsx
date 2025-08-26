'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface Conversation {
  id: string
  customer_email: string
  provider_id: string
  booking_id: string
  status: string
  created_at: string
  provider?: {
    business_name: string
  }
  last_message?: {
    content: string
    created_at: string
    sender_type: string
  }
  unread_count?: number
}

interface Message {
  id: string
  content: string
  sender_type: 'support' | 'customer'
  sender_id: string
  created_at: string
  is_read: boolean
}

export default function SupportMessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const supabase = createClient()

  const SUPPORT_USER_ID = 'e5fde3a3-46f8-4df9-a48e-edfed098ede0'

  useEffect(() => {
    checkAdminAndLoadConversations()
  }, [])

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id)
      const subscription = subscribeToMessages(selectedConversation.id)
      return () => {
        subscription?.unsubscribe()
      }
    }
  }, [selectedConversation])

  const checkAdminAndLoadConversations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user || user.id !== SUPPORT_USER_ID) {
        // Check if user is admin
        const { data: adminUser } = await supabase
          .from('admin_users')
          .select('role')
          .eq('user_id', user?.id)
          .single()

        if (!adminUser) {
          alert('Access denied. Admin privileges required.')
          window.location.href = '/dashboard'
          return
        }
      }

      await loadConversations()
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadConversations = async () => {
    try {
      // Get all conversations with last message and unread count
      const { data: convs, error } = await supabase
        .from('conversations')
        .select(`
          *,
          provider:providers(business_name)
        `)
        .order('updated_at', { ascending: false })

      if (error) throw error

      // Get last message and unread count for each conversation
      const conversationsWithDetails = await Promise.all(
        (convs || []).map(async (conv) => {
          // Get last message
          const { data: lastMsg } = await supabase
            .from('messages')
            .select('content, created_at, sender_type')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

          // Get unread count
          const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .eq('is_read', false)
            .eq('sender_type', 'customer')

          return {
            ...conv,
            last_message: lastMsg,
            unread_count: count || 0
          }
        })
      )

      setConversations(conversationsWithDetails)
    } catch (error) {
      console.error('Error loading conversations:', error)
    }
  }

  const loadMessages = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (error) throw error
      
      setMessages(data || [])
      
      // Mark messages as read
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .eq('sender_type', 'customer')
        .eq('is_read', false)
    } catch (error) {
      console.error('Error loading messages:', error)
    }
  }

  const subscribeToMessages = (conversationId: string) => {
    return supabase
      .channel(`support-messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          const newMsg = payload.new as Message
          setMessages(prev => [...prev, newMsg])
          if (newMsg.sender_type === 'customer') {
            // Update unread count
            loadConversations()
          }
        }
      )
      .subscribe()
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return

    setSending(true)
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: selectedConversation.id,
          sender_type: 'support',
          sender_id: SUPPORT_USER_ID,
          content: newMessage.trim(),
          is_flagged: false
        })

      if (error) throw error
      
      setNewMessage('')
      await loadConversations() // Refresh to update last message
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Support Messages</h1>
            <Link href="/admin" className="text-blue-600 hover:text-blue-800">
              ← Back to Admin
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-12 gap-6 h-[calc(100vh-140px)]">
          {/* Conversations List */}
          <div className="col-span-4 bg-white rounded-lg shadow overflow-hidden">
            <div className="border-b p-4">
              <h2 className="font-semibold">Conversations</h2>
              <p className="text-sm text-gray-600 mt-1">
                {conversations.filter(c => (c.unread_count || 0) > 0).length} unread
              </p>
            </div>
            <div className="overflow-y-auto h-full">
              {conversations.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No conversations yet
                </div>
              ) : (
                conversations.map((conv) => (
                  <div
                    key={conv.id}
                    onClick={() => setSelectedConversation(conv)}
                    className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                      selectedConversation?.id === conv.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <div className="font-medium">{conv.customer_email}</div>
                      {(conv.unread_count || 0) > 0 && (
                        <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                          {conv.unread_count}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 mb-1">
                      Provider: {conv.provider?.business_name || 'Unknown'}
                    </div>
                    {conv.last_message && (
                      <>
                        <div className="text-sm text-gray-700 truncate">
                          {conv.last_message.sender_type === 'support' && '✓ '}
                          {conv.last_message.content}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {formatTime(conv.last_message.created_at)}
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Messages Area */}
          <div className="col-span-8 bg-white rounded-lg shadow flex flex-col">
            {selectedConversation ? (
              <>
                {/* Header */}
                <div className="border-b p-4">
                  <h3 className="font-semibold">{selectedConversation.customer_email}</h3>
                  <p className="text-sm text-gray-600">
                    Booking ID: {selectedConversation.booking_id || 'N/A'} | 
                    Provider: {selectedConversation.provider?.business_name}
                  </p>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`mb-4 ${
                        msg.sender_type === 'support' ? 'text-right' : 'text-left'
                      }`}
                    >
                      <div
                        className={`inline-block max-w-[70%] p-3 rounded-lg ${
                          msg.sender_type === 'support'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        <p>{msg.content}</p>
                        <p className={`text-xs mt-1 ${
                          msg.sender_type === 'support' ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {formatTime(msg.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Input */}
                <div className="border-t p-4">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      placeholder="Type a message..."
                      className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={sending}
                    />
                    <button
                      onClick={sendMessage}
                      disabled={sending || !newMessage.trim()}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      Send
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                Select a conversation to view messages
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}