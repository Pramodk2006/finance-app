import sys
import json

try:
    import pandas as pd
    print("pandas imported successfully")
    
    from prophet import Prophet
    print("prophet imported successfully")
    
    import numpy as np
    print("numpy imported successfully")
    
    # Try to create a Prophet model
    model = Prophet()
    print("Prophet model created successfully")
    
    print(json.dumps({
        "success": True,
        "message": "All dependencies working correctly"
    }))
    sys.exit(0)
except Exception as e:
    print(json.dumps({
        "success": False,
        "error": str(e),
        "python_version": sys.version
    }))
    sys.exit(1) 