import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";

const execPromise = promisify(exec);
const ytDlpPath = `"C:\\yt-dlp\\yt-dlp.exe"`; //  Make sure this path is correct

export async function POST(req: Request) {
  try {
    console.log("✅ API was hit! Processing request...");

    const { videoUrl } = await req.json();
    console.log("🎯 Received video URL:", videoUrl);

    if (!videoUrl) {
      console.error("❌ No video URL provided!");
      return NextResponse.json({ error: "Missing video URL" }, { status: 400 });
    }

    // Extract video ID from URL
    const videoId = new URL(videoUrl).searchParams.get("v");
    if (!videoId) {
      console.error("❌ Could not extract video ID!");
      return NextResponse.json({ error: "Invalid YouTube URL" }, { status: 400 });
    }

    // Subtitle file name
    const subtitleFile = path.resolve(`./${videoId}.en.vtt`);

    // Run yt-dlp to download subtitles
    const command = `${ytDlpPath} --write-auto-sub --sub-lang en --skip-download --output "%(id)s" "${videoUrl}"`;
    console.log("🚀 Running command:", command);

    await execPromise(command);

    // Check if subtitles were downloaded
    if (!fs.existsSync(subtitleFile)) {
      console.error("❌ No subtitles found!");
      return NextResponse.json({ error: "No subtitles found for this video." }, { status: 404 });
    }

    // Read and clean up subtitles
    let subtitles = fs.readFileSync(subtitleFile, "utf8");
    fs.unlinkSync(subtitleFile); //  Delete file after reading

    // Remove timestamps and metadata
    subtitles = subtitles
    .split("\n")
    .filter((line) => !line.startsWith("WEBVTT") && !line.match(/\d{2}:\d{2}:\d{2}/)) // Remove timestamps
    .map((line) => line.trim())
    .filter((line, index, self) => line && self.indexOf(line) === index) // Remove duplicate lines
    .join(" ");

    console.log("📝 Transcript Extracted!");
    
    // ✅ Now send the transcript to OpenAI for summarization
    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`, 
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          { role: "system", content: "Summarize this YouTube lecture in brainrot terms." },
          { role: "user", content: subtitles },
        ],
        max_tokens: 300,
      }),
    });

    const openaiData = await openaiResponse.json();
    const summary = openaiData.choices?.[0]?.message?.content || "No summary available.";

    console.log("📝 Summary Generated!");

    // ✅ Debug: Log the final response
    console.log("📜 Final API Response:", JSON.stringify({ transcript: subtitles, summary }, null, 2));

    return NextResponse.json({ transcript: subtitles, summary });

  } catch (error) {
    console.error("🔥 Server Error:", error);
    return NextResponse.json({ error: "Internal server error", details: String(error) }, { status: 500 });
  }
}
