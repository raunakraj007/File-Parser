
import React, { useState } from 'react';
import { fileApi } from '../services/api';

const FileUpload = () => {
	const [file, setFile] = useState(null);
	const [errorMsg, setErrorMsg] = useState('');

	const handleFileChange = (e) => {
		setErrorMsg('');
		setFile(e.target.files[0]);
	};

	const handleUpload = async () => {
		if (!file) return;
		const formData = new FormData();
		formData.append('file', file);
		try {
			await fileApi.upload(formData);
			window.dispatchEvent(new CustomEvent('fileUploaded'));
			setFile(null);
			setErrorMsg('');
		} catch (error) {
			const maxLimit = error?.response?.data?.maxLimitMb;
			if (error?.response?.status === 413 && maxLimit) {
				setErrorMsg(`File is too large. Maximum allowed size is ${maxLimit} MB.`);
			} else if (typeof error?.response?.data?.error === 'string') {
				setErrorMsg(error.response.data.error);
			} else {
				setErrorMsg('Failed to upload file');
			}
		}
	};

	return (
		<div className="flex flex-col gap-3">
			{errorMsg ? (
				<div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
					{errorMsg}
				</div>
			) : null}
			<input
				type="file"
				accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel, application/pdf"
				onChange={handleFileChange}
				className="block w-full text-sm file:mr-4 file:rounded-md file:border-0 file:bg-slate-800 file:px-4 file:py-2 file:text-white hover:file:bg-slate-700"
			/>
			<button
				onClick={handleUpload}
				className="inline-flex w-fit items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
			>
				Upload
			</button>
		</div>
	);
};

export default FileUpload;
