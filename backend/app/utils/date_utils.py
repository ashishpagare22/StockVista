from __future__ import annotations

from datetime import date, timedelta


def previous_business_day(day: date) -> date:
    current = day
    while current.weekday() >= 5:
        current -= timedelta(days=1)
    return current


def resolve_date_range(start_date: date | None, end_date: date | None) -> tuple[date, date]:
    resolved_end = end_date or date.today()
    resolved_start = start_date or (resolved_end - timedelta(days=90))

    if resolved_start == resolved_end and resolved_start.weekday() >= 5:
        resolved_start = previous_business_day(resolved_start)
        resolved_end = resolved_start

    if resolved_start > resolved_end:
        raise ValueError("start_date must be earlier than or equal to end_date.")

    if not iter_business_days(resolved_start, resolved_end):
        adjusted = previous_business_day(resolved_end)
        return adjusted, adjusted

    return resolved_start, resolved_end


def iter_business_days(start_date: date, end_date: date) -> list[date]:
    days: list[date] = []
    cursor = start_date
    while cursor <= end_date:
        if cursor.weekday() < 5:
            days.append(cursor)
        cursor += timedelta(days=1)
    return days
