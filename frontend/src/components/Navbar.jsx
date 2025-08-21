
import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.jsx';

const Navbar = () => {
  const { token, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-slate-900 text-white">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex h-14 items-center justify-between">
          <Link to="/" className="font-semibold tracking-tight">File Uploader</Link>
          <div className="flex items-center gap-3">
            {token ? (
              <button onClick={handleLogout} className="rounded-md bg-slate-700 px-3 py-1.5 text-sm hover:bg-slate-600">Logout</button>
            ) : (
              <>
                <Link to="/login" className="rounded-md bg-slate-700 px-3 py-1.5 text-sm hover:bg-slate-600">Login</Link>
                <Link to="/register" className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm hover:bg-indigo-500">Register</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
