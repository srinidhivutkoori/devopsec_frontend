# Main Terraform configuration for the Collaborative Whiteboard Frontend
# This file defines the AWS provider, VPC, subnets, and internet gateway
# for hosting the React frontend on AWS S3 with static website hosting.

terraform {
  required_version = ">= 1.0.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }
}

# Configure the AWS provider with the specified region
provider "aws" {
  region = var.aws_region
}

# Create a Virtual Private Cloud (VPC) for network isolation
resource "aws_vpc" "whiteboard_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name    = "whiteboard-frontend-vpc"
    Project = "collaborative-whiteboard"
    Student = "SrinidhiVutkoori-X25173243"
  }
}

# Create a public subnet for internet-facing resources
resource "aws_subnet" "public_subnet" {
  vpc_id                  = aws_vpc.whiteboard_vpc.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "${var.aws_region}a"
  map_public_ip_on_launch = true

  tags = {
    Name = "whiteboard-frontend-public-subnet"
  }
}

# Create a private subnet for internal resources
resource "aws_subnet" "private_subnet_a" {
  vpc_id            = aws_vpc.whiteboard_vpc.id
  cidr_block        = "10.0.2.0/24"
  availability_zone = "${var.aws_region}a"

  tags = {
    Name = "whiteboard-frontend-private-subnet-a"
  }
}

# Create a second private subnet in a different AZ for high availability
resource "aws_subnet" "private_subnet_b" {
  vpc_id            = aws_vpc.whiteboard_vpc.id
  cidr_block        = "10.0.3.0/24"
  availability_zone = "${var.aws_region}b"

  tags = {
    Name = "whiteboard-frontend-private-subnet-b"
  }
}

# Create an Internet Gateway for public internet access
resource "aws_internet_gateway" "whiteboard_igw" {
  vpc_id = aws_vpc.whiteboard_vpc.id

  tags = {
    Name = "whiteboard-frontend-igw"
  }
}

# Create a route table for the public subnet
resource "aws_route_table" "public_rt" {
  vpc_id = aws_vpc.whiteboard_vpc.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.whiteboard_igw.id
  }

  tags = {
    Name = "whiteboard-frontend-public-rt"
  }
}

# Associate the public subnet with the route table
resource "aws_route_table_association" "public_rta" {
  subnet_id      = aws_subnet.public_subnet.id
  route_table_id = aws_route_table.public_rt.id
}

# Generate a random suffix for globally unique S3 bucket names
resource "random_id" "bucket_suffix" {
  byte_length = 4
}
