# 이미지 생성 모델 비교 (2026-09 기준)

> 출처: 공식 가격 페이지 + 제3자 가격 집계 사이트 (2026-07~09). 가격은 수시 변동 — 결제 전 공식 페이지 확인 필수.
> 가격 = API 기준 1024×1024(1MP) 1장, 별도 표기 없으면 USD.

## 0. 추천 Top 10 (2026-09-21~29 리더보드 기준)

> 순위 = LMArena(블라인드 투표 Elo) + Artificial Analysis(AA) 종합. 같은 계열 중복 제외(GPT Image 2는 2.5와 동일 단가·하위 호환이라 제외).
> 가격 = AA 기준 1,000장당 → 장당 환산(최고 품질 설정).

| # | 모델 | 개발사 | LMArena (순위/점수) | AA (순위/Elo) | 장당 가격 | 출시 | 한 줄 평 |
|---|---|---|---|---|---|---|---|
| 1 | **GPT Image 2.5 Sunburst** | OpenAI | #1 / 1424 | #1 / 1195 | ~$0.21 (max) | 2026-09 | 현존 최고. 정밀 편집. 비쌈 |
| 2 | **GPT Image 2.5 Flare** | OpenAI | #2 / 1401 | #2 / 1189 | ~$0.21 (max), low/med는 훨씬 저렴 | 2026-09 | Sunburst 거의 동급, 빠름 |
| 3 | **MAI-Image-2.6** | Microsoft | #4 / 1335 | #5 / 1148 | ~$0.039 | 2026-08 | 상위권 중 가성비 최강 |
| 4 | **Grok Imagine Image 2.0** | xAI | #6 / 1301 | #4 / 1153 | ~$0.04–0.08 | 2026-08 | 장당 고정가, 예산 예측 쉬움 |
| 5 | **Reve 2.1** | Reve | #5 / 1302 | — | 미확인 | 2026 | 미적 품질 강점, AA 미등재 |
| 6 | **Muse Image** | Meta | #7 / 1276 | #7 / 1111 | ~$0.01 | 2026-07 | 상위권 최저가 |
| 7 | **Nano Banana 2** (Gemini 3.1 Flash Image) | Google | #9 / 1261 | #6 / 1124 | ~$0.067 | 2026-02 | 검증된 안정성, 투표 수 많음 |
| 8 | **Seedream 5.0 Pro** | ByteDance | #10 / 1256 | #15 / 1079 | ~$0.09 (2K) | 2026-07 | 인포그래픽·레이어 분해·다국어 텍스트 |
| 9 | **Qwen-Image 3.0 Pro** | Alibaba | #11 / 1256 | #14 / 1088 | ~$0.04 | 2026-07 | 중국어·아시아권 텍스트 강점 |
| 10 | **MAI-Image-2.6-Flash** | Microsoft | — | #9 / 1103 | ~$0.0195 | 2026-09 | 저가·대량용 최선 |

**차점 / 특수 용도**
- **Nano Banana Pro** (Gemini 3 Pro Image): AA #11, $0.134 — 4K 출력 필요 시
- **Qwen-Image 2.1**: AA #18, LMArena #17 — **오픈 웨이트 1위** (로컬 실행)
- **Ideogram 4.0 Quality**: LMArena #18 — 글자 렌더링 특화
- **FLUX.2 계열**: 양 리더보드 top 20 밖. 가격·생태계(LoRA, 로컬) 장점으로만 고려

**용도별 한 줄**
- 품질 최우선 → #1 Sunburst / 속도+품질 → #2 Flare
- 가성비 → #3 MAI-Image-2.6 / 초저가 → #6 Muse Image, #10 MAI-2.6-Flash
- 캐릭터 시트·일러스트 → #1·#2 (편집 일관성), Midjourney V8(구독)
- 로컬·오픈소스 → Qwen-Image 2.1

## 1. API 모델 (종량제)

| 개발사 | 모델명 / 버전 | 장당 가격 (USD) | 가격 방식 | 오픈 웨이트 | 특징 / 비고 |
|---|---|---|---|---|---|
| OpenAI | **GPT Image 2.5 Flare** (`gpt-image-2.5-flare`, 현 플래그십) | GPT Image 2와 동일 수준 | 토큰 (텍스트 입력 $5 / 이미지 입력 $8 / 출력 $30 per 1M) | ❌ | 2026-09-08 출시, 빠른 기본형, 지연 최대 50%↓ |
| OpenAI | **GPT Image 2.5 Sunburst** (`gpt-image-2.5-sunburst`) | 동일 단가 (느림) | 토큰 (동일) | ❌ | 정밀 편집용 |
| OpenAI | GPT Image 2 | low $0.006 / medium $0.053 / high $0.211 | 토큰 (출력 $30/1M) | ❌ | 2.5 이전 플래그십 |
| OpenAI | GPT Image 1.5 | $0.009 ~ $0.20 | 토큰 | ❌ | |
| OpenAI | GPT Image 1 Mini | $0.005 ~ $0.052 | 토큰 | ❌ | 저가형 |
| OpenAI | GPT Image 1 | — | 토큰 | ❌ | 2026-10-23 지원 종료 예정 |
| Google | **Nano Banana Pro** (Gemini 3 Pro Image) | 1K–2K $0.134 / 4K $0.24 | 토큰 | ❌ | 고품질·텍스트 렌더링 |
| Google | Nano Banana 2 (Gemini 3.1 Flash Image) / 2 Lite | ~$0.067 / ~$0.034 | 토큰 | ❌ | Imagen 후속 |
| Google | Nano Banana (Gemini 2.5 Flash Image) | $0.039 | 토큰 | ❌ | 레거시 |
| Google | Imagen 4 Fast / Standard / Ultra | $0.02 / $0.04 / $0.06 | 장당 | ❌ | 2026-08 deprecated |
| Microsoft | **MAI-Image-2.6** | ~$0.04 | 토큰 (출력 $38/1M) | ❌ | Azure Foundry |
| Microsoft | MAI-Image-2.6-Flash | 더 저렴 | 토큰 (출력 $19/1M) | ❌ | |
| Microsoft | MAI-Image-2.5 / 2.5-Flash | — | 토큰 (출력 $47 / $19.5 per 1M) | ❌ | |
| Microsoft | MAI-Image-2 / 2-Efficient | — | 토큰 (출력 $33 / $19.5 per 1M) | ❌ | |
| Black Forest Labs | **FLUX.2 [max]** | $0.07 (첫 MP) + $0.03/추가 MP | 메가픽셀 | ❌ | 포토리얼 최상위 |
| Black Forest Labs | FLUX.2 [pro] | $0.03 | 메가픽셀 | ❌ | 가성비 기본값 |
| Black Forest Labs | FLUX.2 [flex] | $0.05 | 메가픽셀 | ❌ | 파라미터 조절 |
| Black Forest Labs | FLUX.2 [klein] 4B / 9B | $0.014 / $0.015 | 메가픽셀 | ✅ (4B) | 경량 |
| ByteDance | **Seedream 5.0 Pro** | ≤2.36MP $0.045~0.075 / 초과 $0.09~0.15 (출처별 상이) | 장당 | ❌ | 2026-07-08 출시, BytePlus ModelArk. 인포그래픽·레이어 분해(16장)·좌표 편집. OpenRouter 미등재 |
| ByteDance | Seedream 5.0 Flash / Lite | < $0.02 | 장당 | ❌ | |
| ByteDance | Seedream 4.5 | — | 장당 | ❌ | 이전 세대, OpenRouter 등 제3자 플랫폼 제공 |
| xAI | **Grok Imagine Image 2.0** | 1K low $0.04 / 2K low·1K med $0.06 / 2K med $0.08 (+편집 입력 $0.01) | 장당 | ❌ | 최신 |
| xAI | Grok Imagine Image (`grok-imagine-image`, alias `-2026-03-02`) | $0.02 (입력 이미지 $0.002) | 장당 | ❌ | 기본형, Batch API 지원 |
| xAI | Grok Imagine Image Quality (`grok-imagine-image-quality`) | 1K $0.05 / 2K $0.07 | 장당 | ❌ | 2026-11-02 종료 → 2.0 low로 리다이렉트 |
| Ideogram | Ideogram 4.0 | ~$0.06 | 장당 | ❌ | 이미지 내 글자 렌더링 강점 |
| Recraft | Recraft V4.1 | ~$0.035 | 장당 | ❌ | 디자인·벡터(SVG) 출력 |
| Meta | Muse Image | ~$0.01 | 장당 | ❌ | 2026-07, 상위권 최저가 |
| Reve | Reve 2.1 / 2.0 | 미확인 | — | ❌ | LMArena #5 / #8 |
| Stability AI | Stable Diffusion 3.5 Large | ~$0.065 | 장당 | ✅ (커뮤니티 라이선스) | |
| Stability AI | Stable Image Core | ~$0.03 | 장당 | ❌ | |
| Alibaba | Qwen-Image 3.0 | 미확인 | — | 버전별 상이 | 2026-08 GA |
| Alibaba | Z-Image Turbo | ~$0.01 | 장당 | ✅ | 최저가권 |

## 2. 구독형 서비스 (소비자용)

| 서비스 | 요금제 (월) | 제공량 | 비고 |
|---|---|---|---|
| **Midjourney V8** | Basic $10 / Standard $30 / Pro $60 / Mega $120 | Fast GPU 3.3 / 15 / 30 / 60 시간 | 연간 결제 20% 할인, 추가 $4/시간. 공식 API 없음 |
| ChatGPT Images 2.5 | 무료 포함 전 요금제 | 요금제별 한도 | 앱 내 추가 과금 없음 |
| Gemini 앱 (Nano Banana) | 무료 / AI Pro·Ultra | 요금제별 한도 | |
| mai-image2.com | Basic $10 / Pro $20 / Max $50 | 1,200 / 2,600 / 7,500 크레딧 | 일회성 충전 가능(≈$1 = 100크레딧, 만료 없음). 1K 10 / 2K 16 / 4K 24 크레딧. MS 공식 도메인 아님 |

## 3. 용도별 추천

| 용도 | 추천 |
|---|---|
| 최고 품질 / 복잡한 프롬프트 | GPT Image 2.5 Sunburst → Flare |
| 포토리얼 | GPT Image 2.5, MAI-Image-2.6, FLUX.2 [max] (생태계 필요 시) |
| 가성비 기본값 | MAI-Image-2.6, Grok Imagine Image 2.0 |
| 이미지 속 텍스트 | Seedream 5.0 Pro, Qwen-Image 3.0 Pro, Ideogram 4.0 |
| 대량·저가 | Muse Image (Meta), MAI-Image-2.6-Flash, Z-Image Turbo |
| 예술적 스타일 / 캐릭터 일러스트 | GPT Image 2.5, Midjourney V8 (구독) |
| 로컬 실행 (오픈 웨이트) | Qwen-Image 2.1, FLUX.2 [klein], Z-Image Turbo |

**비용 절감**: OpenAI·Google Batch API 사용 시 50% 할인 (24시간 내 처리).

## 출처
- https://arena.ai/leaderboard/text-to-image
- https://artificialanalysis.ai/image/leaderboard/text-to-image
- https://developers.openai.com/api/docs/pricing
- https://datanorth.ai/news/openai-launches-chatgpt-images-2-5
- https://tech-insider.org/chatgpt-images-2-5-gpt-image-2-5-launch-2026/
- https://ai.google.dev/gemini-api/docs/image-generation
- https://bfl.ai/pricing
- https://docs.x.ai/developers/models/grok-imagine-image
- https://tech-insider.org/grok-imagine-image-2-api-setup-2026/
- https://www.therundown.ai/tools/seedream-5-0-pro
- https://docs.byteplus.com/en/docs/ModelArk/2582774
- https://openrouter.ai/microsoft/mai-image-2.6
- https://runtimewire.com/article/microsoft-mai-image-2-6-foundry-four-cents-image
- https://www.buildmvpfast.com/api-costs/ai-image
- https://www.aifreeapi.com/en/posts/openai-image-generation-api-pricing
- https://www.myarchitectai.com/blog/nano-banana-api-pricing
- https://aipresso.com/blog/midjourney-pricing
- https://tech-insider.org/ai-image-generator-api-costs-2026/
- https://www.atlascloud.ai/blog/tips/cheapest-ai-image-generation-api-2026
- https://mai-image2.com/ko/pricing
