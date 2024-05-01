const AWS = require("aws-sdk");
const nanoid = require("nanoid/non-secure");
AWS.config.update({ region: process.env.AWS_REGION });

const s3 = new AWS.S3({
  region: process.env.AWS_REGION,
});
const uploadBucket = "fovus-challenge-sthree-bucket";
const URL_EXPIRATION_SECONDS = 30000;

exports.handler = async (event) => {
  return await getUploadURL(event);
};

const getUploadURL = async function (event) {
  // const randomID = parseInt(Math.random() * 10000000);

  const Key = `${nanoid()}.txt`;

  const s3Params = {
    Bucket: uploadBucket,
    Key,
    Expires: URL_EXPIRATION_SECONDS,
    ContentType: "text",
  };

  return new Promise((resolve, reject) => {
    let uploadURL = s3.getSignedUrl("putObject", s3Params);
    resolve({
      statusCode: 200,
      isBase64Encoded: false,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        uploadURL: uploadURL,
        filename: Key,
      }),
    });
  });
};
