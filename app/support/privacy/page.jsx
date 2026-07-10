import React from 'react';
import fs from 'fs/promises';
import path from 'path';
import { simpleMarkdownToHtml } from '@/utils/markdownToHtml';

async function getPrivacyContent() {
  try {
    const filePath = path.join(process.cwd(), 'public', 'legal', 'privacy.md');
    const content = await fs.readFile(filePath, 'utf-8');
    return content;
  } catch (error) {
    console.error('Error reading privacy file:', error);
    return '# Privacy Policy\n\nPrivacy policy content could not be loaded.';
  }
}

export default async function PrivacyPolicyPage() {
  const markdownContent = await getPrivacyContent();
  const htmlContent = simpleMarkdownToHtml(markdownContent);
  
  return (
    <>
      <div className="text-center mb-6">
        <h1 className="text-base sm:text-lg md:text-xl font-bold text-teal-900 leading-tight">
          Privacy Policy
        </h1>
      </div>
      <div
        className="prose prose-sm sm:prose-base lg:prose-lg max-w-none [&>h1:first-of-type]:hidden prose-headings:text-teal-900 prose-p:text-slate-600 prose-li:text-slate-600 prose-a:text-teal-700 hover:prose-a:text-teal-800"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    </>
  );
}