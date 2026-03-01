from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, cast, Date, extract
from datetime import datetime, timezone, timedelta
from typing import Optional

import models
from database import get_db

ARGENTINA_TZ = timezone(timedelta(hours=-3))

router = APIRouter(prefix="/reports", tags=["Reports"])

PERIOD_DAYS = {
    "7d": 7,
    "30d": 30,
    "3m": 90,
    "6m": 180,
    "1y": 365,
    "3y": 1095,
}


@router.get("/")
def get_reports(period: str = "30d", db: Session = Depends(get_db)):
    days = PERIOD_DAYS.get(period, 30)
    now = datetime.now(ARGENTINA_TZ).replace(tzinfo=None)
    start_date = now - timedelta(days=days)

    # Granularidad: diaria para <=90d, mensual para >90d
    granularity = "daily" if days <= 90 else "monthly"

    # ---- Base query: órdenes del período ----
    base = db.query(models.Order).filter(models.Order.created_at >= start_date)

    # ---- KPIs ----
    kpi_row = db.query(
        func.coalesce(func.sum(models.Order.total_amount), 0).label("revenue"),
        func.count(models.Order.id).label("orders"),
    ).filter(models.Order.created_at >= start_date).first()

    total_revenue = float(kpi_row.revenue)
    total_orders = int(kpi_row.orders)
    avg_ticket = total_revenue / total_orders if total_orders > 0 else 0
    orders_per_day = total_orders / max(days, 1)

    # ---- Revenue Timeline ----
    if granularity == "daily":
        timeline_q = db.query(
            cast(models.Order.created_at, Date).label("day"),
            func.sum(models.Order.total_amount).label("revenue"),
            func.count(models.Order.id).label("orders"),
        ).filter(
            models.Order.created_at >= start_date
        ).group_by(
            cast(models.Order.created_at, Date)
        ).order_by(
            cast(models.Order.created_at, Date)
        ).all()

        revenue_timeline = [
            {"label": row.day.strftime("%d/%m"), "revenue": float(row.revenue), "orders": int(row.orders)}
            for row in timeline_q
        ]
    else:
        # Mensual
        timeline_q = db.query(
            extract("year", models.Order.created_at).label("yr"),
            extract("month", models.Order.created_at).label("mo"),
            func.sum(models.Order.total_amount).label("revenue"),
            func.count(models.Order.id).label("orders"),
        ).filter(
            models.Order.created_at >= start_date
        ).group_by("yr", "mo").order_by("yr", "mo").all()

        month_names = ["", "Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
        revenue_timeline = [
            {
                "label": f"{month_names[int(row.mo)]} {int(row.yr)}",
                "revenue": float(row.revenue),
                "orders": int(row.orders),
            }
            for row in timeline_q
        ]

    # ---- By Weekday ----
    # PostgreSQL: EXTRACT(DOW FROM ...) → 0=Sunday, 1=Monday, ..., 6=Saturday
    weekday_q = db.query(
        extract("dow", models.Order.created_at).label("dow"),
        func.sum(models.Order.total_amount).label("revenue"),
        func.count(models.Order.id).label("orders"),
    ).filter(
        models.Order.created_at >= start_date
    ).group_by("dow").order_by("dow").all()

    day_names = {0: "Domingo", 1: "Lunes", 2: "Martes", 3: "Miércoles", 4: "Jueves", 5: "Viernes", 6: "Sábado"}

    # Calcular cuántas semanas cubre el período para promediar
    weeks = max(days / 7, 1)
    by_weekday = [
        {
            "day": day_names.get(int(row.dow), "?"),
            "avg_revenue": round(float(row.revenue) / weeks, 2),
            "total_orders": int(row.orders),
        }
        for row in weekday_q
    ]

    # ---- By Payment Method ----
    payment_q = db.query(
        models.Order.payment_method,
        func.count(models.Order.id).label("count"),
        func.sum(models.Order.total_amount).label("revenue"),
    ).filter(
        models.Order.created_at >= start_date
    ).group_by(models.Order.payment_method).all()

    by_payment = [
        {
            "method": row.payment_method or "Sin definir",
            "count": int(row.count),
            "revenue": float(row.revenue),
        }
        for row in payment_q
    ]

    # Agregar porcentaje
    total_payment_count = sum(p["count"] for p in by_payment)
    for p in by_payment:
        p["pct"] = round((p["count"] / total_payment_count * 100) if total_payment_count > 0 else 0, 1)

    # ---- Top Products (top 10) ----
    top_products_q = db.query(
        models.Product.name,
        func.sum(models.OrderItem.quantity).label("quantity"),
        func.sum(models.OrderItem.quantity * models.OrderItem.unit_price).label("revenue"),
    ).join(
        models.OrderItem, models.OrderItem.product_id == models.Product.id
    ).join(
        models.Order, models.Order.id == models.OrderItem.order_id
    ).filter(
        models.Order.created_at >= start_date
    ).group_by(
        models.Product.name
    ).order_by(
        func.sum(models.OrderItem.quantity).desc()
    ).limit(10).all()

    top_products = [
        {
            "name": row.name,
            "quantity": int(row.quantity),
            "revenue": float(row.revenue),
            "pct_of_total": round((float(row.revenue) / total_revenue * 100) if total_revenue > 0 else 0, 1),
        }
        for row in top_products_q
    ]

    # ---- All Products (para lazy loading, sin limit) ----
    all_products_q = db.query(
        models.Product.name,
        func.sum(models.OrderItem.quantity).label("quantity"),
        func.sum(models.OrderItem.quantity * models.OrderItem.unit_price).label("revenue"),
    ).join(
        models.OrderItem, models.OrderItem.product_id == models.Product.id
    ).join(
        models.Order, models.Order.id == models.OrderItem.order_id
    ).filter(
        models.Order.created_at >= start_date
    ).group_by(
        models.Product.name
    ).order_by(
        func.sum(models.OrderItem.quantity * models.OrderItem.unit_price).desc()
    ).all()

    all_products = [
        {
            "name": row.name,
            "quantity": int(row.quantity),
            "revenue": float(row.revenue),
            "unit_ticket": round(float(row.revenue) / int(row.quantity), 2) if int(row.quantity) > 0 else 0,
            "pct_of_total": round((float(row.revenue) / total_revenue * 100) if total_revenue > 0 else 0, 1),
        }
        for row in all_products_q
    ]

    return {
        "period": period,
        "granularity": granularity,
        "kpis": {
            "revenue": round(total_revenue, 2),
            "orders": total_orders,
            "avg_ticket": round(avg_ticket, 2),
            "orders_per_day": round(orders_per_day, 1),
        },
        "revenue_timeline": revenue_timeline,
        "by_weekday": by_weekday,
        "by_payment_method": by_payment,
        "top_products": top_products,
        "all_products": all_products,
    }
