# 🗺️ Hypergraph AI Map

A revolutionary collaborative AI conversation mapping platform built on Next.js and powered by Hypergraph technology. Create, visualize, and share AI conversations as interactive knowledge maps that can be collaborated on privately and published on-chain for the world to explore.

## 🚀 What This Project Does

Hypergraph AI Map transforms traditional linear AI conversations into dynamic, visual knowledge graphs. Instead of scrolling through endless chat logs, you can:

- **Visualize Conversations**: See AI interactions as connected nodes in a flow-based interface
- **Branch Conversations**: Create multiple conversation paths from any point
- **Add Context**: Insert comments and annotations anywhere in your conversation map
- **Collaborate Privately**: Work together on the same conversation map in real-time
- **Publish & Share**: Publish your maps on-chain for others to discover and fork

## 🏗️ Architecture

### Next.js Migration from Vite
This project was migrated from Vite to Next.js to leverage:
- **Server-Side Rendering**: Better SEO and initial load performance
- **API Routes**: Seamless backend integration for AI services
- **App Router**: Modern routing with layout support
- **Built-in Optimizations**: Image optimization, font loading, and bundle splitting

### Hypergraph as the Data Layer
[Hypergraph](https://github.com/graphprotocol/hypergraph) serves as our decentralized data store:
- **Entity-Based Storage**: Messages, comments, and conversations are stored as entities
- **Real-time Sync**: Changes propagate instantly across all collaborators
- **Cryptographic Security**: All data is cryptographically signed and verified
- **Offline-First**: Works without internet, syncs when reconnected
- **Version Control**: Built-in history and conflict resolution

## 🤝 Private Collaboration

### Secure Team Workspaces
- **Encrypted Spaces**: Each project exists in a private, encrypted hypergraph space
- **Access Control**: Only invited collaborators can view and edit
- **Real-time Updates**: See changes from teammates instantly
- **Conflict Resolution**: Automatic merging of concurrent edits
- **Audit Trail**: Complete history of who changed what and when

### Collaboration Features
- **Live Cursors**: See where teammates are working in real-time
- **Comments & Annotations**: Add context without disrupting the conversation flow
- **Branching Conversations**: Multiple people can explore different conversation paths
- **Merge Capabilities**: Combine the best parts of different conversation branches

## 🌐 On-Chain Publishing

### Decentralized Knowledge Sharing
When you're ready to share your conversation map with the world:

1. **Publish to Chain**: Your map becomes a permanent, immutable record
2. **Discoverability**: Others can find and explore your published maps
3. **Forkable**: Anyone can create their own version of your map
4. **Attribution**: Original creators are always credited
5. **Monetization**: Optional: Set fees for commercial use of your maps

### Benefits of On-Chain Publishing
- **Permanent Archive**: Your knowledge maps are preserved forever
- **Global Access**: Anyone in the world can access and learn from your work
- **Provenance**: Cryptographic proof of authorship and creation date
- **Composability**: Maps can reference and build upon each other
- **Incentive Alignment**: Creators can be rewarded for valuable contributions

## 🛠️ Getting Started

### Installation

```bash
pnpm install
```

### Development

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to start creating your first AI conversation map.

### Environment Setup

Create a `.env.local` file with your configuration:

```env
# AI Provider (OpenAI, Anthropic, etc.)
OPENAI_API_KEY=your_api_key_here

# Hypergraph Configuration
HYPERGRAPH_SPACE_ID=your_space_id

# Database (optional - for caching)
DATABASE_URL=your_database_url
```

## 🎯 Use Cases

### Education
- **Interactive Learning**: Students can explore AI conversations about complex topics
- **Collaborative Research**: Teams can build comprehensive knowledge maps together
- **Teaching Aid**: Educators can create visual lesson plans with AI assistance

### Business
- **Knowledge Management**: Capture and organize institutional knowledge
- **Team Brainstorming**: Collaborative ideation with AI augmentation
- **Client Presentations**: Visual storytelling with conversation maps

### Research
- **Literature Review**: Map out research conversations and findings
- **Hypothesis Development**: Explore different research directions visually
- **Peer Collaboration**: Share and build upon each other's research conversations

## 🔧 Technology Stack

- **Frontend**: Next.js 15 with React 19
- **Styling**: Tailwind CSS
- **Flow Visualization**: React Flow (xyflow)
- **Data Layer**: Hypergraph Protocol
- **AI Integration**: Multiple providers supported
- **Database**: PostgreSQL (optional caching layer)
- **Authentication**: Wallet-based or traditional auth

## 🤖 AI Integration

The platform supports multiple AI providers:
- **OpenAI**: GPT-4, GPT-3.5, and future models
- **Anthropic**: Claude and Claude Instant
- **Local Models**: Run your own models privately
- **Custom APIs**: Integrate any AI service

## 📈 Roadmap

- [ ] **Mobile App**: Native iOS and Android applications
- [ ] **Advanced Analytics**: Conversation pattern analysis and insights
- [ ] **Plugin System**: Third-party integrations and custom nodes
- [ ] **Marketplace**: Buy and sell premium conversation maps
- [ ] **AI Agents**: Autonomous agents that can navigate and contribute to maps
- [ ] **Multi-modal Support**: Images, audio, and video in conversation maps

## 🤝 Contributing

We welcome contributions! Whether you're fixing bugs, adding features, or improving documentation, your help makes this project better for everyone.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

**Start mapping your AI conversations today and join the future of collaborative knowledge creation** 
