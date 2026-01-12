"""
WhatsApp Rate Limiter Service
Manages daily message quota to enforce 200 messages/day limit.
"""

from app import db
from app.models import WhatsAppDailyQuota, WhatsAppConfig
from datetime import datetime, date
import logging

logger = logging.getLogger(__name__)


class WhatsAppRateLimiter:
    """Service for managing WhatsApp daily message quota"""
    
    @staticmethod
    def get_or_create_today_quota(company_id: str) -> WhatsAppDailyQuota:
        """
        Get today's quota record or create if doesn't exist.
        
        Args:
            company_id: Company UUID
            
        Returns:
            WhatsAppDailyQuota: Today's quota object
        """
        try:
            today = date.today()
            
            quota = WhatsAppDailyQuota.query.filter(
                WhatsAppDailyQuota.company_id == company_id,
                WhatsAppDailyQuota.date == today
            ).first()
            
            if not quota:
                # Get configuration for quota limit
                config = WhatsAppConfig.query.filter_by(company_id=company_id).first()
                quota_limit = config.daily_quota_limit if config else 200
                
                # Create new quota record for today
                quota = WhatsAppDailyQuota(
                    company_id=company_id,
                    date=today,
                    messages_sent=0,
                    quota_limit=quota_limit,
                    last_reset_at=datetime.now()
                )
                db.session.add(quota)
                db.session.commit()
                logger.info(f"Created new quota record for {today} with limit {quota_limit}")
            
            return quota
            
        except Exception as e:
            db.session.rollback()
            logger.error(f"Error getting/creating quota: {str(e)}")
            raise
    
    @staticmethod
    def get_remaining_quota(company_id: str) -> int:
        """
        Get remaining message quota for today.
        
        Args:
            company_id: Company UUID
            
        Returns:
            int: Number of messages that can still be sent today
        """
        try:
            quota = WhatsAppRateLimiter.get_or_create_today_quota(company_id)
            
            # Get buffer setting from config
            config = WhatsAppConfig.query.filter_by(company_id=company_id).first()
            buffer = config.quota_buffer if config else 5
            
            # Calculate remaining with buffer
            effective_limit = quota.quota_limit - buffer
            remaining = max(0, effective_limit - quota.messages_sent)
            
            logger.info(f"Remaining quota: {remaining} (sent: {quota.messages_sent}/{effective_limit})")
            return remaining
            
        except Exception as e:
            logger.error(f"Error getting remaining quota: {str(e)}")
            raise
    
    @staticmethod
    def can_send_message(company_id: str) -> bool:
        """
        Check if a message can be sent (quota available).
        
        Args:
            company_id: Company UUID
            
        Returns:
            bool: True if quota available, False otherwise
        """
        try:
            remaining = WhatsAppRateLimiter.get_remaining_quota(company_id)
            return remaining > 0
            
        except Exception as e:
            logger.error(f"Error checking send permission: {str(e)}")
            return False
    
    @staticmethod
    def increment_sent_count(company_id: str, count: int = 1) -> WhatsAppDailyQuota:
        """
        Increment sent message counter after successful send.
        
        Args:
            company_id: Company UUID
            count: Number of messages to increment (default 1)
            
        Returns:
            WhatsAppDailyQuota: Updated quota object
        """
        try:
            quota = WhatsAppRateLimiter.get_or_create_today_quota(company_id)
            quota.messages_sent += count
            db.session.commit()
            
            logger.info(f"Incremented sent count to {quota.messages_sent}/{quota.quota_limit}")
            return quota
            
        except Exception as e:
            db.session.rollback()
            logger.error(f"Error incrementing sent count: {str(e)}")
            raise
    
    @staticmethod
    def reset_daily_quota(company_id: str = None):
        """
        Reset daily quota counter. Called at midnight by scheduler.
        If company_id is None, resets for all companies.
        
        Args:
            company_id: Optional company UUID
        """
        try:
            today = date.today()
            
            if company_id:
                # Reset specific company
                quota = WhatsAppDailyQuota.query.filter(
                    WhatsAppDailyQuota.company_id == company_id,
                    WhatsAppDailyQuota.date == today
                ).first()
                
                if quota:
                    quota.messages_sent = 0
                    quota.last_reset_at = datetime.now()
            else:
                # Reset all companies
                quotas = WhatsAppDailyQuota.query.filter(
                    WhatsAppDailyQuota.date == today
                ).all()
                
                for quota in quotas:
                    quota.messages_sent = 0
                    quota.last_reset_at = datetime.now()
            
            db.session.commit()
            logger.info(f"Reset daily quota for {company_id or 'all companies'}")
            
        except Exception as e:
            db.session.rollback()
            logger.error(f"Error resetting daily quota: {str(e)}")
            raise
    
    @staticmethod
    def get_quota_stats(company_id: str) -> dict:
        """
        Get detailed quota statistics.
        
        Args:
            company_id: Company UUID
            
        Returns:
            dict: Quota statistics
        """
        try:
            quota = WhatsAppRateLimiter.get_or_create_today_quota(company_id)
            config = WhatsAppConfig.query.filter_by(company_id=company_id).first()
            
            buffer = config.quota_buffer if config else 5
            effective_limit = quota.quota_limit - buffer
            remaining = max(0, effective_limit - quota.messages_sent)
            percentage_used = (quota.messages_sent / effective_limit * 100) if effective_limit > 0 else 0
            
            return {
                'date': quota.date.isoformat(),
                'messages_sent': quota.messages_sent,
                'quota_limit': quota.quota_limit,
                'effective_limit': effective_limit,
                'buffer': buffer,
                'remaining': remaining,
                'percentage_used': round(percentage_used, 2),
                'can_send': remaining > 0,
                'last_reset_at': quota.last_reset_at.isoformat() if quota.last_reset_at else None
            }
            
        except Exception as e:
            logger.error(f"Error getting quota stats: {str(e)}")
            raise
