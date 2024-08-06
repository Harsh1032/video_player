import '@styles/globals.css';
import { AuthProvider } from '@components/AuthContext';

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