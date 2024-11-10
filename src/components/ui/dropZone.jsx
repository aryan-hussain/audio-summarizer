"use client";

import { Button, LinearProgress, Typography, styled } from "@mui/joy";
import {
  CloudUpload,
  Trash2,
  Upload,
  FileAudio,
  FileVideo,
  FileText,
  FilePdf,
  Info,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { DynamoDB, S3 } from "aws-sdk";
import { useRouter } from "next/navigation";

const VisuallyHiddenInput = styled("input")`
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
  height: 1px;
  overflow: hidden;
  position: absolute;
  bottom: 0;
  left: 0;
  white-space: nowrap;
  width: 1px;
`;

export default function DropZone({ showNotification, redirectUrl }) {
  const router = useRouter();

  const s3 = new S3({
    region: "us-east-1",
    accessKeyId: `${process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID}`,
    secretAccessKey: `${process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY}`,
  });

  // Create a DynamoDB service object
  const dynamodb = new DynamoDB({
    region: "us-east-1",
    accessKeyId: `${process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID}`,
    secretAccessKey: `${process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY}`,
  });

  const [files, setFiles] = useState([]);
  const [isDragActive, setIsDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progressValue, setProgressValue] = useState(0);
  const [currentFileNumber, setCurrentFileNumber] = useState(0);

  const handleDragEnter = () => {
    setIsDragActive(true);
  };

  const handleDragLeave = (e) => {
    // Check if the drag leave event is from the container itself
    if (
      e.target === e.currentTarget &&
      e.relatedTarget.id !== "placeHolderText"
    ) {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragActive(false);
    const dropfiles = Array.from(e.dataTransfer.files);
    handleFiles(dropfiles);
  };

  const handleFileSelect = (e) => {
    e.preventDefault();
    const selectedFiles = Array.from(e.target.files);
    handleFiles(selectedFiles);
  };

  const handleFiles = (files) => {
    const allowedFormats = [
      "amr",
      "flac",
      "m4a",
      "mp3",
      "mp4",
      "ogg",
      "webm",
      "wav",
    ];
    const maxSize = 30 * 1024 * 1024; // 15 MB in bytes

    if (files.length > 1) {
      // Handle case where more than one file is selected
      showNotification("danger", "Please select only one file at a time.");
      return;
    }

    const file = files[0];

    // Check if file name contains space
    if (/\s/.test(file.name)) {
      showNotification("danger", "File name cannot contain spaces.");
      return;
    }

    // Check file format
    const fileExtension = file.name.split(".").pop().toLowerCase();
    if (!allowedFormats.includes(fileExtension)) {
      showNotification(
        "danger",
        "File format is not supported. Please select a file with formats: AMR, FLAC, M4A, MP3, MP4, Ogg, WebM, WAV."
      );
      return;
    }

    // Check file size
    if (file.size > maxSize) {
      showNotification("danger", "File size exceeds the limit of 30 MB.");
      return;
    }

    // If all checks pass, set the file
    setFiles([file]);
  };

  const handleRemoveFile = (e) => {
    setFiles([]);
  };

  async function addEntryToDynamoDB(file, location) {
    try {
      const fileName = file.name;
      const fileType = file.type || "application/octet-stream"; // Default to octet-stream if type is undefined
      const fileSize = file.size;

      // Encode fileName as base64 to use as entryId
      const entryId = Buffer.from(fileName).toString("base64");

      // Get current datetime in ISO format
      const currentTime = new Date().toISOString();

      // Determine file type based on MIME type
      let fileTypeNormalized = "";
      if (fileType.startsWith("audio")) {
        fileTypeNormalized = "audio";
      } else if (fileType.startsWith("video")) {
        fileTypeNormalized = "video";
      } else {
        throw new Error("Unsupported file type");
      }

      // Define the item to be added to the table
      const params = {
        TableName: "audio-analyzer-user-data",
        Item: {
          id: { S: entryId },
          name: { S: fileName },
          type: { S: fileTypeNormalized },
          size: { N: fileSize.toString() },
          data: { S: "" }, // This can be adjusted based on your data needs
          status: { S: "Queued" },
          path: { S: `${location}` },
          created_at: { S: currentTime },
          updated_at: { S: currentTime },
        },
      };

      // Put the item into the DynamoDB table
      const response = await dynamodb.putItem(params).promise();

      return response;
    } catch (error) {
      console.error("Error adding entry to DynamoDB:", error);
      throw error; // Handle or rethrow the error as needed
    }
  }

  const handleUpload = async (e) => {
    e.preventDefault();
    setIsUploading(true);

    if (files.length == 0) {
      showNotification(
        "danger",
        "No files found to upload, please select a audio/video file to upload."
      );
      setIsUploading(false);
      return;
    }

    const totalSize = files.reduce((acc, file) => acc + file.size, 0);
    let uploadedBytes = 0;

    try {
      await Promise.all(
        files.map((file, idx) => {
          setCurrentFileNumber(idx + 1);

          const params = {
            Bucket: "audio-summarizer",
            Key: file.name,
            Body: file,
          };

          return s3
            .upload(params)
            .on("httpUploadProgress", (progressData) => {
              uploadedBytes = progressData.loaded;
              const percentUploaded = Math.round(
                (uploadedBytes / totalSize) * 100
              );
              setProgressValue(percentUploaded);
            })
            .promise()
            .then((response) => {
              if (response && response.Location) {
                // Assuming addEntryToDynamoDB returns a promise
                return addEntryToDynamoDB(file, response.Location);
              }
            });
        })
      );

      setFiles([]);
      // Handle success, e.g., show a success message or reset state
      showNotification("success", "Files Uploaded Successfully!");

      if (
        typeof redirectUrl === "string" &&
        redirectUrl &&
        redirectUrl.startsWith("/")
      ) {
        try {
          router.push(redirectUrl);
        } catch {}
      }
    } catch (error) {
      console.error("Upload error:", error);
      // Handle error, e.g., show an error message
      showNotification(
        "danger",
        "Something went wrong while uploading the file, Please try again later!"
      );
    }

    setIsUploading(false);
    setProgressValue(0);
    setCurrentFileNumber(0);
  };

  const getFileIcon = (file) => {
    if (file.type.startsWith("audio/")) {
      return <FileAudio size={40} className="text-blue-500" />;
    } else if (file.type.startsWith("video/")) {
      return <FileVideo size={40} className="text-green-500" />;
    }
    return <FileAudio size={40} className="text-gray-500" />;
  };

  return (
    <>
      <AnimatePresence>
        <motion.div
          className={`flex flex-col justify-center items-center w-full h-64 border-2 rounded-lg p-6 transition-all duration-300 ease-in-out
          ${
            files.length > 0
              ? "border-solid bg-blue-50 border-blue-300"
              : isDragActive
              ? "border-dashed bg-blue-50 border-blue-300"
              : "border-dashed border-primary  hover:border-blue-300 hover:bg-blue-50"
          }`}
          onDragEnter={() => setIsDragActive(true)}
          onDragLeave={() => setIsDragActive(false)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
        >
          {isUploading ? (
            <div className="w-full max-w-md">
              <LinearProgress
                determinate
                variant="outlined"
                color="neutral"
                size="lg"
                thickness={32}
                value={Number(progressValue)}
                sx={{
                  "--LinearProgress-radius": "16px",
                  "--LinearProgress-thickness": "32px",
                }}
              >
                <Typography
                  level="body-sm"
                  fontWeight="bold"
                  textColor="common.white"
                  sx={{ mixBlendMode: "difference" }}
                >
                  Uploading {currentFileNumber}/{files.length} -{" "}
                  {`${Math.round(Number(progressValue))}%`}
                </Typography>
              </LinearProgress>
            </div>
          ) : files.length > 0 ? (
            <motion.div
              className="flex flex-col items-center gap-4"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              {getFileIcon(files[0])}
              <Typography
                level="body-md"
                className="text-center text-gray-700 font-semibold"
              >
                {files[0].name}
              </Typography>
              <div className="flex gap-3">
                <Button
                  variant="solid"
                  color="primary"
                  startDecorator={<Upload size={18} />}
                  onClick={handleUpload}
                  disabled={isUploading}
                  loading={isUploading}
                >
                  Upload
                </Button>
                <Button
                  variant="solid"
                  color="danger"
                  startDecorator={<Trash2 size={18} />}
                  onClick={handleRemoveFile}
                  disabled={isUploading}
                >
                  Remove
                </Button>
              </div>
            </motion.div>
          ) : (
            <div className="flex flex-col items-center gap-4 text-center">
              <CloudUpload
                size={48}
                className={isDragActive ? "text-blue-500" : "text-primary"}
              />
              <Typography
                level="body-lg"
                className={isDragActive ? "text-blue-500" : "text-primary"}
              >
                {isDragActive
                  ? "Drop your file here"
                  : "Drag and drop your audio/video file here"}
              </Typography>
              {!isDragActive && (
                <>
                  <div className="flex items-center gap-2">
                    <hr className="w-16 border-gray-300" />
                    <Typography level="body-sm" className="text-primary">
                      OR
                    </Typography>
                    <hr className="w-16 border-gray-300" />
                  </div>
                  <Button
                    component="label"
                    variant="outlined"
                    color="neutral"
                    startDecorator={<CloudUpload size={18} />}
                    className="text-primary"
                  >
                    Choose File
                    <VisuallyHiddenInput
                      type="file"
                      accept="audio/*, video/*"
                      onChange={handleFileSelect}
                      disabled={isUploading}
                    />
                  </Button>
                </>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
      <div className="flex-col gap-5 mt-4 ">
        <Typography
          level="body-sm"
          startDecorator={<Info size={16} />}
          className="text-gray-600 "
        >
          Max file size supported: 30 MB
        </Typography>
        <Typography level="body-sm" className="text-gray-600">
          Supported formats: mp3, mp4, wav, flac, ogg, amr, webm, m4a
        </Typography>
      </div>
    </>
  );
}
