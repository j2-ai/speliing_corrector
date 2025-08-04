import React, { useState } from "react";

function App() {
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleCheck = async () => {
    if (!text.trim()) return;
    setLoading(true);

    try {
      const res = await fetch("http://localhost:5080/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      alert("서버 오류: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const applyCorrections = (text, corrections) => {
    if (!corrections || corrections.length === 0) return text;

    let corrected = "";
    let lastIndex = 0;

    corrections.forEach((c) => {
      corrected += text.slice(lastIndex, c.start) + c.correct;
      lastIndex = c.end;
    });
    corrected += text.slice(lastIndex);

    return corrected;
  };

  // 밑줄 + tooltip UI
  const renderText = () => {
    if (!result) return "";

    if (!result.corrections || result.corrections.length === 0) {
      return <span style={{ color: "gray" }}>교정할 부분이 없습니다.</span>;
    }

    let output = [];
    let lastIndex = 0;

    result.corrections.forEach((c, idx) => {
      output.push(result.original.slice(lastIndex, c.start));
      output.push(
        <span
          key={idx}
          className="underline-text"
        >
          {result.original.slice(c.start, c.end)}
          <span className="tooltip-box">수정 제안: <strong>{c.correct}</strong></span>
        </span>
      );
      lastIndex = c.end;
    });

    output.push(result.original.slice(lastIndex));
    return output;
  };

  return (
    <div
      style={{
        padding: "40px",
        fontFamily: "sans-serif",
        maxWidth: "800px",
        margin: "0 auto",
      }}
    >
      <h1 style={{ fontSize: "28px", textAlign: "center" }}>📝 맞춤법 교정기</h1>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={5}
        style={{
          width: "100%",
          fontSize: "16px",
          padding: "10px",
          border: "1px solid #ccc",
          borderRadius: "6px",
        }}
        placeholder="텍스트를 입력하세요..."
      />

      <div style={{ textAlign: "center", marginTop: "15px" }}>
        <button
          onClick={handleCheck}
          disabled={loading}
          style={{
            padding: "8px 20px",
            fontSize: "16px",
            border: "1px solid #555",
            borderRadius: "6px",
            background: "#f8f8f8",
            cursor: "pointer",
          }}
        >
          {loading ? "검사 중..." : "검사하기"}
        </button>
      </div>

      {result && (
        <div style={{ marginTop: "20px" }}>
          <div
            style={{
              background: "#f6f6f6",
              padding: "15px",
              borderRadius: "6px",
              fontSize: "18px",
              lineHeight: "1.6",
              minHeight: "30px",
            }}
          >
            {renderText()}
          </div>

          {result.corrections && result.corrections.length > 0 && (
            <div
              style={{
                marginTop: "10px",
                padding: "10px",
                background: "#eef9ff",
                borderRadius: "6px",
                fontSize: "18px",
              }}
            >
              <strong>최종 교정된 문장: </strong>
              {applyCorrections(result.original, result.corrections)}
            </div>
          )}
        </div>
      )}

      {/* Tooltip CSS 추가 */}
      <style>{`
        .underline-text {
          text-decoration: underline;
          text-decoration-color: red;
          text-decoration-thickness: 2px;
          cursor: pointer;
          position: relative;
        }

        .tooltip-box {
          visibility: hidden;
          opacity: 0;
          position: absolute;
          bottom: 125%;
          left: 50%;
          transform: translateX(-50%);
          background: #333;
          color: #fff;
          padding: 6px 10px;
          border-radius: 6px;
          font-size: 14px;
          white-space: nowrap;
          z-index: 10;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          transition: opacity 0.2s ease-in-out;
        }

        .underline-text:hover .tooltip-box {
          visibility: visible;
          opacity: 1;
        }
      `}</style>
    </div>
  );
}

export default App;
