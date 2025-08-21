
import React from 'react';
import FileUpload from '../components/FileUpload.jsx';
import FileList from '../components/FileList.jsx';

const HomePage = () => {
  return (
    <div className="mx-auto max-w-6xl p-4">
      <h1 className="mb-4 text-2xl font-semibold tracking-tight">File Uploader</h1>
      <div className="mb-6 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <FileUpload />
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-2 shadow-sm">
        <FileList />
      </div>
    </div>
  );
};

export default HomePage;
