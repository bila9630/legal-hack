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

2. **Analysis & Recommendations (Compare Contracts)**
   - Core clauses are extracted from the new contract
   - Similar clauses are searched in the vector database
   - OpenAI analyzes differences and generates recommendations
   - User receives classified clauses with actionable insights


## Features

- 🔍 Compare new contracts with existing ones
- 📑 Extract and classify contract clauses
- 🤖 AI-powered analysis and recommendations
- 📊 Actionable insights for decision making
- 🔒 Secure document handling
- 📄 Supports PDF and DOC/DOCX file formats

## Tech Stack

### Frontendhttps://legal-hack.vercel.app/compareV
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

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```bash
OPENAI_API_KEY=your_openai_api_key
QDRANT_HOST=your_qdrant_host
QDRANT_API_KEY=your_qdrant_api_key
```

## Getting Started

1. Clone the repository:
```bash
git clone [repository-url]
cd [repository-name]
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Set up environment variables as described above

4. Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
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