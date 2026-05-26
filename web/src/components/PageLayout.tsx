export default function PageLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-screen-2xl mx-auto px-6 py-8">
      {children}
    </div>
  );
}
