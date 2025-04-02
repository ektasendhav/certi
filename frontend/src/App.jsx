import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import Register from './components/Register';
import Login from './components/Login';
import Booking from './components/Booking';

function App() {
  const handleDownload = () => {
    fetch('http://localhost:5000/download-pdf', {
      method: 'GET',
      credentials: 'include'
    })
    .then(response => response.blob())
    .then(blob => {
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'booking-details.pdf');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    })
    .catch(error => console.error('Error downloading PDF:', error));
  };

  return (
    <Router>
      <div className="App">
        <nav className="navbar">
          <Link to="/register">Register</Link>
          <Link to="/login">Login</Link>
          <Link to="/booking">Booking</Link>
          <button onClick={handleDownload}>Download PDF</button>
        </nav>
        
        <Routes>
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/booking" element={<Booking />} />
          <Route path="/" element={<h2>Welcome! Please Register or Login</h2>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;