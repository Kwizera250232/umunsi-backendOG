import React, { useState } from 'react';

const TestLogin = () => {
  const [email, setEmail] = useState('admin@umunsi.com');
  const [password, setPassword] = useState('admin123');
  const [result, setResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const handleDirectLogin = async () => {
    setIsLoading(true);
    setResult('Starting login...\n');

    try {
      const apiUrl = 'http://localhost:5000/api/auth/login';
      setResult(prev => prev + `Calling: ${apiUrl}\n`);
      setResult(prev => prev + `Email: ${email}\n`);
      setResult(prev => prev + `Password: ${password}\n\n`);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      setResult(prev => prev + `Response status: ${response.status}\n`);
      setResult(prev => prev + `Response ok: ${response.ok}\n`);

      const data = await response.json();
      setResult(prev => prev + `Response data: ${JSON.stringify(data, null, 2)}\n`);

      if (data.success && data.token) {
        // Store in localStorage
        localStorage.setItem('umunsi_user', JSON.stringify(data.user));
        localStorage.setItem('umunsi_token', data.token);
        setResult(prev => prev + '\n✅ Login successful! Data stored in localStorage.\n');
        setResult(prev => prev + `User role: ${data.user.role}\n`);
        setResult(prev => prev + '\nRedirecting to /admin in 2 seconds...\n');
        
        setTimeout(() => {
          window.location.href = '/admin';
        }, 2000);
      } else {
        setResult(prev => prev + '\n❌ Login failed: ' + (data.error || data.message || 'Unknown error') + '\n');
        if (data.details) {
          setResult(prev => prev + `Details: ${JSON.stringify(data.details)}\n`);
        }
      }
    } catch (error: any) {
      setResult(prev => prev + `\n❌ Network/CORS Error: ${error.message}\n`);
      setResult(prev => prev + `Error type: ${error.name}\n`);
      setResult(prev => prev + '\nThis might be a CORS issue. Check browser console for more details.\n');
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkLocalStorage = () => {
    const user = localStorage.getItem('umunsi_user');
    const token = localStorage.getItem('umunsi_token');
    setResult(`localStorage check:\n- umunsi_user: ${user ? 'EXISTS' : 'NOT FOUND'}\n- umunsi_token: ${token ? 'EXISTS' : 'NOT FOUND'}\n\nUser data: ${user || 'null'}`);
  };

  const clearLocalStorage = () => {
    localStorage.removeItem('umunsi_user');
    localStorage.removeItem('umunsi_token');
    setResult('✅ localStorage cleared!');
  };

  const goToAdmin = () => {
    window.location.href = '/admin';
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">🔧 Login Debug Test</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Login Form</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Email:</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Password:</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border rounded px-3 py-2"
              />
            </div>

            <div className="flex gap-2 flex-wrap">
              <button
                onClick={handleDirectLogin}
                disabled={isLoading}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
              >
                {isLoading ? 'Logging in...' : '🔐 Direct Login'}
              </button>
              
              <button
                onClick={checkLocalStorage}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                📦 Check localStorage
              </button>
              
              <button
                onClick={clearLocalStorage}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                🗑️ Clear localStorage
              </button>
              
              <button
                onClick={goToAdmin}
                className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
              >
                ➡️ Go to /admin
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Result:</h2>
          <pre className="bg-gray-900 text-green-400 p-4 rounded overflow-auto text-sm whitespace-pre-wrap">
            {result || 'Click a button to see results...'}
          </pre>
        </div>

        <div className="mt-6 text-sm text-gray-600">
          <p><strong>Test credentials:</strong></p>
          <ul className="list-disc ml-6">
            <li>Email: admin@umunsi.com</li>
            <li>Password: admin123</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TestLogin;

