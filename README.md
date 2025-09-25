# Skyline - AI-Driven DevOps Automation Demo

Amazon Q 기반 완전 자동화된 DevOps 파이프라인 데모

## 🚀 자동화 워크플로

1. **코드 푸시** → Lambda 트리거
2. **Amazon Q 분석** → 인프라 요구사항 도출  
3. **Terraform/K8s 생성** → 자동 PR 생성
4. **관리자 승인** → AWS 배포 실행

## 📋 인프라 사양

- **EKS**: v1.33, t3.medium
- **RDS**: t3.micro, MySQL
- **Network**: Single NAT Gateway
- **Load Balancer**: ALB via Ingress
- **Domain**: www.greenbespinglobal.store (HTTPS)
- **Image**: 646558765106.dkr.ecr.ap-northeast-2.amazonaws.com/skyline-app-lyjking:1.7
