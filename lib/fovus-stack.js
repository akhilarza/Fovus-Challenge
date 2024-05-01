const { Stack, Duration } = require('aws-cdk-lib');
// const sqs = require('aws-cdk-lib/aws-sqs');
const lambda = require("aws-cdk-lib/aws-lambda");
const {
  HttpLambdaIntegration,
} = require("aws-cdk-lib/aws-apigatewayv2-integrations");
const apigatewayv2 = require("aws-cdk-lib/aws-apigatewayv2");
const apigateway = require("aws-cdk-lib/aws-apigateway");
const s3 = require("aws-cdk-lib/aws-s3");
const { RemovalPolicy } = require("aws-cdk-lib");
const dynamoDB = require("aws-cdk-lib/aws-dynamodb");
const iam = require("aws-cdk-lib/aws-iam");
const { DynamoEventSource } = require("aws-cdk-lib/aws-lambda-event-sources");
const { Authorization } = require("aws-cdk-lib/aws-events");

class FovusStack extends Stack {
  /**
   *
   * @param {Construct} scope
   * @param {string} id
   * @param {StackProps=} props
   */
  constructor(scope, id, props) {
    super(scope, id, props);

    // The code that defines your stack goes here

    // example resource
    // const queue = new sqs.Queue(this, 'FovusQueue', {
    //   visibilityTimeout: Duration.seconds(300)
    // });




    //creating s3 bucket

    const S3BucketName = "fovus-challenge-sthree-bucket"
    const corsRule = (s3.CorsRule = [
      {
        allowedMethods: [
          s3.HttpMethods.GET,
          s3.HttpMethods.PUT,
          s3.HttpMethods.POST,
        ],
        allowedOrigins: ["*"],
      },
    ]);

    const S3Bucket = new s3.Bucket(this, "S3Bucket", {
      bucketName: S3BucketName,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      cors: corsRule,
      removal_policy: RemovalPolicy.RETAIN,
    });

    // creating lambda function
    var resource = `arn:aws:s3:::${S3BucketName}/*`
    const signedPolicy = new iam.PolicyStatement({
      actions: ["s3:PutObject"],
      effect: iam.Effect.ALLOW,
      resources: [resource],
    });
    const getSignedURLLambda = new lambda.Function(this, "getSignedURL", {
      functionName: "getSignedURL",
      runtime: lambda.Runtime.NODEJS_16_X,
      // code: lambda.Code.fromAsset("lambda"),

      code: lambda.Code.fromAsset("lambda/getPreSignedURL/index.zip"),
      handler: "index.handler",
      initialPolicy: [signedPolicy],
    });

    //creating API for lambda function

    const signedURLAPI = new apigateway.LambdaRestApi(
      this,
      "getPreSignedURLApi",
      {
        restApiName: "getPreSignedURLApi",
        handler: getSignedURLLambda,
        deploy: true,
        proxy: false,
        deployOptions: {
          stageName: "dev",
        },
      }
    );
    const urllambdaIntegration = new apigateway.LambdaIntegration(
      getSignedURLLambda
    );

    const urlResource = signedURLAPI.root.addResource("url");
    signedURLAPI.root.addCorsPreflight({
      allowOrigins: ["*"],
      allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowHeaders: [
        "Content-Type",
        "Authorization",
        "X-Amz-Date",
        "X-Api-Key",
        "X-Amz-Security-Token",
        "X-Amz-User-Agent",
      ],
      allowCredentials: true,
    });
    urlResource.addMethod("GET", urllambdaIntegration, {
      // authorizationType: apigateway.AuthorizationType.NONE,
    });

    //creating dyamoDB
    const DynamoDB = new dynamoDB.Table(this, "dynamodb", {
      tableName: "dynamodb-fovus",
      partitionKey: {
        name: "id",
        type: dynamoDB.AttributeType.STRING,
      },
      stream: dynamoDB.StreamViewType.NEW_AND_OLD_IMAGES,
      removal_policy: RemovalPolicy.RETAIN,
    });

    // creating Lambda function and attaching the required policies

    const insertDBRole = new iam.Role(this, "InsertDBRole", {
      roleName: "insertDBRole",
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
    });
    insertDBRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        "AmazonAPIGatewayInvokeFullAccess"
      )
    );
    insertDBRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName("CloudWatchLogsFullAccess")
    );

    insertDBRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonDynamoDBFullAccess")
    );

    const InsertIntoDBLambda = new lambda.Function(this, "insertIntoDBLambda", {
      functionName: "insertIntoDBLambda",
      runtime: lambda.Runtime.NODEJS_16_X,
      code: lambda.Code.fromAsset("lambda/insertIntoDB"),
      handler: "insertIntoDB.handler",
      role: insertDBRole,
    });

    //creating API for insert lambda function

    // const InsertIntoDBAPI = new apigateway.LambdaRestApi(
    //   this,
    //   "insertIntoDBAPI",
    //   {
    //     restApiName: "insertIntoDBAPI",
    //     handler: InsertIntoDBLambda,
    //     proxy: false,
    //     defaultCorsPreflightOptions: {
    //       allowOrigins: apigateway.Cors.ALL_ORIGINS,
    //       allowMethods: apigateway.Cors.ALL_METHODS,
    //     },
    //   }
    // );

    // const dbResource = InsertIntoDBAPI.root.addResource("put");
    // dbResource.addMethod("PUT");

    const InsertIntoDBAPI = new apigateway.LambdaRestApi(
      this,
      "insertIntoDBAPI",
      {
        restApiName: "InsertIntoDBAPI",
        handler: InsertIntoDBLambda,
        deploy: true,
        proxy: false,
        deployOptions: {
          stageName: "dev",
        },
        defaultCorsPreflightOptions: {
          allowHeaders: ["*"],
          allowOrigins: ["*"],
          allowMethods: apigateway.Cors.ALL_METHODS,
        },
      }
    );
    const insertIntoDBAPIIntegration = new apigateway.LambdaIntegration(
      InsertIntoDBLambda
    );

    const insertIntoDBAPIResource = InsertIntoDBAPI.root.addResource("insert");
    // InsertIntoDBAPI.root.addCorsPreflight({
    //   allowOrigins: ["*"],
    //   allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    //   allowHeaders: ['*'],
    //   allowCredentials: true,
    // });
    insertIntoDBAPIResource.addMethod("PUT", insertIntoDBAPIIntegration, {
      // authorizationType: apigateway.AuthorizationType.NONE,
    });

    // creating role for EC2 to access s3

    const ec2ToAccessS3Policy = new iam.PolicyStatement({
      name: "ec2ToAccessS3Policy",
      actions: ["sns:*", "s3:*"],
      effect: iam.Effect.ALLOW,
      resources: ["*"],
    });

    const role = new iam.Role(this, "EC2Role", {
      roleName: "ec2AccessS3",
      assumedBy: new iam.ServicePrincipal("ec2.amazonaws.com"),
    });
    role.addToPolicy(ec2ToAccessS3Policy);
    role.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonDynamoDBFullAccess")
    );

    const ec2RoleARN = role.roleArn;
    const instanceProfile = new iam.InstanceProfile(
      this,
      "EC2InstanceProfile",
      {
        instanceProfileName: "ec2AccessS3-profile", // Give it a name
        role: role,
      }
    );

    //creating lambda function for creating EC2 instance

    const lambdaToEC2Policy = new iam.PolicyStatement({
      name: "lambdaToEC2Policy",
      actions: [
        "sns:*",
        "logs:CreateLogStream",
        "ec2:*",
        "s3:*",
        "logs:CreateLogGroup",
        "logs:PutLogEvents",
      ],
      effect: iam.Effect.ALLOW,
      resources: ["*"],
    });
    const lambdaPassRoleToEC2Policy = new iam.PolicyStatement({
      name: "lambdaPassRoleToEC2Policy",
      actions: ["iam:PassRole"], // Corrected syntax
      effect: iam.Effect.ALLOW,
      resources: [ec2RoleARN],
    });

    console.log(ec2RoleARN);

    const LambdaEc2Role = new iam.Role(this, "LambdaEc2Role", {
      roleName: "lambdaEc2Role",
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
    });
    LambdaEc2Role.addToPolicy(lambdaToEC2Policy);
    LambdaEc2Role.addToPolicy(lambdaPassRoleToEC2Policy);
    LambdaEc2Role.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonDynamoDBFullAccess")
    );
    LambdaEc2Role.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName("CloudWatchLogsFullAccess")
    );
    LambdaEc2Role.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName("IAMFullAccess")
    );
    

    const CreateEC2InstanceLambda = new lambda.Function(
      this,
      "createEC2InstanceLambda",
      {
        functionName: "createEC2InstanceLambda",
        runtime: lambda.Runtime.NODEJS_16_X,
        code: lambda.Code.fromAsset("lambda/createEC2Instance/index.zip"),
        handler: "index.handler",
        role: LambdaEc2Role,

        environment: {
          AMI: "ami-080e449218d4434fa",
          KEY_NAME: "fovus",
          INSTANCE_TYPE: "t2.micro",
        },
      }
    );

    // create trigger from lamda to dynamodb

    CreateEC2InstanceLambda.addEventSource(
      new DynamoEventSource(DynamoDB, {
        startingPosition: lambda.StartingPosition.LATEST,
      })
    );
  }
}

module.exports = { FovusStack }
