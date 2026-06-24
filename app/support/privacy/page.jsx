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
    <div className="p-6 bg-white rounded shadow">
      <div 
        className="prose prose-lg max-w-none"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    </div>
  );
}