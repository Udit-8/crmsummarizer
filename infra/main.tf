provider "aws" {
  region = "ap-south-1" # or your preferred region
}

resource "aws_s3_bucket" "example" {
  bucket = "crmsummarizer-demo-bucket-udit88"
  acl    = "private"
}