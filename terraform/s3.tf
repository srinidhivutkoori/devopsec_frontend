# S3 Configuration for the Collaborative Whiteboard Frontend
# This file creates an S3 bucket configured for static website hosting
# to serve the React application's production build files.

# S3 bucket for hosting the React frontend application
resource "aws_s3_bucket" "frontend_hosting" {
  bucket = "whiteboard-app-${random_id.bucket_suffix.hex}"

  tags = {
    Name    = "whiteboard-app"
    Project = "collaborative-whiteboard"
    Student = "SrinidhiVutkoori-X25173243"
  }
}

# Configure the S3 bucket for static website hosting
resource "aws_s3_bucket_website_configuration" "frontend_website" {
  bucket = aws_s3_bucket.frontend_hosting.id

  # Serve index.html as the main page
  index_document {
    suffix = "index.html"
  }

  # Redirect all errors to index.html for client-side routing support
  error_document {
    key = "index.html"
  }
}

# Enable versioning for rollback capability
resource "aws_s3_bucket_versioning" "frontend_versioning" {
  bucket = aws_s3_bucket.frontend_hosting.id

  versioning_configuration {
    status = "Enabled"
  }
}

# Allow public read access for the frontend static files
resource "aws_s3_bucket_public_access_block" "frontend_public_access" {
  bucket = aws_s3_bucket.frontend_hosting.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

# Bucket policy to allow public read access to all objects
resource "aws_s3_bucket_policy" "frontend_policy" {
  bucket = aws_s3_bucket.frontend_hosting.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.frontend_hosting.arn}/*"
      }
    ]
  })

  depends_on = [aws_s3_bucket_public_access_block.frontend_public_access]
}

# Server-side encryption for data at rest
resource "aws_s3_bucket_server_side_encryption_configuration" "frontend_encryption" {
  bucket = aws_s3_bucket.frontend_hosting.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}
