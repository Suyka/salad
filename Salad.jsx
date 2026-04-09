import { useState, useEffect, useRef } from "react";

const SALAD_SYSTEM_PROMPT = `あなたはSaladブラウザのAIシェフ「Shake」です。
ユーザーのキーワードに対して、本当に必要な情報だけを厳選して返してください。

ルール：
- 記事・情報は必ず2〜3個だけに絞る（情報過多にしない）
- それぞれを「タイトル」「要点（2〜3行）」「なぜあなたに必要か（1行）」の形で返す
- 余計な前置きや締めの言葉は不要
- JSON形式で返す：
{
  "articles": [
    {
      "title": "記事タイトル",
      "summary": "要点を2〜3行で",
      "why": "なぜあなたに必要か"
    }
  ],
  "shakeMessage": "Shakeからのひとこと（優しく短く）"
}`;

export default function Salad() {
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [crock, setCrock] = useState([]);
  const [showCrock, setShowCrock] = useState(false);
  const [wellbeing, setWellbeing] = useState(false);
  const [sessionMinutes, setSessionMinutes] = useState(0);
  const [dressing, setDressing] = useState("standard");
  const sessionStart = useRef(Date.now());
  const timerRef = useRef(null);

  // Load crock from storage
  useEffect(() => {
    try {
      const saved = window.localStorage?.getItem("salad-crock");
      if (saved) setCrock(JSON.parse(saved));
    } catch {}
  }, []);

  // Wellbeing timer — 20min for demo friendliness
  useEffect(() => {
    timerRef.current = setInterval(() => {
      const mins = Math.floor((Date.now() - sessionStart.current) / 60000);
      setSessionMinutes(mins);
      if (mins > 0 && mins % 20 === 0) setWellbeing(true);
    }, 30000);
    return () => clearInterval(timerRef.current);
  }, []);

  const dressingPrompt = {
    standard: "通常通り厳選して返してください。",
    deep: "より深い分析と背景知識を含めて返してください。",
    simple: "中学生でもわかるように、できるだけ簡単な言葉で返してください。",
    action: "すぐに行動できるアクションアイテムを中心に返してください。",
  };

  async function callShake() {
    if (!keyword.trim()) return;
    setLoading(true);
    setResult(null);
    setError(null);
    setWellbeing(false);

    const userPrompt = `キーワード：「${keyword}」\nDressingスタイル：${dressingPrompt[dressing]}`;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: SALAD_SYSTEM_PROMPT,
          messages: [{ role: "user", content: userPrompt }],
        }),
      });
      const data = await res.json();
      const raw = data.content?.map((i) => i.text || "").join("") || "";
      const clean = raw.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setResult(parsed);
    } catch {
      setError("🥗 Shakeが少し疲れているみたい。もう一度試してね。");
    } finally {
      setLoading(false);
    }
  }

  function saveToCrock(article) {
    const newCrock = [
      ...crock,
      { ...article, keyword, savedAt: new Date().toISOString(), id: Date.now() },
    ];
    setCrock(newCrock);
    try { window.localStorage?.setItem("salad-crock", JSON.stringify(newCrock)); } catch {}
  }

  function removeFromCrock(id) {
    const updated = crock.filter((c) => c.id !== id);
    setCrock(updated);
    try { window.localStorage?.setItem("salad-crock", JSON.stringify(updated)); } catch {}
  }

  const dressingLabels = {
    standard: "🥗 標準",
    deep: "🔍 深掘り",
    simple: "🌱 やさしく",
    action: "⚡ アクション",
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #e8f5e9 0%, #f0fdf4 40%, #fafff5 100%)",
      fontFamily: "'Georgia', serif",
      padding: "0",
      position: "relative",
      overflow: "hidden",
    }}>

      {/* Background texture */}
      <div style={{
        position: "fixed", inset: 0, opacity: 0.03,
        backgroundImage: "radial-gradient(circle at 2px 2px, #166534 1px, transparent 0)",
        backgroundSize: "32px 32px", pointerEvents: "none",
      }} />

      {/* Wellbeing notification */}
      {wellbeing && (
        <div style={{
          position: "fixed", top: 20, right: 20, zIndex: 100,
          background: "white", border: "1.5px solid #bbf7d0",
          borderRadius: 16, padding: "16px 20px", maxWidth: 280,
          boxShadow: "0 4px 24px rgba(22,101,52,0.12)",
          animation: "fadeIn 0.4s ease",
        }}>
          <div style={{ fontSize: 20, marginBottom: 6 }}>🥤</div>
          <div style={{ fontSize: 13, color: "#166534", fontWeight: 600, marginBottom: 4 }}>
            Shakeより
          </div>
          <div style={{ fontSize: 12, color: "#4b7a5e", lineHeight: 1.6 }}>
            少し目を休めて、お水を飲まない？<br />
            {sessionMinutes}分、よく頑張ったよ。
          </div>
          <button onClick={() => setWellbeing(false)} style={{
            marginTop: 10, fontSize: 11, color: "#86efac",
            background: "none", border: "none", cursor: "pointer", padding: 0,
          }}>閉じる</button>
        </div>
      )}

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "48px 24px 80px" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 8, letterSpacing: "-2px", lineHeight: 1 }}>
            🥗
          </div>
          <h1 style={{
            fontSize: 42, fontWeight: 400, color: "#14532d",
            margin: "0 0 8px", letterSpacing: "-1px", fontStyle: "italic",
          }}>
            Salad
          </h1>
          <p style={{ fontSize: 13, color: "#6b9e7e", margin: 0, letterSpacing: "0.08em" }}>
            本当に必要な情報だけを、あなたのために。
          </p>
        </div>

        {/* Dressing selector */}
        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 20, flexWrap: "wrap" }}>
          {Object.entries(dressingLabels).map(([key, label]) => (
            <button key={key} onClick={() => setDressing(key)} style={{
              padding: "6px 16px", borderRadius: 20, fontSize: 12,
              border: dressing === key ? "1.5px solid #16a34a" : "1.5px solid #bbf7d0",
              background: dressing === key ? "#16a34a" : "white",
              color: dressing === key ? "white" : "#4b7a5e",
              cursor: "pointer", transition: "all 0.2s", fontFamily: "inherit",
            }}>{label}</button>
          ))}
        </div>

        {/* Search bar */}
        <div style={{ display: "flex", gap: 10, marginBottom: 32 }}>
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && callShake()}
            placeholder="何を知りたい？"
            style={{
              flex: 1, padding: "14px 22px", borderRadius: 30,
              border: "1.5px solid #bbf7d0", fontSize: 15,
              fontFamily: "inherit", color: "#1a3c2a", outline: "none",
              background: "rgba(255,255,255,0.8)",
              boxShadow: "0 2px 12px rgba(22,101,52,0.06)",
              transition: "border 0.2s",
            }}
          />
          <button
            onClick={callShake}
            disabled={loading}
            style={{
              padding: "14px 28px", borderRadius: 30,
              background: loading ? "#86efac" : "linear-gradient(135deg, #16a34a, #15803d)",
              color: "white", border: "none", fontSize: 14,
              fontFamily: "inherit", cursor: loading ? "not-allowed" : "pointer",
              boxShadow: "0 4px 14px rgba(22,101,52,0.25)",
              transition: "all 0.2s", whiteSpace: "nowrap",
            }}>
            {loading ? "調理中..." : "✨ Dressing"}
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#6b9e7e" }}>
            <div style={{ fontSize: 32, marginBottom: 12, animation: "spin 2s linear infinite", display: "inline-block" }}>🥗</div>
            <div style={{ fontSize: 13, letterSpacing: "0.05em" }}>
              Shakeがあなたのために厳選しています...
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            background: "#fef2f2", border: "1.5px solid #fca5a5",
            borderRadius: 16, padding: 20, color: "#991b1b", fontSize: 14, textAlign: "center",
          }}>{error}</div>
        )}

        {/* Results */}
        {result && (
          <div>
            {/* Shake message */}
            <div style={{
              background: "rgba(255,255,255,0.7)", border: "1.5px solid #bbf7d0",
              borderRadius: 16, padding: "14px 20px", marginBottom: 20,
              display: "flex", alignItems: "center", gap: 12,
            }}>
              <span style={{ fontSize: 22 }}>🤖</span>
              <div>
                <div style={{ fontSize: 11, color: "#6b9e7e", marginBottom: 2 }}>Shakeより</div>
                <div style={{ fontSize: 13, color: "#1a3c2a" }}>{result.shakeMessage}</div>
              </div>
            </div>

            {/* Articles */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {result.articles?.map((article, i) => (
                <div key={i} style={{
                  background: "rgba(255,255,255,0.85)",
                  border: "1.5px solid #d1fae5",
                  borderRadius: 20, padding: "22px 24px",
                  boxShadow: "0 2px 16px rgba(22,101,52,0.07)",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, color: "#6b9e7e", marginBottom: 6, letterSpacing: "0.05em" }}>
                        📰 記事 {i + 1}
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 600, color: "#14532d", marginBottom: 10, lineHeight: 1.4 }}>
                        {article.title}
                      </div>
                      <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.8, marginBottom: 12 }}>
                        {article.summary}
                      </div>
                      <div style={{
                        fontSize: 12, color: "#16a34a",
                        background: "#f0fdf4", borderRadius: 8, padding: "6px 12px",
                        display: "inline-block",
                      }}>
                        💡 {article.why}
                      </div>
                    </div>
                    <button
                      onClick={() => saveToCrock(article)}
                      title="Crockに保存"
                      style={{
                        padding: "8px 14px", borderRadius: 12, fontSize: 12,
                        border: "1.5px solid #bbf7d0", background: "white",
                        color: "#16a34a", cursor: "pointer", whiteSpace: "nowrap",
                        fontFamily: "inherit", transition: "all 0.2s",
                      }}>
                      🫙 Crock
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Crock toggle */}
        <div style={{ marginTop: 40, textAlign: "center" }}>
          <button onClick={() => setShowCrock(!showCrock)} style={{
            padding: "10px 24px", borderRadius: 20, fontSize: 13,
            border: "1.5px solid #bbf7d0", background: "white",
            color: "#16a34a", cursor: "pointer", fontFamily: "inherit",
          }}>
            🫙 Crock {crock.length > 0 ? `(${crock.length})` : ""}
            {showCrock ? " ▲" : " ▼"}
          </button>
        </div>

        {/* Crock contents */}
        {showCrock && (
          <div style={{ marginTop: 20 }}>
            {crock.length === 0 ? (
              <div style={{ textAlign: "center", color: "#6b9e7e", fontSize: 13, padding: 20 }}>
                まだ何も漬け込まれていません。<br />気になった記事を🫙Crockへ。
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {crock.map((item) => (
                  <div key={item.id} style={{
                    background: "rgba(255,255,255,0.7)", border: "1.5px dashed #bbf7d0",
                    borderRadius: 16, padding: "16px 20px",
                    display: "flex", justifyContent: "space-between", alignItems: "flex-start",
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, color: "#6b9e7e", marginBottom: 4 }}>
                        🔍 {item.keyword} · {new Date(item.savedAt).toLocaleDateString("ja-JP")}
                      </div>
                      <div style={{ fontSize: 14, color: "#14532d", fontWeight: 600 }}>{item.title}</div>
                      <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>{item.summary}</div>
                    </div>
                    <button onClick={() => removeFromCrock(item.id)} style={{
                      background: "none", border: "none", cursor: "pointer",
                      color: "#d1d5db", fontSize: 16, padding: "0 4px",
                    }}>×</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: none; } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        input:focus { border-color: #16a34a !important; box-shadow: 0 2px 16px rgba(22,101,52,0.12) !important; }
      `}</style>
    </div>
  );
}
