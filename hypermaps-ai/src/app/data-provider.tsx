'use client';

import { USE_POSTGRES } from '@/lib/config';
import { HypergraphAppProvider } from '@graphprotocol/hypergraph-react';
import { mapping } from './mapping';
import { createContext, useContext, ReactNode, useState, useCallback } from 'react';
import { ChatMessage, Comment } from './schema';

// Mock data types
interface MockSpace {
  id: string;
  name: string;
  mode: 'public' | 'private';
}

interface MockSpacesData {
  data: MockSpace[] | undefined;
  isPending: boolean;
}

interface MockSpaceData {
  name: string;
  ready: boolean;
}

interface MockQueryData<T> {
  data: T[] | undefined;
  isPending: boolean;
}

type EntityClass = typeof ChatMessage | typeof Comment;

interface PostgresContextType {
  useSpaces: (options: { mode: 'public' | 'private' }) => MockSpacesData;
  useSpace: (options: { mode: 'public' | 'private' }) => MockSpaceData;
  useQuery: <T>(entityClass: EntityClass, options: Record<string, unknown>) => MockQueryData<T>;
  useUpdateEntity: <T>(entityClass: EntityClass) => (id: string, data: Partial<T>) => void;
  useDeleteEntity: () => (id: string) => void;
  mockMessages: ChatMessage[];
  mockComments: Comment[];
  setMockMessages: (messages: ChatMessage[]) => void;
  setMockComments: (comments: Comment[]) => void;
}

// Mock data
const mockPrivateSpaces: MockSpace[] = [
  {
    id: 'mock-private-space-1',
    name: 'My Private Workspace',
    mode: 'private'
  },
  {
    id: 'mock-private-space-2', 
    name: 'Personal AI Chat',
    mode: 'private'
  }
];

const mockPublicSpaces: MockSpace[] = [
  {
    id: 'mock-public-space-1',
    name: 'Public Demo Space',
    mode: 'public'
  }
];

// Initial mock messages
const initialMockMessages: ChatMessage[] = [
  {
    id: 'msg-1',
    content: 'Hello! Can you help me understand quantum computing?',
    role: 'user',
    createdAt: new Date('2024-01-01T10:00:00Z'),
    parentMessageId: '',
    conversationId: 'conv-1',
    position: 0,
    x: 100,
    y: 100
  },
  {
    id: 'msg-2', 
    content: 'Quantum computing is a type of computation that harnesses quantum mechanics to process information in fundamentally different ways than classical computers. It uses quantum bits (qubits) that can exist in multiple states simultaneously.',
    role: 'assistant',
    createdAt: new Date('2024-01-01T10:01:00Z'),
    parentMessageId: 'msg-1',
    conversationId: 'conv-1',
    position: 1,
    x: 350,
    y: 100
  },
  {
    id: 'msg-3',
    content: 'Can you explain quantum entanglement?',
    role: 'user',
    createdAt: new Date('2024-01-01T10:02:00Z'),
    parentMessageId: 'msg-2',
    conversationId: 'conv-1',
    position: 2,
    x: 100,
    y: 250
  }
];

// Initial mock comments
const initialMockComments: Comment[] = [
  {
    id: 'comment-1',
    content: 'This is a great explanation!',
    createdAt: new Date('2024-01-01T10:03:00Z'),
    conversationId: 'conv-1',
    position: 0,
    x: 200,
    y: 300
  }
];

// Create postgres context
const PostgresContext = createContext<PostgresContextType | null>(null);

const PostgresProvider = ({ children }: { children: ReactNode }) => {
  console.log('Running in Postgres mode');
  
  // State for mock data
  const [mockMessages, setMockMessages] = useState<ChatMessage[]>(initialMockMessages);
  const [mockComments, setMockComments] = useState<Comment[]>(initialMockComments);

  // Create update callback for messages
  const updateMessageCallback = useCallback((id: string, data: Partial<ChatMessage>) => {
    console.log('Mock update message:', id, data);
    setMockMessages(prev => 
      prev.map(msg => 
        msg.id === id ? { ...msg, ...data } : msg
      )
    );
  }, []);

  // Create update callback for comments
  const updateCommentCallback = useCallback((id: string, data: Partial<Comment>) => {
    console.log('Mock update comment:', id, data);
    setMockComments(prev =>
      prev.map(comment =>
        comment.id === id ? { ...comment, ...data } : comment
      )
    );
  }, []);

  // Create delete callback
  const deleteEntityCallback = useCallback((id: string) => {
    console.log('Mock delete entity:', id);
    setMockMessages(prev => prev.filter(msg => msg.id !== id));
    setMockComments(prev => prev.filter(comment => comment.id !== id));
  }, []);

  const mockUseSpaces = (options: { mode: 'public' | 'private' }): MockSpacesData => {
    const spaces = options.mode === 'private' ? mockPrivateSpaces : mockPublicSpaces;
    return {
      data: spaces,
      isPending: false
    };
  };

  const mockUseSpace = (options: { mode: 'public' | 'private' }): MockSpaceData => {
    // Return mock space data based on mode
    const spaceName = options.mode === 'private' ? 'My Private Workspace' : 'Public Demo Space';
    return {
      name: spaceName,
      ready: true
    };
  };

  const mockUseQuery = <T,>(entityClass: EntityClass): MockQueryData<T> => {
    // Determine what type of entity is being queried
    if (entityClass === ChatMessage) {
      return {
        data: mockMessages as T[],
        isPending: false
      };
    } else if (entityClass === Comment) {
      return {
        data: mockComments as T[],
        isPending: false
      };
    }
    
    return {
      data: [],
      isPending: false
    };
  };

  const mockUseUpdateEntity = <T,>(entityClass: EntityClass) => {
    if (entityClass === ChatMessage) {
      return updateMessageCallback as (id: string, data: Partial<T>) => void;
    } else if (entityClass === Comment) {
      return updateCommentCallback as (id: string, data: Partial<T>) => void;
    }
    
    return () => {
      console.log('Mock update entity - unsupported type');
    };
  };

  const mockUseDeleteEntity = () => {
    return deleteEntityCallback;
  };

  const contextValue: PostgresContextType = {
    useSpaces: mockUseSpaces,
    useSpace: mockUseSpace,
    useQuery: mockUseQuery,
    useUpdateEntity: mockUseUpdateEntity,
    useDeleteEntity: mockUseDeleteEntity,
    mockMessages,
    mockComments,
    setMockMessages,
    setMockComments
  };

  return (
    <PostgresContext.Provider value={contextValue}>
      {children}
    </PostgresContext.Provider>
  );
};

// Hook to use postgres context
export const usePostgresSpaces = (options: { mode: 'public' | 'private' }) => {
  const context = useContext(PostgresContext);
  if (!context) {
    throw new Error('usePostgresSpaces must be used within PostgresProvider');
  }
  return context.useSpaces(options);
};

export const usePostgresSpace = (options: { mode: 'public' | 'private' }) => {
  const context = useContext(PostgresContext);
  if (!context) {
    throw new Error('usePostgresSpace must be used within PostgresProvider');
  }
  return context.useSpace(options);
};

export const usePostgresQuery = <T,>(entityClass: EntityClass, options: Record<string, unknown>) => {
  const context = useContext(PostgresContext);
  if (!context) {
    throw new Error('usePostgresQuery must be used within PostgresProvider');
  }
  return context.useQuery<T>(entityClass, options);
};

export const usePostgresUpdateEntity = <T,>(entityClass: EntityClass) => {
  const context = useContext(PostgresContext);
  if (!context) {
    throw new Error('usePostgresUpdateEntity must be used within PostgresProvider');
  }
  return context.useUpdateEntity<T>(entityClass);
};

export const usePostgresDeleteEntity = () => {
  const context = useContext(PostgresContext);
  if (!context) {
    throw new Error('usePostgresDeleteEntity must be used within PostgresProvider');
  }
  return context.useDeleteEntity();
};

// Mock HypergraphSpaceProvider for postgres mode
export const MockHypergraphSpaceProvider = ({ children }: { children: ReactNode }) => {
  if (USE_POSTGRES) {
    return <>{children}</>;
  }
  // This should never be reached, but just in case
  return <>{children}</>;
};

export function DataProvider({ children }: { children: ReactNode }) {
  if (USE_POSTGRES) {
    return <PostgresProvider>{children}</PostgresProvider>;
  }

  return (
    <HypergraphAppProvider mapping={mapping}>
      {children}
    </HypergraphAppProvider>
  );
} 