import '@styles/globals.css';
import { AuthProvider } from '@components/AuthContext';

export const metadata = {
  title: "Default Title - Your Website",
  description: "Default description for your website.",
  openGraph: {
    title: "Default Title - Your Website",
    description: "Default description for your website.",
    type: "website",
    locale: "en_US",
    url: process.env.BASE_URL, // Use your BASE_URL here
    siteName: "Your Website",
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
    title: "Default Title - Your Website",
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
    <body className="w-full h-screen bg-slate-400">
      <AuthProvider>
        {children}
      </AuthProvider>
    </body>
    </html>
  )
}

export default layout