'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Message {
  id: string
  content: string
  sender_type: 'provider' | 'customer'
  sender_id: string
  created_at: string
  is_read: boolean
  is_flagged: boolean
}

interface Conversation {
  id: string
  provider_id: string
  customer_email: string
  booking_id?: string
  status: string
  provider?: {
    business_name: string
  }
}

interface MessagingSystemProps {
  providerId: string
  customerId: string  // Customer email
  bookingId?: string
  userType: 'provider' | 'customer'
  providerName?: string
  customerName?: string
}

export default function MessagingSystem({ 
  providerId, 
  customerId,
  bookingId,
  userType,
  providerName,
  customerName
}: MessagingSystemProps) {
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    initializeConversation()
  }, [customerId, bookingId])

  useEffect(() => {
    if (conversation) {
      loadMessages(conversation.id)
      const subscription = subscribeToMessages(conversation.id)
      return () => {
        subscription?.unsubscribe()
      }
    }
  }, [conversation])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const initializeConversation = async () => {
    try {
      console.log('Initializing conversation between provider and customer:', {
        providerId,
        customerId,
        bookingId,
        userType,
        providerName,
        customerName
      });

      // Check if conversation exists
      const { data: existingConvs } = await supabase
        .from('conversations')
        .select(`
          *,
          provider:providers(business_name)
        `)
        .eq('provider_id', providerId)
        .eq('customer_email', customerId)
        .eq('booking_id', bookingId || null)

      let existingConv = existingConvs && existingConvs.length > 0 ? existingConvs[0] : null

      if (!existingConv) {
        console.log('Creating new conversation...');
        // Create new conversation
        const { data: newConv, error } = await supabase
          .from('conversations')
          .insert({
            provider_id: providerId,
            customer_email: customerId,
            booking_id: bookingId,
            status: 'active'
          })
          .select(`
            *,
            provider:providers(business_name)
          `)
          .single()

        if (error) {
          console.error('Error creating conversation:', error)
          throw error
        }
        
        // Send automatic welcome message from provider
        if (newConv && userType === 'provider') {
          await supabase
            .from('messages')
            .insert({
              conversation_id: newConv.id,
              sender_type: 'provider',
              sender_id: providerId,
              content: `Hello ${customerName || 'there'}! This is ${providerName}. Thank you for your booking inquiry. How can I help you today?`,
              is_flagged: false
            })
        }
        
        existingConv = newConv
      }

      setConversation(existingConv)
    } catch (error) {
      console.error('Error initializing conversation:', error)
      alert('Unable to initialize chat. Please refresh the page and try again.')
    } finally {
      setLoading(false)
    }
  }

  const loadMessages = async (conversationId: string) => {
    console.log('Loading messages for conversation:', conversationId);
    
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    console.log('Messages loaded:', data);
    console.log('Load error:', error);
    
    if (data) {
      setMessages(data)
      // Mark messages as read based on who's viewing
      if (userType === 'customer') {
        markMessagesAsRead(data.filter(m => m.sender_type === 'provider'))
      } else if (userType === 'provider') {
        markMessagesAsRead(data.filter(m => m.sender_type === 'customer'))
      }
    } else if (error) {
      console.error('Error loading messages:', error)
    }
  }

  const markMessagesAsRead = async (messagesToMark: Message[]) => {
    const unreadIds = messagesToMark
      .filter(m => !m.is_read)
      .map(m => m.id)

    if (unreadIds.length > 0) {
      await supabase
        .from('messages')
        .update({ is_read: true })
        .in('id', unreadIds)
    }
  }

  const subscribeToMessages = (conversationId: string) => {
    console.log('Subscribing to messages for conversation:', conversationId);
    
    return supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          console.log('New message received:', payload);
          const newMsg = payload.new as Message
          
          // Check if message already exists to prevent duplicates
          setMessages(prev => {
            const exists = prev.some(m => m.id === newMsg.id)
            if (exists) return prev
            return [...prev, newMsg]
          })
          
          // Mark as read if it's from the other party
          if ((newMsg.sender_type === 'provider' && userType === 'customer') ||
              (newMsg.sender_type === 'customer' && userType === 'provider')) {
            markMessagesAsRead([newMsg])
          }
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
      })
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !conversation) return

    setSending(true)
    const messageContent = newMessage.trim()
    setNewMessage('') // Clear input immediately for better UX
    
    try {
      // Determine sender type and ID based on current user
      const messageSenderType: 'provider' | 'customer' = userType
      const messageSenderId = userType === 'customer' ? customerId : providerId

      // Create a temporary message ID for optimistic update
      const tempId = `temp-${Date.now()}`
      const tempMessage: Message = {
        id: tempId,
        content: messageContent,
        sender_type: messageSenderType,
        sender_id: messageSenderId,
        created_at: new Date().toISOString(),
        is_read: false,
        is_flagged: false
      }

      // Optimistically add the message to the UI
      setMessages(prev => [...prev, tempMessage])

      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversation.id,
          sender_type: messageSenderType,
          sender_id: messageSenderId,
          content: messageContent,
          is_flagged: false
        })
        .select()
        .single()

      if (error) throw error

      // Replace temp message with real one
      if (data) {
        setMessages(prev => prev.map(m => m.id === tempId ? data : m))
      }
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Failed to send message. Please try again.')
      setNewMessage(messageContent) // Restore message on error
      // Remove temp message on error
      setMessages(prev => prev.filter(m => !m.id.startsWith('temp-')))
    } finally {
      setSending(false)
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday ' + date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' + 
             date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading messages...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-lg h-[600px] flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg">
              {userType === 'customer' 
                ? `Chat with ${providerName || 'Provider'}`
                : `Chat with ${customerName || 'Customer'}`
              }
            </h3>
            <p className="text-sm opacity-90">Secure Platform Messaging</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm">Active</span>
          </div>
        </div>
      </div>

      {/* Warning Banner */}
      <div className="bg-yellow-50 border-b border-yellow-200 p-3">
        <div className="flex items-start space-x-2">
          <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-yellow-800">
            Keep all communications on-platform. Sharing contact information violates our terms and may result in account suspension.
          </p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="bg-white rounded-full p-6 mb-4 shadow-sm">
              <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No messages yet</h3>
            <p className="text-gray-600 max-w-sm">
              Start the conversation! Messages are encrypted and monitored for safety.
            </p>
          </div>
        ) : (
          <>
            {messages.map((message, index) => {
              // Customer messages always on right (blue), Provider messages always on left (gray)
              const isCustomerMessage = message.sender_type === 'customer'
              const showDateSeparator = index > 0 && 
                new Date(message.created_at).toDateString() !== 
                new Date(messages[index - 1].created_at).toDateString()

              return (
                <div key={message.id}>
                  {showDateSeparator && (
                    <div className="flex items-center justify-center my-2">
                      <div className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
                        {formatTime(message.created_at).split(' ')[0]}
                      </div>
                    </div>
                  )}
                  
                  <div className={`flex ${isCustomerMessage ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%]`}>
                      {/* Show sender name */}
                      {!isCustomerMessage && (
                        <p className="text-xs text-gray-500 mb-1 px-1">
                          {providerName || 'Provider'}
                        </p>
                      )}
                      {isCustomerMessage && userType === 'provider' && (
                        <p className="text-xs text-gray-500 mb-1 px-1 text-right">
                          {customerName || 'Customer'}
                        </p>
                      )}
                      <div
                        className={`rounded-2xl px-4 py-2 ${
                          isCustomerMessage
                            ? 'bg-blue-600 text-white rounded-br-sm' // Customer messages: Blue, right side
                            : 'bg-gray-200 text-gray-800 shadow-sm rounded-bl-sm' // Provider messages: Gray, left side
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                        <p className={`text-xs mt-1 ${
                          isCustomerMessage ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {formatTime(message.created_at)}
                          {message.is_read && (
                            <span className="ml-1">✓✓</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t bg-white p-4 rounded-b-lg">
        <div className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={sending || conversation?.status !== 'active'}
          />
          <button
            onClick={sendMessage}
            disabled={sending || !newMessage.trim() || conversation?.status !== 'active'}
            className="px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            {sending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Sending...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                <span>Send</span>
              </>
            )}
          </button>
        </div>
        {conversation?.status !== 'active' && (
          <p className="text-xs text-red-500 mt-2">This conversation has been closed.</p>
        )}
      </div>
    </div>
  )
}