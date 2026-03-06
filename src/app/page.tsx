export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <div className="max-w-4xl mx-auto px-6 py-20">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            🫖 Steep
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
            <div className="text-4xl mb-4">🫖</div>
            <h3 className="font-semibold text-lg mb-2">Digest</h3>
            <p className="text-gray-600">
              Every weekend, get a curated digest of what you captured.
            </p>
          </div>
        </div>

        {/* Pricing */}
        <div className="mb-16">
          <div className="bg-white border-2 border-gray-200 rounded-2xl p-8 text-center max-w-md mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Early Adopter Pricing</h2>
            <div className="text-5xl font-bold text-gray-900 mb-1">$9.95</div>
            <p className="text-gray-500 mb-6">/year</p>
            <p className="text-gray-600 mb-6">Includes a 14-day free trial</p>
            <a
              href="/login"
              className="inline-block bg-gray-900 text-white px-8 py-3 rounded-lg font-semibold hover:bg-gray-800 transition w-full"
            >
              Start Free Trial
            </a>
          </div>
          <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-6 text-center max-w-md mx-auto">
            <p className="font-semibold text-gray-900 mb-1">First 250 sign-ups get Steep free for life</p>
            <p className="text-gray-600 text-sm">Limited spots remaining</p>
          </div>
        </div>

        {/* Referral Program */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-2xl p-10 text-center mb-16">
          <h2 className="text-2xl font-bold mb-3">Share the Brew</h2>
          <p className="text-gray-300 mb-6">
            Refer a colleague and you both get a free year of Steep.
          </p>
          <div className="text-4xl font-bold mb-2">1 Referral = 2 Free Years</div>
          <p className="text-gray-400 text-sm">
            You and your colleague each get a year free when they sign up.
          </p>
        </div>

        {/* CTA */}
        <div className="bg-gray-900 text-white rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Start steeping today</h2>
          <p className="text-gray-300 mb-6">
            Your personal LinkedIn intelligence layer awaits.
          </p>
          <a
            href="/login"
            className="inline-block bg-white text-gray-900 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
          >
            Sign in →
          </a>
        </div>

        {/* Footer */}
        <div className="text-center mt-16 text-gray-500 text-sm">
          <p>
            A{' '}
            <a
              href="https://www.syndesi.io/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-700 hover:text-gray-900 underline underline-offset-2"
            >
              Syndesi
            </a>
            {' '}project
          </p>
        </div>
      </div>
    </main>
  )
}
