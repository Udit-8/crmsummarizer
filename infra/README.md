# Infrastructure as Code (IaC) for CRM Summarizer

This directory contains Terraform code to provision and manage cloud infrastructure for the CRM Summarizer project on AWS.

---

## Prerequisites

- [Terraform](https://www.terraform.io/downloads) installed (recommended: use Homebrew on Mac)
- [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) installed
- An AWS account with programmatic access (Access Key ID and Secret Access Key)

---

## Setup Steps

### 1. Install Terraform and AWS CLI

**Terraform (with Homebrew):**
```sh
brew tap hashicorp/tap
brew install hashicorp/tap/terraform
```

**AWS CLI (with Homebrew):**
```sh
brew install awscli
```

### 2. Configure AWS Credentials

Run:
```sh
aws configure
```
Enter your AWS Access Key ID, Secret Access Key, default region (e.g., `us-east-1`), and output format (`json` is fine).

---

## Using Terraform

All commands below should be run from the `infra` directory.

### 1. Initialize Terraform
```sh
terraform init
```
This sets up Terraform and downloads the AWS provider plugin.

### 2. Preview Infrastructure Changes
```sh
terraform plan
```
This shows what Terraform will do (no changes are made yet).

### 3. Apply Infrastructure Changes
```sh
terraform apply
```
This will provision the resources defined in `main.tf`. Type `yes` when prompted.

### 4. Destroy Infrastructure (Cleanup)
```sh
terraform destroy
```
This will remove all resources created by Terraform. Type `yes` to confirm.

---

## Notes
- Edit `main.tf` to define or change AWS resources (e.g., S3 buckets, EC2 instances, databases, etc.).
- Bucket names and some resources must be globally unique—modify as needed.
- For more complex setups, use Terraform modules and variables.
- Always review the plan before applying changes to avoid accidental resource deletion.

--- 