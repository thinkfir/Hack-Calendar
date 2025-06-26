import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HackathonPage from './pages/HackathonPage';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <main className="min-h-screen bg-background text-foreground">
          <Routes>
            <Route path="/" element={<HackathonPage />} />
            {/* Add other routes here later */}
          </Routes>
        </main>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
