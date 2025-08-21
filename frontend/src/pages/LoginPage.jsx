
import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.jsx';

const LoginPage = () => {
	const { login } = useContext(AuthContext);
	const navigate = useNavigate();
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [errorMsg, setErrorMsg] = useState('');
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (e) => {
		e.preventDefault();
		setErrorMsg('');
		setLoading(true);
		try {
			await login(email, password);
			navigate('/');
		} catch (error) {
			setErrorMsg('Failed to login');
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="mx-auto flex min-h-[70vh] max-w-md items-center p-4">
			<div className="w-full rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
				<h1 className="mb-4 text-xl font-semibold">Login</h1>
				{errorMsg && (
					<div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{errorMsg}</div>
				)}
				<form onSubmit={handleSubmit} className="space-y-3">
					<div>
						<label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
						<input
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
							required
						/>
					</div>
					<div>
						<label className="mb-1 block text-sm font-medium text-slate-700">Password</label>
						<input
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
							required
						/>
					</div>
					<button
						type="submit"
						disabled={loading}
						className="inline-flex w-full items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
					>
						{loading ? 'Logging in…' : 'Login'}
					</button>
				</form>
			</div>
		</div>
	);
};

export default LoginPage;
