interface PolicyLayoutProps {
  children: React.ReactNode;
}

export default function PolicyLayout({ children }: PolicyLayoutProps) {
  return (
    <article className="py-10">
      <div className="mx-auto max-w-4xl px-6">
        <div className="prose prose-gray dark:prose-invert max-w-none prose-headings:font-semibold prose-h1:text-3xl prose-h1:md:text-2xl prose-h2:text-lg prose-h2:md:text-base prose-a:text-primary prose-a:transition-colors">
          {children}
        </div>
      </div>
    </article>
  );
}
