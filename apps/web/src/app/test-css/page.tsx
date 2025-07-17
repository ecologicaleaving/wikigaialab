export default function TestCSS() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Test Header */}
      <header className="bg-green-600 text-white p-4">
        <h1 className="text-2xl font-bold">WikiGaiaLab - Test CSS</h1>
      </header>
      
      {/* Test Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Test di Tailwind CSS
          </h2>
          <p className="text-gray-600 mb-4">
            Se vedi questo testo con stili colorati, Tailwind CSS funziona!
          </p>
          
          <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded mr-4">
            Bottone Test
          </button>
          
          <button className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded">
            Altro Bottone
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-red-100 p-4 rounded text-red-800">Rosso</div>
          <div className="bg-green-100 p-4 rounded text-green-800">Verde</div>
          <div className="bg-blue-100 p-4 rounded text-blue-800">Blu</div>
        </div>
        
        <div className="mt-8 text-center">
          <a href="/" className="text-blue-600 hover:text-blue-800 underline">
            ← Torna alla homepage
          </a>
        </div>
      </main>
    </div>
  );
}