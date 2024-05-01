const AWS = require("aws-sdk");
const region = process.env.AWS_REGION;
AWS.config.update({ region: process.env.AWS_REGION });
const nanoid = require("nanoid/non-secure");
const ec2 = new AWS.EC2();

const INSTANCE_TYPE = process.env.INSTANCE_TYPE;
const KEY_NAME = process.env.KEY_NAME;
const AMI = process.env.AMI;

const iam = new AWS.IAM();

async function getInstanceProfileByName(profileName) {
  const params = {};
  const data = await iam.listInstanceProfiles(params).promise();

  for (const profile of data.InstanceProfiles) {
    if (profile.InstanceProfileName === profileName) {
      return profile.Arn;
    }
  }

  return null;
}

exports.handler = async (event, context) => {
  try {
    const inputText = event.Records[0].dynamodb.NewImage.input_text.S;
    const inputFileText = event.Records[0].dynamodb.NewImage.input_file_text.S;
    const inputFileName = inputFileText.split("/")[1];

    const key = nanoid();
    const dynamodbKey = nanoid();

    const jsonData = {
      id: { S: dynamodbKey },
      input_file_text: { S: `fovus-sthree-bucket/${key}.txt` },
    };
    const jsonText = JSON.stringify(jsonData);

    const arn = await getInstanceProfileByName("ec2AccessS3-profile");
    console.log("profile", arn);

    const userDataScript = `
            #!/bin/bash
            aws s3 cp s3://fovus-sthree-bucket//script.py .
            aws s3 cp s3://${inputFileText} .
            chmod +rwx ./script.py
            chmod 701 ./${inputFileName}
            chmod +rwx ./${inputFileName}
            python ./script.py ${inputText} ./${inputFileName}
            aws s3 cp ./${inputFileName} s3://fovus-sthree-bucket//${key}.txt
            aws dynamodb put-item --table-name dynamodb-fovus --item '${jsonText}' --region ${region}
            shutdown now -h
        `;
    const userDataBase64 = Buffer.from(userDataScript).toString("base64");

    const instanceParams = {
      InstanceType: INSTANCE_TYPE,
      KeyName: KEY_NAME,
      ImageId: AMI,
      MaxCount: 1,
      MinCount: 1,
      TagSpecifications: [
        {
          ResourceType: "instance",
          Tags: [{ Key: "Name", Value: "Fovus-instance" }],
        },
      ],
      IamInstanceProfile: {
        Arn: arn,
      },
      InstanceInitiatedShutdownBehavior: "terminate",
      UserData: userDataBase64,
    };

    const instance = await ec2.runInstances(instanceParams).promise();
    console.log("New instance created:", instance);

    return {
      statusCode: 200,
      body: "Instance creation initiated",
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: "Error creating instance",
    };
  }
};
