# EduCheck : Intelligent Assignment Evaluation System (IAES)

The **Intelligent Assignment Evaluation System (IAES)** is designed to streamline assignment management, submission tracking, similarity detection, analytics, and Non-Objection Certificate (NOC) updates. The system provides a secure, scalable, and intelligent platform for academic or industry-like environments, serving students, teachers, and administrators efficiently.

Live at: https://educheck-ai-assignment-noc-system.vercel.app/
---

## Table of Contents

- [Features](#features)  
- [System Architecture](#system-architecture)  
- [User Roles and Workflow](#user-roles-and-workflow)  
- [Assignment Management](#assignment-management)  
- [Similarity Detection and Evaluation](#similarity-detection-and-evaluation)  
- [Notifications and Communication](#notifications-and-communication)  
- [Analytics and Reporting](#analytics-and-reporting)  
- [Security and Performance](#security-and-performance)  
- [Technologies Used](#technologies-used)  
- [Installation](#installation)  
- [Usage](#usage)  
- [Results](#results)  
- [Future Enhancements](#future-enhancements)  
- [References](#references)  

---

## Features

- **Assignment Management**: Teachers can create and assign tasks; students can submit work with versioning and timestamps.  
- **Similarity Detection**: Hybrid AI Engine for teacher-to-student comparison; TF-IDF for peer-to-peer similarity monitoring.  
- **Analytics & Reporting**: Track submission rates, average grades, and delays through visual dashboards.  
- **NOC Management**: Automated issuance and seamless status updates for No-Objection Certificates.  
- **Role-based Access Control**: Admin, Teacher, and Student roles with secure access management.  
- **Notifications**: Real-time alerts for assignments, deadlines, and grading updates (future WebSocket and email support).  

---

## System Architecture

The IAES follows a **client-server architecture**:

- **Frontend**: React + Tailwind CSS for interactive dashboards.  
- **Backend**: FastAPI with SQLAlchemy ORM and Alembic for database migrations.  
- **Database**: SQLite for prototyping; PostgreSQL for production deployment.  
- **Authentication & Security**: JWT authentication, bcrypt password hashing, HTTPS protection, and role-based access control.  


---

## User Roles and Workflow

1. **Admin**: Manages users, roles, and global system settings.  
2. **Teacher**: Creates assignments, reviews submissions, provides grades and feedback.  
3. **Student**: Views assignments, submits work before deadlines, receives status updates.  

Role-based middleware ensures that only authorized users can access protected endpoints, and all actions are logged for auditing purposes.

---

## Assignment Management

- Teachers create assignments with title, description, deadline, and attachments.  
- Students submit assignments with version control and timestamps.  
- Centralized repository stores all assignment materials with search, tagging, and versioning functionality.

---

## Similarity Detection and Evaluation

### Teacher-to-Student Comparison

- Preprocessing: Lowercasing, punctuation removal, tokenization.  
- Semantic Analysis: Dense embeddings using **all-mpnet-base-v2**.  
- Cross-Encoder: **stsb-roberta-large** for sentence-level similarity.  
- Natural Language Inference: **bart-large-mnli** to detect paraphrasing.  

### Peer-to-Peer Comparison

- TF-IDF vectorization with cosine similarity to detect lexical overlaps among submissions.  

Grades are calculated based on teacher-to-student similarity to ensure fairness and consistency.

---

## Notifications and Communication

- Real-time updates via WebSockets (planned).  
- Email notifications for critical events.  
- Future feature: Threaded comments or chat per assignment for better collaboration.  

---

## Analytics and Reporting

- Track key metrics: submission rates, average grades, delays.  
- Visual dashboards for monitoring progress.  
- Export options: CSV and PDF for academic and administrative reporting.  

---

## Security and Performance

- Secure authentication using JWT and bcrypt password hashing.  
- HTTPS protection for all API endpoints.  
- Role-based access control ensures data privacy.  
- API response times under 200 ms; WebSocket latency under 100 ms.  
- Full-text search optimized for results under 500 ms.  

---

## Technologies Used

- **Frontend**: React, Tailwind CSS  
- **Backend**: FastAPI, SQLAlchemy, Alembic  
- **Database**: SQLite (prototype), PostgreSQL (production)  
- **Similarity Detection**: sentence-transformers, cross-encoder, BART-NLI, TF-IDF  
- **Authentication & Security**: JWT, bcrypt, HTTPS  

---

