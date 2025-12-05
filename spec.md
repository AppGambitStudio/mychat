Micro-SaaS Chat Widget Platform - Technical Specification
1. Overview
A multi-tenant SaaS platform that allows users to create AI-powered chat widgets trained on their custom knowledge base (PDFs and web content), which can be embedded on any website.
2. System Architecture
2.1 Technology Stack
Frontend:

Next.js 14+ (App Router)
React 18+
Tailwind CSS
shadcn/ui components

Backend:

Node.js 20+
TypeScript
Express.js or Next.js API Routes
PostgreSQL 15+ with pgvector extension
Use Docker and Docker Compose for containerization

AI Integration:

OpenRouter API
Text embedding models (e.g., text-embedding-3-small)
LLM models (e.g., GPT-4, Claude)

Additional Services:

PDF processing: pdf-parse or pdf.js (whichever is easier to use)
Web scraping: Cheerio, Puppeteer
Authentication: NextAuth.js
File storage: local storage to start with

3. Data Models
3.1 User Management
sql-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  password_hash VARCHAR(255), -- if using email/password auth
  avatar_url TEXT,
  subscription_tier VARCHAR(50) DEFAULT 'free', -- free, pro, enterprise
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_login_at TIMESTAMP
);

-- User sessions (if managing sessions manually)
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
3.2 Chat Spaces (Projects)
sql-- Chat spaces
CREATE TABLE chat_spaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'draft', -- draft, processing, published, archived
  endpoint_slug VARCHAR(255) UNIQUE, -- unique slug for public endpoint
  api_key VARCHAR(255) UNIQUE, -- for API access
  
  -- Widget configuration
  widget_config JSONB DEFAULT '{
    "theme": "light",
    "primaryColor": "#3B82F6",
    "position": "bottom-right",
    "welcomeMessage": "Hi! How can I help you?",
    "placeholder": "Type your message...",
    "botName": "Assistant",
    "botAvatar": null
  }',
  
  -- AI configuration
  ai_config JSONB DEFAULT '{
    "model": "gpt-3.5-turbo",
    "temperature": 0.7,
    "maxTokens": 500,
    "systemPrompt": "You are a helpful assistant."
  }',
  
  -- Usage limits and tracking
  message_count INTEGER DEFAULT 0,
  last_message_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  published_at TIMESTAMP
);

-- Index for faster lookups
CREATE INDEX idx_chat_spaces_user_id ON chat_spaces(user_id);
CREATE INDEX idx_chat_spaces_endpoint_slug ON chat_spaces(endpoint_slug);
CREATE INDEX idx_chat_spaces_status ON chat_spaces(status);
3.3 Knowledge Base
sql-- Documents (PDFs and scraped pages)
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_space_id UUID REFERENCES chat_spaces(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'pdf', 'url'
  source_url TEXT, -- for URLs or S3 path for PDFs
  file_name VARCHAR(255),
  file_size BIGINT, -- in bytes
  
  -- Processing status
  status VARCHAR(50) DEFAULT 'pending', -- pending, processing, completed, failed
  processing_started_at TIMESTAMP,
  processing_completed_at TIMESTAMP,
  error_message TEXT,
  
  -- Metadata
  title TEXT,
  author VARCHAR(255),
  page_count INTEGER,
  word_count INTEGER,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_documents_chat_space_id ON documents(chat_space_id);
CREATE INDEX idx_documents_status ON documents(status);
sql-- Document chunks (for vector search)
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  chat_space_id UUID REFERENCES chat_spaces(id) ON DELETE CASCADE,
  
  -- Content
  content TEXT NOT NULL,
  token_count INTEGER,
  
  -- Vector embedding
  embedding vector(1536), -- dimension depends on embedding model
  
  -- Metadata for context
  metadata JSONB DEFAULT '{}', -- page_number, section, heading, etc.
  chunk_index INTEGER, -- order within document
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- HNSW index for fast vector similarity search
CREATE INDEX idx_document_chunks_embedding ON document_chunks 
  USING hnsw (embedding vector_cosine_ops);

CREATE INDEX idx_document_chunks_document_id ON document_chunks(document_id);
CREATE INDEX idx_document_chunks_chat_space_id ON document_chunks(chat_space_id);
3.4 Conversations and Messages
sql-- Conversations (chat sessions)
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_space_id UUID REFERENCES chat_spaces(id) ON DELETE CASCADE,
  
  -- End-user identification (optional)
  end_user_id VARCHAR(255), -- external user ID or session ID
  end_user_email VARCHAR(255),
  end_user_name VARCHAR(255),
  
  -- Metadata
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  
  -- Status
  status VARCHAR(50) DEFAULT 'active', -- active, closed, archived
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  closed_at TIMESTAMP
);

CREATE INDEX idx_conversations_chat_space_id ON conversations(chat_space_id);
CREATE INDEX idx_conversations_end_user_id ON conversations(end_user_id);
sql-- Messages in conversations
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  chat_space_id UUID REFERENCES chat_spaces(id) ON DELETE CASCADE,
  
  -- Message content
  role VARCHAR(50) NOT NULL, -- 'user', 'assistant', 'system'
  content TEXT NOT NULL,
  
  -- AI metadata (for assistant messages)
  model VARCHAR(100),
  tokens_used INTEGER,
  processing_time_ms INTEGER,
  
  -- Context used (for debugging/analytics)
  context_chunks JSONB, -- array of chunk IDs used for RAG
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_chat_space_id ON messages(chat_space_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
3.5 Analytics and Usage
sql-- Usage analytics (aggregated daily)
CREATE TABLE usage_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_space_id UUID REFERENCES chat_spaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  date DATE NOT NULL,
  
  -- Metrics
  message_count INTEGER DEFAULT 0,
  conversation_count INTEGER DEFAULT 0,
  unique_users INTEGER DEFAULT 0,
  
  -- AI usage
  total_tokens_used INTEGER DEFAULT 0,
  total_cost_usd DECIMAL(10, 4) DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(chat_space_id, date)
);

CREATE INDEX idx_usage_analytics_chat_space_id ON usage_analytics(chat_space_id);
CREATE INDEX idx_usage_analytics_date ON usage_analytics(date);
sql-- Processing jobs queue
CREATE TABLE processing_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_space_id UUID REFERENCES chat_spaces(id) ON DELETE CASCADE,
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  
  job_type VARCHAR(50) NOT NULL, -- 'pdf_processing', 'url_scraping', 'embedding_generation'
  status VARCHAR(50) DEFAULT 'pending', -- pending, running, completed, failed
  
  progress INTEGER DEFAULT 0, -- 0-100
  
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_processing_jobs_status ON processing_jobs(status);
CREATE INDEX idx_processing_jobs_chat_space_id ON processing_jobs(chat_space_id);
```

## 4. API Endpoints

### 4.1 Authentication
```
POST   /api/auth/signup              - User registration
POST   /api/auth/login               - User login
POST   /api/auth/logout              - User logout
GET    /api/auth/me                  - Get current user
POST   /api/auth/forgot-password     - Request password reset
POST   /api/auth/reset-password      - Reset password
```

### 4.2 Chat Spaces
```
GET    /api/chat-spaces              - List user's chat spaces
POST   /api/chat-spaces              - Create new chat space
GET    /api/chat-spaces/:id          - Get chat space details
PATCH  /api/chat-spaces/:id          - Update chat space
DELETE /api/chat-spaces/:id          - Delete chat space
POST   /api/chat-spaces/:id/publish  - Publish chat space
POST   /api/chat-spaces/:id/unpublish - Unpublish chat space
GET    /api/chat-spaces/:id/widget   - Get widget embed code
```

### 4.3 Documents
```
GET    /api/chat-spaces/:id/documents       - List documents
POST   /api/chat-spaces/:id/documents/upload - Upload PDF
POST   /api/chat-spaces/:id/documents/url    - Add URL to scrape
GET    /api/documents/:id                    - Get document details
DELETE /api/documents/:id                    - Delete document
POST   /api/documents/:id/reprocess          - Reprocess document
```

### 4.4 Public Chat Widget API
```
POST   /api/widget/:slug/chat        - Send message to chatbot
GET    /api/widget/:slug/config      - Get widget configuration
POST   /api/widget/:slug/conversation - Create new conversation
GET    /api/widget/:slug/conversation/:id - Get conversation history
```

### 4.5 Analytics
```
GET    /api/chat-spaces/:id/analytics - Get chat space analytics
GET    /api/chat-spaces/:id/conversations - List conversations
GET    /api/conversations/:id/messages - Get conversation messages
5. Core Workflows
5.1 Chat Space Creation

User creates chat space with name and description
System generates unique endpoint slug and API key
Chat space status set to 'draft'
Default widget and AI configurations applied

5.2 Document Processing
PDF Upload:

User uploads PDF file
File stored in S3 or local storage
Document record created with 'pending' status
Background job created for processing
PDF extracted to text
Text split into chunks (with overlap)
Each chunk embedded using OpenRouter embedding API
Chunks and embeddings stored in database
Document status updated to 'completed'

URL Scraping:

User provides URL
Document record created with 'pending' status
Background job fetches and parses HTML
Extract main content (remove nav, footer, ads)
Convert to plain text
Follow same chunking and embedding process
Store metadata (title, author, date)

5.3 Publishing Chat Space

User clicks "Publish"
System validates:

At least one document processed
Valid configuration
Unique endpoint slug


Status updated to 'published'
Published_at timestamp set
Widget embed code generated
Public endpoint becomes accessible

5.4 Chat Message Flow
User sends message:

Request received at /api/widget/:slug/chat
Validate chat space is published
Create or retrieve conversation
Store user message in database
Generate embedding for user query
Perform vector similarity search in document_chunks
Retrieve top K relevant chunks (e.g., K=5)
Construct prompt with system message + context + user query
Call OpenRouter API with configured model
Store assistant response in database
Update usage metrics
Return response to user

5.5 Widget Embedding
Generated embed code:
html<script>
  (function() {
    var script = document.createElement('script');
    script.src = 'https://yourdomain.com/widget.js';
    script.setAttribute('data-chat-space', 'ENDPOINT_SLUG');
    document.body.appendChild(script);
  })();
</script>
6. Key Features Implementation
6.1 Text Chunking Strategy
typescriptinterface ChunkConfig {
  maxChunkSize: number;      // 1000 tokens
  overlapSize: number;        // 200 tokens
  chunkingMethod: 'fixed' | 'semantic'; // start with fixed, upgrade to semantic
}
6.2 RAG (Retrieval-Augmented Generation)
typescriptinterface RAGConfig {
  topK: number;                    // number of chunks to retrieve (5-10)
  similarityThreshold: number;     // minimum cosine similarity (0.7)
  rerankResults: boolean;          // optional reranking
  includeMetadata: boolean;        // include source info in response
}
6.3 Rate Limiting
typescriptinterface RateLimits {
  free: {
    messagesPerMonth: 100;
    chatSpaces: 1;
    documentsPerSpace: 5;
  };
  pro: {
    messagesPerMonth: 10000;
    chatSpaces: 10;
    documentsPerSpace: 50;
  };
  enterprise: {
    messagesPerMonth: -1;  // unlimited
    chatSpaces: -1;
    documentsPerSpace: -1;
  };
}
7. Security Considerations

Authentication: Secure JWT-based auth for admin panel
API Keys: Rate-limited, scoped to chat space
CORS: Configurable allowed domains per chat space
Input Validation: Sanitize all user inputs
File Upload: Validate file types, scan for malware, size limits
SQL Injection: Use parameterized queries
XSS Protection: Sanitize chat widget outputs
Rate Limiting: Prevent abuse on public endpoints

8. Performance Optimization

Caching: Redis for widget configs, frequently accessed data
Vector Search: HNSW indexes for fast similarity search
Background Jobs: Queue for document processing (Bull/BullMQ)
CDN: Serve widget JS/CSS from CDN
Database Indexes: On all foreign keys and frequently queried fields
Connection Pooling: PostgreSQL connection pool
Lazy Loading: Paginate conversations and messages

9. Monitoring and Observability

Logging: Structured logging (Winston/Pino)
Error Tracking: Sentry or similar
Analytics: Track usage, popular queries, response times
Health Checks: /health endpoint
Metrics: Token usage, processing times, error rates

10. Future Enhancements

Multi-language support
Voice input/output
Image understanding in PDFs
Custom training/fine-tuning
A/B testing for prompts
Conversation handoff to human agents
Integration with third-party tools (Slack, Discord, etc.)
Custom domain for widgets
White-label options