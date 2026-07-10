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
    <>
      <div className="text-center mb-6">
        <h1 className="text-base sm:text-lg md:text-xl font-bold text-teal-900 leading-tight">
          Terms and Conditions
        </h1>
      </div>
      <div
        className="prose prose-sm sm:prose-base lg:prose-lg max-w-none [&>h1:first-of-type]:hidden prose-headings:text-teal-900 prose-p:text-slate-600 prose-li:text-slate-600 prose-a:text-teal-700 hover:prose-a:text-teal-800"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    </>
  );
}