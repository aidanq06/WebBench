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
    .from("reports")
    .select("model_display_name, accuracy, correct_count, total_questions, difficulty_scores, subject_scores")
    .eq("id", runId)
    .single();

  if (!data) {
    return new ImageResponse(
      (
        <div
          style={{
            background: "#09090b",
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "monospace",
          }}
        >
          <span style={{ color: "#71717a", fontSize: 24 }}>report not found</span>
        </div>
      ),
      { width: 1200, height: 630 }
    );
  }

  const accuracy = Math.round(data.accuracy * 100);
  const difficultyScores = data.difficulty_scores as Array<{
    difficulty: string;
    correct: number;
    total: number;
    accuracy: number;
  }>;

  const easy = difficultyScores.find((d) => d.difficulty === "easy");
  const medium = difficultyScores.find((d) => d.difficulty === "medium");
  const hard = difficultyScores.find((d) => d.difficulty === "hard");

  const scoreColor =
    accuracy >= 70 ? "#22c55e" : accuracy >= 40 ? "#eab308" : "#ef4444";

  return new ImageResponse(
    (
      <div
        style={{
          background: "#09090b",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: "72px 80px",
          fontFamily: "monospace",
          border: "1px solid #27272a",
        }}
      >
        {/* top: wordmark */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 48,
          }}
        >
          <span style={{ color: "#71717a", fontSize: 18, letterSpacing: 2 }}>
            ⬛ webbench
          </span>
        </div>

        {/* model name */}
        <div
          style={{
            color: "#a1a1aa",
            fontSize: 22,
            marginBottom: 8,
            letterSpacing: 1,
          }}
        >
          {data.model_display_name}
        </div>

        {/* big score */}
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 12,
            marginBottom: 56,
          }}
        >
          <span
            style={{
              color: scoreColor,
              fontSize: 120,
              fontWeight: 700,
              lineHeight: 1,
              letterSpacing: -4,
            }}
          >
            {accuracy}%
          </span>
          <span style={{ color: "#52525b", fontSize: 28 }}>
            {data.correct_count}/{data.total_questions} correct
          </span>
        </div>

        {/* difficulty blocks */}
        <div style={{ display: "flex", gap: 16, marginBottom: 48 }}>
          {[easy, medium, hard].map((d) => {
            if (!d) return null;
            const pct = Math.round(d.accuracy * 100);
            return (
              <div
                key={d.difficulty}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 6,
                  border: "1px solid #27272a",
                  padding: "20px 36px",
                  minWidth: 130,
                }}
              >
                <span style={{ color: "#fafafa", fontSize: 36, fontWeight: 600 }}>
                  {pct}%
                </span>
                <span style={{ color: "#71717a", fontSize: 14 }}>{d.difficulty}</span>
                <span style={{ color: "#3f3f46", fontSize: 12 }}>
                  {d.correct}/{d.total}
                </span>
              </div>
            );
          })}
        </div>

        {/* footer */}
        <div
          style={{
            marginTop: "auto",
            color: "#3f3f46",
            fontSize: 16,
            letterSpacing: 1,
          }}
        >
          benchmarked locally in browser · no api key · no server
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
