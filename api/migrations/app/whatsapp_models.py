from app import db
import uuid
from sqlalchemy.dialects.postgresql import UUID, ENUM
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

# Enums for WhatsApp message status and types
