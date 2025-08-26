from typing import Dict, Any, List
import json
from datetime import datetime

def serialize_datetime(obj):
    """JSON serializer for datetime objects"""
    if isinstance(obj, datetime):
        return obj.isoformat()
    raise TypeError(f"Object of type {type(obj)} is not JSON serializable")

def validate_sql_query(query: str) -> bool:
    """Basic SQL query validation"""
    dangerous_keywords = [
        'DROP', 'DELETE', 'TRUNCATE', 'INSERT', 'UPDATE', 
        'ALTER', 'CREATE', 'GRANT', 'REVOKE'
    ]
    
    query_upper = query.upper().strip()
    
    # Allow only SELECT statements for safety
    if not query_upper.startswith('SELECT'):
        return False
    
    # Check for dangerous keywords
    for keyword in dangerous_keywords:
        if keyword in query_upper:
            return False
    
    return True

def format_query_result(result: Dict[str, Any]) -> Dict[str, Any]:
    """Format query results for API response"""
    if result.get('data'):
        # Convert datetime objects to strings
        for row in result['data']:
            for key, value in row.items():
                if isinstance(value, datetime):
                    row[key] = value.isoformat()
    
    return result
