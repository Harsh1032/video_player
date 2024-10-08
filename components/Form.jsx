"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from 'next/navigation';
import Papa from "papaparse";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaTrashAlt, FaHistory, FaSync } from "react-icons/fa";

const Form = () => {
  const baseURL = process.env.BASE_URL;

  const [name, setName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [timeFullScreen, setTimeFullScreen] = useState("");
  const [image, setImage] = useState("");
  const [videoDuration, setVideoDuration] = useState(null);
  const [uploadStatus, setUploadStatus] = useState(""); // State to manage upload status
  const [mode, setMode] = useState("single"); // State to manage form mode
  const [csvFile, setCsvFile] = useState(null); // State to manage CSV file
  const [csvFiles, setCsvFiles] = useState([]);
  const [showCsvDropdown, setShowCsvDropdown] = useState(false);
  const [videos, setVideos] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showResetDropdown, setShowResetDropdown] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false); // State for tracking reset

  const videoRef = useRef(null);
  const fileInputRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    fetchVideos();
    fetchCsvFiles();
  }, []);

  const fetchCsvFiles = async () => {
    try {
      const response = await fetch(`/api/csv-files`);
      const data = await response.json();
      if (response.ok) {
        setCsvFiles(data);
      } else {
        console.error(data.error);
      }
    } catch (error) {
      console.error("Error fetching CSV files:", error);
    }
  };

  const fetchVideos = async () => {
    try {
      const response = await fetch(`/api/video/videos`);
      const data = await response.json();
      if (response.ok) {
        setVideos(data);
      } else {
        console.error(data.error);
      }
    } catch (error) {
      console.error("Error fetching videos:", error);
    }
  };

   // API Call to reset both videos and CSVs
   const resetDatabase = async () => {
    try {
      setIsDeleting(true);  // Set loading state
      const response = await fetch(`/api/reset-button`, {
        method: "DELETE",  // Call the DELETE endpoint to reset
      });

      const data = await response.json();
      if (response.ok) {
        toast.success(data.message);  // Show success message
        fetchVideos(); // Refresh videos after reset
        fetchCsvFiles(); // Refresh CSV history after reset
      } else {
        toast.error(data.error);
      }
    } catch (error) {
      console.error("Error resetting the database:", error);
      toast.error("An error occurred while resetting the database.");
    } finally {
      setIsDeleting(false); // Reset loading state
    }
  };


  const deleteVideo = async (id) => {
    try {
      const response = await fetch(`/api/video/${id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (response.ok) {
        toast.success("Video deleted successfully.");
        setVideos((prevVideos) =>
          prevVideos.filter((video) => video.id !== id)
        );
      } else {
        toast.error(data.error);
      }
    } catch (error) {
      console.error("Error deleting video:", error);
      toast.error("An error occurred while deleting the video.");
    }
  };

  const handleSubmission = async (e) => {
    e.preventDefault();

    if (mode === "bulk") {
      if (!csvFile) {
        alert("Please upload a CSV file.");
        return;
      }

      setUploadStatus("Uploading...");

      Papa.parse(csvFile, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          const validRows = results.data.filter(
            (row) =>
              row.name && row.websiteUrl && row.videoUrl && row.timeFullScreen && row.image
          );

          const videos = validRows.map((row) => ({
            name: row.name,
            websiteUrl: row.websiteUrl,
            videoUrl: row.videoUrl,
            timeFullScreen: parseInt(row.timeFullScreen, 10),
            image: row.image,
            videoDuration: null,
          }));

          for (const video of videos) {
            video.videoDuration = await getVideoDuration(video.videoUrl);
          }

          await submitBulkData(videos, csvFile.name);
          setUploadStatus("");
          setCsvFile(null);
          if (fileInputRef.current) {
            fileInputRef.current.value = null;
          }
        },
        error: (error) => {
          console.error("Error parsing CSV: ", error);
        },
      });
    } else {
      if (videoRef.current && videoDuration === null) {
        videoRef.current.load();
        videoRef.current.onloadedmetadata = async () => {
          setVideoDuration(Math.floor(videoRef.current.duration));
          await submitFormData(Math.floor(videoRef.current.duration));
        };
      } else {
        await submitFormData(videoDuration);
      }
    }
  };

  const submitFormData = async (duration) => {
    const formDataToSubmit = {
      name,
      websiteUrl,
      videoUrl,
      timeFullScreen,
      videoDuration: duration,
      image,
    };

    try {
      const response = await fetch(`/api/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formDataToSubmit),
      });

      const data = await response.json();
      if (response.ok) {
        const videoId = data.link.split("/").pop();
        router.push(`/video/${videoId}`);
        fetchVideos();
      } else {
        toast.error(`${data.error}`);
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("An error occurred while generating the video link.");
    }
  };

  const CHUNK_SIZE = 100; // Size of each chunk for uploads



  const submitBulkData = async (videos, originalFileName) => {
    try {
      // Split videos into chunks
      const chunks = splitIntoChunks(videos, CHUNK_SIZE);
      const BATCH_DELAY = 5000; // Delay in milliseconds (5 seconds)
  
      for (const chunk of chunks) {
        const response = await fetch(`/api/generate-bulk`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ videos: chunk, originalFileName }),
        });
  
        const data = await response.json();
        if (!response.ok) {
          toast.error(`${data.error}`);
        } else {
          // Optionally, handle successful responses per chunk
          toast.success("Templates successfully generated");
          generateDownloadableFile(data.videoLinks, chunk);
        }
  
        // Add a delay before processing the next chunk
        await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
      }
      
      fetchVideos(); // Refresh videos after all chunks have been uploaded
      fetchCsvFiles(); // Refresh CSV history after upload
    } catch (error) {
      console.error("Error:", error);
      toast.error("An error occurred while generating the bulk video links.");
    }
  };
  

  // Function to split the array into chunks
  const splitIntoChunks = (array, chunkSize) => {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  };
  
  const getVideoDuration = (url) => {
    return new Promise((resolve) => {
      const video = document.createElement("video");
      video.src = url;
      video.onloadedmetadata = () => {
        resolve(Math.floor(video.duration));
      };
    });
  };

  const generateDownloadableFile = (links, videos) => {
    const rows = videos.map((video, index) => ({
      ...video,
      link: links[index],
    }));
  
    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "generated_videos.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleVideoUrlChange = (e) => {
    setVideoUrl(e.target.value);
    if (videoRef.current) {
      videoRef.current.load();
    }
  };

  const handleModeSwitch = () => {
    setMode(mode === "single" ? "bulk" : "single");
  };

  const deleteCsvFile = async (id) => {
    try {
      const response = await fetch(`/api/csv-files/${id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (response.ok) {
        toast.success("CSV file and associated videos deleted successfully.");
        setCsvFiles((prevCsvFiles) =>
          prevCsvFiles.filter((file) => file._id !== id)
        );

        const updatedVideos = videos.filter(
          (video) => video.csvFile !== id
        );
        setVideos(updatedVideos);
      } else {
        toast.error(data.error);
      }
    } catch (error) {
      console.error("Error deleting CSV file:", error);
      toast.error("An error occurred while deleting the CSV file.");
    }
  };

  const renderVideos = (videoList) => {
    return videoList.map((video) => (
      <li key={video.id} className="flex items-center justify-between p-2">
        <span>{video.name}</span>
        <button
          onClick={() => deleteVideo(video.id)}
          className="p-1 bg-red-500 hover:bg-red-400 text-white rounded"
        >
          <FaTrashAlt />
        </button>
      </li>
    ));
  };

  const renderCsvFiles = (csvFileList) => {
    return csvFileList.map((file) => (
      <li key={file._id} className="flex items-center justify-between p-2">
        <span>{file.fileName}</span>
        <span>{file.numberOfPages}</span>
        <span>{new Date(file.generatedAt).toLocaleDateString()}</span>
        <a
          href={file.downloadLink}
          className="p-1 bg-blue-500 hover:bg-blue-400 text-white rounded"
          download
        >
          Download
        </a>
        <button
          onClick={() => deleteCsvFile(file._id)}
          className="p-1 bg-red-500 hover:bg-red-400 text-white rounded ml-2"
        >
          <FaTrashAlt />
        </button>
      </li>
    ));
  };

  return (
    <div className="w-full h-full flex flex-col justify-center items-center">
      <button
        type="button"
        className="w-[200px] h-[40px] rounded-lg p-2 mb-5 bg-gray-600 hover:bg-gray-500 text-white"
        onClick={handleModeSwitch}
      >
        {mode === "single" ? "Switch to Bulk Mode" : "Switch to Single Form"}
      </button>

      <form
        className="xs:w-[90%] lg:w-[40%] h-[70%] flex flex-col gap-4 items-center justify-center rounded-lg p-2 bg-white"
        onSubmit={handleSubmission}
      >
        {mode === "single" ? (
          <>
            <input
              type="text"
              placeholder="Name"
              required
              className="lg:w-[50%] h-[10%] xs:w-[80%] rounded-lg p-2 bg-white text-center border border-black block whitespace-nowrap overflow-hidden text-ellipsis"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              type="url"
              placeholder="Website URL"
              required
              className="lg:w-[50%] h-[10%] xs:w-[80%] rounded-lg p-2 bg-white text-center border border-black"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
            />
            <input
              type="url"
              placeholder="Video URL"
              required
              className="lg:w-[50%] h-[10%] xs:w-[80%] rounded-lg p-2 bg-white text-center border border-black"
              value={videoUrl}
              onChange={handleVideoUrlChange}
            />
            <input
              type="number"
              placeholder="Time to go full screen"
              required
              className="lg:w-[50%] h-[10%] xs:w-[80%] rounded-lg p-2 bg-white text-center border border-black"
              value={timeFullScreen}
              onChange={(e) => setTimeFullScreen(e.target.value)}
            />
            <input
              type="url"
              placeholder="Set Image URL"
              required
              className="lg:w-[50%] h-[10%] xs:w-[80%] rounded-lg p-2 bg-white text-center border border-black"
              value={image}
              onChange={(e) => setImage(e.target.value)}
            />
            <button
              type="submit"
              className="w-[100px] h-[40px] rounded-lg p-2 mt-5 bg-indigo-600 hover:bg-indigo-500 text-white"
            >
              Submit
            </button>
          </>
        ) : (
          <>
            <input
              type="file"
              accept=".csv"
              required
              className="lg:w-[50%] h-[10%] xs:w-[80%] rounded-lg p-2 bg-white text-center border border-black"
              ref={fileInputRef}
              onChange={(e) => setCsvFile(e.target.files[0])}
            />
            <button
              type="submit"
              className="w-[100px] h-[40px] rounded-lg p-2 mt-5 bg-indigo-600 hover:bg-indigo-500 text-white"
            >
              {uploadStatus ? uploadStatus : "Upload CSV"}
            </button>
          </>
        )}

        <ToastContainer />
      </form>

      <div className="absolute top-4 right-8">
        <button 
          className="relative z-10 p-2 bg-gray-600 hover:bg-gray-500 text-white rounded-full " 
          onClick={resetDatabase} 
          disabled={isDeleting}
          onMouseEnter={() => setShowResetDropdown(true)}
          onMouseLeave={() => setShowResetDropdown(false)}
          >
          <FaSync />
        </button>
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="relative z-10 p-2 bg-gray-600 hover:bg-gray-500 text-white rounded-full ml-2"
        >
          <FaTrashAlt />
        </button>
        <button
          onClick={() => setShowCsvDropdown(!showCsvDropdown)}
          className="relative z-10 p-2 bg-gray-600 hover:bg-gray-500 text-white rounded-full ml-2"
        >
          <FaHistory />
        </button>
        {showResetDropdown && (
          <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-300 rounded-lg shadow-lg z-20 max-h-64 overflow-y-scroll no-scrollbar">
              <div className="flex justify-center p-2">
                <span className="text-xl font-semibold">
                  RESET THE DATABASE
                </span>
              </div>
          </div>
        )}
        {showDropdown && (
          <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-300 rounded-lg shadow-lg z-20 max-h-64 overflow-y-scroll no-scrollbar">
            <ul className="divide-y divide-gray-200">{renderVideos(videos)}</ul>
            {videos.length <= 0 && (
              <div className="flex justify-center p-2">
                <span className="text-xl font-semibold">
                  No video generated
                </span>
              </div>
            )}
          </div>
        )}

        {showDropdown && (
          <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-300 rounded-lg shadow-lg z-20 max-h-64 overflow-y-scroll no-scrollbar">
            <ul className="divide-y divide-gray-200">{renderVideos(videos)}</ul>
            {videos.length <= 0 && (
              <div className="flex justify-center p-2">
                <span className="text-xl font-semibold">
                  No video generated
                </span>
              </div>
            )}
          </div>
        )}

        {showCsvDropdown && (
          <div className="absolute right-0 mt-2 w-80 max-w-xs bg-white border border-gray-300 rounded-lg shadow-lg z-20 max-h-64 overflow-y-scroll no-scrollbar">
            <ul className="divide-y divide-gray-200">
              {renderCsvFiles(csvFiles)}
            </ul>
            {csvFiles.length <= 0 && (
              <div className="flex justify-center p-2">
                <span className="text-xl font-semibold">
                  No CSV files generated
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      <video
        ref={videoRef}
        style={{ display: "none" }}
        onLoadedMetadata={(e) =>
          setVideoDuration(Math.floor(e.target.duration))
        }
      >
        <source src={videoUrl} />
      </video>
    </div>
  );
};

export default Form;