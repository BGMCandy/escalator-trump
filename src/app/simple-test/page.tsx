export default function SimpleTest() {
  return (
    <div className="min-h-screen bg-blue-100 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-blue-800 mb-4">
          Simple Test Page
        </h1>
        <p className="text-xl text-blue-600">
          If you can see this, Next.js routing is working!
        </p>
        <p className="text-sm text-gray-600 mt-4">
          Time: {new Date().toLocaleString()}
        </p>
      </div>
    </div>
  );
}
