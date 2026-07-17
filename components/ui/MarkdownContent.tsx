import { marked } from "marked";

interface MarkdownContentProps {
  content: string;
  className?: string;
}

export async function MarkdownContent({ content, className = "" }: MarkdownContentProps): Promise<React.ReactElement> {
  const html = await marked(content);

  return (
    <div
      className={`prose ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
