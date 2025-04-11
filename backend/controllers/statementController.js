/**
 * Bank Statement Controller
 * 
 * Handles bank statement upload and processing
 */

const asyncHandler = require('express-async-handler');
const path = require('path');
const fs = require('fs').promises;
const { parseStatement } = require('../services/bankStatementParser');
const Transaction = require('../models/transactionModel');
const multer = require('multer');
const Statement = require('../models/statementModel');
const { processStatement } = require('../services/statementService');
const statementService = require('../services/statementService');

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.promises.access(uploadDir).then(() => true).catch(() => false)) {
      fs.promises.mkdir(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// Configure multer upload with increased limits
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    fieldSize: 10 * 1024 * 1024 // 10MB field size limit
  },
  fileFilter: (req, file, cb) => {
    console.log('Uploaded file mimetype:', file.mimetype); // log this!
    const allowedTypes = [
      'application/pdf',
      'text/csv',
      'application/vnd.ms-excel',
      'application/octet-stream',
      'image/jpeg',
      'image/png'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, CSV, JPEG, and PNG files are allowed.'));
    }
  }
  
}).single('statement'); // Specify the field name 'statement'

/**
 * @desc    Upload a bank statement
 * @route   POST /api/statements/upload
 * @access  Private
 */
const uploadStatement = asyncHandler(async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Check if file exists
    try {
      await fs.access(req.file.path);
    } catch (error) {
      return res.status(400).json({ message: 'File not found' });
    }

    // Check if a statement with the same original filename exists for this user
    const existingStatement = await Statement.findOne({
      user: req.user._id,
      originalFilename: req.file.originalname
    });

    if (existingStatement) {
      // Delete the newly uploaded file since it's a duplicate
      await fs.unlink(req.file.path);
      return res.status(400).json({ 
        message: 'A statement with this filename already exists',
        statementId: existingStatement._id
      });
    }

    // Ensure user ID is properly passed
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const statement = await processStatement(req.file, req.user._id);
    res.status(201).json(statement);
  } catch (error) {
    // Clean up uploaded file if there's an error
    if (req.file && req.file.path) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Error cleaning up file:', unlinkError);
      }
    }
    console.error('Error uploading statement:', error);
    res.status(400).json({ message: error.message || 'Failed to upload statement' });
  }
});

/**
 * @desc    Get statement status
 * @route   GET /api/statements/:id/status
 * @access  Private
 */
const getStatementStatus = asyncHandler(async (req, res) => {
  const statement = await Statement.findOne({
    _id: req.params.id,
    user: req.user._id
  });

  if (!statement) {
    res.status(404);
    throw new Error('Statement not found');
  }

  res.json({ status: statement.status });
});

/**
 * @desc    Get all statements
 * @route   GET /api/statements
 * @access  Private
 */
const getStatements = asyncHandler(async (req, res) => {
  const statements = await Statement.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .select('-text');
  res.json(statements);
});

/**
 * @desc    Delete a statement
 * @route   DELETE /api/statements/:id
 * @access  Private
 */
const deleteStatement = asyncHandler(async (req, res) => {
  const statement = await Statement.findOne({
    _id: req.params.id,
    user: req.user._id
  });

  if (!statement) {
    res.status(404);
    throw new Error('Statement not found');
  }

  // Delete the file if it exists
  if (statement.path) {
    try {
      await fs.unlink(statement.path);
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  }

  await statement.remove();
  res.json({ message: 'Statement removed' });
});

// @desc    Handle multer errors
// @route   POST /api/statements/upload
// @access  Private
const handleMulterError = (err, req, res, next) => {
  if (err) {
    console.error('Multer error:', err);
    return res.status(400).json({ message: err.message });
  }
  next();
};

module.exports = {
  upload,
  handleMulterError,
  uploadStatement,
  getStatementStatus,
  getStatements,
  deleteStatement
}; 