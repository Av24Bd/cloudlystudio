import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import { ContentProvider } from './contexts/ContentContext';
import AdminVault from './pages/AdminVault';
import AnalyticsTracker from './components/AnalyticsTracker';

function App() {
    return (
        <ContentProvider>
            <Router>
                <AnalyticsTracker />
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/admin" element={<AdminVault />} />
                </Routes>
            </Router>
        </ContentProvider>
    );
}

export default App;
