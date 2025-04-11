import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import json
import sys
import traceback  # Add this import for better error tracking
import logging
import os
import codecs

# Configure stdout to use utf-8
if sys.platform == 'win32':
    # Force UTF-8 output encoding on Windows
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer)
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer)

# Configure logging to use stderr
logging.basicConfig(level=logging.INFO, stream=sys.stderr)
logger = logging.getLogger(__name__)

def parse_input():
    try:
        # Get the file path from command line argument
        file_path = sys.argv[1]
        logger.info(f"Reading from file: {file_path}")
        
        # Read the JSON from the file with explicit UTF-8 encoding
        with open(file_path, 'r', encoding='utf-8') as f:
            raw_input = f.read()
        
        logger.debug(f"Raw input from file: {raw_input}")
        
        # Parse the JSON
        try:
            parsed_data = json.loads(raw_input)
            logger.debug(f"Successfully parsed JSON: {parsed_data}")
            return parsed_data
        except json.JSONDecodeError as e:
            logger.error(f"JSON parsing failed: {e}")
            raise
    except Exception as e:
        error_msg = {
            "error": f"Input data parsing error: {str(e)}",
            "traceback": traceback.format_exc()
        }
        # Print error to stderr
        print(json.dumps(error_msg, ensure_ascii=False), file=sys.stderr)
        sys.exit(1)

class BudgetPredictor:
    def __init__(self):
        pass
        
    def prepare_data(self, transactions):
        # Convert transactions to DataFrame
        df = pd.DataFrame(transactions)
        df['ds'] = pd.to_datetime(df['date'])
        
        # Handle amount as string or number
        if df['amount'].dtype == 'object':
            # Remove currency symbols and commas, then convert to float
            df['y'] = df['amount'].apply(lambda x: float(str(x).replace('$', '').replace(',', '')))
        else:
            df['y'] = df['amount'].astype(float)
        
        # Sort by date
        df = df.sort_values('ds')
        
        # Add category if not present
        if 'category' not in df.columns:
            df['category'] = ''
            
        return df
    
    def train_and_predict(self, transactions, monthly_salary):
        # Prepare data
        df = self.prepare_data(transactions)
        
        if len(df) < 1:
            raise ValueError("Not enough transaction data for predictions. Please add more transactions.")
        
        # Separate savings from expenses
        savings_mask = df['category'].str.lower().str.contains('savings', na=False)
        savings_df = df[savings_mask].copy()
        expenses_df = df[~savings_mask].copy()
        
        # Calculate monthly totals (excluding savings)
        monthly_totals = expenses_df.groupby(expenses_df['ds'].dt.to_period('M'))['y'].sum()
        
        # Calculate actual savings
        actual_savings = abs(savings_df['y'].sum()) if not savings_df.empty else 0
        
        # Calculate average monthly spend (absolute value of expenses)
        # We consider negative values as expenses, excluding savings
        expenses = expenses_df[expenses_df['y'] < 0]
        if not expenses.empty:
            monthly_expenses = expenses.groupby(expenses['ds'].dt.to_period('M'))['y'].sum().abs()
            average_monthly_spend = monthly_expenses.mean() if not monthly_expenses.empty else 0
        else:
            average_monthly_spend = 0
            
        # If we have at least 2 months of data, calculate trend
        if len(monthly_totals) >= 2:
            trend = (monthly_totals.iloc[-1] - monthly_totals.iloc[0]) / (len(monthly_totals) - 1)
        else:
            trend = 0
            
        # Predict next month's spend based on average monthly spend
        # Add a small trend factor to account for changes
        predicted_spend = average_monthly_spend + (trend * 0.5)
        
        # Calculate suggested savings (30% of salary)
        suggested_savings = monthly_salary * 0.3
        
        # Calculate available budget (excluding savings from expenses)
        available_budget = monthly_salary - suggested_savings
        
        # Create future dates for visualization
        future_dates = pd.date_range(
            start=datetime.now(),
            periods=30,
            freq='D'
        )
        
        # Create daily predictions (divide monthly prediction by 30)
        daily_prediction = predicted_spend / 30
        forecast = pd.DataFrame({
            'ds': future_dates,
            'yhat': [daily_prediction] * 30,
            'yhat_lower': [daily_prediction * 0.9] * 30,  # 10% lower bound
            'yhat_upper': [daily_prediction * 1.1] * 30   # 10% upper bound
        })
        
        # Generate spending alerts
        alerts = []
        
        # Validate monthly salary against expenses (excluding savings)
        if monthly_salary < max(abs(expenses_df['y'])):
            alerts.append("⚠️ Note: Your monthly salary is less than your largest expense. Consider reviewing your salary input or expenses.")
        
        if predicted_spend > available_budget:
            alerts.append(f"⚠️ Warning: Predicted spending (${predicted_spend:.2f}) exceeds available budget (${available_budget:.2f})")
        
        if predicted_spend > monthly_salary:
            alerts.append("🚨 Critical: Predicted spending exceeds monthly income!")
            
        if average_monthly_spend > monthly_salary:
            alerts.append("🚨 Critical: Your average monthly spending exceeds your monthly salary! Please review your expenses or verify your salary input.")
        
        # Savings-related alerts
        if actual_savings < suggested_savings:
            alerts.append(f"💡 Tip: Your current savings (${actual_savings:.2f}) are below the suggested amount (${suggested_savings:.2f}). Consider increasing your savings.")
        elif actual_savings > suggested_savings:
            alerts.append("👍 Great job! You're saving more than the suggested amount.")
        
        if predicted_spend < 0.5 * average_monthly_spend:
            alerts.append("💡 Tip: Your predicted spending is unusually low. Consider saving the extra money!")
        elif predicted_spend > 1.5 * average_monthly_spend:
            alerts.append("⚠️ Alert: Your predicted spending is 50% higher than your average. Consider reviewing your expenses.")
        
        # Calculate category-wise spending (excluding savings)
        category_insights = self._get_category_insights(expenses_df)
        
        result = {
            'predicted_monthly_spend': float(predicted_spend),
            'suggested_savings': float(suggested_savings),
            'actual_savings': float(actual_savings),
            'available_budget': float(available_budget),
            'average_monthly_spend': float(average_monthly_spend),
            'alerts': alerts,
            'category_insights': category_insights,
            'forecast_data': {
                'dates': forecast['ds'].dt.strftime('%Y-%m-%d').tolist(),
                'values': forecast['yhat'].round(2).tolist(),
                'upper_bound': forecast['yhat_upper'].round(2).tolist(),
                'lower_bound': forecast['yhat_lower'].round(2).tolist()
            }
        }
        
        return result
    
    def _get_category_insights(self, df):
        insights = []
        if 'category' not in df.columns:
            return insights
            
        categories = df['category'].unique()
        
        for category in categories:
            if not category or category.lower() == 'savings':
                continue
                
            category_data = df[df['category'] == category]
            category_total = abs(category_data['y'].sum())
            category_avg = abs(category_data['y'].mean())
            
            insights.append({
                'category': category,
                'total_spend': float(category_total),
                'average_spend': float(category_avg)
            })
        
        return insights

if __name__ == '__main__':
    try:
        # Parse input data using the new function
        input_data = parse_input()
        
        # Initialize predictor
        predictor = BudgetPredictor()
        
        # Make predictions
        result = predictor.train_and_predict(
            input_data['transactions'],
            input_data['monthlySalary']
        )
        
        # Print only the final result as JSON to stdout
        # Use ensure_ascii=False to properly handle Unicode characters
        json_output = json.dumps(result, ensure_ascii=False)
        
        # Write to stdout with explicit UTF-8 encoding
        sys.stdout.write(json_output)
        sys.stdout.flush()
        sys.exit(0)
    except Exception as e:
        error_msg = {
            "error": "An unexpected error occurred while processing your request.",
            "details": str(e),
            "suggestion": "Please try again or contact support if the issue persists."
        }
        # Print error to stderr with proper encoding
        print(json.dumps(error_msg, ensure_ascii=False), file=sys.stderr)
        sys.exit(1) 