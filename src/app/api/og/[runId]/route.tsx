import { ImageResponse } from "@vercel/og";
import { createClient } from "@supabase/supabase-js";

export const runtime = "edge";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ runId: string }> }
) {
  const { runId } = await params;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data } = await supabase
    .from("runs")
    .select("model_display_name, accuracy, correct_count, total_questions")
    .eq("id", runId)
    .single();

  if (!data) {
    return new ImageResponse(
      (
        <div
          style={{
            background: "#191919",
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "monospace",
          }}
        >
          <span style={{ color: "#5A5A5A", fontSize: 20 }}>report not found</span>
        </div>
      ),
      { width: 1200, height: 630 }
    );
  }

  const accuracy = Math.round(data.accuracy * 100);

  return new ImageResponse(
    (
      <div
        style={{
          background: "#191919",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: "64px 80px",
          fontFamily: "monospace",
        }}
      >
        <div style={{ display: "flex", marginBottom: 48 }}>
          <span style={{ color: "#5A5A5A", fontSize: 16, letterSpacing: 3, textTransform: "uppercase" }}>
            webbench
          </span>
        </div>

        <div style={{ color: "#8A8A8A", fontSize: 20, marginBottom: 12, letterSpacing: 1 }}>
          {data.model_display_name}
        </div>

        <div style={{ display: "flex", alignItems: "baseline", gap: 32, marginBottom: 48 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ color: "#5A5A5A", fontSize: 12, letterSpacing: 2, textTransform: "uppercase" }}>
              accuracy
            </span>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
              <span style={{ color: "#ECECEC", fontSize: 96, fontWeight: 600, lineHeight: 1, letterSpacing: -3 }}>
                {accuracy}
              </span>
              <span style={{ color: "#5A5A5A", fontSize: 40 }}>%</span>
            </div>
          </div>
        </div>

        <div style={{ color: "#5A5A5A", fontSize: 18, marginBottom: 8 }}>
          {data.correct_count}/{data.total_questions} correct
        </div>

        <div style={{ marginTop: "auto", color: "#3A3A3A", fontSize: 14, letterSpacing: 1 }}>
          benchmarked locally in browser · no api key · no server
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
