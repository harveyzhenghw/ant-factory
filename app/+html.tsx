import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="description" content="Ant Factory - build and care for your virtual ant colony" />
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: 'html, body { background-color: #FFF8E1; }' }} />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
