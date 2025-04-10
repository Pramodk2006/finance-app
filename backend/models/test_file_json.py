import sys
import json
import os

def test_json_parsing_from_file():
    try:
        # Get the file path from command line argument
        file_path = sys.argv[1] if len(sys.argv) > 1 else None
        
        if not file_path or not os.path.exists(file_path):
            print(f"File not found: {file_path}")
            return False
            
        # Read the JSON from the file
        with open(file_path, 'r') as f:
            raw_input = f.read()
            
        print(f"Raw input from file: {raw_input}")
        
        # Parse the JSON
        try:
            parsed_data = json.loads(raw_input)
            print(f"Successfully parsed JSON: {parsed_data}")
            return True
        except json.JSONDecodeError as e:
            print(f"JSON parsing failed: {e}")
            return False
    except Exception as e:
        print(f"Error: {e}")
        return False

if __name__ == "__main__":
    success = test_json_parsing_from_file()
    sys.exit(0 if success else 1) 