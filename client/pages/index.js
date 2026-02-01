export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center font-sans">
      
      {/* Header */}
      <h1 className="text-5xl font-bold mb-12 text-green-500 tracking-tighter">
         SudoStream
      </h1>
      <h3> Shipped by Amex </h3>

      {/* The Player Card */}
      <div className="bg-gray-900 p-8 rounded-2xl shadow-2xl border border-gray-800 w-96 text-center">
        
        {/* Album Art Placeholder */}
        <div className="w-full h-64 bg-gradient-to-br from-gray-800 to-gray-700 mb-6 rounded-xl flex items-center justify-center shadow-inner">
             <span className="text-6xl animate-pulse">🎵</span>
        </div>
        
        {/* Song Info */}
        <h2 className="text-2xl font-bold mb-1 text-white">System Test</h2>
        <p className="text-gray-400 text-sm mb-8 uppercase tracking-widest">Local Audio Engine</p>
        
        {/* The Audio Player */}
        <audio controls className="w-full">
          {/* This points directly to your Backend running on Port 8000 */}
          <source src="http://192.168.1.37:8000" type="audio/mpeg" />
          Your browser does not support the audio element.
        </audio>
      </div>

    </div>
  );
}
