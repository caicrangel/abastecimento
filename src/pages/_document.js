import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="pt-BR">
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="theme-color" content="#0d1117" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
