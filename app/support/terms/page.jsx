import React from 'react';
import fs from 'fs/promises';
import path from 'path';
import { simpleMarkdownToHtml } from '@/utils/markdownToHtml';

async function getTermsContent() {
  try {
    const filePath = path.join(process.cwd(), 'public', 'legal', 'terms.md');
    const content = await fs.readFile(filePath, 'utf-8');
    return content;
  } catch (error) {
    console.error('Error reading terms file:', error);
    return '# Terms and Conditions\n\nTerms content could not be loaded.';
  }
}

export default async function TermsPage() {
  const markdownContent = await getTermsContent();
  const htmlContent = simpleMarkdownToHtml(markdownContent);
  
  return (
    <div className="w-full bg-white rounded-lg shadow-lg">
      <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div 
            className="prose prose-sm sm:prose-base lg:prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        </div>
    </div>
  );
}