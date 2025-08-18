from beanie import Document
from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime
from datetime import date as Date
from enum import Enum

class TrendDirection(str, Enum):
    UP = "up"
    DOWN = "down"
    STABLE = "stable"

class HealthMetric(BaseModel):
    weight: Optional[float] = None
    body_fat: Optional[float] = None
    muscle_mass: Optional[float] = None
    energy_level: Optional[int] = None  # 1-10 scale
    mood: Optional[int] = None  # 1-10 scale
    sleep_hours: Optional[float] = None
    stress_level: Optional[int] = None  # 1-10 scale

class NutritionMetrics(BaseModel):
    calories_consumed: float = 0
    protein_consumed: float = 0
    carbs_consumed: float = 0
    fats_consumed: float = 0
    water_consumed: float = 0
    meals_logged: int = 0
    alcohol_units: float = 0

class ActivityMetrics(BaseModel):
    gym_sessions: int = 0
    cardio_minutes: int = 0
    strength_training_minutes: int = 0
    steps: Optional[int] = None
    calories_burned: Optional[float] = None

class DailyStats(Document):
    user_id: str = Field(..., index=True)
    date: Date = Field(..., index=True)
    health_metrics: HealthMetric = Field(default_factory=HealthMetric)
    nutrition_metrics: NutritionMetrics = Field(default_factory=NutritionMetrics)
    activity_metrics: ActivityMetrics = Field(default_factory=ActivityMetrics)
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "daily_stats"
        indexes = [
            "user_id",
            "date",
            "created_at"
        ]

# Schemas para analytics
class WeeklyTrend(BaseModel):
    metric_name: str
    current_value: float
    previous_value: float
    change_percentage: float
    direction: TrendDirection

class MonthlyProgress(BaseModel):
    month: str
    weight_change: Optional[float] = None
    avg_calories: Optional[float] = None
    avg_protein: Optional[float] = None
    gym_sessions: int = 0
    consistency_score: float = 0  # 0-100

class AnalyticsSummary(BaseModel):
    user_id: str
    period_start: Date
    period_end: Date
    weekly_trends: List[WeeklyTrend]
    monthly_progress: List[MonthlyProgress]
    achievements: List[str]
    recommendations: List[str]
    consistency_metrics: Dict[str, float]

class GoalProgress(BaseModel):
    goal_type: str
    target_value: float
    current_value: float
    progress_percentage: float
    estimated_completion: Optional[Date] = None
    is_on_track: bool

# Schemas para requests/responses
class DailyStatsCreate(BaseModel):
    date: Optional[Date] = None
    health_metrics: Optional[HealthMetric] = None
    activity_metrics: Optional[ActivityMetrics] = None
    notes: Optional[str] = None

class DailyStatsUpdate(BaseModel):
    health_metrics: Optional[HealthMetric] = None
    activity_metrics: Optional[ActivityMetrics] = None
    notes: Optional[str] = None

class DailyStatsResponse(BaseModel):
    id: str
    date: Date
    health_metrics: HealthMetric
    nutrition_metrics: NutritionMetrics
    activity_metrics: ActivityMetrics
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

class AnalyticsRequest(BaseModel):
    start_date: Optional[Date] = None
    end_date: Optional[Date] = None
    metrics: Optional[List[str]] = None  # Métricas específicas a analizar