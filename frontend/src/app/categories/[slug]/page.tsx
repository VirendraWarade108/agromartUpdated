interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 py-24">
        <h1 className="text-5xl font-black text-white mb-4 capitalize">{slug}</h1>
        <p className="text-xl text-gray-200">Category page for {slug}</p>
      </div>
    </div>
  );
}
