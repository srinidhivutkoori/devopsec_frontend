# Input Variables for the Collaborative Whiteboard Frontend Infrastructure
# These variables allow customization of the AWS deployment settings.

variable "aws_region" {
  description = "The AWS region where resources will be provisioned"
  type        = string
  default     = "eu-west-1"
}

variable "instance_type" {
  description = "The EC2 instance type for the frontend server"
  type        = string
  default     = "t3.micro"
}

variable "ami_id" {
  description = "The Amazon Machine Image ID for the EC2 instance"
  type        = string
  default     = "ami-0c38b837cd80f13bb"
}

variable "key_pair_name" {
  description = "The name of the SSH key pair for EC2 access"
  type        = string
  default     = "whiteboard-frontend-key"
}

variable "db_instance_class" {
  description = "The RDS instance class for the database"
  type        = string
  default     = "db.t3.micro"
}

variable "db_name" {
  description = "The name of the PostgreSQL database"
  type        = string
  default     = "whiteboard_db"
}

variable "db_username" {
  description = "The master username for the database"
  type        = string
  default     = "wbadmin"
  sensitive   = true
}

variable "db_password" {
  description = "The master password for the database"
  type        = string
  default     = "Whiteboard2024!"
  sensitive   = true
}
