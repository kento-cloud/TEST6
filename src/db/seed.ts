import Database from "better-sqlite3"
import path from "path"
import { ulid } from "ulid"

const DB_PATH = path.join(process.cwd(), "data", "pivot.db")
const sqlite = new Database(DB_PATH)
sqlite.pragma("journal_mode = WAL")

const now = new Date().toISOString()

// === 番組データ投入 ===
const programsData = [
  { id: 48, name: "PIVOT TALK", description: "各界のトップランナーに迫るインタビュー番組", thumbnailPath: "/images/programs/thumbnail_vertical/68a44eea919df.png", logoPath: "/images/programs/logo_banner/68f892ba65fed.svg" },
  { id: 19, name: "MONEY SKILL SET", description: "お金の教養を身につける", thumbnailPath: "/images/programs/thumbnail_vertical/68a44f67ce787.png", logoPath: "/images/programs/logo_banner/688dc66289db3.svg" },
  { id: 2, name: "9 questions", description: "時代を切り拓くリーダーに9つの質問", thumbnailPath: "/images/programs/thumbnail_vertical/68a44fe6cf874.png", logoPath: "/images/programs/logo_banner/6789c5483cb7d.svg" },
  { id: 76, name: "ランキング超分析", description: "ランキングを専門家と共に徹底分析", thumbnailPath: "/images/programs/thumbnail_vertical/68b10dc8e26ae.png", logoPath: "/images/programs/logo_banner/68baf2526844c.svg" },
  { id: 10, name: "EDUCATION SKILL SET", description: "教育の最前線を探る", thumbnailPath: "/images/programs/thumbnail_vertical/68fecee954a36.png" },
  { id: 6, name: "BODY SKILL SET", description: "カラダの教養を身につける", thumbnailPath: "/images/programs/thumbnail_vertical/6992adf73eb7a.png" },
  { id: 13, name: "EXTREME SCIENCE", description: "科学の最前線に迫る", thumbnailPath: "/images/programs/thumbnail_vertical/6992ae170452c.png", logoPath: "/images/programs/logo_banner/68f89a4e14742.svg" },
  { id: 27, name: "TOP TALK", description: "日本を代表する経営者の戦略に迫る", thumbnailPath: "/images/programs/thumbnail_vertical/6992ae2d5aaee.png", logoPath: "/images/programs/logo_banner/68b86024e30ae.svg" },
  { id: 100, name: "ビジネス虎の巻", description: "実践的なビジネスノウハウを伝授", thumbnailPath: "/images/programs/thumbnail_vertical/6992ae66c1a19.png" },
  { id: 42, name: "PIVOT GLOBAL", description: "世界のビジネストレンドを読む", thumbnailPath: "/images/programs/thumbnail_vertical/6992ae87d58d4.png" },
]

console.log("Seeding programs...")
const insertProgram = sqlite.prepare("INSERT OR REPLACE INTO programs (id, name, description, thumbnail_path, logo_path, is_active, created_at) VALUES (?, ?, ?, ?, ?, 1, ?)")
for (const p of programsData) {
  insertProgram.run(p.id, p.name, p.description, p.thumbnailPath, p.logoPath ?? null, now)
  console.log(`  ✓ ${p.name}`)
}

// === エピソードデータ投入 ===
const episodesData = [
  { id: 14365, title: "宇宙開発の課題 \"交通整備\"は誰がする？", programId: 48, programName: "PIVOT TALK SCIENCE", duration: 1204, categoryCode: "technology", viewCount: 12000, rating: 4.5 },
  { id: 14328, title: "100年に一度の変化。次世代タバコでJTは勝てるのか？【筒井岳彦社長】", programId: 27, programName: "TOP TALK", duration: 1709, categoryCode: "business", viewCount: 38000, rating: 4.3 },
  { id: 14325, title: "「山下本気うどん」売却までの経緯【オモロー山下】", programId: 19, programName: "MONEY SKILL SET", duration: 2322, categoryCode: "money", viewCount: 74000, rating: 4.5 },
  { id: 14287, title: "【宇宙のミステリー】人体に起きる「謎の症状」", programId: 13, programName: "EXTREME SCIENCE", duration: 1243, categoryCode: "technology", viewCount: 21000, rating: 4.7 },
  { id: 14317, title: "Geminiで学ぶ・稼ぐ術／NotebookLMによるAI家庭教師／穴場の稼ぎ方", programId: 76, programName: "ランキング超分析", duration: 1932, categoryCode: "technology", viewCount: 83000, rating: 4.8 },
  { id: 14305, title: "北朝鮮・迎撃不可能なドローン攻撃の恐怖", programId: 2, programName: "9 questions", duration: 1618, categoryCode: "global", viewCount: 67000, rating: 4.2 },
  { id: 14364, title: "新たなヒットの方程式。アニメ×バイラル＝グローバル", programId: 48, programName: "PIVOT TALK", duration: 1416, categoryCode: "business", viewCount: 18000, rating: 4.1 },
  { id: 14316, title: "【コピペで使える】企画を成功に導く最強AI壁打ち", programId: 100, programName: "ビジネス虎の巻", duration: 1665, categoryCode: "business", viewCount: 32000, rating: 4.5 },
  { id: 14362, title: "資産が残る街と消える街【のらえもん】", programId: 19, programName: "MONEY SKILL SET", duration: 1809, categoryCode: "money", viewCount: 41000, rating: 4.3 },
  { id: 14357, title: "少子化対策は全く効かない。シンガポール・韓国の教訓", programId: 2, programName: "9 questions", duration: 3349, categoryCode: "global", viewCount: 55000, rating: 4.4 },
]

console.log("\nSeeding episodes as videos...")
const insertVideo = sqlite.prepare("INSERT OR IGNORE INTO videos (id, title, description, file_path, thumbnail_path, duration, status, publish_status, processing_step, source_type, category_code, program_id, published_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 'published', 'published', 'none', 'local', ?, ?, ?, ?, ?)")
const insertMetric = sqlite.prepare("INSERT OR IGNORE INTO metrics (video_id, view_count, rating, rating_count, comment_count) VALUES (?, ?, ?, ?, ?)")
const insertThumb = sqlite.prepare("INSERT OR IGNORE INTO thumbnails (id, video_id, file_path, source, is_primary, status, created_at) VALUES (?, ?, ?, 'manual', 1, 'done', ?)")

// === エピソード別AIコンテンツ ===
const aiContentMap: Record<number, { summary: string; chapters: Array<{ title: string; startTime: number; endTime: number; summary: string }>; article: string; tags: string[] }> = {
  14365: {
    summary: "宇宙空間における衛星やデブリの増加に伴い、宇宙の「交通整備」が急務となっている。国際ルール策定の課題と日本の宇宙スタートアップが果たすべき役割を専門家が語る。",
    chapters: [
      { title: "宇宙空間の現状と課題", startTime: 0, endTime: 180, summary: "地球軌道上の衛星数が急増し、衝突リスクが深刻化している現状を解説。" },
      { title: "スペースデブリの脅威", startTime: 180, endTime: 380, summary: "デブリがもたらす連鎖的な衝突シナリオと、ISS回避の実例を紹介。" },
      { title: "宇宙交通管制の国際議論", startTime: 380, endTime: 600, summary: "国連宇宙空間平和利用委員会での議論と各国の思惑を分析。" },
      { title: "日本企業の取り組み", startTime: 600, endTime: 850, summary: "アストロスケールなど日本発スタートアップのデブリ除去技術を紹介。" },
      { title: "ルール形成と今後の展望", startTime: 850, endTime: 1050, summary: "宇宙版の航空管制が必要な理由と、日本がルール策定で主導権を握る戦略。" },
      { title: "まとめと提言", startTime: 1050, endTime: 1204, summary: "宇宙の持続可能な利用に向けた産官学連携の重要性を総括。" },
    ],
    article: `## 宇宙の「交通整備」が急務に\n\n地球軌道上には現在、約1万基以上の人工衛星と数百万個のデブリが存在する。SpaceXのStarlinkだけでも6,000基超が打ち上げられ、宇宙空間の混雑は加速している。\n\n## デブリ問題の深刻さ\n\n- 秒速7kmで飛行するデブリは1cm未満でも衛星を破壊し得る\n- ケスラーシンドロームによる連鎖衝突が現実的な脅威に\n- ISSは年間数回の回避機動を実施\n\n## 日本の強み\n\nアストロスケール社はデブリ除去の実証実験で世界をリードしている。また、JAXAの宇宙状況監視（SSA）システムも国際的に高い評価を受けている。\n\n## 今後の課題\n\n国際的なルール形成は遅れており、宇宙版の「航空管制」構築が急がれる。日本は技術力と外交力を活かし、ルール策定における主導的役割を果たすべきである。`,
    tags: ["宇宙開発", "スペースデブリ", "交通管制", "アストロスケール", "JAXA", "衛星軌道", "国際ルール"],
  },
  14328: {
    summary: "JT筒井岳彦社長が次世代タバコ市場での戦略を語る。加熱式タバコPloom Xの巻き返し策、海外展開、そしてたばこ業界の100年に一度の構造変化にどう立ち向かうか。",
    chapters: [
      { title: "JTの現在地", startTime: 0, endTime: 250, summary: "グローバルたばこ市場におけるJTのポジションと業績を概観。" },
      { title: "加熱式タバコ市場の激変", startTime: 250, endTime: 520, summary: "IQOSが席巻する加熱式市場でPloom Xが直面する課題を分析。" },
      { title: "Ploom Xの技術革新", startTime: 520, endTime: 800, summary: "味・吸い心地の改良とデバイスデザインの進化戦略を紹介。" },
      { title: "海外事業の成長戦略", startTime: 800, endTime: 1100, summary: "M&Aと有機成長を組み合わせたグローバル展開の青写真。" },
      { title: "ESGと社会的責任", startTime: 1100, endTime: 1400, summary: "たばこ企業としてのESG対応と健康リスク低減製品への転換。" },
      { title: "筒井社長が描く未来", startTime: 1400, endTime: 1709, summary: "100年企業としてのビジョンとイノベーション投資の方向性。" },
    ],
    article: `## 100年に一度の転換期を迎えるJT\n\nたばこ業界は紙巻きから加熱式への歴史的転換を迎えている。筒井岳彦社長はこの変化を「100年に一度のチャンス」と捉え、攻めの戦略を展開する。\n\n## Ploom Xの巻き返し\n\n- 加熱式市場はIQOSが約7割のシェアを握る\n- Ploom Xは味の深みとデバイスの使いやすさで差別化\n- 2024年の新モデルで若年層の支持拡大を狙う\n\n## グローバル戦略\n\nJTは海外売上比率が6割を超える。英国のGallaher買収、米国のReynoldsのブランド取得など、M&Aを軸にした成長を継続する方針だ。\n\n## 社会との共存\n\n健康リスク低減製品（RRP）への転換を進めつつ、たばこ税収を通じた社会貢献も強調。ESG投資家との対話も積極的に行っている。`,
    tags: ["JT", "加熱式タバコ", "Ploom X", "筒井岳彦", "たばこ産業", "経営戦略", "IQOS"],
  },
  14325: {
    summary: "お笑い芸人オモロー山下がうどんチェーン「山下本気うどん」を立ち上げ、急成長させた後に事業売却した全経緯を赤裸々に語る。芸人×起業家のリアルな成功と葛藤。",
    chapters: [
      { title: "芸人が飲食業に挑んだ理由", startTime: 0, endTime: 350, summary: "テレビの仕事が減る中、なぜうどん屋を始めたのかを語る。" },
      { title: "「山下本気うどん」の誕生", startTime: 350, endTime: 700, summary: "ブランド名の由来と1号店オープンまでの奮闘記。" },
      { title: "急成長の裏側", startTime: 700, endTime: 1100, summary: "SNSマーケティングとメニュー開発で多店舗展開に成功した手法。" },
      { title: "経営の壁と葛藤", startTime: 1100, endTime: 1600, summary: "人材採用、品質管理、資金繰りなど経営者として直面した課題。" },
      { title: "売却の決断", startTime: 1600, endTime: 2000, summary: "なぜ成長中の事業を手放したのか、売却交渉の内幕。" },
      { title: "売却後の学びと今後", startTime: 2000, endTime: 2322, summary: "事業売却で得た資金と経験を次にどう活かすかを展望。" },
    ],
    article: `## 芸人から起業家へ\n\nオモロー山下は、芸人としてのキャリアに限界を感じる中で飲食業界に参入。「山下本気うどん」を2018年に創業し、渋谷の1号店を皮切りに都内で急拡大した。\n\n## 成功の方程式\n\n- Instagramを活用した「映える」うどんのブランディング\n- 芸人ネットワークを活かした話題作り\n- 原価率を抑えつつ満足度の高いメニュー設計\n\n## 売却という選択\n\n多店舗経営は想像以上にハードだった。品質維持、人材育成、資金繰り――芸人業との両立に限界を感じ、戦略的に売却を決断。金額は非公開だが「人生が変わるレベル」と語る。\n\n## 芸人×起業家の教訓\n\n「面白い」を軸にした発想力は、ビジネスでも強力な武器になる。ただし経営は笑いだけでは成り立たない。その両面を学んだ経験を次の挑戦に活かす。`,
    tags: ["山下本気うどん", "オモロー山下", "飲食業", "M&A", "事業売却", "芸人起業", "マネースキル"],
  },
  14287: {
    summary: "宇宙空間で人体に起こる「謎の症状」を最新科学で解明。視力低下、骨密度減少、DNAの変化まで、宇宙飛行が人体に与える未知の影響とその対策を専門家が徹底解説。",
    chapters: [
      { title: "宇宙と人体の関係", startTime: 0, endTime: 200, summary: "なぜ宇宙環境が人体に大きな影響を与えるのかを科学的に解説。" },
      { title: "微小重力と骨・筋肉の変化", startTime: 200, endTime: 400, summary: "宇宙滞在による骨密度低下と筋萎縮のメカニズムを紹介。" },
      { title: "宇宙視力低下症候群", startTime: 400, endTime: 600, summary: "ISS長期滞在者の60%以上が経験する視力低下の謎。" },
      { title: "放射線とDNAへの影響", startTime: 600, endTime: 850, summary: "宇宙放射線がDNAに与えるダメージとNASA双子研究の衝撃的結果。" },
      { title: "免疫系の異変", startTime: 850, endTime: 1050, summary: "宇宙空間で免疫細胞の挙動が変化し、潜伏ウイルスが再活性化する現象。" },
      { title: "火星有人探査への課題", startTime: 1050, endTime: 1243, summary: "長期宇宙旅行に向けた医学的課題と対策技術の最前線。" },
    ],
    article: `## 宇宙が人体を変える\n\n国際宇宙ステーション（ISS）での長期滞在データから、宇宙環境が人体に予想以上の影響を与えることが明らかになっている。\n\n## 主な症状\n\n- **骨密度の急激な低下**: 月1〜2%のペースで骨量が減少\n- **宇宙視力低下症候群（SANS）**: 頭蓋内圧上昇による眼球変形\n- **DNA損傷**: 宇宙放射線によるテロメア長の異常変化\n- **免疫異常**: ヘルペスウイルスなどの再活性化\n\n## NASA双子研究の衝撃\n\n一卵性双生児の宇宙飛行士を比較した研究で、宇宙に1年滞在した兄は遺伝子発現の7%が帰還後も変化していた。\n\n## 火星への道\n\n火星有人探査では片道6ヶ月以上の宇宙滞在が必要となる。人工重力装置や放射線シールドなど、対策技術の開発が急ピッチで進む。`,
    tags: ["宇宙医学", "人体", "微小重力", "DNA", "ISS", "火星探査", "サイエンス"],
  },
  14317: {
    summary: "Google Geminiの実践的な活用術を徹底ランキング。NotebookLMを使ったAI家庭教師の作り方、Geminiで収益化する穴場の稼ぎ方まで、すぐ使えるテクニックを専門家が解説。",
    chapters: [
      { title: "Gemini最新機能の概要", startTime: 0, endTime: 280, summary: "Google Geminiの進化と他AIサービスとの差別化ポイント。" },
      { title: "学習効率を10倍にするGemini活用法", startTime: 280, endTime: 560, summary: "語学学習、資格試験対策でGeminiを最大限に使う方法。" },
      { title: "NotebookLMでAI家庭教師を作る", startTime: 560, endTime: 900, summary: "教科書をアップロードし、自分専用のAI教師を構築する手順を実演。" },
      { title: "Geminiで稼ぐ穴場ランキング", startTime: 900, endTime: 1300, summary: "ライティング、データ分析、動画台本作成など収益化の方法をランキング形式で紹介。" },
      { title: "Gems機能で業務を自動化", startTime: 1300, endTime: 1650, summary: "カスタムGeminiを作成して定型業務を自動化するテクニック。" },
      { title: "まとめ：AI時代の学び方と稼ぎ方", startTime: 1650, endTime: 1932, summary: "AIツールを使いこなすことが今後の必須スキルである理由を総括。" },
    ],
    article: `## Geminiで学ぶ・稼ぐ時代が来た\n\nGoogle Geminiは2024年に大幅アップデートを遂げ、GPT-4oに匹敵する性能を無料で提供している。本エピソードでは、学習と収益化の両面からGeminiの活用法を徹底分析する。\n\n## NotebookLMが革命的\n\n- 教科書・論文をアップロードするだけでAI家庭教師が完成\n- 音声での質疑応答が可能で、通勤中の学習に最適\n- 複数資料の横断分析で研究効率が劇的に向上\n\n## 穴場の稼ぎ方TOP3\n\n1. **企業向けデータ分析レポート作成**: Geminiでデータを整理・可視化\n2. **AI動画台本の量産**: YouTube向け台本をGeminiで効率化\n3. **多言語コンテンツ翻訳**: 高精度な翻訳で海外案件を獲得\n\n## AI時代の必須スキル\n\nAIは道具であり、使いこなす人が圧倒的に有利になる。まずは無料のGeminiから始めることが、AI時代を生き抜く第一歩である。`,
    tags: ["Gemini", "NotebookLM", "AI活用", "副業", "生成AI", "Google", "AI学習"],
  },
  14305: {
    summary: "北朝鮮が開発を進める最新ドローン技術の脅威を安全保障の専門家が分析。従来の迎撃システムでは対処困難な群体攻撃の実態と、日本の防衛体制の課題を9つの質問で深掘り。",
    chapters: [
      { title: "北朝鮮のドローン開発の実態", startTime: 0, endTime: 250, summary: "衛星写真やインテリジェンス情報から見える北朝鮮のドローン能力。" },
      { title: "なぜ迎撃が困難なのか", startTime: 250, endTime: 500, summary: "低空飛行・群体攻撃・安価な量産が従来の防空システムを無力化する仕組み。" },
      { title: "ウクライナ戦争からの教訓", startTime: 500, endTime: 800, summary: "ロシア・ウクライナ双方のドローン戦術が示す現代戦の変化。" },
      { title: "日本の防衛体制の脆弱性", startTime: 800, endTime: 1100, summary: "現行の迎撃システムがドローン攻撃に対応できない構造的問題。" },
      { title: "対ドローン技術の最前線", startTime: 1100, endTime: 1380, summary: "電子戦、レーザー兵器、AI自動迎撃など新技術の開発状況。" },
      { title: "日本に求められる対策", startTime: 1380, endTime: 1618, summary: "法整備から技術投資まで、日本が早急に取るべきアクションを提言。" },
    ],
    article: `## ドローンが変える安全保障の常識\n\n北朝鮮は弾道ミサイルだけでなく、安価で大量に配備可能なドローンの開発を急速に進めている。従来の迎撃ミサイルではコスト的に対処が不可能であり、安全保障の概念そのものが変わりつつある。\n\n## 迎撃困難な理由\n\n- 1機数万円のドローンに対し、迎撃ミサイルは1発数千万円\n- 100機規模の群体攻撃に既存システムは対応不能\n- レーダーに映りにくい低空・低速飛行\n\n## ウクライナの教訓\n\nウクライナ戦争では、両軍がドローンを偵察・攻撃・自爆用途で大量運用。FPVドローンが戦車を撃破する映像は、従来の軍事常識を覆した。\n\n## 日本の課題\n\n自衛隊はドローン対策の専門部隊を持たず、法的にも民間ドローンの撃墜に制約がある。技術投資と法整備の両面で早急な対応が求められる。`,
    tags: ["北朝鮮", "ドローン", "安全保障", "防衛", "ウクライナ", "迎撃システム", "地政学"],
  },
  14364: {
    summary: "日本アニメが世界で爆発的ヒットを生む新方程式を分析。TikTok・YouTubeでのバイラルがNetflixランキングを動かす構造と、アニメ産業が直面する制作キャパシティ問題を解説。",
    chapters: [
      { title: "アニメ×バイラルの新時代", startTime: 0, endTime: 220, summary: "SNSバイラルがアニメヒットの起爆剤になる新しい構図を紹介。" },
      { title: "「推しの子」「葬送のフリーレン」の成功分析", startTime: 220, endTime: 450, summary: "SNSでの切り抜き拡散がグローバルヒットにつながった事例を分析。" },
      { title: "Netflixとアニメの共進化", startTime: 450, endTime: 700, summary: "配信プラットフォームが日本アニメの海外展開を加速させた経緯。" },
      { title: "制作現場のキャパシティ危機", startTime: 700, endTime: 1000, summary: "アニメーターの待遇問題と制作スタジオの過密スケジュール。" },
      { title: "AI技術と制作効率化", startTime: 1000, endTime: 1220, summary: "AIによる中割り生成やカラーリングの自動化が与える影響。" },
      { title: "グローバル市場での日本アニメの未来", startTime: 1220, endTime: 1416, summary: "3兆円市場に成長したアニメ産業の次なる成長ドライバー。" },
    ],
    article: `## アニメ×バイラル＝グローバルヒットの方程式\n\n日本アニメの海外市場は3兆円を突破し、なおも成長を続けている。その原動力となっているのが、SNSでのバイラル拡散だ。\n\n## バイラルの仕組み\n\n- TikTokでの名シーン切り抜きが数億回再生を記録\n- 海外ファンがリアクション動画を量産し二次拡散\n- Netflix等の配信プラットフォームがトレンドを検知して推薦強化\n\n## 制作現場の課題\n\n需要が爆発する一方で、アニメーターの平均年収は約440万円と低水準。制作スタジオは案件過多で品質維持が困難になりつつある。\n\n## AIの可能性\n\n中割り生成やカラーリングのAI自動化は、制作効率を30〜50%向上させる可能性がある。ただし、クリエイターの創造性を代替するものではなく、あくまで補助ツールとしての活用が鍵となる。`,
    tags: ["アニメ", "バイラル", "Netflix", "TikTok", "コンテンツ産業", "グローバル展開", "AI制作"],
  },
  14316: {
    summary: "企画立案をAIで劇的に効率化する方法を実践解説。ChatGPTやClaudeを使った壁打ちプロンプトのコピペテンプレートと、企画の精度を上げるフレームワークを紹介。",
    chapters: [
      { title: "AI壁打ちとは何か", startTime: 0, endTime: 250, summary: "AIを企画のブレインストーミング相手にする手法の概要と効果。" },
      { title: "最強プロンプトの構造", startTime: 250, endTime: 520, summary: "役割設定・制約条件・出力形式を組み合わせたプロンプト設計術。" },
      { title: "企画書テンプレートの自動生成", startTime: 520, endTime: 800, summary: "コピペするだけで企画書のドラフトが完成するプロンプトを実演。" },
      { title: "競合分析をAIで自動化", startTime: 800, endTime: 1100, summary: "市場調査と競合のSWOT分析をAIで効率化する手順。" },
      { title: "企画の精度を上げるフレームワーク", startTime: 1100, endTime: 1400, summary: "SCAMPER法やオズボーンのチェックリストをAIに組み込む方法。" },
      { title: "実践：明日から使えるAI企画術", startTime: 1400, endTime: 1665, summary: "視聴者がすぐに試せる3つのプロンプトテンプレートを公開。" },
    ],
    article: `## AIが企画力を10倍にする\n\n企画立案は多くのビジネスパーソンが苦手とする業務だが、AIを「壁打ち相手」にすることで劇的に効率化できる。本エピソードでは、コピペで使えるプロンプトを多数紹介する。\n\n## プロンプト設計の3要素\n\n- **役割設定**: 「あなたは20年の経験を持つマーケティングディレクターです」\n- **制約条件**: 予算、期間、ターゲット層を明示\n- **出力形式**: 箇条書き、表形式、企画書フォーマットを指定\n\n## すぐ使えるテンプレート\n\n1. 新規事業アイデア出し：業界×トレンド×顧客課題の掛け算\n2. 競合SWOT分析：企業名を入れるだけで分析表を自動生成\n3. 企画書ドラフト：目的・施策・KPI・スケジュールを一括出力\n\n## 注意点\n\nAIの出力は「たたき台」であり、最終判断は人間が行う。AIに依存しすぎず、自分の知見と組み合わせることが成功の鍵である。`,
    tags: ["AI活用", "プロンプト", "企画立案", "ChatGPT", "Claude", "ビジネススキル", "業務効率化"],
  },
  14362: {
    summary: "不動産インフルエンサー・のらえもんが「資産価値が残る街」と「消える街」の見分け方を徹底解説。人口動態・再開発計画・交通インフラから読み解く不動産投資の新常識。",
    chapters: [
      { title: "資産が残る街の共通点", startTime: 0, endTime: 280, summary: "人口流入・再開発・交通利便性の3条件を満たす街を分析。" },
      { title: "消える街の危険サイン", startTime: 280, endTime: 550, summary: "人口減少、商業施設撤退、インフラ老朽化が進む街の特徴。" },
      { title: "注目エリアランキング", startTime: 550, endTime: 900, summary: "今後10年で資産価値が上がると予測されるエリアをランキング形式で紹介。" },
      { title: "マンション選びの鉄則", startTime: 900, endTime: 1200, summary: "駅距離、階数、管理組合の質など、資産価値を守る物件選びのポイント。" },
      { title: "住宅ローンと金利リスク", startTime: 1200, endTime: 1500, summary: "変動金利上昇時代に備えたローン戦略と借り換えの判断基準。" },
      { title: "不動産×AI：データドリブンな街選び", startTime: 1500, endTime: 1809, summary: "AIによる不動産価格予測ツールの活用法と限界を解説。" },
    ],
    article: `## 街の「資産格差」が広がっている\n\n日本全体では人口減少が進むが、都市部では特定エリアに人口が集中する「極点化」が加速している。不動産の資産価値は立地によって明暗が分かれる時代に突入した。\n\n## 資産が残る街の条件\n\n- **再開発計画がある**: 大規模再開発は街の価値を引き上げる最大の要因\n- **交通インフラの整備**: 新駅・新路線は周辺不動産の価格を20〜30%押し上げる\n- **若年層の流入**: 30代の転入超過がある街は将来性が高い\n\n## 消える街の危険サイン\n\n1. スーパー・銀行の撤退が始まっている\n2. 空き家率が15%を超えている\n3. 自治体の財政力指数が0.5未満\n\n## のらえもんの結論\n\n「買ってはいけない街」は存在する。データに基づいた冷静な判断が、一生で最大の買い物を成功に導く。`,
    tags: ["不動産", "資産価値", "マンション", "住宅ローン", "のらえもん", "再開発", "人口動態"],
  },
  14357: {
    summary: "世界最先端の少子化対策を実施したシンガポールと韓国がなぜ失敗したのかを徹底分析。巨額の財政投入でも出生率が上がらない構造的要因と、日本が学ぶべき教訓を専門家が解説。",
    chapters: [
      { title: "世界の少子化マップ", startTime: 0, endTime: 450, summary: "東アジアを中心に加速する少子化の現状をデータで俯瞰。" },
      { title: "シンガポールの「失敗」", startTime: 450, endTime: 1000, summary: "出産奨励金・住宅優遇など手厚い政策でも出生率0.97に沈んだ理由。" },
      { title: "韓国の「絶望的状況」", startTime: 1000, endTime: 1600, summary: "世界最低の出生率0.72を記録した韓国の構造的問題を分析。" },
      { title: "なぜ政策は効かないのか", startTime: 1600, endTime: 2200, summary: "経済的支援だけでは解決できない、価値観の変化と社会構造の課題。" },
      { title: "北欧モデルは参考になるか", startTime: 2200, endTime: 2800, summary: "フランス・スウェーデンの成功事例と日本への適用可能性。" },
      { title: "日本の選択肢", startTime: 2800, endTime: 3349, summary: "移民政策、AI活用、社会制度改革など日本が取りうる対策を議論。" },
    ],
    article: `## 少子化対策の「不都合な真実」\n\n世界で最も手厚い少子化対策を行ったシンガポールと韓国。しかし両国の出生率は改善どころか悪化を続けている。この事実は、日本の少子化対策にも重要な教訓を投げかける。\n\n## シンガポールの教訓\n\n- 出産ボーナス最大100万円相当を支給\n- 公営住宅の優先配分、育児休業の充実\n- **結果**: 出生率は0.97まで低下（2023年）\n\n## 韓国の教訓\n\n- 過去16年で約30兆円を少子化対策に投入\n- 出産奨励金、不妊治療補助、育児手当を大幅拡充\n- **結果**: 出生率は世界最低の0.72（2023年）\n\n## 構造的な問題\n\n金銭的支援だけでは、高い教育費、住宅費、長時間労働、ジェンダー格差といった構造的要因は解消できない。価値観の変化も大きく、「結婚・出産が当然」という前提が崩れた社会では、従来型の政策は効力を失う。\n\n## 日本への示唆\n\n出生率回復だけに依存せず、人口減少を前提とした社会設計――AIやロボティクスの活用、移民政策の見直し、社会保障の再構築――が求められている。`,
    tags: ["少子化", "シンガポール", "韓国", "人口問題", "社会政策", "出生率", "グローバル"],
  },
}

for (const ep of episodesData) {
  const videoId = `EP_${ep.id}`
  const thumbPath = `/images/static/converted/chapter/${ep.id}/ogp/${ep.id}.webp`
  const desc = `${ep.programName}の人気エピソード`

  insertVideo.run(videoId, ep.title, desc, "", thumbPath, ep.duration, ep.categoryCode, ep.programId, now, now, now)
  insertMetric.run(videoId, ep.viewCount, ep.rating, Math.floor(ep.viewCount / 5000), Math.floor(ep.viewCount / 10000))
  insertThumb.run(ulid(), videoId, thumbPath, now)

  // Transcription + AI Content（フロント表示用モックデータ）
  const transId = ulid()
  sqlite.prepare("INSERT OR IGNORE INTO transcriptions (id, video_id, full_text, segments, source, status, created_at) VALUES (?, ?, ?, '[]', 'manual', 'done', ?)").run(
    transId, videoId, `${ep.title}の文字起こしテキスト。${desc}`, now
  )

  const aiContent = aiContentMap[ep.id]
  const aiId = ulid()
  sqlite.prepare("INSERT OR IGNORE INTO ai_contents (id, video_id, summary, chapters, article, tags, related_category_codes, status, version, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'done', 1, ?, ?)").run(
    aiId, videoId,
    aiContent.summary,
    JSON.stringify(aiContent.chapters),
    aiContent.article,
    JSON.stringify(aiContent.tags),
    JSON.stringify([ep.categoryCode]),
    now, now
  )

  console.log(`  ✓ ${ep.title.slice(0, 30)}...`)
}

// === サムネイルスタイルプリセット投入 ===
console.log("\nSeeding thumbnail style presets...")
const thumbnailPresets = [
  {
    id: ulid(),
    name: "ビジネスプロフェッショナル",
    promptTemplate: "A clean, corporate-style thumbnail with a professional color palette of navy blue and white. Sharp geometric shapes, subtle gradient background, modern sans-serif typography placeholder. Executive business atmosphere.",
    styleParams: JSON.stringify({ colorScheme: "navy-white", layout: "corporate", fontStyle: "sans-serif", mood: "professional" }),
    isDefault: 1,
  },
  {
    id: ulid(),
    name: "テクノロジー",
    promptTemplate: "A futuristic, tech-oriented thumbnail with neon accents on a dark background. Circuit board patterns, holographic elements, digital grid lines. Cyberpunk-inspired color palette of electric blue and purple.",
    styleParams: JSON.stringify({ colorScheme: "neon-dark", layout: "futuristic", fontStyle: "monospace", mood: "innovative" }),
    isDefault: 0,
  },
  {
    id: ulid(),
    name: "カジュアルトーク",
    promptTemplate: "A warm, friendly thumbnail with soft pastel colors and rounded shapes. Cozy atmosphere with gentle lighting, speech bubble elements, inviting and approachable design. Warm orange and cream tones.",
    styleParams: JSON.stringify({ colorScheme: "warm-pastel", layout: "casual", fontStyle: "rounded", mood: "friendly" }),
    isDefault: 0,
  },
  {
    id: ulid(),
    name: "ニュース解説",
    promptTemplate: "A serious, news-style thumbnail with bold red and white color scheme. Breaking news banner layout, sharp angular design, high contrast text areas. Authoritative and urgent atmosphere.",
    styleParams: JSON.stringify({ colorScheme: "red-white", layout: "news", fontStyle: "bold-serif", mood: "serious" }),
    isDefault: 0,
  },
]

const insertPreset = sqlite.prepare("INSERT OR IGNORE INTO thumbnail_style_presets (id, name, prompt_template, style_params, is_default, created_at) VALUES (?, ?, ?, ?, ?, ?)")
for (const preset of thumbnailPresets) {
  insertPreset.run(preset.id, preset.name, preset.promptTemplate, preset.styleParams, preset.isDefault, now)
  console.log(`  ✓ ${preset.name}`)
}

console.log("\nSeed complete.")
console.log(`  Programs: ${programsData.length}`)
console.log(`  Videos: ${episodesData.length}`)
console.log(`  Thumbnail presets: ${thumbnailPresets.length}`)

sqlite.close()
