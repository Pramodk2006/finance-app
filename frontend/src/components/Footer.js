import React from 'react';
import { Box, Typography, Container, Link, Grid } from '@mui/material';
import { styled } from '@mui/material/styles';

const FooterContainer = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.grey[100],
  padding: theme.spacing(3, 0),
  marginTop: 'auto',
}));

const Footer = () => {
  return (
    <FooterContainer component="footer">
      <Container maxWidth="lg">
        <Grid container spacing={3}>
          <Grid item xs={12} sm={4}>
            <Typography variant="h6" color="textPrimary" gutterBottom>
              AI Finance Manager
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Master your money with AI-powered insights and automation.
            </Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="h6" color="textPrimary" gutterBottom>
              Features
            </Typography>
            <Typography variant="body2" color="textSecondary">
              • Automatic Transaction Categorization<br />
              • Expense Tracking and Visualization<br />
              • Spending Trend Detection<br />
              • Personalized Budget Recommendations
            </Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="h6" color="textPrimary" gutterBottom>
              Resources
            </Typography>
            <Link href="#" color="textSecondary" display="block">Help Center</Link>
            <Link href="#" color="textSecondary" display="block">Privacy Policy</Link>
            <Link href="#" color="textSecondary" display="block">Terms of Service</Link>
            <Link href="#" color="textSecondary" display="block">Contact Us</Link>
          </Grid>
        </Grid>
        <Box mt={3}>
          <Typography variant="body2" color="textSecondary" align="center">
            {'© '}
            {new Date().getFullYear()}
            {' AI Finance Manager. All rights reserved.'}
          </Typography>
        </Box>
      </Container>
    </FooterContainer>
  );
};

export default Footer;
