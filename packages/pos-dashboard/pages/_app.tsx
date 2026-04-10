import '../styles/globals.css';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { Toaster } from 'react-hot-toast';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>AgentOS POS</title>
        <meta name="description" content="AgentOS Point-of-Sale & Partner Dashboard" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </Head>
      <Toaster position="top-right" toastOptions={{ style: { background: '#242741', color: '#e8eaf6', border: '1px solid rgba(108,99,255,0.25)' } }} />
      <Component {...pageProps} />
    </>
  );
}
