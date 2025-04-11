/**
 * Bank Statement Parser Service
 * 
 * This service handles parsing of bank statements from various formats (CSV, PDF, Image)
 * and converting them into structured transaction data that can be processed by
 * the application.
 */

const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const PDFParser = require('pdf-parse');
const Tesseract = require('tesseract.js');
const sharp = require('sharp');
const { classifyTransaction } = require('./transactionCategorizer');

/**
 * Parse a CSV bank statement file
 * 
 * @param {string} filePath - Path to the CSV file
 * @param {Object} options - Configuration options for parsing
 * @returns {Promise<Array>} Array of parsed transactions
 */
const parseCSV = async (filePath, options = {}) => {
  const results = [];
  const dateFormat = options.dateFormat || 'MM/DD/YYYY';
  const dateColumn = options.dateColumn || 'Date';
  const descriptionColumn = options.descriptionColumn || 'Description';
  const amountColumn = options.amountColumn || 'Amount';
  const typeColumn = options.typeColumn || 'Type';

  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => {
        // Handle different CSV formats by attempting to detect columns
        const dateField = data[dateColumn] || data['Transaction Date'] || data['Date'] || '';
        const descriptionField = data[descriptionColumn] || data['Description'] || data['Merchant'] || data['Narration'] || '';
        let amountField = data[amountColumn] || data['Amount'] || data['Transaction Amount'] || '0';
        
        // Some statements have separate debit/credit columns
        if (!amountField && (data['Debit'] || data['Credit'])) {
          if (data['Debit'] && parseFloat(data['Debit']) > 0) {
            amountField = `-${data['Debit']}`;
          } else if (data['Credit'] && parseFloat(data['Credit']) > 0) {
            amountField = data['Credit'];
          }
        }
        
        // Determine transaction type
        let type = data[typeColumn] || '';
        if (!type) {
          // If no explicit type, infer from amount
          const amount = parseFloat(amountField);
          type = amount < 0 ? 'expense' : 'income';
        } else {
          // Normalize type values
          type = type.toLowerCase();
          if (type.includes('debit') || type.includes('payment') || type.includes('withdrawal')) {
            type = 'expense';
          } else if (type.includes('credit') || type.includes('deposit') || type.includes('refund')) {
            type = 'income';
          }
        }
        
        // Clean up the amount
        const amount = parseFloat(String(amountField).replace(/[^\d.-]/g, ''));
        
        // Skip rows with invalid data
        if (!dateField || isNaN(amount)) return;
        
        // Classify the transaction using our AI service
        const { category, confidence } = classifyTransaction(descriptionField, Math.abs(amount));
        
        results.push({
          date: new Date(dateField),
          description: descriptionField,
          amount: Math.abs(amount), // store as positive
          type,
          category,
          aiCategorized: true,
          aiConfidence: confidence
        });
      })
      .on('end', () => {
        resolve(results);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
};

/**
 * Parse a PDF bank statement
 * This is more complex and depends on the bank's format
 * 
 * @param {string} filePath - Path to the PDF file
 * @param {Object} options - Configuration options for parsing
 * @returns {Promise<Array>} Array of parsed transactions
 */
const parsePDF = async (filePath, options = {}) => {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await PDFParser(dataBuffer);
    
    // Extract text content
    const text = data.text;
    
    // This is a simplified approach - real implementation would need
    // to handle different bank statement formats with specific regex patterns
    const transactions = [];
    
    // Use regex to find transaction patterns
    // Example pattern for dates: MM/DD/YYYY followed by description and amount
    const transactionPattern = /(\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2})[^\n]*?(-?\$?\d+(\.\d{2})?)/g;
    let match;
    
    while ((match = transactionPattern.exec(text)) !== null) {
      const dateStr = match[1];
      const amountStr = match[2];
      const description = match[0]
        .replace(dateStr, '')
        .replace(amountStr, '')
        .trim();
      
      // Clean up the amount and convert to number
      const amountClean = amountStr.replace(/[^\d.-]/g, '');
      const amount = parseFloat(amountClean);
      
      // Skip invalid amounts
      if (isNaN(amount)) continue;
      
      // Determine transaction type
      const type = amount < 0 ? 'expense' : 'income';
      
      // Classify the transaction
      const { category, confidence } = classifyTransaction(description, Math.abs(amount));
      
      transactions.push({
        date: new Date(dateStr),
        description,
        amount: Math.abs(amount),
        type,
        category,
        aiCategorized: true,
        aiConfidence: confidence
      });
    }
    
    return transactions;
  } catch (error) {
    console.error('Error parsing PDF:', error);
    throw error;
  }
};

/**
 * Parse an image (screenshot) of a bank statement
 * Uses OCR to extract text and then processes it
 * 
 * @param {string} filePath - Path to the image file
 * @param {Object} options - Configuration options for parsing
 * @returns {Promise<Array>} Array of parsed transactions
 */
const parseImage = async (filePath, options = {}) => {
  try {
    // Pre-process the image to improve OCR accuracy
    const preprocessedImagePath = `${filePath}_processed.png`;
    
    // Use sharp to enhance the image
    await sharp(filePath)
      .resize({ width: 2000, fit: 'inside', withoutEnlargement: true }) // Resize if too small
      .greyscale() // Convert to grayscale
      .normalize() // Normalize the image (improve contrast)
      .sharpen() // Sharpen the image
      .toFile(preprocessedImagePath);
    
    // Perform OCR on the preprocessed image
    const { data } = await Tesseract.recognize(
      preprocessedImagePath,
      options.lang || 'eng', // Default to English
      {
        logger: options.debug ? console : { // Only log if debug is enabled
          log: () => {},
          error: () => {}
        }
      }
    );
    
    // Clean up the preprocessed image
    fs.unlinkSync(preprocessedImagePath);
    
    // Extract text from OCR result
    const text = data.text;
    
    if (options.debug) {
      console.log('OCR Text:', text);
    }
    
    // Parse the extracted text to find transactions
    const transactions = [];
    
    // Common transaction patterns in bank statements
    // 1. Dates (various formats)
    // 2. Amounts (with currency symbols)
    // 3. Transaction descriptions
    
    // Different regex patterns for different statement formats
    const patterns = [
      // Format: MM/DD/YYYY or MM-DD-YYYY followed by description and amount
      /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})[^\n\d$]*?([^$\n]*?)[^\n\d]*?(\$?\s?\d+\,?\d*\.\d{2})/g,
      
      // Format: YYYY-MM-DD followed by description and amount
      /(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})[^\n\d$]*?([^$\n]*?)[^\n\d]*?(\$?\s?\d+\,?\d*\.\d{2})/g,
      
      // Format: Description followed by date and amount
      /([A-Za-z\s\&\.]+)\s+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\s+(\$?\s?\d+\,?\d*\.\d{2})/g
    ];
    
    // Try each pattern
    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        // Extract different components based on the matched pattern
        let dateStr, description, amountStr;
        
        if (pattern.source.startsWith('(\\d{1,2}[\\/\\-]')) {
          // First pattern: Date, Description, Amount
          dateStr = match[1];
          description = match[2].trim();
          amountStr = match[3];
        } else if (pattern.source.startsWith('(\\d{4}[\\/\\-]')) {
          // Second pattern: Date, Description, Amount
          dateStr = match[1];
          description = match[2].trim();
          amountStr = match[3];
        } else {
          // Third pattern: Description, Date, Amount
          description = match[1].trim();
          dateStr = match[2];
          amountStr = match[3];
        }
        
        // Clean and parse the amount
        const amountClean = amountStr.replace(/[^\d.-]/g, '');
        const amount = parseFloat(amountClean);
        
        // Skip invalid amounts
        if (isNaN(amount)) continue;
        
        // Determine transaction type
        // In screenshots, it's hard to determine if negative, 
        // so we'll use presence of terms like "payment", "withdrawal", etc.
        let type;
        const lowerDesc = description.toLowerCase();
        if (
          lowerDesc.includes('payment') || 
          lowerDesc.includes('purchase') || 
          lowerDesc.includes('withdrawal') || 
          lowerDesc.includes('debit')
        ) {
          type = 'expense';
        } else if (
          lowerDesc.includes('deposit') || 
          lowerDesc.includes('credit') || 
          lowerDesc.includes('refund')
        ) {
          type = 'income';
        } else {
          // Default to expense if we can't determine
          type = 'expense';
        }
        
        // Try to parse the date - handle different formats
        let date;
        try {
          // Convert to consistent format
          if (dateStr.match(/\d{4}[\/-]\d{1,2}[\/-]\d{1,2}/)) {
            // YYYY-MM-DD format
            date = new Date(dateStr);
          } else {
            // MM/DD/YYYY or MM-DD-YYYY format
            const parts = dateStr.split(/[-\/]/);
            if (parts[2].length === 2) {
              // Convert 2-digit year to 4-digit
              parts[2] = (parseInt(parts[2]) < 50 ? '20' : '19') + parts[2];
            }
            date = new Date(`${parts[2]}-${parts[0]}-${parts[1]}`);
          }
          
          // Skip if date is invalid
          if (isNaN(date.getTime())) continue;
        } catch (err) {
          // Use current date if parsing fails
          date = new Date();
        }
        
        // Classify the transaction
        const { category, confidence } = classifyTransaction(description, Math.abs(amount));
        
        transactions.push({
          date,
          description,
          amount: Math.abs(amount),
          type,
          category,
          aiCategorized: true,
          aiConfidence: confidence
        });
      }
    }
    
    // Additional heuristics to clean up results:
    // 1. Remove duplicates (based on similar dates, amounts, descriptions)
    const uniqueTransactions = [];
    const seen = new Set();
    
    for (const transaction of transactions) {
      const key = `${transaction.date.toISOString()}_${transaction.amount.toFixed(2)}_${transaction.description.substring(0, 20)}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueTransactions.push(transaction);
      }
    }
    
    return uniqueTransactions;
  } catch (error) {
    console.error('Error parsing image:', error);
    throw error;
  }
};

/**
 * Parse a statement file based on its extension
 * 
 * @param {string} filePath - Path to the statement file
 * @param {Object} options - Configuration options for parsing
 * @returns {Promise<Array>} Array of parsed transactions
 */
const parseStatement = async (filePath, options = {}) => {
  try {
    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      throw new Error(`File not found: ${filePath}`);
    }

    console.log(`Attempting to parse statement file: ${filePath}`);
    console.log(`Parse options:`, JSON.stringify(options, null, 2));
    
    const ext = path.extname(filePath).toLowerCase();
    let transactions = [];
    
    // Select the appropriate parser based on file extension
    switch (ext) {
      case '.csv':
        console.log(`Using CSV parser for ${filePath}`);
        transactions = await parseCSV(filePath, options);
        break;
      case '.pdf':
        console.log(`Using PDF parser for ${filePath}`);
        transactions = await parsePDF(filePath, options);
        break;
      case '.jpg':
      case '.jpeg':
      case '.png':
        console.log(`Using Image parser for ${filePath}`);
        transactions = await parseImage(filePath, options);
        break;
      default:
        console.error(`Unsupported file type: ${ext}`);
        throw new Error(`Unsupported file type: ${ext}. Only CSV, PDF, and image files are supported.`);
    }
    
    console.log(`Successfully parsed ${transactions.length} transactions from ${filePath}`);
    
    if (options.debug && transactions.length > 0) {
      console.log('Sample transaction data:');
      console.log(JSON.stringify(transactions[0], null, 2));
    }
    
    // Additional data validation
    const validTransactions = transactions.filter(tx => {
      // Validate date
      if (!tx.date || !(tx.date instanceof Date) || isNaN(tx.date.getTime())) {
        console.warn(`Skipping transaction with invalid date: ${JSON.stringify(tx)}`);
        return false;
      }
      
      // Validate amount
      if (isNaN(tx.amount) || tx.amount <= 0) {
        console.warn(`Skipping transaction with invalid amount: ${JSON.stringify(tx)}`);
        return false;
      }
      
      // Validate description
      if (!tx.description || typeof tx.description !== 'string') {
        console.warn(`Skipping transaction with invalid description: ${JSON.stringify(tx)}`);
        return false;
      }
      
      return true;
    });
    
    if (validTransactions.length < transactions.length) {
      console.log(`Filtered out ${transactions.length - validTransactions.length} invalid transactions`);
    }
    
    return validTransactions;
  } catch (error) {
    console.error(`Error parsing statement: ${error.message}`);
    console.error(error.stack);
    throw error;
  }
};

module.exports = {
  parseStatement,
  parseCSV,
  parsePDF,
  parseImage
}; 