import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppShell from './components/AppShell.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Upload from './pages/Upload.jsx';
import Library from './pages/Library.jsx';
import QuickCipher from './pages/QuickCipher.jsx';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/cifra-carica" element={<Upload />} />
          <Route path="/libreria" element={<Library />} />
          <Route path="/strumenti" element={<QuickCipher />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
