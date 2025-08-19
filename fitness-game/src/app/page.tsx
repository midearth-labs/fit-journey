import Image from 'next/image';
import { AuthButton } from '@/components/auth/auth-button';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="flex justify-between items-center p-4 sm:p-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">🏋️</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">Fitness AI Game</h1>
        </div>
        <AuthButton />
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Train Your Fitness Knowledge
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Master fitness, nutrition, and anatomy through fun interactive quizzes. 
            Train your avatar and compete with friends!
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/auth/signup"
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
            >
              Get Started
            </a>
            <a
              href="/auth/login"
              className="px-8 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
            >
              Sign In
            </a>
          </div>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500 mb-2">Test the authentication system:</p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <a
                href="/demo"
                className="px-4 py-2 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
              >
                🔒 Client Demo (Protected)
              </a>
              <a
                href="/profile"
                className="px-4 py-2 text-sm bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors"
              >
                ⚡ Server Demo (SSR)
              </a>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">🧠</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">Smart Quizzes</h3>
            <p className="text-gray-600">Test your knowledge with AI-generated questions on fitness, nutrition, and anatomy.</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">👤</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">Avatar System</h3>
            <p className="text-gray-600">Watch your avatar evolve based on your performance and knowledge gains.</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">🏆</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">Compete & Share</h3>
            <p className="text-gray-600">Challenge friends, share results, and climb the leaderboards.</p>
          </div>
        </div>

        {/* Game Types Preview */}
        <div className="bg-white rounded-lg p-8 shadow-sm">
          <h3 className="text-2xl font-bold text-center mb-6">Game Types</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="text-center p-4 border rounded-lg hover:bg-gray-50 transition-colors">
              <div className="text-3xl mb-2">🏋️</div>
              <h4 className="font-medium">Equipment ID</h4>
            </div>
            <div className="text-center p-4 border rounded-lg hover:bg-gray-50 transition-colors">
              <div className="text-3xl mb-2">✅</div>
              <h4 className="font-medium">Form Check</h4>
            </div>
            <div className="text-center p-4 border rounded-lg hover:bg-gray-50 transition-colors">
              <div className="text-3xl mb-2">🥗</div>
              <h4 className="font-medium">Nutrition Myths</h4>
            </div>
            <div className="text-center p-4 border rounded-lg hover:bg-gray-50 transition-colors">
              <div className="text-3xl mb-2">🛡️</div>
              <h4 className="font-medium">Injury Prevention</h4>
            </div>
            <div className="text-center p-4 border rounded-lg hover:bg-gray-50 transition-colors">
              <div className="text-3xl mb-2">🧬</div>
              <h4 className="font-medium">Body Anatomy</h4>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-16">
        <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="text-center text-gray-600">
            <p>&copy; 2024 Fitness AI Game. Train smarter, not harder.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
