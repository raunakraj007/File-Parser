
import React, { useContext, useEffect, useState, useCallback } from 'react';
import { fileApi } from '../services/api';
import { io } from 'socket.io-client';
import { AuthContext } from '../context/AuthContext.jsx';

const FileList = () => {
	const { token } = useContext(AuthContext);
	const [files, setFiles] = useState([]);

	const fetchFiles = useCallback(() => {
		fileApi.list().then(res => {
			setFiles(res.data.files);
		}).catch(() => {});
	}, []);

	useEffect(() => {
		if (!token) return;
		fetchFiles();
		const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000';
		const s = io(SOCKET_URL);
		s.on('fileProgress', (data) => {
			setFiles(prev => prev.map(file => file.id === data.fileId ? { ...file, progress: data.progress, status: data.status } : file));
		});
		window.addEventListener('fileUploaded', fetchFiles);
		return () => {
			s.off('fileProgress');
			s.disconnect();
			window.removeEventListener('fileUploaded', fetchFiles);
		};
	}, [token, fetchFiles]);

	const handleDelete = async (fileId) => {
		try {
			await fileApi.remove(fileId);
			setFiles(prev => prev.filter(file => file.id !== fileId));
		} catch (error) {
			console.error('Failed to delete file', error);
		}
	};

	const getStatusLabel = (status) => {
		switch (status) {
			case 'ready':
				return 'Uploaded';
			case 'uploading':
				return 'Uploading…';
			case 'processing':
				return 'Processing…';
			case 'failed':
				return 'Failed';
			default:
				return status;
		}
	};

	return (
		<ul className="divide-y divide-slate-200">
			{files.map(file => (
				<li key={file.id} className="flex items-center gap-3 px-2 py-3">
					<div className="flex-1 text-sm">
						<span className="font-medium">{file.filename}</span>
						<span className="text-slate-500"> — {getStatusLabel(file.status)}</span>
					</div>
					{(file.status === 'uploading' || file.status === 'processing') && (
						<div className="flex w-1/2 items-center gap-2">
							<div className="h-2 w-full overflow-hidden rounded bg-slate-200">
								<div className="h-full bg-indigo-600" style={{ width: `${Math.round(file.progress)}%` }} />
							</div>
							<div className="w-10 text-right text-xs text-slate-600">{`${Math.round(file.progress)}%`}</div>
						</div>
					)}
					<button onClick={() => handleDelete(file.id)} className="rounded-md px-2 py-1 text-xs text-red-600 hover:bg-red-50">Delete</button>
				</li>
			))}
		</ul>
	);
};

export default FileList;
