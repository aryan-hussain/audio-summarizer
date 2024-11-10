"use client";

import Notification from "@/components/ui/notifications";
import {
  Card,
  CardContent,
  Divider,
  extendTheme,
  Skeleton,
  Typography,
} from "@mui/joy";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { LineChart } from "@mui/x-charts";
import { API_URL } from "@/config";
import {
  MediaController,
  MediaControlBar,
  MediaTimeRange,
  MediaTimeDisplay,
  MediaPlayButton,
  MediaPlaybackRateButton,
  MediaMuteButton,
} from "media-chrome/react";
import { S3 } from "aws-sdk";
import { Box, CircularProgress, styled, Tab, Tabs } from "@mui/material";
import SentimentsChart from "@/reusable/sentimentsChart/sentimentsChart";
import ConversationCharacteristics from "@/reusable/conversationCharacteristics/ConversationCharacteristics";
import WhoTalksMoreChart from "@/components/ui/whoTalksMore/WhoTalksMore";
import PIIRedactionTable from "@/reusable/piiredactedTable/PIIRedactionTable";
import styles from "./page.module.scss";
import { formatTextForDetection, formatTextForNextItemDetection, formatTextForOutComeDetection, generateDataPoints } from "@/lib/helper";
import SpeakerDiarization from "@/components/ui/speakerDiarization/SpeakerDiarization";
import AudioVisualizer from "@/components/ui/audioVisualizer/AudioVisualizer";
import WaveformPlayer from "@/components/ui/audioVisualizer/AudioVisualizer";
import { HeaderTypography } from "@/lib/reusableStyles";

const StyledTabs = styled((props) => (
  <Tabs
    {...props}
    TabIndicatorProps={{ children: <span className="MuiTabs-indicatorSpan" /> }}
  />
))({
  "& .MuiTabs-indicator": {
    display: "flex",
    justifyContent: "center",
    backgroundColor: "transparent",
    height: "5px",
  },
  "& .MuiTabs-indicatorSpan": {
    maxWidth: 90,
    borderRadius: `15px 15px 0 0`,
    // height:"10px !important",
    width: "100%",
    backgroundColor: "#134B70",
  },
});

const StyledTab = styled((props) => <Tab disableRipple {...props} />)(
  ({ theme }) => ({
    textTransform: "none",
    // fontWeight: theme.typography.fontWeightRegular,
    fontWeight: theme.typography.fontWeightBold,
    fontSize: theme.typography.pxToRem(15),
    marginRight: theme.spacing(1),
    color: "#000",
    "&.Mui-selected": {
      color: "#134B70",
    },
    "&.Mui-focusVisible": {
      backgroundColor: "rgba(100, 95, 228, 0.32)",
    },
  })
);

// Define the MediaChromeVideoPlayer component
const MediaChromeAudioPlayer = ({ src }) => {
  return (
    <MediaController audio className="rounded-full">
      <audio slot="media" src={src}></audio>
      <MediaControlBar className="rounded-full px-2">
        <MediaPlayButton className="rounded-full bg-black hover:bg-black"></MediaPlayButton>
        <MediaTimeRange className="rounded-full bg-black hover:bg-black"></MediaTimeRange>
        <MediaTimeDisplay
          showDuration
          className="rounded-full bg-black hover:bg-black"
        ></MediaTimeDisplay>
        <MediaPlaybackRateButton className="rounded-full bg-black hover:bg-black"></MediaPlaybackRateButton>
        <MediaMuteButton className="rounded-full bg-black hover:bg-black"></MediaMuteButton>
        {/* <MediaVolumeRange></MediaVolumeRange> */}
      </MediaControlBar>
    </MediaController>
  );
};

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

function formatDuration(ms) {
  // Calculate total seconds, minutes, and hours from milliseconds
  let seconds = Math.floor(ms / 1000); // Convert milliseconds to seconds
  let minutes = Math.floor(seconds / 60); // Convert seconds to minutes
  let hours = Math.floor(minutes / 60); // Convert minutes to hours

  // Calculate remaining seconds and minutes after extracting full hours and minutes
  seconds = seconds % 60; // Remaining seconds after full minutes
  minutes = minutes % 60; // Remaining minutes after full hours

  // Build the result string
  let result = [];
  if (hours > 0) {
    result.push(hours + "h"); // Add hours to the result if greater than 0
  }
  if (minutes > 0) {
    result.push(minutes + "m"); // Add minutes to the result if greater than 0
  }
  if (seconds > 0) {
    result.push(seconds + "s"); // Add seconds to the result if greater than 0
  }

  // Join the array into a string with spaces
  return result.join(" ");
}

const generatePresignedUrl = async (objectKey, expiration = 3600) => {
  const s3 = new S3({
    region: "us-east-1",
    accessKeyId: `${process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID}`,
    secretAccessKey: `${process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY}`,
  });

  const params = {
    Bucket: "audio-summarizer",
    Key: objectKey,
    Expires: expiration,
  };

  try {
    const url = await s3.getSignedUrlPromise("getObject", params);
    return url;
  } catch (error) {
    console.error("Error generating pre-signed URL:", error);
    return "";
  }
};

const capitalizeFirstLetter = (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export default function AudioAnalysis({ params }) {
  const theme = extendTheme();

  const [notifyOpen, setNotifyOpen] = useState(false);
  const [notifyMessage, setNotifyMessage] = useState("");
  const [notifyColor, setNotifyColor] = useState("neutral");

  const [initalFetch, setInitialFetch] = useState(true);

  const [transcript, setTranscript] = useState("");
  const [language, setLanguage] = useState("");
  const [talkTime, setTalkTime] = useState({});
  const [talkSpeed, setTalkSpeed] = useState({});
  const [sentiment, setSentiment] = useState({});
  const [summary, setSummary] = useState("");
  const [loudness, setLoudness] = useState({});
  const [issues, setIssues] = useState("");
  const [outcomes, setOutcome] = useState("");
  const [actionItems, setActionItems] = useState("");
  const [piiRedacted, setPiiRedacted] = useState([]);

  const [filePath, setFilePath] = useState("");

  // codes here
  const [valueTab, setValueTab] = useState(0);

  const handleChangeTab = (event, newValue) => {
    setValueTab(newValue);
  };

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

  const parseAnalytics = (analytics) => {
    
    let parsedData = {};
    try {
      // Attempt to parse the JSON string
      parsedData = JSON.parse(analytics.action_times[0]);
    } catch (error) {
      // Handle any errors that occur during parsing
      console.error("Error parsing JSON data:", error);
      parsedData = {
        "Issues detected": "No issues detected",
        "Outcome detected": "No outcome detected",
        "Next action item": "No next item detected",
      };
    }
    
    if (typeof analytics === "object" && Object.entries(analytics).length > 0) {
      setSummary(analytics.summary?.summary || analytics.summary || "");
      setTalkTime(analytics.talkTime || {});
      setTalkSpeed(analytics.talkSpeed || {});
      setSentiment(analytics.sentiments || {});
      setLoudness(analytics.loudness || {});
      setIssues(parsedData["Issues detected"] || "");
      setOutcome(parsedData["Outcome detected"] || "");
      setActionItems(parsedData["Next action item"] || "");
      setPiiRedacted(analytics.pii_replacements || []);
      setLanguage(analytics.language || "");
    }
  };

  const fetchFileData = useCallback(
    async (e) => {
      try {
        const response = await fetch(
          `${API_URL}/file/${decodeURIComponent(params.audioId)}`
        );

        const jsonResponse = await response.json();
        const resData = jsonResponse.data || [];
        if (resData.length > 0) {
          const data = JSON.parse(resData[0].data);
          const path = await generatePresignedUrl(resData[0]?.name);

          setTranscript(data.transcript || "");
          parseAnalytics(data.analytics || {});
          setFilePath(path);
        } else {
          setFileData({});
          setFilePath("");
        }

        showNotification("success", `File Data Fetched Successfully!`);
      } catch (error) {
        showNotification("danger", `Error fetching files: ${error}`);
      } finally {
        setInitialFetch(false);
      }
    },
    [params]
  );

  useEffect(
    (e) => {
      if (initalFetch) {
        fetchFileData();
      }
    },
    [initalFetch, fetchFileData]
  );

  return (
    <>
      <Notification
        open={notifyOpen}
        message={notifyMessage}
        color={notifyColor}
      />
      <main className="h-screen w-screen bg-[#EEEEEE] overflow-x-hidden flex flex-col px-2 lg:px-10 pt-3 pb-5 gap-5">
        <div className="flex flex-col lg:flex-row justify-between w-full mb-2">
          <Image src={"/crossml.svg"} width={150} height={150} alt={"Logo"} />
          {/* <Typography className="text-primary" level="h1">
            Audio Summarizer
          </Typography> */}
        </div>
        <div className="flex flex-row">
          <Link href="/audios">
            <Typography
              level="title-sm"
              className="font-bold no-underline text-primary"
              startDecorator={<ArrowLeft />}
            >
              Back to Files
            </Typography>
          </Link>
        </div>

        <div className="flex flex-col mt-4 justify-between items-center">
          <div className="flex flex-col self-start h-fit mb-5">
            <Typography level="h2" className="text-primary">
              Audio Analysis
            </Typography>
            <Typography level="h5" className="font-medium text-primary">
              Unleashing AI to decode the language of sound.
            </Typography>
          </div>
          {filePath && <WaveformPlayer src={filePath} />}
        </div>

        {/* <div className="flex flex-row h-fit mb-5 ">
          <MediaChromeAudioPlayer src={filePath} />
        </div> */}

        <Box sx={{ width: "100%" }}>
          <Box sx={{ bgcolor: "", borderBottom: "1px solid #C9C9C9" }}>
            <StyledTabs
              value={valueTab}
              onChange={handleChangeTab}
              aria-label="styled tabs example"
            >
              <StyledTab label="ANALYSIS" />
              <StyledTab label="DIARIZATION" />
              <StyledTab label="RETRIEVAL" />
            </StyledTabs>
            <Box sx={{ p: 0 }} />
          </Box>
        </Box>

        {valueTab === 0 && (
          <div className={`${styles.gridContainer}`}>
            <div className={`${styles.agentSentiments}`}>
              {!initalFetch ? (
                sentiment?.chart_data?.agent ? (
                  <SentimentsChart
                    title={"Agent"}
                    data={generateDataPoints(sentiment.chart_data?.agent)}
                    overallScore={sentiment.agent || 0}
                    areaColor={"#134B70"}
                  />
                ) : (
                  <Card
                    sx={{
                      width: "100%",
                      height: "100%",
                      marginTop: "0",
                    }}
                  >
                    <HeaderTypography>Agent Sentiments</HeaderTypography>
                    <CardContent
                      sx={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        justifyItems: "center",
                        alignItems: "center",
                      }}
                    >
                      <span className="text-gray-400 text-xl">
                        No data to display
                      </span>
                    </CardContent>
                  </Card>
                )
              ) : (
                <Card
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    width: "100%",
                    height: "20rem",
                    marginTop: "10px",
                  }}
                >
                  <Skeleton
                    sx={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      justifyItems: "center",
                      alignItems: "center",
                    }}
                  >
                    <span className="text-gray-400 text-xl">
                      No data to display
                    </span>
                  </Skeleton>
                </Card>
              )}
            </div>
            <div className={`${styles.customerSetiments}`}>
              {!initalFetch ? (
                sentiment?.chart_data?.customer ? (
                  <SentimentsChart
                    title={"Customer"}
                    data={generateDataPoints(sentiment.chart_data?.customer)}
                    overallScore={sentiment.customer || 0}
                    areaColor={"#508C9B"}
                  />
                ) : (
                  <Card
                    sx={{
                      width: "100%",
                      height: "100%",
                      marginTop: "0",
                    }}
                  >
                    <HeaderTypography>Customer Sentiments</HeaderTypography>
                    <CardContent
                      sx={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        justifyItems: "center",
                        alignItems: "center",
                      }}
                    >
                      <span className="text-gray-400 text-xl">
                        No data to display
                      </span>
                    </CardContent>
                  </Card>
                )
              ) : (
                <Card
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    width: "100%",
                    height: "20rem",
                    marginTop: "10px",
                  }}
                >
                  <Skeleton
                    sx={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      justifyItems: "center",
                      alignItems: "center",
                    }}
                  >
                    <span className="text-gray-400 text-xl">
                      No data to display
                    </span>
                  </Skeleton>
                </Card>
              )}
            </div>
            <div className={`${styles.conversationCharacteristics}`}>
              {!initalFetch ? (
                <ConversationCharacteristics
                  language={language}
                  agentTime={formatDuration(talkTime.agent || 0)}
                  customerTime={formatDuration(talkTime.customer || 0)}
                  totalTalkTime={formatDuration(talkTime.total_talk_time || 0)}
                  agentTalkSpeed={talkSpeed.agent || 0}
                  customerTalkSpeed={talkSpeed.customer || 0}
                  talkTime={talkTime}
                />
              ) : (
                <Card
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    width: "100%",
                    height: "100%",
                    marginTop: "10px",
                  }}
                >
                  <Skeleton
                    sx={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      justifyItems: "center",
                      alignItems: "center",
                    }}
                  >
                    <span className="text-gray-400 text-xl">
                      No data to display
                    </span>
                  </Skeleton>
                </Card>
              )}
            </div>
            <div className={`${styles.PIIredaction}`}>
              {!initalFetch ? (
                piiRedacted &&
                typeof piiRedacted === "object" &&
                Object.keys(piiRedacted).length !== 0 ? (
                  <PIIRedactionTable piiRedacted={piiRedacted} />
                ) : (
                  <Card
                    sx={{
                      // display: "flex",
                      // justifyContent: "center",
                      // alignItems: "center",
                      width: "100%",
                      height: "100%",
                      // marginTop: "10px",
                    }}
                    className="shadow-lg"
                  >
                    <HeaderTypography>PII Redacted</HeaderTypography>
                    <CardContent
                      sx={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        justifyItems: "center",
                        alignItems: "center",
                      }}
                    >
                      <span className="text-gray-400 text-xl">
                        No data to display
                      </span>
                    </CardContent>
                  </Card>
                )
              ) : (
                <Card
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    width: "100%",
                    height: "20rem",
                    marginTop: "10px",
                  }}
                >
                  <Skeleton
                    sx={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      justifyItems: "center",
                      alignItems: "center",
                    }}
                  >
                    <span className="text-gray-400 text-xl">
                      No data to display
                    </span>
                  </Skeleton>
                </Card>
              )}
            </div>
            <div className={`${styles.whoTalksMore}`}>
              {!initalFetch ? (
                talkTime && sentiment && sentiment.chart_data ? (
                  <WhoTalksMoreChart
                    data={{
                      nodes: [
                        { name: "Agent Talks More" },
                        { name: "Cust. Talks More" },
                        { name: "Positive" },
                        { name: "Negative" },
                      ],
                      links: [
                        { source: 0, target: 2, value: 23 },
                        { source: 0, target: 3, value: 27 },
                        { source: 1, target: 2, value: 45 },
                        { source: 1, target: 3, value: 5 },
                      ],
                    }}
                    talkTime={talkTime}
                    sentiment={sentiment}
                  />
                ) : (
                  <Card
                    sx={{
                      width: "100%",
                      height: "100%",
                      marginTop: "0",
                    }}
                  >
                    <HeaderTypography>Customer Sentiments</HeaderTypography>
                    <CardContent
                      sx={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        justifyItems: "center",
                        alignItems: "center",
                      }}
                    >
                      <span className="text-gray-400 text-xl">
                        No data to display
                      </span>
                    </CardContent>
                  </Card>
                )
              ) : (
                <Card
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    width: "100%",
                    height: "20rem",
                    marginTop: "10px",
                  }}
                >
                  <Skeleton
                    sx={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      justifyItems: "center",
                      alignItems: "center",
                    }}
                  >
                    <span className="text-gray-400 text-xl">
                      No data to display
                    </span>
                  </Skeleton>
                </Card>
              )}
            </div>
            <div className={`${styles.analyticLoudeness}`}>
              {!initalFetch ? (
                <Card className="shadow-lg">
                  <CardContent>
                    <Typography level="title-lg" className="text-primary">
                      Loudness Analysis
                    </Typography>
                    <Typography level="body-xs" className="text-primary">
                      {"(Y Axis - Loudness Scores)"}
                    </Typography>
                    <Typography level="body-xs" className="text-primary">
                      {"(X Axis - Seconds)"}
                    </Typography>
                    <div className="flex flex-col md:flex-row justify-center items-center w-full gap-2 mt-2">
                      <div className="flex flex-col justify-center items-start w-full">
                        <Typography level="title-md text-primary">
                          {toTitleCase("Agent Loudness")}
                        </Typography>
                        {!initalFetch ? (
                          loudness.agent ? (
                            <LineChart
                              xAxis={[{ data: loudness.agent?.seconds }]}
                              series={[{ data: loudness.agent?.score }]}
                              height={400}
                              colors={["#134B70"]}
                              grid={{ vertical: true, horizontal: true }}
                            />
                          ) : (
                            <Card
                              sx={{
                                width: "100%",
                                height: "20rem",
                                marginTop: "10px",
                              }}
                            >
                              <HeaderTypography>
                                Agent Loudness
                              </HeaderTypography>
                              <CardContent
                                sx={{
                                  width: "100%",
                                  height: "100%",
                                  display: "flex",
                                  flexDirection: "column",
                                  justifyContent: "center",
                                  justifyItems: "center",
                                  alignItems: "center",
                                }}
                              >
                                <span className="text-gray-400 text-xl">
                                  No data to display
                                </span>
                              </CardContent>
                            </Card>
                          )
                        ) : (
                          <Card
                            sx={{
                              width: "100%",
                              height: "20rem",
                              marginTop: "10px",
                            }}
                          >
                            <CardContent
                              sx={{
                                width: "100%",
                                height: "100%",
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "center",
                                justifyItems: "center",
                                alignItems: "center",
                              }}
                            >
                              <span className="text-gray-400 text-xl">
                                No data to display
                              </span>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                      <div className="flex flex-col justify-center items-start w-full">
                        <Typography level="title-md" className="text-primary">
                          {toTitleCase("Customer Loudness")}
                        </Typography>
                        {!initalFetch ? (
                          loudness.customer ? (
                            <LineChart
                              xAxis={[{ data: loudness.customer?.seconds }]}
                              series={[{ data: loudness.customer?.score }]}
                              height={400}
                              colors={["#508C9B"]}
                              grid={{ vertical: true, horizontal: true }}
                            />
                          ) : (
                            <Card
                              sx={{
                                width: "100%",
                                height: "20rem",
                                marginTop: "10px",
                              }}
                            >
                              <HeaderTypography>
                                Customer Loudness
                              </HeaderTypography>
                              <CardContent
                                sx={{
                                  width: "100%",
                                  height: "100%",
                                  display: "flex",
                                  flexDirection: "column",
                                  justifyContent: "center",
                                  justifyItems: "center",
                                  alignItems: "center",
                                }}
                              >
                                <span className="text-gray-400 text-xl">
                                  No data to display
                                </span>
                              </CardContent>
                            </Card>
                          )
                        ) : (
                          <Card
                            sx={{
                              width: "100%",
                              height: "20rem",
                              marginTop: "10px",
                            }}
                          >
                            <CardContent
                              sx={{
                                width: "100%",
                                height: "100%",
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "center",
                                justifyItems: "center",
                                alignItems: "center",
                              }}
                            >
                              <span className="text-gray-400 text-xl">
                                No data to display
                              </span>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    width: "100%",
                    height: "20rem",
                    marginTop: "10px",
                  }}
                >
                  <Skeleton
                    sx={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      justifyItems: "center",
                      alignItems: "center",
                    }}
                  >
                    <span className="text-gray-400 text-xl">
                      No data to display
                    </span>
                  </Skeleton>
                </Card>
              )}
            </div>
            {/* <div className={`${styles.customerLoudness}`}></div> */}
          </div>
        )}

        {valueTab === 1 && (
          <div className="flex flex-col justify-start items-center w-full h-full">
            <div className="flex flex-col w-full gap-2 h-fit">
              <div className="flex flex-col w-full lg:w-[100%] p-0">
                <Card
                  variant="plain"
                  sx={{
                    width: "100%",
                    height: "100%",
                    backgroundColor: "transparent",
                    padding: "0 0 1rem 0",
                    "&::-webkit-scrollbar": {
                      width: "5px",
                    },
                    "&::-webkit-scrollbar-track": {
                      background: "#eee",
                      borderRadius: "20px",
                    },
                    "&::-webkit-scrollbar-thumb": {
                      background: "#888",
                      borderRadius: "20px", // Adjust the radius as needed
                    },
                    "&::-webkit-scrollbar-thumb:hover": {
                      background: "#555",
                    },
                    "&::-webkit-scrollbar-button": {
                      display: "none",
                    },
                  }}
                >
                  <CardContent
                    className="shadow-lg bg-transparent"
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "start",
                      justifyItems: "center",
                      gap: 3,
                    }}
                  >
                    <Card>
                      <CardContent>
                        <Typography
                          level="title-lg"
                          className="text-primary mb-3"
                        >
                          Conversation Summary
                        </Typography>
                        <Typography level="">
                          {!initalFetch ? (
                            summary ? (
                              <div className="text-primary">{`${summary}`}</div>
                            ) : (
                              "No Summary Generated"
                            )
                          ) : (
                            <Skeleton>
                              The customer inquired about applying for a
                              business loan from Tata Capital. The agent
                              provided the basic eligibility criteria including
                              minimum age, credit score, business profitability,
                              business vintage and bank balance. The agent also
                              mentioned the minimal documentation required like
                              identity proof, address proof, income tax returns
                              and bank statements. The agent advised the
                              customer to visit the company website and apply
                              online. The customer felt more confident about the
                              process after receiving the information and
                              planned to submit the online application.
                            </Skeleton>
                          )}
                        </Typography>
                      </CardContent>
                    </Card>

                    {/* <Card>
                      <SpeakerDiarization />
                    </Card> */}
                  </CardContent>
                </Card>
              </div>
              <div className="flex flex-col w-full lg:w-[100%] p-0">
                <Card
                  // variant="plain"
                  sx={{
                    width: "100%",
                    height: "100%",
                    marginBottom: "1rem",
                    backgroundColor: "#fff",
                    "&::-webkit-scrollbar": {
                      width: "5px",
                    },
                    "&::-webkit-scrollbar-track": {
                      background: "#f1f1f1",
                      borderRadius: "20px",
                    },
                    "&::-webkit-scrollbar-thumb": {
                      background: "#888",
                      borderRadius: "20px", // Adjust the radius as needed
                    },
                    "&::-webkit-scrollbar-thumb:hover": {
                      background: "#555",
                    },
                    "&::-webkit-scrollbar-button": {
                      display: "none",
                    },
                  }}
                  className="shadow-lg"
                >
                  <CardContent>
                    <Typography className="text-primary" level="h3">
                      Transcript
                    </Typography>
                    {!initalFetch ? (
                      transcript ? (
                        <div
                          className="font-medium text-primary"
                          dangerouslySetInnerHTML={{
                            __html: formatTranscript(transcript),
                          }}
                        />
                      ) : (
                        <>
                          <Typography className="text-primary">
                            No Transcript Found
                          </Typography>
                        </>
                      )
                    ) : (
                      <div className="flex flex-col justify-start items-start gap-4">
                        <Typography>
                          <Skeleton>
                            spk_0: There. I am the owner of a start up and I am
                            exploring options for a business loan. I have a few
                            questions about the process and requirements. Can
                            you help me with that?
                          </Skeleton>
                        </Typography>
                        <Typography>
                          <Skeleton>
                            spk_1: Sure. I&apos;d be happy to help you with your
                            queries about our business loan offering. As a start
                            up owner, you can avail of our business loans with
                            minimal documentation. We consider start ups under
                            our eligibility criteria. Please feel free to ask me
                            any specific questions you may have regarding loan
                            amount, tenure, interest rates or documentation
                            requirements. I&apos;ll provide you with clear and
                            concise information to assist you in choosing the
                            right business finance solution for your
                            startup&apos;s needs.
                          </Skeleton>
                        </Typography>
                        <Typography>
                          <Skeleton>
                            spk_0: First off, what are the basic eligibility
                            criteria for getting a business loan?
                          </Skeleton>
                        </Typography>
                        <Typography>
                          <Skeleton>
                            spk_1: The basic eligibility criteria to get a
                            business loan from Tata capital typically includes
                            your age should be between 21 to 65 years. Minimum
                            credit score of 650 business should be profitable.
                            Minimum two years of business vintage, maintaining a
                            minimum bank balance of ₹5000 having a good credit
                            history and stable income from your business
                            operations makes you eligible for easier approval.
                            The documentation required is minimal, like identity
                            proof, address, proof, income tax returns, bank
                            statements, etc. Let me know if you need any other
                            details.
                          </Skeleton>
                        </Typography>
                        <Typography>
                          <Skeleton>
                            spk_0: Thanks. That&apos;s helpful. How do I go
                            about applying for a business loan online
                          </Skeleton>
                        </Typography>
                        <Typography>
                          <Skeleton>
                            spk_1: to apply for a business loan online with Tata
                            Capital? Simply visit our website and click on apply
                            now under the business loan section. You can then
                            fill out the application form, providing basic
                            details and upload the required documents. It&apos;s
                            a quick and hassle free process,
                          </Skeleton>
                        </Typography>
                        <Typography>
                          <Skeleton>
                            spk_0: please. What document will I need to submit
                          </Skeleton>
                        </Typography>
                        <Typography>
                          <Skeleton>
                            spk_1: to apply for a business loan? You&apos;ll
                            need K YC documents like photo id and address proof,
                            business registration certificate, GSD certificate.
                            Last two years, its audited financials, bank
                            statements and GSD returns for six months. Visit the
                            documents page for complete details.
                          </Skeleton>
                        </Typography>
                        <Typography>
                          <Skeleton>
                            spk_0: You so much for all the information. I feel
                            much more confident about the process. Now I will go
                            ahead and start the application. Have a great day.
                          </Skeleton>
                        </Typography>
                        <Typography>
                          <Skeleton>
                            spk_1: I&apos;m glad the information was helpful and
                            you feel more confident about our business loan
                            process. Go ahead and start the online application.
                            It&apos;s straightforward and our team will guide
                            you through each step. Wishing you all the best with
                            your business plans.
                          </Skeleton>
                        </Typography>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}

        {valueTab === 2 && (
          <div className="flex flex-col justify-start items-center w-full h-full">
            <div className="flex flex-col w-full gap-2 h-fit">
              <div className="flex flex-col w-full lg:w-[100%] p-0">
                <Card
                  variant="plain"
                  sx={{
                    width: "100%",
                    height: "100%",
                    backgroundColor: "transparent",
                    padding: "0 0 2rem 0",
                    "&::-webkit-scrollbar": {
                      width: "5px",
                    },
                    "&::-webkit-scrollbar-track": {
                      background: "#f1f1f1",
                      borderRadius: "20px",
                    },
                    "&::-webkit-scrollbar-thumb": {
                      background: "#888",
                      borderRadius: "20px", // Adjust the radius as needed
                    },
                    "&::-webkit-scrollbar-thumb:hover": {
                      background: "#555",
                    },
                    "&::-webkit-scrollbar-button": {
                      display: "none",
                    },
                  }}
                >
                  <CardContent
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "start",
                      justifyItems: "center",
                      gap: 3,
                    }}
                  >
                    <Card className="shadow-lg text-primary">
                      <CardContent>
                        <Typography level="title-lg" className="text-primary">
                          Issues Detected
                        </Typography>
                        <div className="flex flex-col justify-center items-center w-full gap-2 mt-2">
                          {!initalFetch ? (
                            // issues.length > 0 ? (
                            //   issues.map((issue, idx) => (
                            //     <div className="w-full row py-2" key={idx}>
                            //       <Typography level="title-sm text-primary">
                            //         {issue}
                            //       </Typography>
                            //     </div>
                            //   ))
                            // )
                            issues ? (
                              <div className="w-full row py-2">
                                <Typography level="title-sm text-primary">
                                  {issues}
                                </Typography>
                              </div>
                            ) : (
                              <div className="w-full row py-2">
                                <Typography level="title-sm text-primary">
                                  No issue found
                                </Typography>
                              </div>
                            )
                          ) : (
                            <div className="w-full row p-2">
                              <Typography level="title-sm">
                                <Skeleton>
                                  spk_0: There. I am the owner of a start up and
                                  I am exploring options for a business loan. I
                                  have a few questions about the process and
                                  requirements. Can you help me with that?
                                </Skeleton>
                              </Typography>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="shadow-lg">
                      <CardContent>
                        <Typography level="title-lg" className="text-primary">
                          Outcome Detected
                        </Typography>
                        <div className="flex flex-col justify-center items-center w-full gap-2 mt-2">
                          {!initalFetch ? (
                            outcomes ? (
                              <div className="w-full row py-2">
                                <Typography level="title-sm text-primary">
                                  {outcomes}
                                </Typography>
                              </div>
                            ) : (
                              <div className="w-full row py-2">
                                <Typography level="title-sm text-primary">
                                  No outcome found
                                </Typography>
                              </div>
                            )
                          ) : (
                            <div className="w-full row p-2">
                              <Typography level="title-sm">
                                <Skeleton>
                                  spk_0: There. I am the owner of a start up and
                                  I am exploring options for a business loan. I
                                  have a few questions about the process and
                                  requirements. Can you help me with that?
                                </Skeleton>
                              </Typography>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="shadow-lg">
                      <CardContent>
                        <Typography level="title-lg" className="text-primary">
                          Next Items Detected
                        </Typography>
                        <div className="flex flex-col justify-center items-center w-full gap-2 mt-2">
                          {!initalFetch ? (
                            // actionItems &&
                            // actionItems.length > 0 &&
                            // actionItems.some((item) => item !== null) ? (
                            //   actionItems.map((actionItem, idx) => (
                            //     <div className="w-full row py-2" key={idx}>
                            //       {/* <Typography level="title-sm text-primary">
                            //         {actionItem}
                            //       </Typography> */}
                            //       {formatTextForDetection(actionItem)}
                            //     </div>
                            //   ))
                            actionItems ? (
                              <div className="w-full row py-2">
                                {/* <Typography level="title-sm text-primary">
                                    {actionItem}
                                  </Typography> */}
                                {formatTextForOutComeDetection(actionItems)}
                              </div>
                            ) : (
                              <div className="w-full row py-2 ">
                                <Typography level="title-sm text-primary">
                                  No next items found
                                </Typography>
                              </div>
                            )
                          ) : (
                            <div className="w-full row border border-gray-200 p-2">
                              <Typography level="title-sm">
                                <Skeleton>
                                  spk_0: There. I am the owner of a start up and
                                  I am exploring options for a business loan. I
                                  have a few questions about the process and
                                  requirements. Can you help me with that?
                                </Skeleton>
                              </Typography>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
