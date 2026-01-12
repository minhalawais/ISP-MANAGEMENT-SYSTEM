from datetime import datetime
import pytz

PKT = pytz.timezone('Asia/Karachi')

def get_pkt_now():
    """Get current datetime in Pakistani Timezone"""
    return datetime.now(PKT)

def to_pkt(dt):
    """Convert a datetime object to PKT"""
    if dt.tzinfo is None:
        return PKT.localize(dt)
    return dt.astimezone(PKT)

def parse_pkt_datetime(date_str: str, time_str: str = '00:00'):
    """
    Parse date and time strings into a PKT timezone-aware datetime object.
    
    Args:
        date_str: Date string in 'YYYY-MM-DD' format
        time_str: Time string in 'HH:MM' or 'HH:MM:SS' format
    
    Returns:
        datetime: Timezone-aware datetime object in PKT
    """
    try:
        # Handle time string potentially having seconds
        if len(time_str.split(':')) == 2:
            fmt = "%Y-%m-%d %H:%M"
        else:
            fmt = "%Y-%m-%d %H:%M:%S"
            
        dt_str = f"{date_str} {time_str}"
        dt = datetime.strptime(dt_str, fmt)
        return PKT.localize(dt)
    except ValueError as e:
        raise ValueError(f"Invalid date/time format: {e}")
