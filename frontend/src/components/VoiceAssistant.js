import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Box, 
  IconButton, 
  Typography, 
  Paper, 
  CircularProgress,
  Snackbar,
  Alert
} from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import { styled } from '@mui/material/styles';

const VoiceButton = styled(IconButton)(({ theme, $isListening }) => ({
  backgroundColor: $isListening ? theme.palette.error.main : theme.palette.primary.main,
  color: 'white',
  '&:hover': {
    backgroundColor: $isListening ? theme.palette.error.dark : theme.palette.primary.dark,
  },
  width: 56,
  height: 56,
  margin: theme.spacing(2),
}));

const VoiceAssistant = ({ onTransactionDetected }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [debugInfo, setDebugInfo] = useState(null);
  const recognitionRef = useRef(null);

  const parseVoiceCommand = useCallback((command) => {
    // Convert command to lowercase for easier parsing
    const lowerCommand = command.toLowerCase();
    
    // First check for income with category pattern
    const incomeWithCategoryPattern = /^(?:add\s+)?(?:income|earning|salary)\s+(\d+)(?:\s*(?:rupees?|rs\.?|inr|\$))?\s+(?:to|in|for|as)\s+(?:category\s+)?([a-zA-Z\s]+)$/i;
    const incomeMatch = lowerCommand.match(incomeWithCategoryPattern);
    
    // Log the attempt to match income pattern
    console.log('Attempting to match income pattern:', {
      pattern: incomeWithCategoryPattern.toString(),
      command: lowerCommand,
      match: incomeMatch
    });
    
    if (incomeMatch) {
      const amount = parseFloat(incomeMatch[1]);
      const category = incomeMatch[2].trim();
      
      console.log('Income with Category Match:', {
        pattern: incomeWithCategoryPattern.toString(),
        match: incomeMatch,
        amount: amount,
        category: category,
        command: command
      });
      
      const transaction = {
        description: `Voice: ${command}`,
        amount: amount,
        type: 'income',
        category: category,
        date: new Date()
      };

      console.log('Income Transaction Created:', transaction);
      
      // Set debug info
      setDebugInfo({
        originalCommand: command,
        extractedAmount: amount,
        extractedCategory: category,
        extractedType: 'income',
        finalTransaction: transaction,
        matchedPattern: 'income with category'
      });
      
      onTransactionDetected(transaction);
      setShowSuccess(true);
      return;
    }

    // Simple category command patterns (highest priority)
    const simpleCategoryPatterns = [
      // Direct category commands
      /^(?:categories?\.?\s+)?([a-zA-Z\s]+)\s+(?:for|is)\s+(?:rs\.?|₹|rupees?)?\s*(\d+)(?:\s*(?:rupees?|rs\.?|inr|\$))?$/i,
      /^(?:category|type)\s+(?:is\s+)?([a-zA-Z\s]+)$/i,
      /^(?:this\s+)?(?:is|as)\s+([a-zA-Z\s]+)$/i,
      /^(?:categorize|mark|set)\s+(?:as\s+)?([a-zA-Z\s]+)$/i,
      // Category with amount
      /^(?:category|type)\s+([a-zA-Z\s]+)\s+(\d+)(?:\s*(?:rupees?|rs\.?|inr|\$))?$/i,
      /^([a-zA-Z\s]+)\s+(\d+)(?:\s*(?:rupees?|rs\.?|inr|\$))?$/i
    ];

    // Check simple category patterns first
    for (const pattern of simpleCategoryPatterns) {
      const match = lowerCommand.match(pattern);
      if (match) {
        const category = match[1].trim();
        const amount = match[2] ? parseFloat(match[2]) : null;
        
        // Log the match for debugging
        console.log('Category Pattern Match:', {
          pattern: pattern.toString(),
          match: match,
          category: category,
          amount: amount
        });
        
        const transaction = {
          description: `Voice: ${command}`,
          amount: amount ? -amount : null, // Default to expense
          type: 'expense',
          category: category,
          date: new Date()
        };

        // Set debug info
        setDebugInfo({
          originalCommand: command,
          extractedAmount: amount,
          extractedCategory: category,
          extractedType: 'expense',
          finalTransaction: transaction,
          matchedPattern: 'simple category'
        });

        onTransactionDetected(transaction);
        setShowSuccess(true);
        return;
      }
    }

    // Complex transaction patterns (second priority)
    const transactionPatterns = [
      // Category first patterns
      {
        regex: /(?:categories?\.?\s+)?([a-zA-Z\s]+)\s+(?:for|is)\s+(?:rs\.?|₹|rupees?)?\s*(\d+)(?:\s*(?:rupees?|rs\.?|inr|\$))?/i,
        type: 'expense'
      },
      // Expense patterns
      {
        regex: /(?:add|create|make)\s+(?:an?\s+)?(?:expense|payment)\s+(?:of\s+)?(\d+)(?:\s*(?:rupees?|rs\.?|inr|\$))?\s*(?:(?:to|in|for|as)\s+)?(?:category\s+)?([a-zA-Z\s]+)?/i,
        type: 'expense'
      },
      // Income patterns
      {
        regex: /(?:add|create|make)\s+(?:an?\s+)?(?:income|earning|salary)\s+(?:of\s+)?(\d+)(?:\s*(?:rupees?|rs\.?|inr|\$))?\s*(?:(?:to|in|for|as)\s+)?(?:category\s+)?([a-zA-Z\s]+)?/i,
        type: 'income'
      }
    ];

    // Try complex transaction patterns
    for (const pattern of transactionPatterns) {
      const match = lowerCommand.match(pattern.regex);
      if (match) {
        // For category-first patterns, the groups are reversed
        const isCategoryFirst = pattern.regex.toString().includes('categories?');
        const amount = parseFloat(isCategoryFirst ? match[2] : match[1]);
        const category = isCategoryFirst ? match[1].trim() : (match[2] ? match[2].trim() : null);
        
        // Log the match for debugging
        console.log('Transaction Pattern Match:', {
          pattern: pattern.regex.toString(),
          match: match,
          isCategoryFirst: isCategoryFirst,
          amount: amount,
          category: category
        });
        
        const transaction = {
          description: `Voice: ${command}`,
          amount: pattern.type === 'expense' ? -amount : amount,
          type: pattern.type,
          category: category || command.split(' ')[0], // Use first word as category if no specific category found
          date: new Date()
        };

        // Set debug info
        setDebugInfo({
          originalCommand: command,
          extractedAmount: amount,
          extractedCategory: category,
          extractedType: pattern.type,
          finalTransaction: transaction,
          matchedPattern: 'complex transaction'
        });

        onTransactionDetected(transaction);
        setShowSuccess(true);
        return;
      }
    }

    // Fallback for amount-only commands
    const amountMatch = lowerCommand.match(/(\d+)(?:\s*(?:rupees?|rs\.?|inr|\$))?/i);
    if (amountMatch) {
      const amount = parseFloat(amountMatch[1]);
      const isIncome = lowerCommand.includes('income') || 
                      lowerCommand.includes('earning') || 
                      lowerCommand.includes('salary');
      
      // Try to extract category from the command
      let category = null;
      const categoryMatch = lowerCommand.match(/(?:to|in|for|as)\s+(?:category\s+)?([a-zA-Z\s]+)$/i);
      if (categoryMatch) {
        category = categoryMatch[1].trim();
        console.log('Category extracted from amount-only command:', category);
      }
      
      const transaction = {
        description: `Voice: ${command}`,
        amount: isIncome ? amount : -amount,
        type: isIncome ? 'income' : 'expense',
        category: category || command.split(' ')[0], // Use first word as category if no specific category found
        date: new Date()
      };

      // Set debug info
      setDebugInfo({
        originalCommand: command,
        extractedAmount: amount,
        extractedCategory: category,
        extractedType: isIncome ? 'income' : 'expense',
        finalTransaction: transaction,
        matchedPattern: 'amount only'
      });

      onTransactionDetected(transaction);
      setShowSuccess(true);
    } else {
      setError('Could not understand the command. Please try again.');
      console.log('No pattern matched for command:', command);
    }
  }, [onTransactionDetected]);

  useEffect(() => {
    // Check if browser supports speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setTranscript(transcript);
        parseVoiceCommand(transcript);
      };

      recognitionRef.current.onerror = (event) => {
        setError(`Error: ${event.error}`);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    } else {
      setError('Speech recognition is not supported in this browser.');
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [parseVoiceCommand]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setTranscript('');
      setError('');
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  return (
    <Paper 
      elevation={3} 
      sx={{ 
        p: 2, 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        maxWidth: 300,
        mx: 'auto',
        my: 2
      }}
    >
      <Typography variant="h6" gutterBottom>
        Voice Assistant
      </Typography>
      
      <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 2 }}>
        Say something like: "Add expense 500 rupees to groceries"
      </Typography>
      
      <VoiceButton 
        onClick={toggleListening} 
        $isListening={isListening}
        aria-label={isListening ? "Stop listening" : "Start listening"}
      >
        {isListening ? <MicOffIcon /> : <MicIcon />}
      </VoiceButton>
      
      {isListening && (
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
          <CircularProgress size={20} sx={{ mr: 1 }} />
          <Typography variant="body2">Listening...</Typography>
        </Box>
      )}
      
      {transcript && !isListening && (
        <Typography variant="body2" sx={{ mt: 1 }}>
          You said: "{transcript}"
        </Typography>
      )}
      
      {/* Debug Information Display */}
      {debugInfo && !isListening && (
        <Box sx={{ mt: 2, width: '100%', p: 1, bgcolor: 'background.paper', borderRadius: 1 }}>
          <Typography variant="subtitle2" color="primary">Extracted Information:</Typography>
          <Typography variant="body2">Amount: {debugInfo.extractedAmount}</Typography>
          <Typography variant="body2">Category: {debugInfo.extractedCategory || 'Uncategorized'}</Typography>
          <Typography variant="body2">Type: {debugInfo.extractedType}</Typography>
          {debugInfo.matchedPattern && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontStyle: 'italic' }}>
              Matched pattern: {debugInfo.matchedPattern}
            </Typography>
          )}
        </Box>
      )}
      
      <Snackbar 
        open={!!error} 
        autoHideDuration={6000} 
        onClose={() => setError('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setError('')} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
      
      <Snackbar 
        open={showSuccess} 
        autoHideDuration={3000} 
        onClose={() => setShowSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setShowSuccess(false)} severity="success" sx={{ width: '100%' }}>
          Transaction added successfully!
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default VoiceAssistant; 