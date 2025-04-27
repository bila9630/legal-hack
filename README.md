# Contract Analysis Tool

🌐 **Live Application**: [https://legal-hack.vercel.app/compare](https://legal-hack.vercel.app/compare)

A powerful AI-powered tool for analyzing and comparing legal contracts. This application helps users without legal expertise make informed decisions by identifying key clauses, potential conflicts, and risks in contracts.

## Process Flow

The application follows a two-phase process:

1. **Initial Processing (Upload Contract)**
   - Contract is uploaded and stored in PocketBase
   - Document is processed by LangChain
   - OpenAI extracts clauses and generates embeddings
   - Clauses are stored in PocketBase
   - Embeddings are stored in Qdrant for future reference
     
![upload](https://github.com/user-attachments/assets/4df6e09f-31b1-4f07-92c3-d75358990716)

2. **Analysis & Recommendations (Compare Contracts)**
   - Core clauses are extracted from the new contract
   - Similar clauses are searched in the vector database
   - OpenAI analyzes differences and generates recommendations
   - User receives classified clauses with actionable insights
     
![retrieval](https://github.com/user-attachments/assets/8ba83744-b117-4c1d-ba20-308fd31123b9)

## Features

- 🔍 Compare new contracts with existing ones
- 📑 Extract and classify contract clauses
- 🤖 AI-powered analysis and recommendations
- 📊 Actionable insights for decision making
- 🔒 Secure document handling
- 📄 Supports PDF and DOC/DOCX file formats

## Tech Stack

### Frontend
- Next.js
- Shadcn UI
- Tailwind CSS

### Backend
- PocketBase (Backend as a Service)
- LangChain (PDF Processing)
- OpenAI (Embeddings)
- Qdrant (Vector Database)

## Prerequisites

- Node.js (Latest LTS version recommended)
- npm, yarn, or pnpm
- OpenAI API Key
- Qdrant Cloud Account
- PocketBase Instance

## Setup

1. **Qdrant Cloud Setup**
   - Create a free account at [Qdrant Cloud](https://cloud.qdrant.io)
   - Create a new cluster
   - Get your API key and host URL

2. **PocketBase Setup**
   - Option 1: Self-hosted
     - Download PocketBase from [pocketbase.io](https://pocketbase.io)
     - Run the executable
   - Option 2: Hosted (Recommended)
     - Use [Pockethost.io](https://pockethost.io) for a managed PocketBase instance
     - Get your PocketBase URL and admin credentials

3. **Environment Variables**
   Create a `.env.local` file in the root directory with the following variables:
   ```bash
   OPENAI_API_KEY=your_openai_api_key
   QDRANT_HOST=your_qdrant_host
   QDRANT_API_KEY=your_qdrant_api_key
   POCKETBASE_URL=your_pocketbase_url
   ```

4. **Installation**
   ```bash
   git clone [repository-url]
   cd [repository-name]
   npm install
   ```

5. **Run Development Server**
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Deployment

The application is configured for deployment on Vercel. CI/CD is handled automatically through Vercel's platform.

## Usage

1. Upload your new contract document
2. The system will automatically:
   - Extract and classify clauses
   - Compare with existing contracts
   - Generate recommendations
3. Review the analysis and recommendations
4. Make informed decisions based on the provided insights

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!
