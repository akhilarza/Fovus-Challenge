import "./App.css";
import { useState } from "react";
import axios from "axios";
import { nanoid } from "nanoid";

function App() {
  const [name, setName] = useState();
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileChange = (event) => {
    console.log(event.target.files[0]);
    setSelectedFile(event.target.files[0]);
  };

  const API_ENDPOINT =
    "";

  const DYNAMODB_ENDPOINT =
    "";

  const getPresignedUrl = async () => {
    console.log("getpresigned");
    try {
      console.log("inside try");
      const response = await axios({
        method: "GET",
        url: API_ENDPOINT+'url',
      });
      console.log("Response: ", response);
      console.log("Response.data: ", response.data);

      return response.data;
    } catch (error) {
      console.error("Error in getPresignedUrl:", error);
      throw error;
    }
  };

  const uploadToPresignedUrl = async (presignedUrl) => {
    console.log("inside upload");
    // let formData = new FormData();
    // formData.append("file", selectedFile);
    const uploadResponse = await axios.put(presignedUrl, selectedFile, {});
    console.log(uploadResponse);
  };

  const uploadToDynamoDB = async (filename) => {
    const data = {
      id: nanoid(),
      input_text: name,
      input_file_text: "fovus-challenge-sthree-bucket/" + filename,
    };
    const response = await axios.put(DYNAMODB_ENDPOINT + "insert", data);
    console.log("DYNAMO", response);
  };

  const handleUpload = async () => {
    console.log("Upload");
    try {
      if (!selectedFile) {
        console.error("No file selected.");
        return;
      }
      const response = await getPresignedUrl();
      console.log("response", response);

      await uploadToPresignedUrl(response.uploadURL);
      const filename = response.filename;
      await uploadToDynamoDB(filename);
    } catch (error) {
      console.log("Error uploading file:", error);
    }
    setName("")
    setSelectedFile(null)
  };

  return (
    <>
      {/* <label>
        Text :
        <input value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <label>
        File:
        <input type="file" onChange={handleFileChange} />
      </label>

      <button onClick={handleUpload}>Submit</button> */}
      <>
        <h2>FOVUS CODING CHALLENGE</h2>
        <div className="input-group">
          <label htmlFor="textInput" className="labels">
            Text Input:
          </label>
          <input
            type="text"
            id="textInput"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="input-group">
          <label htmlFor="fileInput" className="labels">
            File Input:
          </label>
          <input type="file" id="fileInput" onChange={handleFileChange} />
        </div>

        <button class="button" onClick={handleUpload}>
          Submit
        </button>
      </>
    </>
  );
}

export default App;
