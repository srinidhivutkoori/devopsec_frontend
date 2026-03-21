# Output Values for the Collaborative Whiteboard Frontend Infrastructure
# These outputs display important information after terraform apply,
# including the S3 website URL and EC2 server details.

# The public IP of the frontend EC2 instance
output "frontend_server_public_ip" {
  description = "The public IP address of the frontend EC2 server (Elastic IP)"
  value       = aws_eip.frontend_eip.public_ip
}

# The public DNS of the frontend EC2 instance
output "frontend_server_public_dns" {
  description = "The public DNS name of the frontend EC2 server"
  value       = aws_instance.frontend_server.public_dns
}

# The S3 static website hosting URL
output "frontend_website_url" {
  description = "The URL of the frontend application hosted on S3"
  value       = aws_s3_bucket_website_configuration.frontend_website.website_endpoint
}

# The S3 bucket name for the frontend
output "frontend_s3_bucket" {
  description = "The name of the S3 bucket hosting the frontend"
  value       = aws_s3_bucket.frontend_hosting.bucket
}

# The RDS endpoint
output "rds_endpoint" {
  description = "The connection endpoint for the PostgreSQL RDS instance"
  value       = aws_db_instance.whiteboard_db.endpoint
}

# The RDS database name
output "rds_database_name" {
  description = "The name of the PostgreSQL database"
  value       = aws_db_instance.whiteboard_db.db_name
}
