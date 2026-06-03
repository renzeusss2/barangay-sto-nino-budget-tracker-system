from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from models.transaction import Transaction
from models.budget import BudgetCategory, BudgetAllocation
import json
import math
import statistics

def _month_expr(col):
    """Returns month expression compatible with SQLite and PostgreSQL."""
    try:
        from database import IS_SQLITE
        if IS_SQLITE:
            return func.strftime('%m', col)
        return func.to_char(col, 'MM')
    except Exception:
        return func.strftime('%m', col)

class AIInsightsService:

    @staticmethod
    def moving_average(data: List[float], window: int = 3) -> List[float]:
        if len(data) < window:
            return data
        result = []
        for i in range(len(data)):
            if i < window - 1:
                result.append(sum(data[:i+1]) / (i+1))
            else:
                result.append(sum(data[i-window+1:i+1]) / window)
        return result

    @staticmethod
    def linear_regression(x: List[float], y: List[float]):
        n = len(x)
        if n < 2:
            return 0, y[0] if y else 0
        x_mean = sum(x) / n
        y_mean = sum(y) / n
        numerator   = sum((x[i] - x_mean) * (y[i] - y_mean) for i in range(n))
        denominator = sum((x[i] - x_mean) ** 2 for i in range(n))
        if denominator == 0:
            return 0, y_mean
        slope     = numerator / denominator
        intercept = y_mean - slope * x_mean
        return slope, intercept

    @staticmethod
    def detect_anomalies(values: List[float], threshold: float = 2.0) -> List[Dict]:
        if len(values) < 3:
            return []
        mean = statistics.mean(values)
        try:
            std = statistics.stdev(values)
        except statistics.StatisticsError:
            return []
        if std == 0:
            return []
        anomalies = []
        for i, val in enumerate(values):
            z_score = abs((val - mean) / std)
            if z_score > threshold:
                anomalies.append({
                    "index": i, "value": val,
                    "z_score": round(z_score, 2),
                    "deviation": "HIGH" if val > mean else "LOW"
                })
        return anomalies

    @classmethod
    async def get_spending_forecast(cls, session: AsyncSession, fiscal_year: int, months_ahead: int = 3) -> Dict[str, Any]:
        result = await session.execute(
            select(
                _month_expr(Transaction.transaction_date).label('month'),
                func.sum(Transaction.amount).label('total')
            )
            .where(and_(
                Transaction.fiscal_year == fiscal_year,
                Transaction.transaction_type == 'expense',
                Transaction.status == 'approved'
            ))
            .group_by(_month_expr(Transaction.transaction_date))
            .order_by(_month_expr(Transaction.transaction_date))
        )

        monthly_data = result.all()
        if not monthly_data:
            return {"forecast": [], "confidence": "low", "message": "Insufficient data for forecasting"}

        months  = [int(r.month) for r in monthly_data]
        amounts = [float(r.total) for r in monthly_data]
        slope, intercept = cls.linear_regression(months, amounts)

        current_month = datetime.now().month
        month_names   = ["","Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
        forecast = []
        for i in range(1, months_ahead + 1):
            future_month = current_month + i
            if future_month > 12:
                future_month -= 12
            predicted = max(0, slope * future_month + intercept)
            forecast.append({
                "month": future_month,
                "month_name": month_names[future_month],
                "predicted_amount": round(predicted, 2),
                "confidence_interval": {
                    "lower": round(predicted * 0.85, 2),
                    "upper": round(predicted * 1.15, 2)
                }
            })

        confidence = "high" if len(amounts) >= 6 else "medium" if len(amounts) >= 3 else "low"
        return {
            "forecast": forecast,
            "trend": "increasing" if slope > 0 else "decreasing" if slope < 0 else "stable",
            "trend_rate": round(slope, 2),
            "confidence": confidence,
            "data_points": len(amounts),
            "average_monthly": round(sum(amounts) / len(amounts), 2)
        }

    @classmethod
    async def get_budget_utilization_analysis(cls, session: AsyncSession, fiscal_year: int) -> Dict[str, Any]:
        alloc_result = await session.execute(
            select(
                BudgetAllocation.category_id,
                func.sum(BudgetAllocation.allocated_amount).label('allocated'),
                BudgetCategory.name, BudgetCategory.code, BudgetCategory.color
            )
            .join(BudgetCategory, BudgetAllocation.category_id == BudgetCategory.id)
            .where(BudgetAllocation.fiscal_year == fiscal_year)
            .group_by(BudgetAllocation.category_id, BudgetCategory.name, BudgetCategory.code, BudgetCategory.color)
        )

        tx_result = await session.execute(
            select(
                Transaction.category_id,
                func.sum(Transaction.amount).label('spent')
            )
            .where(and_(
                Transaction.fiscal_year == fiscal_year,
                Transaction.transaction_type == 'expense',
                Transaction.status == 'approved'
            ))
            .group_by(Transaction.category_id)
        )

        allocations = {r.category_id: r for r in alloc_result.all()}
        spending    = {r.category_id: float(r.spent) for r in tx_result.all()}
        categories  = []
        alerts      = []

        for cat_id, alloc in allocations.items():
            spent     = spending.get(cat_id, 0)
            allocated = float(alloc.allocated)
            utilization_rate = (spent / allocated * 100) if allocated > 0 else 0
            remaining = allocated - spent

            status = "on_track"
            if utilization_rate >= 95:
                status = "critical"
                alerts.append({"category": alloc.name, "type": "budget_exhausted",
                    "message": f"{alloc.name} has used {utilization_rate:.1f}% of budget", "severity": "high"})
            elif utilization_rate >= 80:
                status = "warning"
                alerts.append({"category": alloc.name, "type": "budget_warning",
                    "message": f"{alloc.name} is at {utilization_rate:.1f}%", "severity": "medium"})
            elif utilization_rate < 20 and datetime.now().month > 6:
                status = "underutilized"
                alerts.append({"category": alloc.name, "type": "underutilization",
                    "message": f"{alloc.name} only used {utilization_rate:.1f}%", "severity": "low"})

            categories.append({
                "category_id": cat_id, "name": alloc.name, "code": alloc.code, "color": alloc.color,
                "allocated": allocated, "spent": spent, "remaining": remaining,
                "utilization_rate": round(utilization_rate, 2), "status": status
            })

        total_allocated = sum(float(a.allocated) for a in allocations.values())
        total_spent     = sum(spending.values())

        return {
            "fiscal_year": fiscal_year, "categories": categories, "alerts": alerts,
            "summary": {
                "total_allocated": total_allocated, "total_spent": total_spent,
                "total_remaining": total_allocated - total_spent,
                "overall_utilization": round((total_spent / total_allocated * 100) if total_allocated > 0 else 0, 2),
                "categories_on_track": sum(1 for c in categories if c["status"] == "on_track"),
                "categories_warning":  sum(1 for c in categories if c["status"] == "warning"),
                "categories_critical": sum(1 for c in categories if c["status"] == "critical"),
            }
        }

    @classmethod
    async def detect_spending_anomalies(cls, session: AsyncSession, fiscal_year: int) -> Dict[str, Any]:
        result = await session.execute(
            select(Transaction)
            .where(and_(Transaction.fiscal_year == fiscal_year, Transaction.transaction_type == 'expense'))
            .order_by(Transaction.transaction_date.asc())
        )
        transactions = result.scalars().all()
        if not transactions:
            return {"anomalies": [], "analyzed": 0, "anomaly_count": 0}

        amounts         = [t.amount for t in transactions]
        anomaly_indices = cls.detect_anomalies(amounts)
        anomalies = []
        for a in anomaly_indices:
            tx = transactions[a["index"]]
            anomalies.append({
                "transaction_id": tx.id, "reference_number": tx.reference_number,
                "amount": tx.amount, "description": tx.description,
                "transaction_date": tx.transaction_date.isoformat(),
                "z_score": a["z_score"], "deviation": a["deviation"],
                "flag": "UNUSUAL_AMOUNT",
                "recommendation": "Review this transaction for accuracy and authorization"
            })

        return {
            "anomalies": anomalies, "analyzed": len(transactions),
            "anomaly_count": len(anomalies),
            "analysis_date": datetime.utcnow().isoformat()
        }

    @classmethod
    async def generate_recommendations(cls, session: AsyncSession, fiscal_year: int) -> List[Dict[str, Any]]:
        utilization  = await cls.get_budget_utilization_analysis(session, fiscal_year)
        forecast     = await cls.get_spending_forecast(session, fiscal_year)
        recommendations = []

        for cat in utilization.get("categories", []):
            if cat["status"] == "underutilized":
                recommendations.append({
                    "type": "reallocation", "priority": "medium", "category": cat["name"],
                    "title": f"Consider reallocating {cat['name']} funds",
                    "description": f"Only {cat['utilization_rate']}% used. Consider reallocating ₱{cat['remaining']:,.2f}.",
                    "action": "REVIEW_REALLOCATION"
                })
            elif cat["status"] == "critical":
                recommendations.append({
                    "type": "budget_increase", "priority": "high", "category": cat["name"],
                    "title": f"Urgent: {cat['name']} budget nearly exhausted",
                    "description": f"Only ₱{cat['remaining']:,.2f} remaining. Request supplemental budget.",
                    "action": "REQUEST_SUPPLEMENTAL"
                })

        if not recommendations:
            recommendations.append({
                "type": "info", "priority": "low", "category": "Overall",
                "title": "Budget execution is on track",
                "description": "All categories are within normal utilization ranges.",
                "action": "CONTINUE_MONITORING"
            })
        return recommendations