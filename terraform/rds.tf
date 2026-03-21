# RDS Configuration for the Collaborative Whiteboard Frontend Infrastructure
# This file provisions a PostgreSQL RDS instance that can be shared
# with the backend application for data storage.

# Subnet group for RDS requiring subnets in multiple availability zones
resource "aws_db_subnet_group" "whiteboard_db_subnet" {
  name       = "whiteboard-frontend-db-subnet-group"
  subnet_ids = [aws_subnet.private_subnet_a.id, aws_subnet.private_subnet_b.id]

  tags = {
    Name = "whiteboard-frontend-db-subnet-group"
  }
}

# Security group for the RDS instance
resource "aws_security_group" "rds_sg" {
  name        = "whiteboard-frontend-rds-sg"
  description = "Security group for the whiteboard RDS instance"
  vpc_id      = aws_vpc.whiteboard_vpc.id

  # Allow PostgreSQL connections from the frontend security group
  ingress {
    description     = "PostgreSQL access from frontend server"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.frontend_sg.id]
  }

  # Allow all outbound traffic
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "whiteboard-frontend-rds-sg"
  }
}

# PostgreSQL RDS instance for the whiteboard application
resource "aws_db_instance" "whiteboard_db" {
  identifier             = "whiteboard-frontend-db"
  engine                 = "postgres"
  engine_version         = "16.9"
  instance_class         = var.db_instance_class
  allocated_storage      = 20
  max_allocated_storage  = 50
  db_name                = var.db_name
  username               = var.db_username
  password               = var.db_password
  db_subnet_group_name   = aws_db_subnet_group.whiteboard_db_subnet.name
  vpc_security_group_ids = [aws_security_group.rds_sg.id]
  skip_final_snapshot    = true
  publicly_accessible    = false
  multi_az               = false
  storage_encrypted      = true

  tags = {
    Name    = "whiteboard-frontend-postgresql-db"
    Project = "collaborative-whiteboard"
    Student = "SrinidhiVutkoori-X25173243"
  }
}
