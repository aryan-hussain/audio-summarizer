"use client";

import { WavyBackground } from "@/components/ui/wavy-background";
import {
  Button,
  CircularProgress,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Drawer,
  Modal,
  ModalDialog,
  Typography,
  extendTheme,
} from "@mui/joy";
import { AudioLines, FileVolume, TriangleAlert } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import Notification from "@/components/ui/notifications";
import { useRouter } from "next/navigation";
import Color from "color";
import { LinkPreview } from "@/components/ui/link-preview";
import { v4 } from "uuid";
import { API_URL } from "@/config";
import ReactPlayer from "react-player";
import MicRecorder from "mic-recorder-to-mp3";

export default function Home() {
  const router = useRouter();
  const theme = extendTheme();

  // New instance
  const [Mp3Recorder, setMp3Recorder] = useState(
    new MicRecorder({ bitRate: 128 })
  );

  const [isOpen, setOpen] = useState(false);
  const [isModalOpen, setModalOpen] = useState(false);
  const [isEndingConversation, setIsEndingConversation] = useState(false);

  const [notifyOpen, setNotifyOpen] = useState(false);
  const [notifyMessage, setNotifyMessage] = useState("");
  const [notifyColor, setNotifyColor] = useState("neutral");

  const [isRecording, setIsRecording] = useState(false);

  const [conversationId, setConversationId] = useState("");
  const [messageId, setMessageId] = useState(1);

  const [isProcessingAudio, setIsProcessingAudio] = useState(false);

  const [audioPath, setAudioPath] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // References to store the MediaRecorder instance and audio chunks
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Function to start recording
  const startRecording = () => {
    setIsRecording(true);
    // // Create a new MediaRecorder instance and configure it
    // navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
    //   mediaRecorderRef.current = new MediaRecorder(stream);
    //   mediaRecorderRef.current.ondataavailable = (event) => {
    //     audioChunksRef.current.push(event.data);
    //   };

    //   mediaRecorderRef.current.start();
    // });

    // Start recording. Browser will request permission to use your microphone.
    Mp3Recorder.start()
      .then(() => {
        // something else
      })
      .catch((e) => {
        console.error(e);
      });
  };

  // Cleanup effect when the component unmounts
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  // Function to stop recording
  const stopRecording = () => {
    Mp3Recorder.stop()
      .getMp3()
      .then(([buffer, blob]) => {
        // do what ever you want with buffer and blob
        // Example: Create a mp3 file and play
        sendWavFile(blob);
      })
      .catch((e) => {
        alert("We could not retrieve your message");
        console.log(e);
      });

    // if (mediaRecorderRef.current) {
    //   // Stop the media recorder and save the recorded audio
    //   mediaRecorderRef.current.stop();
    //   mediaRecorderRef.current.onstop = () => {
    //     const audioBlob = new Blob(audioChunksRef.current, { type: "audio/mpeg-3" });

    //     try {
    //       const mp3AudioBlob = encodeMP3(audioBlob);
    //       debugger;
    //     } catch (exception) {
    //       console.log("Error converting blob: ", exception);
    //       debugger;
    //     }

    //     sendWavFile(audioBlob);
    //     audioChunksRef.current = [];
    //   };
    // }
  };

  // Function to convert audio Blob to WAV format
  const convertToWav = async (audioBlob) => {
    const arrayBuffer = await audioBlob.arrayBuffer();
    const audioBuffer = await new AudioContext().decodeAudioData(arrayBuffer);

    const wavBuffer = encodeWAV(audioBuffer);
    const wavBlob = new Blob([wavBuffer], { type: "audio/wav" });
    sendWavFile(wavBlob);
  };

  // Function to encode audio buffer to WAV format
  const encodeWAV = (audioBuffer) => {
    const numberOfChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;

    const resultBuffer = new ArrayBuffer(44 + audioBuffer.length * 2);
    const view = new DataView(resultBuffer);

    function writeString(view, offset, string) {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    }

    writeString(view, 0, "RIFF");
    view.setUint32(4, 36 + audioBuffer.length * 2, true);
    writeString(view, 8, "WAVE");
    writeString(view, 12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numberOfChannels * (bitDepth / 8), true);
    view.setUint16(32, numberOfChannels * (bitDepth / 8), true);
    view.setUint16(34, bitDepth, true);
    writeString(view, 36, "data");
    view.setUint32(40, audioBuffer.length * 2, true);

    for (let channel = 0; channel < numberOfChannels; channel++) {
      const samples = audioBuffer.getChannelData(channel);
      let offset = 44 + channel;
      for (let i = 0; i < samples.length; i++) {
        view.setInt16(offset, samples[i] * 0x7fff, true);
        offset += numberOfChannels * 2;
      }
    }

    return view;
  };

  const encodeMP3 = (audioBuffer) => {
    const numberOfChannels = audioBuffer.numberOfChannels; // Number of audio channels
    const sampleRate = audioBuffer.sampleRate; // Sample rate of the audio
    const kbps = 128; // Bitrate in kbps

    // Create an instance of the MP3 encoder
    const mp3encoder = new Mp3Encoder(numberOfChannels, sampleRate, kbps);

    let mp3Data = [];
    const sampleBlockSize = 1152; // Encoder block size

    // Handle encoding per channel for stereo audio
    for (let channel = 0; channel < numberOfChannels; channel++) {
      const samples = new Int16Array(audioBuffer.length);
      audioBuffer.copyFromChannel(samples, channel);

      // Encode in chunks
      for (let i = 0; i < samples.length; i += sampleBlockSize) {
        const chunk = samples.subarray(i, i + sampleBlockSize);
        const mp3buf =
          numberOfChannels === 1
            ? mp3encoder.encodeBuffer(chunk) // Mono
            : mp3encoder.encodeBuffer(chunk, chunk); // Stereo (duplicate for each channel)

        if (mp3buf.length > 0) {
          mp3Data.push(new Int8Array(mp3buf));
        }
      }
    }

    // Finish encoding
    const end = mp3encoder.flush();
    if (end.length > 0) {
      mp3Data.push(new Int8Array(end));
    }

    // Return the complete MP3 data as a Uint8Array
    return new Uint8Array(mp3Data.reduce((acc, cur) => [...acc, ...cur], []));
  };

  // Function to save the WAV file to the server
  const sendWavFile = async (wavBlob) => {
    const file = new File([wavBlob], `${conversationId}_${messageId}.mp3`, {
      lastModified: new Date().getTime(),
    });

    var formData = {};

    const readFileAsArrayBuffer = (file) => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsArrayBuffer(file);
        reader.onloadend = () => {
          const fileContent = reader.result;
          const base64EncodedContent =
            Buffer.from(fileContent).toString("base64");
          resolve(base64EncodedContent);
        };
        reader.onerror = reject;
      });
    };

    const processFile = async (file) => {
      const base64EncodedContent = await readFileAsArrayBuffer(file);
      formData.uuid = conversationId;
      formData.message_id = messageId;
      formData.customer_query = base64EncodedContent;
    };

    await processFile(file);
    formData = JSON.stringify(formData);

    try {
      const res = await fetch(`${API_URL}/voice-agent`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: formData,
      });

      const response = await res.json();

      if (res.ok) {
        const data = response.data || {};
        const path = data.agent_response_path || "";

        setAudioPath(path);
        setIsPlaying(true);
        setMessageId(messageId + 2);
      } else {
        showNotification(
          "danger",
          "Error generating response please try again later."
        );
      }
    } catch (exception) {
      console.log("Error while creating user: ", exception);
      showNotification(
        "danger",
        "Error generating response please try again later."
      );
    }

    setIsProcessingAudio(false);
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

  // Toggle recording state and manage recording actions
  const handleToggleRecording = () => {
    if (!isRecording) {
      startRecording();
    } else {
      setIsProcessingAudio(true);
      stopRecording();
    }

    setIsRecording(!isRecording);
  };

  const startConversation = () => {
    setConversationId(v4());
    setMessageId(1);
    setOpen(true);
  };

  const endConversation = async () => {
    setIsEndingConversation(true);

    if (!isEndingConversation && messageId !== 1) {
      try {
        const res = await fetch(`${API_URL}/process-call`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            uuid: conversationId,
          }),
        });
        showNotification("success", "Conversation ended successfully!");
      } catch (exception) {
        console.log("Error ending conversation: ", exception);
      }

      setIsEndingConversation(false);
      setModalOpen(false);
      setOpen(false);
    } else {
      setIsEndingConversation(false);
      setModalOpen(false);
      setOpen(false);
    }
  };

  const endPlaying = () => {
    setIsPlaying(false);
    setAudioPath("");
  };

  return (
    <>
      <Notification
        open={notifyOpen}
        message={notifyMessage}
        color={notifyColor}
      />
      <main className="relative h-screen w-screen overflow-hidden flex flex-col items-center justify-between">
        <WavyBackground
          className={"absolute top-50 left-0 z-[-1]"}
          backgroundFill={"white"}
        />
        <div className="absolute flex flex-col h-full w-full justify-center items-center gap-5 px-3">
          <LinkPreview url="https://www.crossml.com/" className={"mb-5"}>
            <Image src={"/crossml.svg"} width={150} height={150} alt={"Logo"} />
          </LinkPreview>
          <div className="flex flex-col w-full justify-center items-center">
            <Typography
              level="h1"
              className="font-extrabold text-center"
              sx={{
                fontSize: "4rem",
                lineHeight: "1",
                [theme.breakpoints.down("md")]: {
                  fontSize: "3rem",
                },
              }}
            >
              Audio Summarizer
            </Typography>
            <Typography
              level="title-lg"
              className="text-blue-gray-200 text-center"
            >
              Condense Conversations, Capture Content
            </Typography>
          </div>
          <div className="flex flex-col md:flex-row justify-center items-center gap-3">
            <Button
              startDecorator={<AudioLines />}
              onClick={startConversation}
              sx={{
                backgroundColor: "black",
                "&:hover": {
                  backgroundColor: "black",
                },
              }}
            >
              Let&apos;s Listen
            </Button>
            <Button
              variant="outlined"
              color="neutral"
              startDecorator={<FileVolume />}
              onClick={() => router.push("/audios")}
              sx={{
                borderColor: "black",
                "&:hover": {
                  borderColor: "black",
                  backgroundColor: Color("grey").alpha(0.2).string(),
                },
              }}
            >
              Audio/Call Analysis
            </Button>
          </div>
        </div>

        <Drawer anchor={"bottom"} open={isOpen}>
          <ReactPlayer
            url={audioPath}
            playing={isPlaying}
            style={{
              display: "none",
            }}
            onEnded={endPlaying}
          />
          <div className="w-full h-full flex flex-col justify-center items-center px-3">
            <div className="w-full h-2/3 lg:w-1/6 flex flex-col justify-center items-center gap-7">
              <div className="w-full h-full flex flex-col justify-center items-center">
                {isRecording ? (
                  // Button for stopping recording
                  <button
                    disabled={isProcessingAudio || isPlaying}
                    onClick={handleToggleRecording}
                    className={`flex items-center justify-center ${
                      isProcessingAudio || isPlaying
                        ? "bg-gray-200"
                        : "bg-red-400 hover:bg-red-500"
                    } rounded-full w-20 h-20 focus:outline-none`}
                  >
                    {isProcessingAudio ? (
                      <CircularProgress />
                    ) : isPlaying ? (
                      <CircularProgress />
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-12 w-12 text-white lucide lucide-pause"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      >
                        <rect x="14" y="4" width="4" height="16" rx="1" />
                        <rect x="6" y="4" width="4" height="16" rx="1" />
                      </svg>
                    )}
                  </button>
                ) : (
                  // Button for starting recording
                  <button
                    disabled={isProcessingAudio || isPlaying}
                    onClick={handleToggleRecording}
                    className={`flex items-center justify-center ${
                      isProcessingAudio || isPlaying
                        ? "bg-gray-200"
                        : "bg-blue-400 hover:bg-blue-500"
                    } rounded-full w-20 h-20 focus:outline-none`}
                  >
                    {isProcessingAudio ? (
                      <CircularProgress />
                    ) : isPlaying ? (
                      <CircularProgress />
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-12 h-12 text-white lucide lucide-mic-vocal"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      >
                        <path d="m11 7.601-5.994 8.19a1 1 0 0 0 .1 1.298l.817.818a1 1 0 0 0 1.314.087L15.09 12" />
                        <path d="M16.5 21.174C15.5 20.5 14.372 20 13 20c-2.058 0-3.928 2.356-6 2-2.072-.356-2.775-3.369-1.5-4.5" />
                        <circle cx="16" cy="7" r="5" />
                      </svg>
                    )}
                  </button>
                )}

                <Typography
                  level="body-xs"
                  sx={{
                    marginTop: "10px",
                    color: "grey",
                  }}
                >
                  {isRecording
                    ? "Pause Recording."
                    : isProcessingAudio
                    ? "Processing Query.."
                    : isPlaying
                    ? "Agent Speaking.."
                    : "Start/Resume Recording."}
                </Typography>
              </div>
              <div className="flex flex-col justify-center items-center gap-2 w-full">
                <Button
                  variant="outlined"
                  color="neutral"
                  disabled={isProcessingAudio || isPlaying}
                  onClick={() => setModalOpen(true)}
                  sx={{
                    width: "100%",
                    borderColor: "black",
                    "&:hover": {
                      borderColor: "black",
                      backgroundColor: Color("grey").alpha(0.2).string(),
                    },
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </Drawer>

        <Modal open={isModalOpen} onClose={() => setModalOpen(false)}>
          <ModalDialog variant="outlined" role="alertdialog">
            <DialogTitle>
              <TriangleAlert />
              Confirmation
            </DialogTitle>
            <Divider />
            <DialogContent>
              Are you sure you want to end conversation?
            </DialogContent>
            <DialogActions>
              <Button
                variant="solid"
                color="danger"
                onClick={endConversation}
                disabled={
                  isProcessingAudio || isPlaying || isEndingConversation
                }
                loading={isEndingConversation}
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  justifyItems: "center",
                  alignItems: "center",
                  gap: 2,
                }}
              >
                {isEndingConversation ? "Ending.." : "End Conversation"}
              </Button>
              <Button
                variant="plain"
                color="neutral"
                onClick={() => setModalOpen(false)}
              >
                Cancel
              </Button>
            </DialogActions>
          </ModalDialog>
        </Modal>
      </main>
    </>
  );
}
