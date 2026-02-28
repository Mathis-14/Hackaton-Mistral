import { NextRequest, NextResponse } from "next/server";

const ELEVENLABS_API_KEY = process.env.ELEVEN_LABS_API_KEY;

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const action = formData.get("action") as string;

  if (action === "clone") {
    const name = formData.get("name") as string;
    const files = formData.getAll("files") as File[];

    const elevenLabsForm = new FormData();
    elevenLabsForm.append("name", name);
    elevenLabsForm.append("remove_background_noise", "true");
    for (const file of files) {
      elevenLabsForm.append("files", file);
    }

    const response = await fetch("https://api.elevenlabs.io/v1/voices/add", {
      method: "POST",
      headers: { "xi-api-key": ELEVENLABS_API_KEY! },
      body: elevenLabsForm,
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ error: errorText }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json({ voiceId: data.voice_id });
  }

  if (action === "speak") {
    const voiceId = formData.get("voiceId") as string;
    const text = formData.get("text") as string;

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ error: errorText }, { status: response.status });
    }

    const audioBuffer = await response.arrayBuffer();
    return new NextResponse(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": audioBuffer.byteLength.toString(),
      },
    });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
