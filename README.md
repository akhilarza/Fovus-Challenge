# Fovus Coding Challenge 
This project is a full-stack web application developed to fulfill the requirements of the Fovus Challenge. It leverages various AWS services, including S3, DynamoDB, API Gateway, Lambda, EC2, and IAM, as well as ReactJS for the frontend. The primary functionality of the application is to allow users to input text and upload a file, process the inputs, and generate an updated output file.

## Approach
Below is a high-level overview of my implementation for this project: 

### AWS Infrastructure Setup (AWS CDK, Javascript):

1. Created necessary AWS resources such as S3 buckets, DynamoDB tables, API Gateway, Lambda functions, and IAM roles/policies using AWS CDK.
2. Configured appropriate permissions and access controls for each resource.
3. Set up the DynamoDB event trigger to invoke the EC2 instance creation and script execution.


### ReactJS Web UI:

1. Developed a responsive web UI using ReactJS
2. Implemented a text input field and a file input field.
3. Integrated the AWS SDK to access the AWS services through Lambda.
4. Implemented a submit button to send the text input and the uploaded file to S3 and DynamoDB through the API Gateway and Lambda function.


### API Gateway and Lambda Function:

1. Created a Lambda function to handle the API Gateway requests.
2. Used the AWS SDK JavaScript for Lambda.
3. Uploaded the file in the S3 through a presignedURL obtained from the Lambda function
4. Saved the text input and the S3 file path in the DynamoDB table, along with an auto-generated nano id through an API Gateway redirecting to a Lambda function.


### EC2 Instance and Script Execution:

1. Set up an EC2 instance creation based on the DynamoDB event trigger.
2. Uploaded the required script to S3 during the infrastructure setup.
3. Executed the script on the EC2 instance, which performs the following tasks:
4. Retrieves the input text and file path from the DynamoDB table based on the id.
5. Downloads the input file from S3 to the EC2 instance.
6. Appends the retrieved input text to the downloaded input file and saves it as an output file through a script.
7. Uploads the output file to S3.
8. Updates the DynamoDB table with the output file path.
9. Terminated the EC2 instance after the script execution is complete.

## Setting Up the Project
To get started with the project, follow the below instructions:



1. **Clone the Repository:**

   ```bash
   git clone https://github.com/akhilarza/Fovus-Challenge.git
   ```
2. **Setting up AWS Credentials:**
   
   Create an IAM user with the following permissions:

- AmazonAPIGatewayPushToCloudWatchLogs
- AmazonDynamoDBFullAccess
- AmazonEC2ContainerRegistryFullAccess
- AmazonEC2FullAccess
- AmazonElasticContainerRegistryPublicFullAccess
- AmazonS3FullAccess
- AmazonSSMFullAccess
- AWSCloudFormationFullAccess
- IAMFullAccess
- IAMUserChangePassword


Get the access key and secret key from the created IAM user.
Configure the AWS credentials using the aws configure command:
```bash
   aws configure
   ```
This command will prompt you to enter the following information:

AWS Access Key ID: Enter the access key obtained from the IAM user.
AWS Secret Access Key: Enter the secret key obtained from the IAM user.
Default region name: Enter the desired AWS region (e.g., us-east-1).
Default output format: Enter the desired output format (e.g., json).



After following these steps, your AWS credentials will be configured, and you can proceed with running other AWS commands or deploying your application using the configured credentials.

3. **Run the AWS CDK App:**

   ```bash
   cdk deploy
   ```
   
4. **Opening the Repository Folder**

   ```bash
   cd frontend
   ```

5. **Installing all the dependencies needed to run the project**

   ```bash
   npm install
   ```

6. **Running the application**

   ```bash
   npm start
   ```

7. **Opening the localhost:3000**

- The browser should automatically open after the above command, if not, copy and paste the following url in the broswer.
  ```bash
  http://localhost:3000
  ```
   

### References: 
1. https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib-readme.html
2. https://docs.aws.amazon.com/cdk/v2/guide/work-with-cdk-javascript.html
3. https://docs.aws.amazon.com/lambda/latest/dg/typescript-package.html
4. https://hevodata.com/learn/aws-cdk-lambda/
5. https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_temp_use-resources.html
6. https://github.com/awsdocs/aws-doc-sdk-examples/tree/main/javascriptv3/example_code/web/s3
7. https://docs.databricks.com/en/connect/storage/tutorial-s3-instance-profile.html
8. https://docs.aws.amazon.com/code-library/latest/ug/python_3_ec2_code_examples.html
