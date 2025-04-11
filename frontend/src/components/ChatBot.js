import React, { useState } from "react";
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Fab,
  Tooltip,
  Typography,
  TextField,
  Button,
} from "@mui/material";
import ChatIcon from "@mui/icons-material/Chat";
import CloseIcon from "@mui/icons-material/Close";
import SendIcon from "@mui/icons-material/Send";
import api from "../services/api";

const ChatBot = () => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    { text: "Hi! How can I help you with your finances today?", sender: "bot" },
  ]);
  const [loading, setLoading] = useState(false);

  const handleToggle = () => {
    setOpen(!open);
  };

  const handleSend = async () => {
    if (!message.trim()) return;

    const userMessage = message;
    setMessage("");
    setMessages((prev) => [...prev, { text: userMessage, sender: "user" }]);
    setLoading(true);

    try {
      const response = await api.post("/chat", { message: userMessage });

      if (response.data.success) {
        setMessages((prev) => [
          ...prev,
          { text: response.data.message, sender: "bot" },
        ]);
      } else {
        throw new Error(
          response.data.error || "Failed to get response from the chatbot"
        );
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          text: "Sorry, I encountered an error. Please try again.",
          sender: "bot",
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Tooltip title="Chat Assistant" placement="left">
        <Fab
          color="primary"
          aria-label="chat"
          onClick={handleToggle}
          sx={{
            position: "fixed",
            bottom: 24,
            right: 24,
          }}
        >
          <ChatIcon />
        </Fab>
      </Tooltip>

      <Dialog
        open={open}
        onClose={handleToggle}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            minHeight: "60vh",
            maxHeight: "80vh",
            display: "flex",
            flexDirection: "column",
          },
        }}
      >
        <DialogTitle>
          Chat Assistant
          <IconButton
            aria-label="close"
            onClick={handleToggle}
            sx={{
              position: "absolute",
              right: 8,
              top: 8,
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent
          dividers
          sx={{ display: "flex", flexDirection: "column" }}
        >
          <Box
            sx={{
              flexGrow: 1,
              overflowY: "auto",
              mb: 2,
              display: "flex",
              flexDirection: "column",
              gap: 1,
            }}
          >
            {messages.map((msg, index) => (
              <Box
                key={index}
                sx={{
                  alignSelf: msg.sender === "user" ? "flex-end" : "flex-start",
                  backgroundColor: msg.isError
                    ? "error.light"
                    : msg.sender === "user"
                    ? "primary.main"
                    : "grey.100",
                  color: msg.sender === "user" ? "white" : "text.primary",
                  borderRadius: 2,
                  px: 2,
                  py: 1,
                  maxWidth: "80%",
                }}
              >
                <Typography variant="body1">{msg.text}</Typography>
              </Box>
            ))}
            {loading && (
              <Box
                sx={{
                  alignSelf: "flex-start",
                  backgroundColor: "grey.100",
                  borderRadius: 2,
                  px: 2,
                  py: 1,
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  Typing...
                </Typography>
              </Box>
            )}
          </Box>

          <Box sx={{ display: "flex", gap: 1 }}>
            <TextField
              fullWidth
              placeholder="Type your message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              multiline
              maxRows={4}
              variant="outlined"
              size="small"
            />
            <Button
              variant="contained"
              color="primary"
              onClick={handleSend}
              disabled={!message.trim() || loading}
              startIcon={<SendIcon />}
            >
              Send
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ChatBot;
