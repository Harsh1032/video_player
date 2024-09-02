import '@styles/globals.css';
import { AuthProvider } from '@components/AuthContext';
import Head from 'next/head';

export const metadata = {
  title: "Video - Agence QUASR",
  description: "Default description for your website.",
  openGraph: {
    title: "Video - Agence QUASR",
    description: "Default description for your website.",
    type: "website",
    locale: "en_US",
    url: process.env.BASE_URL, // Use your BASE_URL here
    siteName: "Agence QUASR",
    images: [
      {
        url: "https://www.quasr.fr/wp-content/uploads/2024/07/example-bg.png",
        width: 1200,
        height: 630,
        alt: "Default Image",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@yoursite",
    title: "Video - Agence QUASR",
    description: "Default description for your website.",
    images: [
      {
        url: "https://www.quasr.fr/wp-content/uploads/2024/07/example-bg.png",
        alt: "Default Image",
      },
    ],
  },
};


const layout = ({children}) => {
  return (
    <html lang="en">
      <Head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css" />
        <link rel="icon" href="https://www.quasr.fr/wp-content/uploads/2023/12/bigfav-lightv.png" sizes="192x192" />
        <link rel="icon" href="https://www.quasr.fr/wp-content/uploads/2023/12/bigfav-lightv-150x150.png" sizes="any" />
      </Head>
    <body className="w-full h-screen bg-slate-400">
      <AuthProvider>
        {children}
      </AuthProvider>
    </body>
    </html>
  )
}

export default layout