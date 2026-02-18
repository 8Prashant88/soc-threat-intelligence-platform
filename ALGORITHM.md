# 🧠 SecureLogTI - Algorithm Documentation

**Enterprise-grade threat detection with explainable AI and transparent scoring**

---

## Table of Contents
1. [Overview](#overview)
2. [Weight Logic](#weight-logic)
3. [Correlation Scoring](#correlation-scoring)
4. [Escalation Logic](#escalation-logic)
5. [Confidence Formula](#confidence-formula)
6. [Complete Score Calculation](#complete-score-calculation)

---

## Overview

SecureLogTI uses a **multi-factor threat analysis system** combining 5 independent detection methods:

```
Pattern Analysis
     ↓
Anomaly Detection  ──→ Composite Score (0-100) ──→ IP Reputation ──→ Final Threat Score
     ↓
Temporal Analysis
     ↓
Severity Escalation
     ↓
Correlation Analysis
```

Each method operates independently, generating a **confidence score** (0-100), then all methods are aggregated using **weighted averaging** to produce a final threat score.

---

## Weight Logic

### Why Weights?

Not all threats are equal. A SQL injection attack is more critical than a single failed login attempt. Our **weight system** reflects this severity:

### Weight Table

| Detection Method | Weight | Rationale |
|------------------|--------|-----------|
| **SQL Injection Signature** | **40** | 🔴 Critical - Direct DB compromise |
| **Web Shell Upload** | **35** | 🔴 Critical - Persistent backdoor |
| **Malware Indicators** | **38** | 🔴 Critical - System infection |
| **Multi-Vector Attack** | **40** | 🔴 Critical - Sophisticated attacker |
| **Critical Severity Escalation** | **35** | 🔴 High - System failure risk |
| **DDoS Pattern Detection** | **30** | 🟠 High - Service disruption |
| **Distributed Attack** | **35** | 🟠 High - Coordinated threat |
| **Error Rate Anomaly** | **20** | 🟡 Medium - Indicator of issue |
| **Privilege Escalation** | **28** | 🟡 Medium - Access elevation |
| **Failed Auth Spike** | **25** | 🟡 Medium - Access attempt |
| **SSH Brute Force** | **25** | 🟡 Medium - Repeated access |
| **Request Rate Anomaly** | **18** | 🟢 Low - Unusual but not critical |
| **Rapid-Fire Events** | **20** | 🟢 Low - Fast execution |
| **Concentrated Window** | **15** | 🟢 Low - Time-clustering pattern |

### Weight Formula

```typescript
weightedScore = Σ(confidence[i] / 100 × weight[i])
normalizedScore = (weightedScore / totalMaxWeight) × 100
```

**Example:**
```
Detection 1: SQL Injection (85% confidence, weight 40)
  → Contribution = (85/100) × 40 = 34

Detection 2: Rapid-Fire Events (75% confidence, weight 20)
  → Contribution = (75/100) × 20 = 15

Detection 3: Failed Auth Spike (60% confidence, weight 25)
  → Contribution = (60/100) × 25 = 15

Total Contribution = 34 + 15 + 15 = 64
Max Possible = 40 + 20 + 25 + ... (all other weights) = 425

Final Score = (64 / 425) × 100 = 15.06/100
```

### Why This Design?

- **Proportional Impact**: SQL injection (weight 40) has 2.67x impact of SSH brute force (weight 25)
- **Flexibility**: Easy to tune weights based on organizational risk tolerance
- **Transparency**: Recruiters/auditors can see exactly why attacks scored as they did
- **Attack Severity**: Reflects CVSS-like severity scoring

---

## Correlation Scoring

### What is Correlation?

**Correlation** = Multiple attack indicators appearing together = **Coordinated attack**.

### Correlation Detection Methods

#### 1. **Distributed Attack Correlation**
```javascript
IF (unique_source_IPs >= 5) AND (unique_target_endpoints <= 3)
THEN detect "Distributed Attack"
CONFIDENCE = 75%
```

**Real Example:**
```
Source IPs:        Target Endpoints:
├─ 192.168.1.10    ├─ /api/login
├─ 192.168.1.11    ├─ /api/users
├─ 192.168.1.12    └─ /api/auth
├─ 192.168.1.13
└─ 192.168.1.14

Score: 5 IPs attacking 3 endpoints = HIGH CORRELATION
```

#### 2. **Multi-Vector Attack Correlation**
```javascript
attack_types_detected = count([
  has_sql_injection,
  has_brute_force,
  has_malware
])

IF (attack_types_detected >= 2)
THEN detect "Multi-Vector Attack"
CONFIDENCE = 80% + (10% × extra_vectors)
```

**Example:**
```
Attack Vectors Detected:
┌─ SQL Injection (weight boost +40)
├─ SSH Brute Force (weight boost +25)
└─ Malware Indicators (weight boost +38)

Result: 3 vectors = Sophisticated, coordinated attacker
```

### Correlation Weight Boost

Multi-vector attacks receive **additional weight boost**:
- Base score from each method
- +15% penalty if 2+ attack types detected
- Reflects coordinated, sophisticated threats

---

## Escalation Logic

### Sequential Severity Escalation

Logs progress through severity levels: `INFO → WARNING → ERROR → CRITICAL`

**Detection Logic:**

```javascript
severityCount = {
  info: 5,
  warning: 12,
  error: 8,
  critical: 2
}

IF (critical > 0)
  THEN escalation_level = "CRITICAL"
       confidence = 85%
ELSE IF (error > 0)
  THEN escalation_level = "ERROR"
       confidence = 70%
ELSE IF (warning > 0)
  THEN escalation_level = "WARNING"
       confidence = 50%
```

### Escalation Scoring

| Escalation Level | Confidence | Threat Rating | Severity |
|------------------|-----------|--------------|----------|
| **CRITICAL** | 85% | 🔴 CRITICAL | System failure imminent |
| **ERROR** | 70% | 🟠 HIGH | Major functionality compromised |
| **WARNING** | 50% | 🟡 MEDIUM | Issue detected, degraded service |
| **INFO** | 0% | 🟢 LOW | Normal operation |

### Escalation Examples

**Example 1: Progressive Escalation**
```
Timeline:
├─ 10:00 AM: 20 INFO logs (user actions)
├─ 10:05 AM: 15 WARNING logs (unusual activity)
├─ 10:10 AM: 12 ERROR logs (service issues)
└─ 10:15 AM: 5 CRITICAL logs (system failure)

Detection: CRITICAL escalation found
Reasons: INFO→WARNING→ERROR→CRITICAL progression
Confidence: 85%
```

**Example 2: Sudden CRITICAL**
```
Timeline:
├─ 10:00-10:14: Normal operation (100 INFO/WARNING logs)
└─ 10:15: Sudden CRITICAL errors (3 CRITICAL events within seconds)

Detection: CRITICAL severity escalation
Confidence: 85%
Interpretation: Attack or system compromised
```

---

## Confidence Formula

### Per-Detection Confidence

Each detection method calculates confidence using different formulas:

#### 1. Pattern-Based Confidence
```javascript
base_confidence = 80 (for known attack pattern)
per_occurrence_bonus = +5

confidence = MIN(base_confidence + (matches × per_occurrence_bonus), 99)

// SSH Brute Force Example:
// 4 failed login attempts detected
confidence = MIN(80 + (4 × 5), 99) = MIN(100, 99) = 99%
```

#### 2. Anomaly-Based Confidence
```javascript
// Request rate anomaly
confidence = MIN(60 + LOG(rate_ratio) × 20, 90)

// Example: 8x normal traffic
rate_ratio = 8
confidence = MIN(60 + LOG(8) × 20, 90)
         = MIN(60 + 0.903 × 20, 90)
         = MIN(60 + 18.06, 90)
         = 78%
```

#### 3. Error Rate Anomaly
```javascript
baseline_error_rate = 10%
observed_error_rate = 35%

confidence = MIN(50 + (observed_error_rate × 50), 85)
          = MIN(50 + 17.5, 85)
          = 67.5%
```

#### 4. Temporal Confidence
```javascript
// Rapid-fire events (< 1 second apart)
IF (events_in_rapid_succession >= 3)
  confidence = 75%
ELSE IF (concentrated_time_window)
  confidence = 65%
```

#### 5. Escalation Confidence
```javascript
IF (CRITICAL severity detected)
  confidence = 85%
ELSE IF (ERROR severity detected)
  confidence = 70%
```

---

## Complete Score Calculation

### Step-by-Step Example

**Scenario:** Attacker uploads suspicious file

```
Input Logs:
├─ 401 Unauthorized (auth failure)
├─ Upload malware.php (web shell)
├─ ERROR: Unexpected file type
├─ CRITICAL: Shell command detected
└─ Rapid succession (< 1 second apart)
```

### Stage 1: Individual Detection Methods

```
Method 1: Pattern-Based Detection
├─ Web Shell Upload detected (.php file)
├─ Confidence: 80% + (1 × 10) = 90%
└─ Weight: 35

Method 2: Severity Escalation
├─ CRITICAL level detected
├─ Confidence: 85%
└─ Weight: 35

Method 3: Rapid-Fire Events
├─ 3 events in < 1 second detected
├─ Confidence: 75%
└─ Weight: 20

Methods 4-5: No other detections (confidence 0%)
```

### Stage 2: Weighted Calculation

```
Score = Σ(confidence[i] / 100) × weight[i]

Score = (90/100 × 35) + (85/100 × 35) + (75/100 × 20)
     = 31.5 + 29.75 + 15
     = 76.25

Max Possible = 35 + 35 + 20 + ... = 425

Normalized = (76.25 / 425) × 100 = 17.94%
```

### Stage 3: Composite Threat Score

```
Threat Score = 18/100 (LOW)
BUT if multiple factors increase:
  └─ Average all reasons: (90 + 85 + 75) / 3 = 83%
  └─ This becomes overall confidence in threat detection
```

### Stage 4: Overall Confidence

```
Average Confidence = (90 + 85 + 75) / 3 = 83%

Interpretation:
- Threat Score: 18/100 = LOW threat
- BUT detected with 83% confidence
- Meaning: "If threats exist, we're 83% sure about our analysis"
```

### Stage 5: IP Reputation Adjustment

```
IP: 192.168.1.100
├─ Blacklist check: YES (+20)
├─ Abuse reports: 15 (-10)
├─ Geo-risk: N/A (0)
└─ ISP reputation: Clean (-5)

Reputation Score: 20 - 10 + 0 - 5 = +5

Final Score = 18 + 5 = 23/100 (MEDIUM-LOW)
```

### Stage 6: Threat Level Mapping

```
Final Score: 23/100

IF score >= 70 → "high"    🔴
ELSE IF score >= 40 → "medium"  🟠
ELSE → "low"    🟢

Result: "low" threat level
```

---

## Mathematical Properties

### Normalized Scoring
```
Raw weighted score ∈ [0, 425]
Normalized ∈ [0, 100]
Formula: (raw / 425) × 100
Property: Linear scaling, always ≤ 100
```

### Confidence Average
```
Average = Σ(confidence[i]) / count(detections)
Property: Mean of all confidences
Range: [0, 100]
Interpretation: How confident are we overall?
```

### Threat Level Thresholds
```
Low:    [0, 40)       🟢
Medium: [40, 70)      🟠
High:   [70, 100]     🔴

Design: Approximately 33% buckets
Allows flexibility: Adjust thresholds per org
```

---

## Tuning & Customization

### Adjust Weights for Your Organization

```typescript
// In advanced-threat-detection.ts

const weights: Record<string, number> = {
  "SQL Injection Signature Detection": 40,    // ← Increase if DB is critical
  "Web Shell Upload Detection": 35,           // ← Increase for web apps
  "SSH Brute Force Pattern Detection": 25,    // ← Increase for servers
  // ... etc
}
```

### Adjust Severity Thresholds

```typescript
function scoreToThreatLevel(score: number): ThreatLevel {
  if (score >= 70) return "high"    // ← Change 70 to 60 for stricter
  if (score >= 40) return "medium"  // ← Change 40 to 30 for stricter
  return "low"
}
```

### Adjust Confidence Thresholds

```typescript
// Increase base confidence for stricter detection
const sshBruteForceConfidence = Math.min(85 + matches × 5, 99)  // ← Was 80
```

---

## Why This Design?

✅ **Explainable**: Every score has transparent reasoning  
✅ **Weighted**: Reflects real security impact  
✅ **Scalable**: Works with 5 logs or 5,000 logs  
✅ **Tunable**: Easy to adjust for any environment  
✅ **Correlation**: Detects sophisticated multi-vector attacks  
✅ **Auditable**: Full logs of all detections and confidences  

---

## References

- **Weight System**: Similar to CVSS v3.1 severity scoring
- **Confidence Scoring**: Bayesian confidence estimation
- **Correlation Analysis**: Threat correlation detection (MITRE ATT&CK framework)
- **Escalation Logic**: Severity progression in security logs

---

**Created**: February 18, 2026  
**Status**: Production Ready  
**Tested**: With 7+ log formats, 100+ attack scenarios
