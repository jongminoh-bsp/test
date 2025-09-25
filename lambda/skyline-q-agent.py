import json
import boto3
import os
from datetime import datetime

def lambda_handler(event, context):
    """
    Amazon Q 기반 인프라 자동화 Lambda 함수
    """
    
    # 요구사항 파싱
    requirements = event.get('requirements', {})
    
    # Terraform 코드 생성
    terraform_code = generate_terraform_code(requirements)
    
    # Kubernetes 매니페스트 생성
    k8s_manifests = generate_k8s_manifests(requirements)
    
    # GitHub PR 생성
    create_github_pr(terraform_code, k8s_manifests, event)
    
    return {
        'statusCode': 200,
        'body': json.dumps({
            'message': 'Infrastructure automation completed',
            'timestamp': datetime.now().isoformat()
        })
    }

def generate_terraform_code(requirements):
    """Terraform 코드 생성"""
    
    main_tf = f"""
terraform {{
  required_version = ">= 1.0"
  required_providers {{
    aws = {{
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }}
  }}
  backend "s3" {{
    bucket = "{requirements.get('tfstate_bucket', 'skyline-infra')}"
    key    = "terraform.tfstate"
    region = "ap-northeast-2"
  }}
}}

provider "aws" {{
  region = "ap-northeast-2"
}}

# VPC
resource "aws_vpc" "main" {{
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = {{
    Name = "skyline-vpc"
  }}
}}

# Internet Gateway
resource "aws_internet_gateway" "main" {{
  vpc_id = aws_vpc.main.id
  
  tags = {{
    Name = "skyline-igw"
  }}
}}

# Public Subnets
resource "aws_subnet" "public" {{
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${{count.index + 1}}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]
  
  map_public_ip_on_launch = true
  
  tags = {{
    Name = "skyline-public-${{count.index + 1}}"
    "kubernetes.io/role/elb" = "1"
  }}
}}

# Private Subnets
resource "aws_subnet" "private" {{
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${{count.index + 10}}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]
  
  tags = {{
    Name = "skyline-private-${{count.index + 1}}"
    "kubernetes.io/role/internal-elb" = "1"
  }}
}}

# Single NAT Gateway (cost optimization)
resource "aws_eip" "nat" {{
  domain = "vpc"
  
  tags = {{
    Name = "skyline-nat-eip"
  }}
}}

resource "aws_nat_gateway" "main" {{
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public[0].id
  
  tags = {{
    Name = "skyline-nat"
  }}
}}

# Route Tables
resource "aws_route_table" "public" {{
  vpc_id = aws_vpc.main.id
  
  route {{
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }}
  
  tags = {{
    Name = "skyline-public-rt"
  }}
}}

resource "aws_route_table" "private" {{
  vpc_id = aws_vpc.main.id
  
  route {{
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main.id
  }}
  
  tags = {{
    Name = "skyline-private-rt"
  }}
}}

# Route Table Associations
resource "aws_route_table_association" "public" {{
  count          = 2
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}}

resource "aws_route_table_association" "private" {{
  count          = 2
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private.id
}}

# EKS Cluster
resource "aws_eks_cluster" "main" {{
  name     = "skyline-cluster"
  role_arn = aws_iam_role.eks_cluster.arn
  version  = "{requirements.get('eks_version', '1.33')}"
  
  vpc_config {{
    subnet_ids = concat(aws_subnet.private[*].id, aws_subnet.public[*].id)
  }}
  
  depends_on = [
    aws_iam_role_policy_attachment.eks_cluster_policy,
  ]
}}

# EKS Node Group
resource "aws_eks_node_group" "main" {{
  cluster_name    = aws_eks_cluster.main.name
  node_group_name = "skyline-nodes"
  node_role_arn   = aws_iam_role.eks_node.arn
  subnet_ids      = aws_subnet.private[*].id
  instance_types  = ["{requirements.get('eks_instance_type', 't3.medium')}"]
  
  scaling_config {{
    desired_size = 2
    max_size     = 4
    min_size     = 1
  }}
  
  depends_on = [
    aws_iam_role_policy_attachment.eks_worker_node_policy,
    aws_iam_role_policy_attachment.eks_cni_policy,
    aws_iam_role_policy_attachment.eks_container_registry_policy,
  ]
}}

# RDS Subnet Group
resource "aws_db_subnet_group" "main" {{
  name       = "skyline-db-subnet-group"
  subnet_ids = aws_subnet.private[*].id
  
  tags = {{
    Name = "skyline-db-subnet-group"
  }}
}}

# RDS Instance
resource "aws_db_instance" "main" {{
  identifier     = "skyline-db"
  engine         = "mysql"
  engine_version = "8.0"
  instance_class = "{requirements.get('db_instance_class', 't3.micro')}"
  
  allocated_storage = 20
  storage_type      = "gp2"
  
  db_name  = "{requirements.get('db_name', 'skyline')}"
  username = "{requirements.get('db_user', 'skyline_ojm')}"
  password = "{requirements.get('db_password', 'skyline1267')}"
  
  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name
  
  skip_final_snapshot = true
  
  tags = {{
    Name = "skyline-db"
  }}
}}

# Security Groups
resource "aws_security_group" "rds" {{
  name_prefix = "skyline-rds-"
  vpc_id      = aws_vpc.main.id
  
  ingress {{
    from_port   = 3306
    to_port     = 3306
    protocol    = "tcp"
    cidr_blocks = [aws_vpc.main.cidr_block]
  }}
  
  egress {{
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }}
}}

# IAM Roles
resource "aws_iam_role" "eks_cluster" {{
  name = "skyline-eks-cluster-role"
  
  assume_role_policy = jsonencode({{
    Version = "2012-10-17"
    Statement = [
      {{
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {{
          Service = "eks.amazonaws.com"
        }}
      }},
    ]
  }})
}}

resource "aws_iam_role_policy_attachment" "eks_cluster_policy" {{
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
  role       = aws_iam_role.eks_cluster.name
}}

resource "aws_iam_role" "eks_node" {{
  name = "skyline-eks-node-role"
  
  assume_role_policy = jsonencode({{
    Version = "2012-10-17"
    Statement = [
      {{
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {{
          Service = "ec2.amazonaws.com"
        }}
      }},
    ]
  }})
}}

resource "aws_iam_role_policy_attachment" "eks_worker_node_policy" {{
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy"
  role       = aws_iam_role.eks_node.name
}}

resource "aws_iam_role_policy_attachment" "eks_cni_policy" {{
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy"
  role       = aws_iam_role.eks_node.name
}}

resource "aws_iam_role_policy_attachment" "eks_container_registry_policy" {{
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
  role       = aws_iam_role.eks_node.name
}}

# Data Sources
data "aws_availability_zones" "available" {{
  state = "available"
}}

# Outputs
output "cluster_endpoint" {{
  value = aws_eks_cluster.main.endpoint
}}

output "cluster_name" {{
  value = aws_eks_cluster.main.name
}}

output "rds_endpoint" {{
  value = aws_db_instance.main.endpoint
}}
"""
    
    return main_tf

def generate_k8s_manifests(requirements):
    """Kubernetes 매니페스트 생성"""
    
    namespace = """
apiVersion: v1
kind: Namespace
metadata:
  name: skyline
"""
    
    secret = f"""
apiVersion: v1
kind: Secret
metadata:
  name: skyline-db-secret
  namespace: skyline
type: Opaque
stringData:
  DB_HOST: "skyline-db.c5d2wfqufspp.ap-northeast-2.rds.amazonaws.com"
  DB_PORT: "3306"
  DB_NAME: "{requirements.get('db_name', 'skyline')}"
  DB_USER: "{requirements.get('db_user', 'skyline_ojm')}"
  DB_PASSWORD: "{requirements.get('db_password', 'skyline1267')}"
"""
    
    deployment = f"""
apiVersion: apps/v1
kind: Deployment
metadata:
  name: skyline-app
  namespace: skyline
spec:
  replicas: 2
  selector:
    matchLabels:
      app: skyline
  template:
    metadata:
      labels:
        app: skyline
    spec:
      containers:
      - name: skyline
        image: {requirements.get('image', '646558765106.dkr.ecr.ap-northeast-2.amazonaws.com/skyline-app-lyjking:1.7')}
        ports:
        - containerPort: 8080
        env:
        - name: DB_HOST
          valueFrom:
            secretKeyRef:
              name: skyline-db-secret
              key: DB_HOST
        - name: DB_PORT
          valueFrom:
            secretKeyRef:
              name: skyline-db-secret
              key: DB_PORT
        - name: DB_NAME
          valueFrom:
            secretKeyRef:
              name: skyline-db-secret
              key: DB_NAME
        - name: DB_USER
          valueFrom:
            secretKeyRef:
              name: skyline-db-secret
              key: DB_USER
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: skyline-db-secret
              key: DB_PASSWORD
        - name: SPRING_PROFILES_ACTIVE
          value: "production"
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 90
          periodSeconds: 30
        readinessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 60
          periodSeconds: 10
"""
    
    service = """
apiVersion: v1
kind: Service
metadata:
  name: skyline-service
  namespace: skyline
spec:
  selector:
    app: skyline
  ports:
  - port: 80
    targetPort: 8080
  type: ClusterIP
"""
    
    ingress = f"""
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: skyline-ingress
  namespace: skyline
  annotations:
    kubernetes.io/ingress.class: alb
    alb.ingress.kubernetes.io/scheme: internet-facing
    alb.ingress.kubernetes.io/target-type: ip
    alb.ingress.kubernetes.io/certificate-arn: arn:aws:acm:ap-northeast-2:646558765106:certificate/your-cert-arn
    alb.ingress.kubernetes.io/listen-ports: '[{{"HTTP": 80}}, {{"HTTPS": 443}}]'
    alb.ingress.kubernetes.io/ssl-redirect: '443'
spec:
  rules:
  - host: {requirements.get('domain', 'www.greenbespinglobal.store')}
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: skyline-service
            port:
              number: 80
"""
    
    return {
        'namespace.yaml': namespace,
        'secret.yaml': secret,
        'deployment.yaml': deployment,
        'service.yaml': service,
        'ingress.yaml': ingress
    }

def create_github_pr(terraform_code, k8s_manifests, event):
    """GitHub PR 생성"""
    # GitHub API를 통한 PR 생성 로직
    # 실제 구현에서는 GitHub API 호출
    pass
