const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const File = require('../models/File');
const FileParser = require('../utils/fileParser');

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
	fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, uploadsDir);
	},
	filename: (req, file, cb) => {
		const uniqueName = `${uuidv4()}-${file.originalname}`;
		cb(null, uniqueName);
	}
});

const upload = multer({
	storage: storage,
	limits: {
		fileSize: (process.env.MAX_FILE_SIZE_IN_MB || 100) * 1024 * 1024, // Use env var or default to 100MB
	},
	fileFilter: (req, file, cb) => {
		const allowedTypes = [
			'text/csv',
			'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
			'application/vnd.ms-excel',
			'application/pdf'
		];
		
		if (allowedTypes.includes(file.mimetype)) {
			cb(null, true);
		} else {
			const err = new Error('Unsupported file type. Only CSV, Excel, and PDF files are allowed.');
			err.status = 400;
			cb(err);
		}
	}
});

// POST /files - Upload file
router.post('/', (req, res) => {
	upload.single('file')(req, res, async (err) => {
		if (err) {
			if (err.code === 'LIMIT_FILE_SIZE') {
				const maxSize = Number(process.env.MAX_FILE_SIZE_IN_MB || 100);
				return res.status(413).json({
					error: 'File too large',
					code: 'LIMIT_FILE_SIZE',
					maxLimitMb: maxSize
				});
			}
			const status = err.status || 400;
			return res.status(status).json({ error: typeof err.message === 'string' ? err.message : 'File upload failed' });
		}

		try {
			if (!req.file) {
				return res.status(400).json({ error: 'No file uploaded' });
			}

			const fileId = uuidv4();
			const filePath = req.file.path;

			// Create file document
			const file = new File({
				fileId,
				filename: req.file.filename,
				originalName: req.file.originalname,
				mimetype: req.file.mimetype,
				size: req.file.size,
				status: 'uploading',
				progress: 0,
				filePath,
				userId: req.user._id
			});

			await file.save();

			// Simulate upload progress
			setTimeout(async () => {
				try {
					await File.findOneAndUpdate(
						{ fileId },
						{ status: 'processing', progress: 5 }
					);

					req.io.emit('fileProgress', {
						fileId,
						status: 'processing',
						progress: 5
					});

					// Start parsing asynchronously
					const parser = new FileParser(req.io);
					parser.parseFile(fileId, filePath, req.file.mimetype).catch((err) => {
						console.error('Unhandled parsing error:', err);
					});
				} catch (error) {
					console.error('Error starting file processing:', error);
				}
			}, 1000);

			res.status(201).json({
				message: 'File uploaded successfully',
				file: {
					file_id: fileId,
					filename: req.file.originalname,
					status: 'uploading',
					progress: 0,
					created_at: file.createdAt
				}
			});
		} catch (error) {
			console.error('Upload error:', error);
			
			// Clean up file if it was uploaded
			if (req.file && fs.existsSync(req.file.path)) {
				fs.unlinkSync(req.file.path);
			}

			if (error.code === 'LIMIT_FILE_SIZE') {
				const maxSize = Number(process.env.MAX_FILE_SIZE_IN_MB || 100);
				return res.status(413).json({
					error: 'File too large',
					code: 'LIMIT_FILE_SIZE',
					maxLimitMb: maxSize
				});
			}
			
			res.status(500).json({ error: error.message || 'File upload failed' });
		}
	});
});

// GET /files/:fileId/progress - Get upload progress
router.get('/:fileId/progress', async (req, res) => {
	try {
		const { fileId } = req.params;
		
		const file = await File.findOne({ fileId, userId: req.user._id });
		if (!file) {
			return res.status(404).json({ error: 'File not found' });
		}

		res.json({
			file_id: fileId,
			status: file.status,
			progress: file.progress,
			error: file.error
		});
	} catch (error) {
		console.error('Progress check error:', error);
		res.status(500).json({ error: 'Failed to get progress' });
	}
});

// GET /files/:fileId - Get file content
router.get('/:fileId', async (req, res) => {
	try {
		const { fileId } = req.params;
		
		const file = await File.findOne({ fileId, userId: req.user._id });
		if (!file) {
			return res.status(404).json({ error: 'File not found' });
		}

		if (file.status !== 'ready') {
			return res.status(202).json({
				message: 'File upload or processing in progress. Please try again later.',
				status: file.status,
				progress: file.progress
			});
		}

		res.json({
			file_id: fileId,
			filename: file.originalName,
			status: file.status,
			metadata: file.metadata,
			content: file.parsedContent,
			created_at: file.createdAt,
			updated_at: file.updatedAt
		});
	} catch (error) {
		console.error('Get file error:', error);
		res.status(500).json({ error: 'Failed to get file content' });
	}
});

// GET /files - List all files
router.get('/', async (req, res) => {
	try {
		const page = parseInt(req.query.page) || 1;
		const limit = parseInt(req.query.limit) || 10;
		const status = req.query.status;
		
		const query = { userId: req.user._id };
		if (status) {
			query.status = status;
		}

		const files = await File.find(query)
			.select('fileId originalName status progress createdAt updatedAt metadata size')
			.sort({ createdAt: -1 })
			.limit(limit * 1)
			.skip((page - 1) * limit);

		const total = await File.countDocuments(query);

		const formattedFiles = files.map(file => ({
			id: file.fileId,
			filename: file.originalName,
			status: file.status,
			progress: file.progress,
			size: file.size,
			metadata: file.metadata,
			created_at: file.createdAt,
			updated_at: file.updatedAt
		}));

		res.json({
			files: formattedFiles,
			pagination: {
				page,
				limit,
				total,
				pages: Math.ceil(total / limit)
			}
		});
	} catch (error) {
		console.error('List files error:', error);
		res.status(500).json({ error: 'Failed to list files' });
	}
});

// DELETE /files/:fileId - Delete file
router.delete('/:fileId', async (req, res) => {
	try {
		const { fileId } = req.params;
		
		const file = await File.findOne({ fileId, userId: req.user._id });
		if (!file) {
			return res.status(404).json({ error: 'File not found' });
		}

		// Delete physical file
		if (fs.existsSync(file.filePath)) {
			fs.unlinkSync(file.filePath);
		}

		// Delete from database
		await File.deleteOne({ fileId, userId: req.user._id });

		res.json({
			message: 'File deleted successfully',
			file_id: fileId
		});
	} catch (error) {
		console.error('Delete file error:', error);
		res.status(500).json({ error: 'Failed to delete file' });
	}
});

module.exports = router;