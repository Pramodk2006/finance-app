import sys
import json

def test_json_parsing():
    try:
        # Get the raw input
        raw_input = sys.argv[1] if len(sys.argv) > 1 else '{"test": "value"}'
        print(f"Raw input: {raw_input}")
        
        # Try to parse it
        try:
            parsed_data = json.loads(raw_input)
            print(f"Successfully parsed JSON: {parsed_data}")
            return True
        except json.JSONDecodeError as e:
            print(f"JSON parsing failed: {e}")
            
            # Try cleaning the input
            cleaned_input = raw_input.strip('"\'')
            print(f"Cleaned input: {cleaned_input}")
            
            try:
                parsed_data = json.loads(cleaned_input)
                print(f"Successfully parsed JSON after cleaning: {parsed_data}")
                return True
            except json.JSONDecodeError as e:
                print(f"JSON parsing failed after cleaning: {e}")
                return False
    except Exception as e:
        print(f"Error: {e}")
        return False

if __name__ == "__main__":
    success = test_json_parsing()
    sys.exit(0 if success else 1) 