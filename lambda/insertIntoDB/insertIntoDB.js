const AWS = require("aws-sdk");
const docClient = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
  console.log(JSON.parse(event.body));
  const request = JSON.parse(event.body);
  try {
    const params = {
      TableName: "dynamodb-fovus",
      Item: {
        id: request.id,
        input_text: request.input_text,
        input_file_text: request.input_file_text,
      },
    };
    await docClient.put(params).promise();
    return {
      statusCode: 200,
      isBase64Encoded: false,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: "Successfully created item!",
    };
  } catch (err) {
    return { error: err };
  }
};
