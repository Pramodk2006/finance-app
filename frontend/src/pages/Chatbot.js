import React, { useState } from 'react';
import { 
  Container, Typography, Box, Paper, TextField, 
  Button, List, ListItem, ListItemText, Avatar,
  IconButton, Divider
} from '@mui/material';
import { styled } from '@mui/material/styles';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';

const ChatbotContainer = styled(Container)(({ theme }) => ({
  marginTop: theme.spacing(4),
  marginBottom: theme.spacing(4),
}));

const ChatbotPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  height: '70vh',
  display: 'flex',
  flexDirection: 'column',
}));

const MessageList = styled(List)(({ theme }) => ({
  flexGrow: 1,
  overflow: 'auto',
  padding: theme.spacing(2),
}));

const MessageItem = styled(ListItem)(({ theme }) => ({
  marginBottom: theme.spacing(1),
}));

const UserMessage = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(1, 2),
  backgroundColor: theme.palette.primary.light,
  color: theme.palette.primary.contrastText,
  borderRadius: '20px 20px 0 20px',
  maxWidth: '80%',
  marginLeft: 'auto',
}));

const BotMessage = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(1, 2),
  backgroundColor: theme.palette.grey[100],
  borderRadius: '20px 20px 20px 0',
  maxWidth: '80%',
}));

const InputContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  padding: theme.spacing(2),
  borderTop: `1px solid ${theme.palette.divider}`,
}));

const Chatbot = () => {
  const [messages, setMessages] = useState([
    { id: 1, text: "Hello! I'm your AI financial assistant. How can I help you today?", sender: 'bot' },
  ]);
  const [input, setInput] = useState('');

  const handleInputChange = (e) => {
    setInput(e.target.value);
  };

  const handleSendMessage = () => {
    if (input.trim() === '') return;

    // Add user message
    const userMessage = {
      id: messages.length + 1,
      text: input,
      sender: 'user',
    };
    setMessages([...messages, userMessage]);
    setInput('');

    // Simulate bot response
    setTimeout(() => {
      const botResponse = getBotResponse(input);
      setMessages(prevMessages => [...prevMessages, {
        id: prevMessages.length + 1,
        text: botResponse,
        sender: 'bot',
      }]);
    }, 1000);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  // Simple rule-based responses
  const getBotResponse = (userInput) => {
    const input = userInput.toLowerCase();
    
    if (input.includes('hello') || input.includes('hi') || input.includes('hey')) {
      return "Hello! How can I assist with your finances today?";
    } else if (input.includes('budget') || input.includes('spending')) {
      return "I can help you create and manage budgets. Would you like me to analyze your spending patterns and suggest a budget?";
    } else if (input.includes('save') || input.includes('saving')) {
      return "Based on your spending patterns, I recommend saving 20% of your income. Would you like me to suggest areas where you could cut expenses?";
    } else if (input.includes('invest') || input.includes('investment')) {
      return "I can provide basic investment insights. However, for personalized investment advice, I recommend consulting with a financial advisor.";
    } else if (input.includes('debt') || input.includes('loan')) {
      return "I can help you create a debt repayment plan. Would you like me to prioritize your debts based on interest rates?";
    } else if (input.includes('expense') || input.includes('transaction')) {
      return "You can add new transactions in the Transactions section. Would you like me to categorize your recent transactions automatically?";
    } else if (input.includes('report') || input.includes('analysis')) {
      return "I can generate financial reports based on your transaction history. Would you like to see a spending analysis for this month?";
    } else if (input.includes('goal') || input.includes('target')) {
      return "Setting financial goals is important. Would you like me to help you create a savings goal and track your progress?";
    } else if (input.includes('thank')) {
      return "You're welcome! Is there anything else I can help you with?";
    } else {
      return "I'm still learning about personal finance. Could you provide more details about what you're looking for?";
    }
  };

  return (
    <ChatbotContainer>
      <Typography variant="h4" gutterBottom>
        AI Financial Assistant
      </Typography>
      
      <ChatbotPaper elevation={2}>
        <MessageList>
          {messages.map((message) => (
            <React.Fragment key={message.id}>
              <MessageItem alignItems="flex-start">
                <Box sx={{ display: 'flex', alignItems: 'flex-start', width: '100%' }}>
                  {message.sender === 'bot' && (
                    <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                      <SmartToyIcon />
                    </Avatar>
                  )}
                  <Box sx={{ flexGrow: 1 }}>
                    {message.sender === 'bot' ? (
                      <BotMessage>
                        <Typography variant="body1">{message.text}</Typography>
                      </BotMessage>
                    ) : (
                      <UserMessage>
                        <Typography variant="body1">{message.text}</Typography>
                      </UserMessage>
                    )}
                  </Box>
                  {message.sender === 'user' && (
                    <Avatar sx={{ ml: 2, bgcolor: 'secondary.main' }}>
                      <PersonIcon />
                    </Avatar>
                  )}
                </Box>
              </MessageItem>
              <Divider variant="inset" component="li" />
            </React.Fragment>
          ))}
        </MessageList>
        
        <InputContainer>
          <TextField
            fullWidth
            placeholder="Ask about your finances..."
            variant="outlined"
            value={input}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
          />
          <IconButton 
            color="primary" 
            onClick={handleSendMessage}
            disabled={input.trim() === ''}
            sx={{ ml: 1 }}
          >
            <SendIcon />
          </IconButton>
        </InputContainer>
      </ChatbotPaper>
      
      <Paper elevation={2} sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Suggested Questions
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          <Button variant="outlined" size="small" onClick={() => setInput("How much did I spend on food this month?")}>
            How much did I spend on food this month?
          </Button>
          <Button variant="outlined" size="small" onClick={() => setInput("Help me create a budget")}>
            Help me create a budget
          </Button>
          <Button variant="outlined" size="small" onClick={() => setInput("What are my top spending categories?")}>
            What are my top spending categories?
          </Button>
          <Button variant="outlined" size="small" onClick={() => setInput("How can I save more money?")}>
            How can I save more money?
          </Button>
        </Box>
      </Paper>
    </ChatbotContainer>
  );
};

export default Chatbot;
