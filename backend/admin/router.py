from fastapi import APIRouter, Depends
from typing import Dict, Any
from admin.dependencies import require_admin
from database import supabase

router = APIRouter()

@router.get("/status")
async def get_admin_status(user: Dict[str, Any] = Depends(require_admin)):
    return {"isAdmin": True}

@router.get("/users")
async def get_users(user: Dict[str, Any] = Depends(require_admin)):
    # Simple fetch all for now, in a real app would use pagination
    res = supabase.table("users").select("id, email, full_name, role, created_at").execute()
    return res.data

@router.get("/analytics")
async def get_analytics(user: Dict[str, Any] = Depends(require_admin)):
    users_res = supabase.table("users").select("id", count="exact").execute()
    scans_res = supabase.table("scans").select(
        "id, primary_diagnosis_code, confidence_rate, risk_level, is_valid_upload, rejection_reason, scanned_at, user_accuracy_feedback"
    ).limit(10000).execute()
    scan_rows = scans_res.data or []
    feedback_rows = [
        row for row in scan_rows
        if row.get("user_accuracy_feedback") is not None
    ]
    if not feedback_rows:
        feedback_res = supabase.table("scans").select("user_accuracy_feedback").not_.is_("user_accuracy_feedback", "null").execute()
        feedback_rows = feedback_res.data or []

    accurate_feedback = sum(row.get("user_accuracy_feedback") == "accurate" for row in feedback_rows)
    inaccurate_feedback = sum(row.get("user_accuracy_feedback") == "inaccurate" for row in feedback_rows)
    verified_total = accurate_feedback + inaccurate_feedback

    confidence_buckets = {"0-20%": 0, "21-40%": 0, "41-60%": 0, "61-80%": 0, "81-100%": 0}
    risk_counts = {"low": 0, "medium": 0, "high": 0, "unknown": 0}
    diagnosis_counts: Dict[str, int] = {}
    timeline: Dict[str, Dict[str, float]] = {}
    quality_counts = {"valid": 0, "rejected": 0}

    for row in scan_rows:
        confidence = max(0, min(100, float(row.get("confidence_rate") or 0)))
        bucket = "81-100%" if confidence > 80 else "61-80%" if confidence > 60 else "41-60%" if confidence > 40 else "21-40%" if confidence > 20 else "0-20%"
        confidence_buckets[bucket] += 1

        risk = (row.get("risk_level") or "unknown").lower()
        risk_counts[risk] = risk_counts.get(risk, 0) + 1
        diagnosis = row.get("primary_diagnosis_code") or "unknown"
        diagnosis_counts[diagnosis] = diagnosis_counts.get(diagnosis, 0) + 1

        day = (row.get("scanned_at") or "unknown")[:10]
        if day != "unknown":
            day_stats = timeline.setdefault(day, {"scans": 0, "confidenceTotal": 0})
            day_stats["scans"] += 1
            day_stats["confidenceTotal"] += confidence

        if row.get("is_valid_upload", True):
            quality_counts["valid"] += 1
        else:
            quality_counts["rejected"] += 1

    correction_res = supabase.table("corrections").select(
        "actual_diagnosis, ai_prediction, biopsy_confirmed"
    ).eq("biopsy_confirmed", True).limit(10000).execute()
    positive_codes = {"MEL", "BCC", "SCCKA", "AKIEC", "MAL_OTH"}
    true_positive = false_positive = true_negative = false_negative = 0
    biopsy_correct = biopsy_incorrect = 0
    for row in correction_res.data or []:
        actual_diagnosis = str(row.get("actual_diagnosis") or "").upper().strip()
        ai_prediction = str(row.get("ai_prediction") or "").upper().strip()
        if actual_diagnosis == ai_prediction:
            biopsy_correct += 1
        else:
            biopsy_incorrect += 1
        actual_positive = actual_diagnosis in positive_codes
        predicted_positive = ai_prediction in positive_codes
        if actual_positive and predicted_positive:
            true_positive += 1
        elif not actual_positive and predicted_positive:
            false_positive += 1
        elif not actual_positive and not predicted_positive:
            true_negative += 1
        else:
            false_negative += 1

    sensitivity_denominator = true_positive + false_negative
    specificity_denominator = true_negative + false_positive

    return {
        "totalUsers": users_res.count if hasattr(users_res, 'count') else 0,
        "totalScans": len(scan_rows),
        "accuracyFeedback": {
            "total": len(feedback_rows),
            "accurate": accurate_feedback,
            "inaccurate": inaccurate_feedback,
        },
        "verifiedClassification": {
            "total": biopsy_correct + biopsy_incorrect,
            "correct": biopsy_correct,
            "incorrect": biopsy_incorrect,
            "accuracyRate": round(biopsy_correct / (biopsy_correct + biopsy_incorrect) * 100, 1) if biopsy_correct + biopsy_incorrect else None,
        },
        "confidenceDistribution": [
            {"bucket": bucket, "count": count} for bucket, count in confidence_buckets.items()
        ],
        "triageDistribution": [
            {"risk": risk, "count": count} for risk, count in risk_counts.items()
        ],
        "diagnosisDistribution": [
            {"diagnosis": diagnosis, "count": count}
            for diagnosis, count in sorted(diagnosis_counts.items(), key=lambda item: item[1], reverse=True)
        ],
        "longitudinalTracking": [
            {"date": day, "scans": values["scans"], "averageConfidence": round(values["confidenceTotal"] / values["scans"], 1)}
            for day, values in sorted(timeline.items())
        ],
        "imageQuality": {
            "valid": quality_counts["valid"],
            "rejected": quality_counts["rejected"],
            "failureRate": round(quality_counts["rejected"] / len(scan_rows) * 100, 1) if scan_rows else None,
            "tracked": quality_counts["rejected"] > 0,
        },
        "performance": {
            "sensitivity": round(true_positive / sensitivity_denominator * 100, 1) if sensitivity_denominator else None,
            "specificity": round(true_negative / specificity_denominator * 100, 1) if specificity_denominator else None,
            "confirmedCases": sensitivity_denominator + true_negative + false_positive,
        },
    }
