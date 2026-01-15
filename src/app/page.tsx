export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <div className="max-w-4xl mx-auto px-6 py-20">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            ☕ Steep
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            Let your ideas brew
          </p>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-12">
            Forward LinkedIn posts you don't have time to explore. 
            Get a personalized weekly digest that connects the dots.
          </p>
        </div>

        {/* How it Works */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="text-center p-6">
            <div className="text-4xl mb-4">📧</div>
            <h3 className="font-semibold text-lg mb-2">Forward</h3>
            <p className="text-gray-600">
              See an interesting post? Forward it to your Steep email. That's it.
            </p>
          </div>
          <div className="text-center p-6">
            <div className="text-4xl mb-4">🧠</div>
            <h3 className="font-semibold text-lg mb-2">Brew</h3>
            <p className="text-gray-600">
              AI processes your saves, finds patterns, and surfaces insights.
            </p>
          </div>
          <div className="text-center p-6">
            <div className="text-4xl mb-4">☕</div>
            <h3 className="font-semibold text-lg mb-2">Digest</h3>
            <p className="text-gray-600">
              Every weekend, get a curated digest of what you captured.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gray-900 text-white rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Start steeping today</h2>
          <p className="text-gray-300 mb-6">
            Your personal LinkedIn intelligence layer awaits.
          </p>
          <a 
            href="/dashboard" 
            className="inline-block bg-white text-gray-900 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
          >
            Go to Dashboard →
          </a>
        </div>

        {/* Footer */}
        <div className="text-center mt-16 text-gray-500 text-sm">
          <p>A Syndesi project</p>
        </div>
      </div>
    </main>
  )
}
