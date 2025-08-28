import type React from 'react'
import type { ReactNode } from 'react'

type MDXComponents = {
  [key: string]: React.ComponentType<{ children?: ReactNode;[key: string]: unknown }>
}

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    // Using Tailwind Typography for beautiful default styling
    // Wrap your content with the 'prose' class to apply these styles
    wrapper: ({ children }: { children?: ReactNode }) => (
      <div className="prose prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-blue-600 hover:prose-a:text-blue-800
      max-w-none p-2">
        {children}
      </div>
    ),
    ...components,
  }
}
