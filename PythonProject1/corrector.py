from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from openai import OpenAI
import json
import uvicorn

app = FastAPI()

# API Key 로드
with open(r"C:\Users\diva\PyCharmMiscProject\Student06.txt", 'r') as f:
    API_KEY = f.read().strip()

client = OpenAI(api_key=API_KEY)

# CORS 설정
origins = ["http://localhost:3000"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# 요청 모델
class TextInput(BaseModel):
    text: str


@app.post("/check")
def check_spelling(data: TextInput):
    """
    맞춤법 검사 API: 입력된 텍스트를 GPT로 보내서 JSON 교정 결과 반환
    """
    try:
        prompt = f"""
        다음 문장의 맞춤법을 검사하세요. 
        반드시 아래 JSON 형식으로만 응답하세요.

        예시:
        {{
          "original": "문장 그대로",
          "corrections": [
            {{
              "wrong": "틀린 단어",
              "correct": "교정된 단어",
              "start": 0,
              "end": 3
            }}
          ]
        }}

        틀린 부분이 없다면 corrections는 빈 배열([])을 반환하세요.

        문장: {data.text}
        """

        completion = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "당신은 한국어 맞춤법 검사기입니다. JSON만 반환하세요."},
                {"role": "user", "content": prompt}
            ]
        )

        # GPT 응답 가져오기
        result_text = completion.choices[0].message.content.strip()

        # 🔹 디버그 로그
        print("========== [DEBUG] GPT RAW RESPONSE ==========")
        print(result_text)
        print("================================================")

        # 🔹 코드 블록(```json ... ```) 제거
        if result_text.startswith("```"):
            result_text = result_text.strip("`")        # 백틱 제거
            result_text = result_text.replace("json", "", 1).strip()  # json 태그 제거

        # JSON 파싱
        result_json = json.loads(result_text)

        # corrections 필드 보정
        if "corrections" not in result_json:
            result_json["corrections"] = []

        return result_json

    except json.JSONDecodeError:
        print("[ERROR] GPT 응답을 JSON으로 파싱할 수 없습니다.")
        raise HTTPException(status_code=500, detail="GPT 응답을 JSON으로 파싱할 수 없습니다.")
    except Exception as e:
        print(f"[ERROR] 서버 오류 발생: {e}")
        raise HTTPException(status_code=500, detail=str(e))



if __name__ == "__main__":
    uvicorn.run("corrector:app", host="0.0.0.0", port=5080, reload=True)
