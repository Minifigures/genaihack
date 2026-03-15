-- VIGIL Snowflake Schema
-- Run this against the VIGIL database

CREATE DATABASE IF NOT EXISTS VIGIL;
USE DATABASE VIGIL;
CREATE SCHEMA IF NOT EXISTS PUBLIC;
USE SCHEMA PUBLIC;

-- Student claims table
CREATE TABLE IF NOT EXISTS claims (
    claim_id VARCHAR(36) PRIMARY KEY,
    student_id VARCHAR(20) NOT NULL,
    provider_id VARCHAR(20),
    claim_date DATE NOT NULL,
    procedures VARIANT,          -- JSON array of procedures
    total FLOAT NOT NULL,
    ocr_confidence FLOAT,
    category_codes VARIANT,      -- JSON object code->category
    raw_text TEXT,
    created_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
);

-- ODA Fee Guide reference table
CREATE TABLE IF NOT EXISTS fee_guide (
    code VARCHAR(5) PRIMARY KEY,
    description VARCHAR(200) NOT NULL,
    category VARCHAR(50) NOT NULL,
    suggested_fee FLOAT NOT NULL,
    effective_date DATE,
    notes VARCHAR(500)
);

-- Fraud cases table
CREATE TABLE IF NOT EXISTS fraud_cases (
    case_id VARCHAR(36) PRIMARY KEY,
    claim_id VARCHAR(36) REFERENCES claims(claim_id),
    student_id VARCHAR(20) NOT NULL,
    provider_id VARCHAR(20),
    fraud_score FLOAT NOT NULL,
    risk_level VARCHAR(20) NOT NULL,
    score_breakdown VARIANT,     -- JSON ScoreBreakdown
    flags VARIANT,               -- JSON array of FraudFlag
    report_html TEXT,
    status VARCHAR(20) DEFAULT 'open',
    created_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP(),
    updated_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
);

-- Provider stats table
CREATE TABLE IF NOT EXISTS provider_stats (
    provider_id VARCHAR(20) PRIMARY KEY,
    provider_name VARCHAR(200) NOT NULL,
    address VARCHAR(500),
    total_claims INT DEFAULT 0,
    flagged_claims INT DEFAULT 0,
    avg_fee_deviation FLOAT DEFAULT 0,
    risk_tier VARCHAR(20) DEFAULT 'clean',
    common_fraud_types VARIANT,  -- JSON array
    last_claim_date DATE,
    updated_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
);

-- Audit log table
CREATE TABLE IF NOT EXISTS audit_log (
    log_id VARCHAR(36) PRIMARY KEY,
    case_id VARCHAR(36),
    claim_id VARCHAR(36),
    student_id VARCHAR(20),
    action VARCHAR(50) NOT NULL,
    agent VARCHAR(50),
    details VARIANT,             -- JSON object with full context
    timestamp TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
);

-- Student benefits tracking
CREATE TABLE IF NOT EXISTS student_benefits (
    student_id VARCHAR(20) NOT NULL,
    plan_year VARCHAR(9) NOT NULL,  -- e.g. "2025-2026"
    category VARCHAR(50) NOT NULL,
    annual_limit FLOAT NOT NULL,
    used_ytd FLOAT DEFAULT 0,
    remaining FLOAT,
    last_updated TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP(),
    PRIMARY KEY (student_id, plan_year, category)
);
