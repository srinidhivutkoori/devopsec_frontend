# EC2 Configuration for the Collaborative Whiteboard Frontend
# While the frontend is primarily hosted on S3, this EC2 instance
# can serve as a reverse proxy or fallback server if needed.

# Security group for the frontend EC2 instance
resource "aws_security_group" "frontend_sg" {
  name        = "whiteboard-frontend-sg"
  description = "Security group for the whiteboard frontend server"
  vpc_id      = aws_vpc.whiteboard_vpc.id

  # Allow SSH access for management
  ingress {
    description = "SSH access"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Allow HTTP traffic on port 80
  ingress {
    description = "HTTP access"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Allow HTTPS traffic on port 443
  ingress {
    description = "HTTPS access"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Allow all outbound traffic
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "whiteboard-frontend-sg"
  }
}

# EC2 instance that can serve as a reverse proxy for the frontend
resource "aws_instance" "frontend_server" {
  ami                    = var.ami_id
  instance_type          = var.instance_type
  subnet_id              = aws_subnet.public_subnet.id
  vpc_security_group_ids = [aws_security_group.frontend_sg.id]
  key_name               = var.key_pair_name

  # User data script to install Nginx as a reverse proxy
  user_data = <<-EOF
              #!/bin/bash
              # Update system packages
              sudo apt-get update -y
              sudo apt-get upgrade -y
              # Install Nginx web server
              sudo apt-get install -y nginx
              # Enable and start Nginx service
              sudo systemctl enable nginx
              sudo systemctl start nginx
              EOF

  tags = {
    Name    = "whiteboard-frontend-server"
    Project = "collaborative-whiteboard"
    Student = "SrinidhiVutkoori-X25173243"
  }
}

# Elastic IP for the frontend EC2 instance
# Provides a static public IP address that persists across instance stop/start cycles
resource "aws_eip" "frontend_eip" {
  instance = aws_instance.frontend_server.id
  domain   = "vpc"

  tags = {
    Name    = "whiteboard-frontend-eip"
    Project = "collaborative-whiteboard"
  }

  depends_on = [aws_internet_gateway.whiteboard_igw]
}
