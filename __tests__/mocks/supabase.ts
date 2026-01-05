/**
 * Supabase Mock Utility
 * 
 * This creates a chainable mock that mimics Supabase's query builder pattern.
 * Use this to test components and functions that interact with Supabase.
 */

type MockResponse<T> = {
  data: T | null
  error: Error | null
  count?: number
}

// Create a chainable mock builder
export function createSupabaseMock() {
  let mockResponse: MockResponse<unknown> = { data: null, error: null }

  const chainableMethods = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    gt: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lt: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    like: jest.fn().mockReturnThis(),
    ilike: jest.fn().mockReturnThis(),
    is: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    contains: jest.fn().mockReturnThis(),
    containedBy: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    match: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    filter: jest.fn().mockReturnThis(),
    not: jest.fn().mockReturnThis(),
    
    // Terminal methods that return the response
    single: jest.fn(() => Promise.resolve(mockResponse)),
    maybeSingle: jest.fn(() => Promise.resolve(mockResponse)),
    
    // RPC calls
    rpc: jest.fn((_functionName: string, _params?: Record<string, unknown>) => Promise.resolve(mockResponse)),
    
    // Make the object itself thenable for queries without .single()
    then: (resolve: (value: MockResponse<unknown>) => void) => {
      resolve(mockResponse)
      return Promise.resolve(mockResponse)
    },
  }

  // Storage mock
  const storageMock = {
    from: jest.fn(() => ({
      upload: jest.fn(() => Promise.resolve({ data: { path: 'test/path.jpg' }, error: null })),
      download: jest.fn(() => Promise.resolve({ data: new Blob(), error: null })),
      remove: jest.fn(() => Promise.resolve({ data: null, error: null })),
      getPublicUrl: jest.fn((path: string) => ({
        data: { publicUrl: `https://test-project.supabase.co/storage/v1/object/public/test-bucket/${path}` }
      })),
      list: jest.fn(() => Promise.resolve({ data: [], error: null })),
    })),
  }

  // Realtime mock
  const realtimeMock = {
    channel: jest.fn((_channelName: string) => ({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn((callback?: (status: string) => void) => {
        if (callback) callback('SUBSCRIBED')
        return {
          unsubscribe: jest.fn(),
        }
      }),
    })),
  }

  // Auth mock
  const authMock = {
    getUser: jest.fn(() => Promise.resolve({ data: { user: null }, error: null })),
    getSession: jest.fn(() => Promise.resolve({ data: { session: null }, error: null })),
    signInWithPassword: jest.fn(() => Promise.resolve({ data: { user: null, session: null }, error: null })),
    signUp: jest.fn(() => Promise.resolve({ data: { user: null, session: null }, error: null })),
    signOut: jest.fn(() => Promise.resolve({ error: null })),
    onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
  }

  const mock = {
    ...chainableMethods,
    storage: storageMock,
    auth: authMock,
    channel: realtimeMock.channel,
    
    // Helper to set the response for the next query
    __setMockResponse: <T>(data: T | null, error: Error | null = null, count?: number) => {
      mockResponse = { data, error, count }
    },
    
    // Helper to reset all mocks
    __resetMocks: () => {
      mockResponse = { data: null, error: null }
      Object.values(chainableMethods).forEach(fn => {
        if (jest.isMockFunction(fn)) {
          fn.mockClear()
        }
      })
    },
  }

  return mock
}

// Pre-configured mock instance
export const mockSupabase = createSupabaseMock()

// Mock the client creation functions
export const mockCreateClient = jest.fn(() => mockSupabase)
export const mockCreateAdminClient = jest.fn(() => mockSupabase)

// Apply mocks to Supabase modules
jest.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase,
}))

jest.mock('@/lib/supabase/server', () => ({
  createClient: async () => mockSupabase,
}))

jest.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => mockSupabase,
}))