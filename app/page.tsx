"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

export default function Home() {
  const [videoUrl, setVideoUrl] = useState("");
  const [transcript, setTranscript] = useState("");
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchTranscript = async () => {
    setLoading(true);
    setTranscript("");
    setSummary("");
    setError("");

    try {
      const res = await fetch("/api/getTranscript", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoUrl }),
      });

      const data = await res.json();

      if (res.ok) {
        setTranscript(data.transcript);
        setSummary(data.summary);
      } else {
        setError(data.error || "Failed to fetch transcript.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white">
      <div className="w-full max-w-2xl bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
        <h1 className="text-2xl font-bold text-center mb-4">
          🎓 YouTube Lecture Summarizer
        </h1>
        <p className="text-center text-gray-600 dark:text-gray-400 mb-4">
          Enter a YouTube URL to extract and summarize its transcript.
        </p>

        <Input
          type="text"
          placeholder="Paste YouTube URL here..."
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          className="w-full mb-4"
        />

        <Button
          onClick={fetchTranscript}
          disabled={!videoUrl || loading}
          className="w-full flex items-center justify-center"
        >
          {loading ? <Loader2 className="animate-spin mr-2" size={20} /> : "Get Transcript"}
        </Button>

        {error && <p className="text-red-500 text-center mt-4">{error}</p>}

        {transcript && (
          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-2">📝 Transcript</h2>
            <Textarea className="w-full h-40" value={transcript} readOnly />
          </div>
        )}

        {summary && (
          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-2">📄 Summary</h2>
            <Textarea className="w-full h-32" value={summary} readOnly />
          </div>
        )}
      </div>
    </div>
  );
}
