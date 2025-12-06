# Infrastructure & Operational Costs - LivestockIQ

> Detailed cost breakdown for running LivestockIQ as a production-ready platform.

---

## Cost Summary by Scale

| Scale | Monthly Cost | Annual Cost |
|-------|--------------|-------------|
| **Pilot (500 farmers)** | ₹32,500 | ₹3,90,000 |
| **Year 2 (50K farmers)** | ₹2,47,700 | ₹29,72,400 |
| **Year 5 (500K farmers)** | ₹14,89,200 | ₹1,78,70,400 |

---

## Pilot Phase (500 Farmers, 50 Vets)

### Dedicated Application Costs

| Service | Provider | Specification | Annual Cost (₹) |
|---------|----------|---------------|-----------------|
| Domain | GoDaddy/Namecheap | livestockiq.in | 1,200 |
| SSL Certificate | Let's Encrypt | Wildcard SSL | 0 |
| Frontend Hosting | Vercel Pro | 1TB bandwidth | 19,200 |
| Backend Hosting | Render | Starter (512MB) | 0 |
| Database | MongoDB Atlas M10 | 2GB RAM, 10GB storage | 48,000 |
| File Storage | AWS S3 | 10GB (prescriptions, images) | 1,200 |
| CDN | Cloudflare | Free tier | 0 |
| **Subtotal** | | | **69,600** |

### AI & ML Services

| Service | Provider | Usage Estimate | Annual Cost (₹) |
|---------|----------|----------------|-----------------|
| LLM Chat (IQ Buddy) | Groq API | 75M tokens/month | 6,000 |
| Health Tips Generation | Google Gemini | 50K requests/month | 6,000 |
| Text-to-Speech | Google Cloud TTS | 2M chars/month | 0 |
| Speech-to-Text | Groq Whisper | 10 hours/month | 1,200 |
| **Subtotal** | | | **13,200** |

### Blockchain & Security

| Service | Provider | Usage Estimate | Annual Cost (₹) |
|---------|----------|----------------|-----------------|
| Blockchain Anchoring | Polygon (MATIC) | 30 txns/month | 3,600 |
| MATIC Token Reserve | Polygon | Gas buffer | 5,000 |
| Secret Management | Doppler/Vault | Free tier | 0 |
| **Subtotal** | | | **8,600** |

### Communication Services

| Service | Provider | Usage Estimate | Annual Cost (₹) |
|---------|----------|----------------|-----------------|
| Transactional Email | Gmail SMTP | 500/day limit | 0 |
| SMS Gateway | MSG91 | 5K SMS/month | 6,000 |
| Push Notifications | Expo (EAS) | 10K notifications | 0 |
| **Subtotal** | | | **6,000** |

### DevOps & Monitoring

| Service | Provider | Specification | Annual Cost (₹) |
|---------|----------|---------------|-----------------|
| CI/CD Pipeline | GitHub Actions | 2000 mins/month | 0 |
| Error Tracking | Sentry | Free tier (5K events) | 0 |
| Uptime Monitoring | UptimeRobot | Free (50 monitors) | 0 |
| Log Management | Papertrail | Free tier | 0 |
| **Subtotal** | | | **0** |

### Pilot Phase - Total Annual Cost

| Category | Annual Cost (₹) |
|----------|-----------------|
| Dedicated Application | 69,600 |
| AI & ML Services | 13,200 |
| Blockchain & Security | 8,600 |
| Communication Services | 6,000 |
| DevOps & Monitoring | 0 |
| **Grand Total** | **97,400** |
| **Monthly Average** | **8,117** |

---

## Year 2 Scale (50,000 Farmers, 5,000 Vets)

### Dedicated Application Costs

| Service | Provider | Specification | Annual Cost (₹) |
|---------|----------|---------------|-----------------|
| Domain | GoDaddy | livestockiq.in + .com | 2,500 |
| SSL Certificate | AWS ACM | Managed SSL | 0 |
| Frontend Hosting | AWS CloudFront | 10TB bandwidth | 1,44,000 |
| Backend Hosting | AWS EC2 | 2x t3.medium | 5,18,400 |
| Database | MongoDB Atlas M30 | 8GB RAM, 40GB storage | 3,00,000 |
| File Storage | AWS S3 | 500GB | 12,000 |
| Redis Cache | AWS ElastiCache | cache.t3.micro | 36,000 |
| CDN | CloudFront | Included above | 0 |
| **Subtotal** | | | **10,12,900** |

### AI & ML Services

| Service | Provider | Usage Estimate | Annual Cost (₹) |
|---------|----------|----------------|-----------------|
| LLM Chat (IQ Buddy) | Groq API | 7.5B tokens/month | 6,00,000 |
| Health Tips Generation | Google Gemini | 5M requests/month | 4,80,000 |
| Text-to-Speech | Google Cloud TTS | 20M chars/month | 72,000 |
| Speech-to-Text | Groq Whisper | 500 hours/month | 60,000 |
| **Subtotal** | | | **12,12,000** |

### Blockchain & Security

| Service | Provider | Usage Estimate | Annual Cost (₹) |
|---------|----------|----------------|-----------------|
| Blockchain Anchoring | Polygon (MATIC) | 300 txns/month | 36,000 |
| MATIC Token Reserve | Polygon | Gas buffer | 25,000 |
| AWS WAF | AWS | Web Application Firewall | 60,000 |
| AWS Secrets Manager | AWS | Secret rotation | 12,000 |
| **Subtotal** | | | **1,33,000** |

### Communication Services

| Service | Provider | Usage Estimate | Annual Cost (₹) |
|---------|----------|----------------|-----------------|
| Transactional Email | AWS SES | 500K emails/month | 42,000 |
| SMS Gateway | MSG91 | 100K SMS/month | 1,20,000 |
| Push Notifications | OneSignal | 100K users | 0 |
| WhatsApp Business | Meta | 50K messages/month | 60,000 |
| **Subtotal** | | | **2,22,000** |

### DevOps & Monitoring

| Service | Provider | Specification | Annual Cost (₹) |
|---------|----------|---------------|-----------------|
| CI/CD Pipeline | AWS CodePipeline | Unlimited builds | 7,20,000 |
| Load Balancer | AWS ALB | Application LB | 2,88,000 |
| CloudWatch | AWS | Logs + Metrics | 1,44,000 |
| Error Tracking | Sentry | Team plan | 30,000 |
| APM | New Relic | Basic plan | 0 |
| **Subtotal** | | | **11,82,000** |

### Year 2 - Total Annual Cost

| Category | Annual Cost (₹) |
|----------|-----------------|
| Dedicated Application | 10,12,900 |
| AI & ML Services | 12,12,000 |
| Blockchain & Security | 1,33,000 |
| Communication Services | 2,22,000 |
| DevOps & Monitoring | 11,82,000 |
| **Grand Total** | **37,61,900** |
| **Monthly Average** | **3,13,492** |

---

## Year 5 Scale (500,000 Farmers, 50,000 Vets)

### Dedicated Application Costs

| Service | Provider | Specification | Annual Cost (₹) |
|---------|----------|---------------|-----------------|
| Domain | GoDaddy | Multiple TLDs | 10,000 |
| SSL Certificate | AWS ACM | Managed | 0 |
| Frontend Hosting | AWS CloudFront | 100TB bandwidth | 6,00,000 |
| Backend Hosting | AWS ECS/EKS | Auto-scaling cluster | 36,00,000 |
| Database | MongoDB Atlas M50+ | Sharded cluster | 9,60,000 |
| File Storage | AWS S3 | 5TB | 1,20,000 |
| Redis Cache | AWS ElastiCache | cache.r6g.large | 4,80,000 |
| **Subtotal** | | | **57,70,000** |

### AI & ML Services

| Service | Provider | Usage Estimate | Annual Cost (₹) |
|---------|----------|----------------|-----------------|
| LLM Chat (IQ Buddy) | Self-hosted LLaMA | GPU Server | 24,00,000 |
| Health Tips Generation | Google Gemini | 50M requests/month | 36,00,000 |
| Text-to-Speech | Google Cloud TTS | 100M chars/month | 3,60,000 |
| Speech-to-Text | Groq Whisper | 2000 hours/month | 2,40,000 |
| ML Training (ANU) | AWS SageMaker | Monthly retraining | 6,00,000 |
| **Subtotal** | | | **72,00,000** |

### Blockchain & Security

| Service | Provider | Usage Estimate | Annual Cost (₹) |
|---------|----------|----------------|-----------------|
| Blockchain Anchoring | Polygon (MATIC) | 1000 txns/month | 1,20,000 |
| MATIC Token Reserve | Polygon | Gas buffer | 50,000 |
| AWS WAF | AWS | Advanced rules | 1,80,000 |
| AWS Shield | AWS | DDoS protection | 3,00,000 |
| HSM (Key Management) | AWS CloudHSM | Compliance | 12,00,000 |
| **Subtotal** | | | **18,50,000** |

### Communication Services

| Service | Provider | Usage Estimate | Annual Cost (₹) |
|---------|----------|----------------|-----------------|
| Transactional Email | AWS SES | 5M emails/month | 4,20,000 |
| SMS Gateway | MSG91 | 1M SMS/month | 12,00,000 |
| Push Notifications | OneSignal | Pro plan | 3,60,000 |
| WhatsApp Business | Meta | 500K messages/month | 6,00,000 |
| Voice Calls (IVR) | Exotel | 50K minutes/month | 6,00,000 |
| **Subtotal** | | | **31,80,000** |

### DevOps & Monitoring

| Service | Provider | Specification | Annual Cost (₹) |
|---------|----------|---------------|-----------------|
| CI/CD Pipeline | AWS CodePipeline | Multi-region | 12,00,000 |
| Load Balancer | AWS NLB + ALB | Multi-AZ | 6,00,000 |
| CloudWatch | AWS | Full observability | 3,60,000 |
| Error Tracking | Sentry | Business plan | 1,80,000 |
| APM | Datadog | Full stack | 12,00,000 |
| Disaster Recovery | AWS | Cross-region backup | 6,00,000 |
| **Subtotal** | | | **41,40,000** |

### Year 5 - Total Annual Cost

| Category | Annual Cost (₹) |
|----------|-----------------|
| Dedicated Application | 57,70,000 |
| AI & ML Services | 72,00,000 |
| Blockchain & Security | 18,50,000 |
| Communication Services | 31,80,000 |
| DevOps & Monitoring | 41,40,000 |
| **Grand Total** | **2,21,40,000** |
| **Monthly Average** | **18,45,000** |

---

## Platform vs Dedicated Costs (Year 2)

### Dedicated Costs (Per-Customer)

| Service | Annual Cost (₹) |
|---------|-----------------|
| Domain & SSL | 2,500 |
| Database Storage (per 1GB) | 7,500 |
| AI Token Usage (per 1M) | 4,000 |
| SMS Credits (per 1K) | 1,200 |
| Email Credits (per 10K) | 840 |
| Blockchain Txns (per 100) | 12,000 |
| **Variable Cost Subtotal** | **28,040** |

### Common Platform Costs

| Service | Annual Cost (₹) |
|---------|-----------------|
| EC2 Backend (2x t3.medium) | 5,18,400 |
| AWS CodePipeline (CI/CD) | 7,20,000 |
| Load Balancer (ALB) | 2,88,000 |
| CloudWatch Monitoring | 1,44,000 |
| CloudFront CDN | 1,44,000 |
| Redis Cache | 36,000 |
| WAF Security | 60,000 |
| **Platform Cost Subtotal** | **19,10,400** |

---

## Cost Optimization Recommendations

### Quick Wins (20-30% savings)

| Optimization | Savings | Implementation |
|--------------|---------|----------------|
| Reserved Instances (1-year) | 30% on EC2 | AWS console |
| Spot Instances for batch jobs | 70% on compute | AWS Spot |
| S3 Intelligent Tiering | 40% on storage | S3 settings |
| Groq caching layer | 50% on AI | Redis cache |

### Medium-Term (40-50% savings)

| Optimization | Savings | Implementation |
|--------------|---------|----------------|
| Self-host LLaMA (GPU server) | 60% on LLM | Year 3+ |
| Batch blockchain anchors | 70% on gas | Weekly anchoring |
| Compress TTS audio | 30% on TTS | OPUS codec |
| Regional SMS providers | 40% on SMS | Gupshup, Twilio |

### Long-Term Architecture

| Strategy | Benefit |
|----------|---------|
| Multi-tenant architecture | Shared infra = lower per-user cost |
| Edge caching (CF Workers) | Reduced origin requests |
| Serverless for spiky loads | Pay-per-use scaling |
| Hybrid cloud | Sensitive data on-prem |

---

## Cost vs Revenue Analysis

| Phase | Annual Cost | Annual Revenue | Gross Margin |
|-------|-------------|----------------|--------------|
| Pilot | ₹97,400 | ₹1,95,00,000 | 99.5% |
| Year 2 | ₹37,61,900 | ₹6,30,00,000 | 94% |
| Year 5 | ₹2,21,40,000 | ₹56,00,00,000 | 96% |

**The platform maintains healthy 94-99% gross margins at all scales.**

---

## External API Rate Cards

### Groq API (as of Dec 2024)

| Model | Input (per 1M tokens) | Output (per 1M tokens) |
|-------|----------------------|------------------------|
| LLaMA 3.1 8B | $0.05 | $0.08 |
| LLaMA 3.1 70B | $0.59 | $0.79 |
| Whisper Large v3 | $0.111 per hour | - |

### Google Cloud

| Service | Rate |
|---------|------|
| Gemini 1.5 Flash | $0.075 per 1M tokens |
| Cloud TTS (Standard) | $4 per 1M characters |
| Cloud TTS (WaveNet) | $16 per 1M characters |

### MongoDB Atlas

| Cluster | Monthly Cost (USD) |
|---------|-------------------|
| M0 (Free) | $0 |
| M10 | $57 |
| M30 | $350 |
| M50 | $700 |

### Polygon Network

| Transaction Type | Gas (MATIC) | Cost (₹) |
|------------------|-------------|----------|
| Simple transfer | 0.001 | ₹0.50 |
| Contract call | 0.01-0.05 | ₹5-25 |
| Batch anchor | 0.02 | ₹10 |

---

## Related Documentation

- [Business Model](./Business_Model.md)
- [User Acquisition Strategy](./User_Acquisition_Strategy.md)
- [AUDIT System Explained](./AUDIT_SYSTEM_EXPLAINED.md)
