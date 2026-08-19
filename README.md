# Gwags Artelier

A modern web application built with React, TypeScript, and Vite, deployed on Vercel.

**Live Site**: https://gwags-portrait.vercel.app

## Getting Started

### Prerequisites
- Node.js (v18 or higher) - [Install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
- npm (comes with Node.js)

### Local Development

1. **Clone the repository**
   ```sh
   git clone https://github.com/Tawfiqm857/GwagsArtelier.git
   cd GwagsArtelier
   ```

2. **Install dependencies**
   ```sh
   npm install
   ```

3. **Start the development server**
   ```sh
   npm run dev
   ```
   The application will be available at `http://localhost:5173`

4. **Build for production**
   ```sh
   npm run build
   ```

## Technologies

This project is built with:

- **Vite** - Fast build tool and dev server
- **React** - UI library
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - High-quality React components
- **React Hook Form** - Performant form handling
- **React Router** - Client-side routing
- **Supabase** - Backend services
- **React Query** - Server state management

## Project Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run build:dev` - Build for development
- `npm run lint` - Run ESLint to check code quality
- `npm run preview` - Preview production build locally

## Deployment

This project is deployed on **Vercel**. Every push to the main branch automatically triggers a deployment.

### Deploy Your Own

1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com)
3. Import this repository
4. Vercel will automatically detect it's a Vite project and configure the build settings
5. Your project will be live!

### Environment Variables

If you need environment variables, add them in your Vercel project settings under Environment Variables.

## File Structure

```
.
├── src/
│   ├── components/     # React components
│   ├── pages/          # Page components
│   ├── lib/            # Utility functions
│   ├── App.tsx         # Main App component
│   └── main.tsx        # Entry point
├── public/             # Static assets
├── vite.config.ts      # Vite configuration
├── tailwind.config.js  # Tailwind CSS configuration
├── package.json        # Dependencies and scripts
└── README.md           # This file
```

## Contributing

1. Create a new branch for your feature
2. Make your changes
3. Commit and push to your branch
4. Open a pull request

## License

This project is open source and available under the MIT License.
