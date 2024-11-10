"use client";

import Notification from "@/components/ui/notifications";
import {
  Alert,
  Button,
  Card,
  CardContent,
  Checkbox,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Modal,
  ModalDialog,
  Sheet,
  Skeleton,
  Table,
  Tooltip,
  Typography,
} from "@mui/joy";
import {
  ArrowLeft,
  Ban,
  Captions,
  CheckCheck,
  Clock,
  Eye,
  FileAudio,
  FileCog,
  FileVideo2,
  Meh,
  RotateCcw,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  TriangleAlert,
  Upload,
  Workflow,
} from "lucide-react";
import style from "./page.module.scss";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import DropZone from "@/components/ui/dropZone";
import { API_URL } from "@/config";
import { redirect, useRouter } from "next/navigation";
import { formatDuration, truncateFilename } from "@/lib/helper";

function createData(
  id,
  name,
  size,
  type,
  status,
  data,
  created_at,
  updated_at
) {
  let fileData = {};
  try {
    fileData = JSON.parse(data);
  } catch {}
  return { id, name, size, type, status, fileData, created_at, updated_at };
}

function getAlertChip(status) {
  if (status === "Queued") {
    return (
      <Alert
        size="sm"
        className="w-[120px] font-medium"
        color="neutral"
        variant="soft"
        startDecorator={<Clock size={20} />}
      >
        <Typography className="font-bold" color="neutral">
          {status}
        </Typography>
      </Alert>
    );
  } else if (status === "Processing") {
    return (
      <Alert
        size="sm"
        className="w-[120px] font-medium"
        color="warning"
        variant="soft"
        startDecorator={<Workflow size={20} />}
      >
        <Typography className="font-bold" color="warning">
          {status}
        </Typography>
      </Alert>
    );
  } else if (status === "Processed") {
    return (
      <Alert
        size="sm"
        className="w-[120px] font-medium"
        color="success"
        variant="soft"
        startDecorator={<CheckCheck size={20} />}
      >
        <Typography className="font-bold" color="success">
          {status}
        </Typography>
      </Alert>
    );
  } else {
    return (
      <Alert
        size="sm"
        className="w-[120px] font-medium"
        color="danger"
        variant="soft"
        startDecorator={<Ban size={20} />}
      >
        <Typography className="font-bold" color="danger">
          {status}
        </Typography>
      </Alert>
    );
  }
}

function getAlertSentiments(status) {
  if (status === "Negative") {
    return (
      <Alert
        size="sm"
        className="w-[120px] font-medium"
        color="danger"
        variant="soft"
        startDecorator={<ThumbsDown size={20} />}
      >
        <Typography className="font-bold" color="neutral">
          {status}
        </Typography>
      </Alert>
    );
  } else if (status === "Neutral") {
    return (
      <Alert
        size="sm"
        className="w-[120px] font-medium"
        color="warning"
        variant="soft"
        startDecorator={<Meh size={20} />}
      >
        <Typography className="font-bold" color="warning">
          {status}
        </Typography>
      </Alert>
    );
  } else if (status === "Positive") {
    return (
      <Alert
        size="sm"
        className="w-[120px] font-medium"
        color="success"
        variant="soft"
        startDecorator={<ThumbsUp size={20} />}
      >
        <Typography className="font-bold" color="success">
          {status}
        </Typography>
      </Alert>
    );
  } else {
    return (
      <Alert
        size="sm"
        className="w-[120px] font-medium"
        color="danger"
        variant="soft"
        // startDecorator={<Ban size={20} />}
      >
        <Typography className="font-bold" color="danger">
          {status}
        </Typography>
      </Alert>
    );
  }
}

function formatBytes(bytes) {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return (bytes / Math.pow(k, i)).toFixed(2) + " " + sizes[i];
}

const formatLocalDate = (isoDate) => {
  const date = new Date(isoDate);

  // Get month name
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const month = monthNames[date.getMonth()];

  // Get day of the month
  const day = date.getDate();

  // Get year
  const year = date.getFullYear();

  // Get hours (12-hour format)
  let hours = date.getHours();
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12; // Handle midnight (0 hours)

  // Get minutes
  const minutes = date.getMinutes().toString().padStart(2, "0");

  // Construct the formatted date string
  const formattedDate = `${month} ${day}, ${year} ${hours}:${minutes} ${ampm}`;

  return formattedDate;
};

const formatServerDate = (isoDate) => {
  const date = new Date(isoDate);

  // Convert UTC date to local date
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);

  // Get month name
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const month = monthNames[localDate.getMonth()];

  // Get day of the month
  const day = localDate.getDate();

  // Get year
  const year = localDate.getFullYear();

  // Get hours (12-hour format)
  let hours = localDate.getHours();
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12; // Handle midnight (0 hours)

  // Get minutes
  const minutes = localDate.getMinutes().toString().padStart(2, "0");

  // Construct the formatted date string
  const formattedDate = `${month} ${day}, ${year} ${hours}:${minutes} ${ampm}`;

  return formattedDate;
};

function getEmoji(emotion) {
  if (emotion) {
    switch (emotion.toLowerCase()) {
      case "positive":
        return "😊"; // Smiling face emoji
      case "negative":
        return "😔"; // Pensive face emoji
      case "neutral":
        return "😐"; // Neutral face emoji
      case "concerned":
        return "😟"; // Worried face emoji
      case "hopeful":
        return "🌟"; // Star emoji for hopeful
      case "sad":
        return "😢"; // Sad face emoji
      case "angry":
        return "😡"; // Angry face emoji
      case "happy":
        return "😄"; // Grinning face with smiling eyes emoji
      case "surprised":
        return "😮"; // Face with open mouth emoji
      case "confused":
        return "😕"; // Confused face emoji
      case "excited":
        return "🤩"; // Star-struck emoji
      case "love":
        return "😍"; // Smiling face with heart-eyes emoji
      default:
        return "❓"; // Question mark emoji for unknown emotions
    }
  }

  return "";
}

function toTitleCase(text) {
  if (text) {
    return text.replace(/\w\S*/g, function (txt) {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
  }

  return "";
}

function formatTranscript(transcript) {
  if (transcript) {
    // Split the text by speaker identifiers followed by a space
    const lines = transcript.split(/(spk_\d+:)/);

    // Initialize variable to store formatted transcript
    let formattedTranscript = "";

    // Iterate through lines and format into paragraphs
    for (let i = 0; i < lines.length; i++) {
      // Remove empty strings and trim whitespace
      const line = lines[i].trim();

      // Skip empty lines
      if (line === "") continue;

      // Append speaker identifier with formatting
      if (line.startsWith("spk_")) {
        formattedTranscript += `<strong>${line}</strong>`;
      } else {
        // Append speaker's dialogue with formatting
        formattedTranscript += ` ${line}<br /><br />`;
      }
    }

    return formattedTranscript.trim(); // Trim any leading/trailing whitespace
  }

  return "";
}

export default function Home() {
  const router = useRouter();

  const [open, setOpen] = useState(false);

  const [initalFetch, setInitialFetch] = useState(true);
  const [refreshFetch, setRefreshFetch] = useState(false);
  const [tableRows, setTableRows] = useState([]);

  const [openDataModal, setOpenDataModal] = useState(false);
  const [fileData, setFileData] = useState({});

  const [notifyOpen, setNotifyOpen] = useState(false);
  const [notifyMessage, setNotifyMessage] = useState("");
  const [notifyColor, setNotifyColor] = useState("neutral");
  const [searchTerm, setSearchTerm] = useState("");
  const [openDropZoneModal, setOpenDropZoneModal] = useState(false);

  const filteredRows = tableRows.filter((row) =>
    row?.name?.toLowerCase().includes(searchTerm?.toLowerCase())
  );

  console.log(filteredRows, "filteredRows zz");
  console.log(tableRows, "tableRows zz");

  useEffect(() => {
    if (notifyOpen) {
      const timer = setTimeout(() => {
        setNotifyOpen(false);
      }, 3000);

      // Clean up the timer
      return () => clearTimeout(timer);
    }
  }, [notifyOpen]);

  const showNotification = (type, message) => {
    setNotifyOpen(false);
    setNotifyMessage(message);
    setNotifyColor(type);
    setNotifyOpen(true);
  };

  const fetchFiles = useCallback(async (e) => {
    try {
      const response = await fetch(`${API_URL}/file/list`, {
        method: "GET",
      });

      const jsonResponse = await response.json();
      const data = jsonResponse?.data;

      if (data.length > 0) {
        // Sort the data by updated_at in descending order
        data.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));

        const rows = data.map((userFile) =>
          createData(
            userFile?.id,
            userFile?.name,
            formatBytes(userFile?.size),
            userFile.type,
            userFile?.status,
            userFile?.data,
            formatLocalDate(userFile?.created_at),
            formatServerDate(userFile?.updated_at)
          )
        );
        setTableRows(rows); // Update file table rows state
      } else {
        setTableRows([]); // No files found, set empty array
      }

      showNotification("success", `Files Fetched Successfully!`);
    } catch (error) {
      showNotification("danger", `Error fetching files: ${error}`);
    } finally {
      setInitialFetch(false);
    }
  }, []);

  useEffect(
    (e) => {
      if (initalFetch) {
        fetchFiles();
      }
    },
    [initalFetch, fetchFiles]
  );

  const handleRefresh = (e) => {
    e.preventDefault();
    setRefreshFetch(true);
    fetchFiles();
    setRefreshFetch(false);
  };

  const fileObject = (id, list) => {
    return list.find((obj) => obj.id === id);
  };

  const handelShowData = (e) => {
    e.preventDefault();

    const file = fileObject(e.target.value, tableRows);

    setFileData(file?.fileData);
    setOpenDataModal(true);
  };

  return (
    <>
      <Notification
        open={notifyOpen}
        message={notifyMessage}
        color={notifyColor}
      />
      <main className="h-screen w-screen overflow-x-hidden flex flex-col px-2 lg:px-10 pt-3 pb-5 gap-5">
        <div className="flex flex-col lg:flex-row w-full mb-2">
          <Image src={"/crossml.svg"} width={150} height={150} alt={"Logo"} />
          <div className="flex justify-center w-full">
            <Typography level="h1" className="text-primary">
              AI Powered Virtual Bot and Post Call Analysis
            </Typography>
          </div>
        </div>
        <div className="flex flex-row">
          <Link href="/">
            <Typography
              level="title-sm"
              className="font-bold text-black no-underline"
              startDecorator={<ArrowLeft />}
            >
              Back to Home
            </Typography>
          </Link>
        </div>
        <div className="flex flex-row-reverse justify-between gap-4 h-fit mb-5">
          {/* <Typography level="h2" className="text-primary hidden">
            Audio/ Videos Files
          </Typography> */}

          <Button
            variant="outlined"
            color="primary"
            className="self-start"
            startDecorator={<Upload />}
            onClick={() => setOpenDropZoneModal(true)}
          >
            Upload New File
          </Button>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-center mb-4">
            <Typography level="h3" className="text-primary">
              Uploaded Files
            </Typography>
            <div className="flex items-center">
              <input
                type="text"
                placeholder="Search files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mr-4 p-2 border rounded"
              />
              <Tooltip arrow title="Refresh" variant="plain" placement="top">
                <IconButton
                  variant="outlined"
                  color="primary"
                  disabled={refreshFetch}
                  loading={refreshFetch}
                  onClick={handleRefresh}
                >
                  <RotateCcw size={20} />
                </IconButton>
              </Tooltip>
            </div>
          </div>

          <Sheet className="overflow-auto max-h-[60vh] w-full">
            <Table stickyHeader hoverRow>
              <thead>
                <tr>
                  <th className="min-w-fit w-[60px]">Sr No</th>
                  <th className="min-w-fit w-[300px] lg:w-[350px]">
                    File name
                  </th>
                  <th className="min-w-fit w-[150px]">Total Duration</th>
                  <th className="min-w-fit w-[200px]">Date Uploaded</th>
                  <th className="min-w-fit w-[200px]">Status</th>
                  <th className="min-w-fit w-[200px]">Agent Sentiment</th>
                  <th className="min-w-fit w-[200px]">Customer Sentiment</th>
                  <th className="min-w-fit w-[100px]">PII</th>
                  <th className="min-w-fit w-[200px]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {initalFetch ? (
                  <tr>
                    <td>
                      <Typography className="font-semibold">
                        <Skeleton>2024</Skeleton>
                      </Typography>
                    </td>
                    <td>
                      <Typography className="gap-2 items-center">
                        <span className="flex flex-col justify-center">
                          <Typography className="font-bold">
                            <Skeleton>new_skeleton_audio.mp3</Skeleton>
                          </Typography>
                          <Typography className="font-medium">
                            <Skeleton>{"200 KB"}</Skeleton>
                          </Typography>
                        </span>
                      </Typography>
                    </td>
                    <td>
                      <Typography className="font-semibold">
                        <Skeleton>June 1, 2024</Skeleton>
                      </Typography>
                    </td>
                    <td>
                      <Typography className="font-semibold">
                        <Skeleton>June 1, 2024</Skeleton>
                      </Typography>
                    </td>
                    <td>
                      <Typography className="font-semibold">
                        <Skeleton>June 1, 2024</Skeleton>
                      </Typography>
                    </td>
                    <td>
                      <Typography className="font-semibold">
                        <Skeleton>June 1, 2024</Skeleton>
                      </Typography>
                    </td>
                    <td>
                      <Typography className="font-semibold">
                        <Skeleton>June 1, 2024</Skeleton>
                      </Typography>
                    </td>
                    <td>
                      <Typography className="font-semibold">
                        <Skeleton>June 1, 2024</Skeleton>
                      </Typography>
                    </td>
                    <td>
                      <Typography className="font-semibold">
                        <Skeleton>June 1, 2024</Skeleton>
                      </Typography>
                    </td>
                  </tr>
                ) : filteredRows.length === 0 ? (
                  <td
                    className="p-4 border-b border-blue-gray-50 item-center"
                    colSpan={9}
                  >
                    <Typography
                      level="small"
                      color="gray"
                      className="font-normal text-center"
                    >
                      {"No Records Found"}
                    </Typography>
                  </td>
                ) : (
                  filteredRows.map((row, index) => (
                    <tr key={row?.id}>
                      <td>
                        <Typography className="font-bold">
                          {index + 1}
                        </Typography>
                      </td>
                      <td>
                        <Typography
                          startDecorator={
                            row?.type &&
                            typeof row?.type === "string" &&
                            row?.type != "" ? (
                              (() => {
                                switch (row.type.toLowerCase()) {
                                  case "audio":
                                    return (
                                      <FileAudio
                                        size={40}
                                        className="border p-2 rounded-lg text-blue-500"
                                      />
                                    );
                                  case "video":
                                    return (
                                      <FileVideo2
                                        size={40}
                                        className="border p-2 rounded-lg text-green-500"
                                      />
                                    );
                                  default:
                                    return (
                                      <FileCog
                                        size={40}
                                        className="border p-2 rounded-lg text-gray-500"
                                      />
                                    );
                                }
                              })()
                            ) : (
                              <FileCog
                                size={40}
                                className="border p-2 rounded-lg"
                              />
                            )
                          }
                          className="gap-2 items-center"
                        >
                          <span className="flex flex-col justify-center">
                            <Tooltip title={row?.name} placement="top">
                              <Typography className="font-bold break-all">
                                {truncateFilename(row?.name, 40)}
                              </Typography>
                            </Tooltip>
                            <Typography className="font-medium">
                              {row?.size}
                            </Typography>
                          </span>
                        </Typography>
                      </td>
                      <td>
                        <Typography className="">
                          {formatDuration(
                            row?.fileData?.analytics?.talkTime
                              ?.total_talk_time || 0
                          )}
                        </Typography>
                      </td>

                      <td>
                        <Typography className="">{row?.created_at}</Typography>
                      </td>
                      <td>{getAlertChip(row?.status)}</td>
                      <td>
                        <Typography className="">
                          {row?.fileData && row?.fileData?.analytics?.sentiments
                            ? row.fileData?.analytics?.sentiments?.agent < 0
                              ? getAlertSentiments("Negative")
                              : row.fileData.analytics.sentiments.agent >= 0 &&
                                row.fileData.analytics.sentiments.agent <= 2
                              ? getAlertSentiments("Neutral")
                              : row.fileData.analytics.sentiments.agent > 2
                              ? getAlertSentiments("Positive")
                              : getAlertSentiments("N/A")
                            : getAlertSentiments("N/A")}
                        </Typography>
                      </td>
                      <td>
                        <Typography className="">
                          {row?.fileData && row.fileData?.analytics?.sentiments
                            ? row.fileData?.analytics?.sentiments?.customer < 0
                              ? getAlertSentiments("Negative")
                              : row.fileData.analytics.sentiments.customer >=
                                  0 &&
                                row.fileData.analytics.sentiments.customer <= 2
                              ? getAlertSentiments("Neutral")
                              : row.fileData.analytics.sentiments.customer > 2
                              ? getAlertSentiments("Positive")
                              : getAlertSentiments("N/A")
                            : getAlertSentiments("N/A")}
                        </Typography>
                      </td>
                      
                      <td className={`${style.checkContainer}`}>
                        <Typography className="">
                          {row?.fileData &&
                          row.fileData?.analytics?.pii_replacements &&
                          typeof row.fileData?.analytics?.pii_replacements ===
                            "object" ? (
                            Object.keys(
                              row.fileData?.analytics?.pii_replacements
                            ).length !== 0 ? (
                              <Checkbox
                                defaultChecked={true}
                                checked={true}
                                color="primary"
                                label=""
                                disabled
                                className={`${style.check}`}
                                size="lg"
                                variant="solid"
                              />
                            ) : (
                              // <p>checked</p>
                              <Checkbox
                                defaultChecked={false}
                                checked={false}
                                color="danger"
                                className={`${style.uncheck}`}
                                label=""
                                size="lg"
                                disabled
                                variant="outlined"
                              />
                            )
                          ) : (
                            <Checkbox
                              defaultChecked={false}
                              checked={false}
                              color="danger"
                              className={`${style.uncheck}`}
                              label=""
                              size="lg"
                              disabled
                              variant="outlined"
                            />
                            // <p>unchecked</p>
                          )}
                        </Typography>
                      </td>
                      <td>
                        <Button
                          size="sm"
                          variant="plain"
                          color="danger"
                          style={{ marginRight: "1rem" }}
                          onClick={() => setOpen(true)}
                          startDecorator={<Trash2 />}
                        ></Button>

                        <Button
                          size="sm"
                          variant="plain"
                          color="primary"
                          value={row?.id}
                          disabled={
                            row?.status?.toLowerCase() === "processed"
                              ? false
                              : true
                          }
                          onClick={() => {
                            router.push(`/audios/${row?.id}`);
                          }}
                          startDecorator={<Eye />}
                        ></Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </Sheet>
        </div>

        <Modal open={open} onClose={() => setOpen(false)}>
          <ModalDialog variant="outlined" role="alertdialog">
            <DialogTitle>
              <TriangleAlert />
              Confirmation
            </DialogTitle>
            <Divider />
            <DialogContent>
              <Typography>
                Are you sure you want to{" "}
                <Typography className="font-bold">
                  permanently delete
                </Typography>{" "}
                this file?
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button
                variant="solid"
                color="danger"
                onClick={() => setOpen(false)}
              >
                Delete
              </Button>
              <Button
                variant="plain"
                color="neutral"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
            </DialogActions>
          </ModalDialog>
        </Modal>

        <Modal open={openDataModal} onClose={() => setOpenDataModal(false)}>
          <ModalDialog variant="outlined" role="alertdialog">
            <DialogTitle>
              <Captions />
              Captured Content
            </DialogTitle>
            <Divider />
            <DialogContent className="flex flex-col gap-3 w-full">
              {Object.keys(fileData).length > 0 ? (
                <>
                  <Card className="w-fit pe-5">
                    <Typography level="h4" className="font-bold">
                      Sentiments
                    </Typography>
                    <CardContent>
                      <Typography
                        startDecorator={getEmoji(fileData?.sentiment)}
                        className="font-semibold"
                      >
                        {toTitleCase(fileData?.sentiment)}
                      </Typography>
                    </CardContent>
                  </Card>

                  <Card className="w-full">
                    <Typography level="h4" className="font-bold">
                      Issues
                    </Typography>
                    <CardContent className="flex flex-col gap-3">
                      {fileData?.issues &&
                        fileData?.issues.length > 0 &&
                        fileData.issues.map((issue, idx) => (
                          <div className="w-full flex flex-col" key={idx}>
                            <Typography level="h5" className="font-bold">
                              {toTitleCase(issue?.topic)}
                            </Typography>
                            <CardContent>
                              <Typography className="font-medium">
                                {issue?.summary}
                              </Typography>
                            </CardContent>
                          </div>
                        ))}
                    </CardContent>
                  </Card>

                  <Card className="w-fit pe-5">
                    <Typography level="h4" className="font-bold">
                      Transcript
                    </Typography>
                    <CardContent>
                      <div
                        className="font-medium"
                        dangerouslySetInnerHTML={{
                          __html: formatTranscript(fileData?.transcript),
                        }}
                      />
                    </CardContent>
                  </Card>
                </>
              ) : (
                <></>
              )}
            </DialogContent>
          </ModalDialog>
        </Modal>

        <Modal
          open={openDropZoneModal}
          onClose={() => setOpenDropZoneModal(false)}
          sx={{
            width: "100%",
          }}
        >
          <ModalDialog
            variant="outlined"
            sx={{
              width: "50%",
            }}
          >
            <Typography level="h4" className="mb-4">
              Upload New File
            </Typography>
            <DropZone showNotification={showNotification} />
            <Button
              variant="outlined"
              color="neutral"
              onClick={() => setOpenDropZoneModal(false)}
              className="mt-4"
            >
              Close
            </Button>
          </ModalDialog>
        </Modal>
      </main>
    </>
  );
}
