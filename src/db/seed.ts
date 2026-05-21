import Database from "better-sqlite3"
import path from "path"
import { ulid } from "ulid"

const DB_PATH = path.join(process.cwd(), "data", "pivot.db")
const sqlite = new Database(DB_PATH)
sqlite.pragma("journal_mode = WAL")

const now = new Date().toISOString()

// === 番組データ投入 ===
const programsData = [
  { id: 48, name: "PADDOCK TALK", description: "競馬界のトップトレーナー・騎手に迫るインタビュー番組", thumbnailPath: "/images/programs/thumbnail_vertical/68a44eea919df.png", logoPath: "/images/programs/logo_banner/68f892ba65fed.svg" },
  { id: 19, name: "馬券ラボ", description: "データ分析で馬券力を身につける", thumbnailPath: "/images/programs/thumbnail_vertical/68a44f67ce787.png", logoPath: "/images/programs/logo_banner/688dc66289db3.svg" },
  { id: 2, name: "血統クロニクル", description: "名血統の系譜を紐解く", thumbnailPath: "/images/programs/thumbnail_vertical/68a44fe6cf874.png", logoPath: "/images/programs/logo_banner/6789c5483cb7d.svg" },
  { id: 76, name: "レース超分析", description: "注目レースを専門家と共に徹底分析", thumbnailPath: "/images/programs/thumbnail_vertical/68b10dc8e26ae.png", logoPath: "/images/programs/logo_banner/68baf2526844c.svg" },
  { id: 10, name: "調教ウォッチ", description: "追い切り・調教映像の見方を学ぶ", thumbnailPath: "/images/programs/thumbnail_vertical/68fecee954a36.png" },
  { id: 6, name: "馬体チェック", description: "パドックでの馬体診断を極める", thumbnailPath: "/images/programs/thumbnail_vertical/6992adf73eb7a.png" },
  { id: 13, name: "ターフサイエンス", description: "競馬を科学的に解析する", thumbnailPath: "/images/programs/thumbnail_vertical/6992ae170452c.png", logoPath: "/images/programs/logo_banner/68f89a4e14742.svg" },
  { id: 27, name: "オーナーズEYE", description: "馬主が語る競馬ビジネスの真実", thumbnailPath: "/images/programs/thumbnail_vertical/6992ae2d5aaee.png", logoPath: "/images/programs/logo_banner/68b86024e30ae.svg" },
  { id: 100, name: "予想の虎の巻", description: "実践的な予想テクニックを伝授", thumbnailPath: "/images/programs/thumbnail_vertical/6992ae66c1a19.png" },
  { id: 42, name: "PADDOCK GLOBAL", description: "世界の競馬トレンドを読む", thumbnailPath: "/images/programs/thumbnail_vertical/6992ae87d58d4.png" },
]

console.log("Seeding programs...")
const insertProgram = sqlite.prepare("INSERT OR REPLACE INTO programs (id, name, description, thumbnail_path, logo_path, is_active, created_at) VALUES (?, ?, ?, ?, ?, 1, ?)")
for (const p of programsData) {
  insertProgram.run(p.id, p.name, p.description, p.thumbnailPath, p.logoPath ?? null, now)
  console.log(`  + ${p.name}`)
}

// === エピソードデータ投入 ===
const episodesData = [
  { id: 14365, title: "有馬記念の展望 \"最強ステイヤー\"はどの馬か？", programId: 48, programName: "PADDOCK TALK", duration: 1204, categoryCode: "race", viewCount: 12000, rating: 4.5 },
  { id: 14328, title: "ノーザンファーム一強時代は終わるのか？【吉田勝己代表】", programId: 27, programName: "オーナーズEYE", duration: 1709, categoryCode: "breeding", viewCount: 38000, rating: 4.3 },
  { id: 14325, title: "馬券で月収100万円を達成した男の回収率管理術【馬券師タケシ】", programId: 19, programName: "馬券ラボ", duration: 2322, categoryCode: "betting", viewCount: 74000, rating: 4.5 },
  { id: 14287, title: "【競走馬の科学】筋肉と心肺機能の限界に迫る", programId: 13, programName: "ターフサイエンス", duration: 1243, categoryCode: "science", viewCount: 21000, rating: 4.7 },
  { id: 14317, title: "AIで予想する日本ダービー／過去データ分析／穴馬の見つけ方", programId: 76, programName: "レース超分析", duration: 1932, categoryCode: "race", viewCount: 83000, rating: 4.8 },
  { id: 14305, title: "凱旋門賞に挑む日本馬。海外遠征の壁とは", programId: 2, programName: "PADDOCK GLOBAL", duration: 1618, categoryCode: "global", viewCount: 67000, rating: 4.2 },
  { id: 14364, title: "新種牡馬ランキング。初年度産駒から見える可能性", programId: 48, programName: "血統クロニクル", duration: 1416, categoryCode: "breeding", viewCount: 18000, rating: 4.1 },
  { id: 14316, title: "【実践】パドックで馬の調子を見抜く5つのポイント", programId: 100, programName: "馬体チェック", duration: 1665, categoryCode: "training", viewCount: 32000, rating: 4.5 },
  { id: 14362, title: "坂路調教のタイム読み方完全ガイド【栗東トレセン】", programId: 19, programName: "調教ウォッチ", duration: 1809, categoryCode: "training", viewCount: 41000, rating: 4.3 },
  { id: 14357, title: "ドバイ・香港・サウジ。世界の高額賞金レース戦略", programId: 2, programName: "PADDOCK GLOBAL", duration: 3349, categoryCode: "global", viewCount: 55000, rating: 4.4 },
]

console.log("\nSeeding episodes as videos...")
const insertVideo = sqlite.prepare("INSERT OR IGNORE INTO videos (id, title, description, file_path, thumbnail_path, duration, status, publish_status, processing_step, source_type, category_code, program_id, published_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 'published', 'published', 'none', 'local', ?, ?, ?, ?, ?)")
const insertMetric = sqlite.prepare("INSERT OR IGNORE INTO metrics (video_id, view_count, rating, rating_count, comment_count) VALUES (?, ?, ?, ?, ?)")
const insertThumb = sqlite.prepare("INSERT OR IGNORE INTO thumbnails (id, video_id, file_path, source, is_primary, status, created_at) VALUES (?, ?, ?, 'manual', 1, 'done', ?)")

// === エピソード別AIコンテンツ ===
const aiContentMap: Record<number, { summary: string; chapters: Array<{ title: string; startTime: number; endTime: number; summary: string }>; article: string; tags: string[] }> = {
  14365: {
    summary: "今年の有馬記念の出走予定馬を徹底分析。過去10年のデータから導く「勝つ馬の条件」と、各馬の適性・展開予想を専門家が語る。",
    chapters: [
      { title: "有馬記念の特殊性", startTime: 0, endTime: 180, summary: "中山2500m・年末のグランプリレースが持つ独特の条件を解説。" },
      { title: "過去10年のデータ分析", startTime: 180, endTime: 380, summary: "勝ち馬の共通点――脚質、前走ローテ、血統傾向をデータで検証。" },
      { title: "有力馬の適性診断", startTime: 380, endTime: 600, summary: "今年の出走予定馬それぞれの中山適性とスタミナを評価。" },
      { title: "展開予想とペース分析", startTime: 600, endTime: 850, summary: "逃げ馬の有無、隊列予想から見える有利なポジションを分析。" },
      { title: "穴馬候補をピックアップ", startTime: 850, endTime: 1050, summary: "人気薄でも激走の可能性がある馬をデータから抽出。" },
      { title: "最終結論と推奨馬券", startTime: 1050, endTime: 1204, summary: "本命・対抗・穴の三段構えで推奨馬券を提示。" },
    ],
    article: "## 有馬記念を制する馬の条件\n\n中山競馬場2500m。急坂を2度越えるタフなコースで行われるグランプリレースは、単なるスピードだけでは勝てない。\n\n## データが示す勝ちパターン\n\n- 前走で天皇賞(秋)またはジャパンCに出走した馬が好成績\n- 4角5番手以内の先行力が必須\n- ステイゴールド系・ハーツクライ系の血統が有利\n\n## 今年の注目馬\n\n今年は3歳勢の参戦が焦点。クラシック戦線を戦い抜いた疲労と、古馬との斤量差のバランスが鍵を握る。\n\n## 馬券戦略\n\n有馬記念は波乱傾向。過去10年で1番人気の勝率は30%にとどまる。三連複のフォーメーションで手広く構えるのが有効だ。",
    tags: ["有馬記念", "G1", "中山競馬場", "データ分析", "血統", "展開予想", "馬券"],
  },
  14328: {
    summary: "ノーザンファーム代表・吉田勝己氏が語る生産者戦略。セレクトセールの裏側、種牡馬選定の哲学、そして一強体制への批判にどう応えるか。",
    chapters: [
      { title: "ノーザンファームの現在地", startTime: 0, endTime: 250, summary: "G1勝利数のシェア、セレクトセール売上など圧倒的な数字を概観。" },
      { title: "種牡馬選定の哲学", startTime: 250, endTime: 520, summary: "ディープインパクト後の種牡馬戦略と海外導入の判断基準。" },
      { title: "育成の最前線", startTime: 520, endTime: 800, summary: "坂路・プール・最新設備を駆使した育成メソッドの全貌。" },
      { title: "セレクトセールの舞台裏", startTime: 800, endTime: 1100, summary: "億超えの取引が飛び交うセールの戦略と馬体評価の基準。" },
      { title: "一強批判にどう答えるか", startTime: 1100, endTime: 1400, summary: "競馬の多様性を損なうという批判への代表の率直な回答。" },
      { title: "次世代への展望", startTime: 1400, endTime: 1709, summary: "ポスト・ディープ時代の生産戦略と後継者育成。" },
    ],
    article: "## ノーザンファーム一強の実態\n\nG1レースの過半数をノーザンファーム生産馬が占める現状。セレクトセールの総売上額は年々更新され、日本競馬の勢力図を塗り替えている。\n\n## 強さの源泉\n\n- 世界トップクラスの種牡馬ラインナップ\n- 科学的アプローチに基づく育成システム\n- 騎手・調教師との深いネットワーク\n\n## 今後の課題\n\nディープインパクトの後継種牡馬の確立が最大のテーマ。キタサンブラック、エピファネイアなど次世代種牡馬の産駒成績が注目される。",
    tags: ["ノーザンファーム", "吉田勝己", "生産者", "セレクトセール", "種牡馬", "育成", "競馬ビジネス"],
  },
  14325: {
    summary: "馬券で生計を立てるプロ馬券師タケシが、回収率120%を維持する資金管理術と期待値計算の全貌を公開。データ分析と感情コントロールの両面から馬券術を解説。",
    chapters: [
      { title: "プロ馬券師の実態", startTime: 0, endTime: 350, summary: "年間収支と生活スタイル、馬券だけで生きるリアルを語る。" },
      { title: "期待値計算の基本", startTime: 350, endTime: 700, summary: "オッズと勝率から期待値を算出する具体的な手法を解説。" },
      { title: "資金管理の鉄則", startTime: 700, endTime: 1100, summary: "ケリー基準を応用したベッティングサイズの決め方。" },
      { title: "データベース構築術", startTime: 1100, endTime: 1600, summary: "過去レースDBの作り方と、条件別の回収率分析手法。" },
      { title: "メンタルコントロール", startTime: 1600, endTime: 2000, summary: "大負け後の冷静さを保つ心理テクニックと損切りルール。" },
      { title: "実践：今週の注目馬", startTime: 2000, endTime: 2322, summary: "解説した手法を使って今週の重賞レースを実際に予想。" },
    ],
    article: "## 馬券で生きるということ\n\n回収率120%。これは年間を通じて安定的に利益を出していることを意味する。プロ馬券師タケシの手法はデータと規律に基づいている。\n\n## 期待値こそが全て\n\n- 単勝オッズ10倍の馬の勝率が12%以上なら期待値プラス\n- 全レースを買う必要はない。期待値がプラスのレースだけに絞る\n- 複勝・ワイドの低配当でも期待値が高ければ買う\n\n## 資金管理の鉄則\n\nケリー基準を応用し、1レースの投資額は資金の2-5%に制限。大穴狙いで一発逆転は絶対にしない。\n\n## 感情を排除する\n\n負けた後に取り返そうとする行動が最大の敵。日次の損益に一喜一憂せず、月単位・年単位で結果を見る冷静さが求められる。",
    tags: ["馬券術", "回収率", "期待値", "資金管理", "データ分析", "プロ馬券師", "ケリー基準"],
  },
  14287: {
    summary: "サラブレッドの驚異的な身体能力を科学的に解剖。最大心拍数250、肺活量55リットル、時速70kmを可能にする筋肉構造など、競走馬の身体の秘密を獣医学の専門家が解説。",
    chapters: [
      { title: "サラブレッドの心臓", startTime: 0, endTime: 200, summary: "人間の2倍以上の心臓重量と毎分250拍の驚異的なポンプ能力。" },
      { title: "呼吸と酸素供給", startTime: 200, endTime: 400, summary: "55リットルの肺活量と脾臓からの赤血球放出メカニズム。" },
      { title: "筋肉の構造と速筋比率", startTime: 400, endTime: 600, summary: "速筋線維の割合がスプリンターとステイヤーで異なる理由。" },
      { title: "骨格と蹄のバイオメカニクス", startTime: 600, endTime: 850, summary: "500kgの体重を支える脚部構造と蹄の衝撃吸収メカニズム。" },
      { title: "故障のメカニズム", startTime: 850, endTime: 1050, summary: "屈腱炎・骨折が起きる科学的原因と予防技術の最前線。" },
      { title: "遺伝子と適性", startTime: 1050, endTime: 1243, summary: "ミオスタチン遺伝子が距離適性を決めるメカニズムを解説。" },
    ],
    article: "## サラブレッドは走るために進化した\n\n300年の品種改良を経て、サラブレッドは地上最速の長距離走者となった。その身体能力は科学的に見ても驚異的だ。\n\n## 心臓と血液\n\n- 心臓重量: 約4.5kg（人間の15倍）\n- 最大心拍数: 毎分250拍\n- 脾臓が酸素運搬用の赤血球を一気に放出するブースト機能\n\n## 距離適性は遺伝子で決まる\n\nミオスタチン遺伝子のC/T多型により、スプリント型（CC）かステイヤー型（TT）かが遺伝的に決定される。血統表から読み取れない適性を遺伝子検査で判定する時代が来ている。\n\n## 故障予防の最前線\n\n高速CT・MRIによる早期診断、バイオマーカーによるストレス検知など、故障を未然に防ぐ技術が急速に進歩している。",
    tags: ["競走馬", "サイエンス", "心臓", "筋肉", "遺伝子", "ミオスタチン", "獣医学"],
  },
  14317: {
    summary: "AIを活用した競馬予想の最前線。過去20年分のデータから日本ダービーの勝ち馬パターンを機械学習で抽出。穴馬発見のアルゴリズムと、今年の注目馬をランキング形式で紹介。",
    chapters: [
      { title: "AI競馬予想の現状", startTime: 0, endTime: 280, summary: "機械学習を使った競馬予想の精度と限界を概観。" },
      { title: "日本ダービーのデータ分析", startTime: 280, endTime: 560, summary: "過去20年のダービー勝ち馬の共通特徴をAIで抽出。" },
      { title: "穴馬発見アルゴリズム", startTime: 560, endTime: 900, summary: "オッズと実力の乖離を検出するモデルの仕組みを解説。" },
      { title: "今年の出走馬ランキング", startTime: 900, endTime: 1300, summary: "AIが算出した各馬の勝利確率をランキング形式で発表。" },
      { title: "馬場・天候の影響分析", startTime: 1300, endTime: 1650, summary: "当日の馬場状態がレース結果に与える影響をデータで検証。" },
      { title: "推奨馬券と期待値", startTime: 1650, endTime: 1932, summary: "AIの予想を馬券に落とし込む際の考え方と推奨買い目。" },
    ],
    article: "## AIが変える競馬予想\n\n機械学習モデルに過去20年分のレースデータを学習させることで、人間の直感では見えないパターンが浮かび上がる。\n\n## ダービーの勝ち馬パターン\n\n- 皐月賞3着以内からの直行ローテが最も好成績\n- 上がり3ハロン33秒台を持つ瞬発力が必須\n- 父サンデーサイレンス系の血統が過半数\n\n## 穴馬の見つけ方\n\n1. オッズが示す人気と、データが示す実力の乖離が大きい馬\n2. 前走不利があり、実力を出し切れていない馬\n3. 距離延長で一変するタイプの血統背景を持つ馬\n\n## AIの限界\n\nAIは過去データのパターンマッチングが得意だが、初出走条件やイレギュラーな馬場状態には弱い。AIの出力を鵜呑みにせず、自分の目で確認することが重要だ。",
    tags: ["AI予想", "日本ダービー", "機械学習", "データ分析", "穴馬", "オッズ", "血統"],
  },
  14305: {
    summary: "凱旋門賞への日本馬の挑戦史を振り返り、なぜ勝てないのかを多角的に分析。馬場の違い、輸送ストレス、欧州調教法との差異など、海外遠征の壁を専門家が解説。",
    chapters: [
      { title: "凱旋門賞と日本馬の歴史", startTime: 0, endTime: 250, summary: "エルコンドルパサーからの挑戦史を振り返る。" },
      { title: "ロンシャンの馬場特性", startTime: 250, endTime: 500, summary: "深い洋芝と起伏のあるコース形態が日本馬に不利な理由。" },
      { title: "輸送と時差の影響", startTime: 500, endTime: 800, summary: "長距離輸送が競走馬の体調に与えるストレスを科学的に解説。" },
      { title: "欧州と日本の調教法の違い", startTime: 800, endTime: 1100, summary: "ギャロップ中心の欧州式とスピード重視の日本式の根本的な差。" },
      { title: "成功への条件", startTime: 1100, endTime: 1380, summary: "長期滞在・現地調教・馬場適性の三条件を満たす戦略。" },
      { title: "次の挑戦者たち", startTime: 1380, endTime: 1618, summary: "今後凱旋門賞に挑む可能性のある日本馬をピックアップ。" },
    ],
    article: "## なぜ日本馬は凱旋門賞を勝てないのか\n\n日本競馬のレベルは世界トップクラスだが、凱旋門賞だけは未だ制覇できていない。その理由は複合的だ。\n\n## 馬場の壁\n\n- ロンシャンの洋芝は日本の高速馬場と根本的に異なる\n- 雨が降ると重馬場になりやすく、パワーが求められる\n- 直線の坂は日本馬のスピードを殺す\n\n## 輸送ストレス\n\n片道約30時間の空輸は馬体重2-3%の減少を引き起こす。体調回復に最低2週間が必要とされるが、多くの日本馬は十分な滞在期間を確保できていない。\n\n## 突破口はあるか\n\n前哨戦からの長期滞在、欧州の調教師との連携、洋芝適性の高い血統の選定。この三位一体の戦略が、日本馬の凱旋門賞制覇を現実にする。",
    tags: ["凱旋門賞", "海外遠征", "ロンシャン", "馬場適性", "輸送", "欧州競馬", "日本馬"],
  },
  14364: {
    summary: "今年デビューした新種牡馬の産駒成績を徹底ランキング。初年度産駒の走りから見える種牡馬としてのポテンシャルと、来年の狙い馬を血統評論家が分析。",
    chapters: [
      { title: "新種牡馬ランキングTOP5", startTime: 0, endTime: 220, summary: "勝ち上がり率・賞金額で今年の新種牡馬をランキング。" },
      { title: "産駒の共通傾向を分析", startTime: 220, endTime: 450, summary: "各種牡馬の産駒に見られる脚質・距離適性の傾向。" },
      { title: "母父との相性", startTime: 450, endTime: 700, summary: "種牡馬×母父の配合パターンで好走率が変わるデータを紹介。" },
      { title: "来年のクラシック候補", startTime: 700, endTime: 1000, summary: "新種牡馬産駒から来年のクラシック戦線で活躍しそうな馬を抽出。" },
      { title: "セレクトセールでの評価", startTime: 1000, endTime: 1220, summary: "市場価格と実際の成績の相関を分析。" },
      { title: "種牡馬ビジネスの展望", startTime: 1220, endTime: 1416, summary: "種付け料の変動予測と生産者が注目すべきポイント。" },
    ],
    article: "## 新種牡馬の成績が示すもの\n\n毎年デビューする新種牡馬の中から、次の大種牡馬が現れる。初年度産駒の走りは、種牡馬としての将来を占う重要な指標だ。\n\n## 注目の新種牡馬\n\n- 勝ち上がり率トップは圧倒的なスピードを伝える産駒が多い\n- 距離延長で成績が上がるタイプは将来のクラシック種牡馬候補\n- 牝馬の成績が良い種牡馬は安定した種付け需要が見込める\n\n## 配合の妙\n\n母父との相性で産駒の傾向が大きく変わる。データを元に、相性の良い配合パターンを血統表から見抜くことが馬券的中への近道。\n\n## 来年の注目馬\n\n新種牡馬産駒の中から、新馬戦の内容が光る馬をリストアップ。2歳戦の好走は来年のクラシック路線につながる。",
    tags: ["新種牡馬", "血統", "産駒成績", "クラシック", "セレクトセール", "配合", "種牡馬ランキング"],
  },
  14316: {
    summary: "パドックで馬の状態を見極めるプロの技術を実践解説。毛艶、歩様、発汗、目つきなど5つの観察ポイントを、映像と共にわかりやすく紹介。初心者から上級者まで使えるテクニック。",
    chapters: [
      { title: "パドック診断の重要性", startTime: 0, endTime: 250, summary: "なぜパドックを見るだけで馬券の的中率が上がるのかを解説。" },
      { title: "ポイント1: 毛艶と馬体の張り", startTime: 250, endTime: 520, summary: "体調が良い馬の毛艶の特徴と、張りのある馬体の見分け方。" },
      { title: "ポイント2: 歩様のリズム", startTime: 520, endTime: 800, summary: "力強い踏み込みと規則的なリズムが示す好調サイン。" },
      { title: "ポイント3: 発汗状態", startTime: 800, endTime: 1100, summary: "良い汗と悪い汗の違い、入れ込みのサインを見抜く。" },
      { title: "ポイント4: 目つきと耳の動き", startTime: 1100, endTime: 1400, summary: "集中力のある馬の目つきと、気性難の馬の見分け方。" },
      { title: "ポイント5: 蹄と脚元チェック", startTime: 1400, endTime: 1665, summary: "バンテージや蹄鉄から読み取れる情報と注意すべきサイン。" },
    ],
    article: "## パドックは情報の宝庫\n\nレース前のパドックには、数字では見えない馬の状態が表れる。プロの目で見れば、当日の好走確率が格段に上がる。\n\n## 5つの観察ポイント\n\n- **毛艶**: ピカピカ光る馬は体調絶好調。くすんでいる馬は要注意\n- **歩様**: 後肢の踏み込みが深く、リズミカルな馬は走る準備ができている\n- **発汗**: 首元にうっすら汗をかく程度が理想。腹部や後肢に大量の汗は入れ込みサイン\n- **目つき**: 落ち着いた目で前を見ている馬はレースに集中できている\n- **脚元**: バンテージの有無、蹄鉄の種類から不安材料をチェック\n\n## 実践のコツ\n\n初心者はまず「毛艶」と「歩様」の2点に集中すること。この2つだけでも馬券収支は大きく改善する。",
    tags: ["パドック", "馬体診断", "毛艶", "歩様", "発汗", "馬券術", "観察眼"],
  },
  14362: {
    summary: "栗東トレーニングセンターの坂路調教に完全密着。タイムの見方、ハロン毎の加速パターン、好走につながる調教内容を、元調教助手が完全ガイド。",
    chapters: [
      { title: "坂路調教とは", startTime: 0, endTime: 280, summary: "栗東坂路の特徴（全長800m・高低差32m）と調教の基本。" },
      { title: "タイムの読み方", startTime: 280, endTime: 550, summary: "4ハロン52秒台の意味と、ラスト1ハロンの加速パターン。" },
      { title: "好走パターンの見極め", startTime: 550, endTime: 900, summary: "レース前の調教パターンから好走を予測する具体的な手法。" },
      { title: "調教師による違い", startTime: 900, endTime: 1200, summary: "攻め調教派vs仕上げ重視派、調教師ごとの傾向を分析。" },
      { title: "CWコースとの使い分け", startTime: 1200, endTime: 1500, summary: "坂路とウッドチップコース、併用パターンの意味を解説。" },
      { title: "今週の注目調教馬", startTime: 1500, endTime: 1809, summary: "今週の重賞レースに向けた注目調教馬をピックアップ。" },
    ],
    article: "## 坂路調教のタイムを読む\n\n栗東トレーニングセンターの坂路は全長800m、高低差32m。この過酷な坂を駆け上がる調教タイムは、馬の仕上がり状態を知る最高の指標である。\n\n## タイムの基準\n\n- 4ハロン52秒台: 一杯に追われた好時計\n- 4ハロン54-55秒台: 馬なりでこのタイムなら好調\n- ラスト1ハロンが加速: 余力十分のサイン\n\n## 調教パターン分析\n\n1週前追い切りで時計を出し、最終追い切りは軽めという調教師が多いが、一部の「攻め調教」派は最終でもビシビシ追う。調教師ごとの傾向を把握することが重要。\n\n## 実践的な見方\n\n単にタイムの速い遅いではなく、同じ馬の過去の調教タイムとの比較が重要。前走時より動いていれば状態アップ、動いていなければ要注意。",
    tags: ["坂路調教", "栗東", "タイム分析", "追い切り", "調教師", "トレセン", "仕上がり"],
  },
  14357: {
    summary: "ドバイワールドカップ、香港国際競走、サウジカップなど世界の高額賞金レースを完全ガイド。各レースの特徴、日本馬の適性、そして中東マネーが変える世界の競馬地図を解説。",
    chapters: [
      { title: "世界の高額賞金レースMAP", startTime: 0, endTime: 450, summary: "賞金額ランキングと各レースの格付けを一覧で紹介。" },
      { title: "ドバイワールドカップの魅力", startTime: 450, endTime: 1000, summary: "メイダン競馬場の特徴と日本馬の好走パターン。" },
      { title: "サウジカップの衝撃", startTime: 1000, endTime: 1600, summary: "賞金総額2000万ドル。中東マネーが競馬界に与えるインパクト。" },
      { title: "香港国際競走の攻略法", startTime: 1600, endTime: 2200, summary: "シャティン競馬場の小回りコースに日本馬が適応する条件。" },
      { title: "ブリーダーズカップと凱旋門賞", startTime: 2200, endTime: 2800, summary: "北米と欧州の最高峰レースの特性と日本馬の成績を比較。" },
      { title: "海外遠征の今後", startTime: 2800, endTime: 3349, summary: "日本馬の海外遠征がさらに増える理由と、成功のための条件。" },
    ],
    article: "## 世界の競馬地図が変わっている\n\n中東の石油マネーが競馬界に流入し、世界の高額賞金レースの序列が大きく変わっている。日本馬にとっても新たなチャンスが広がっている。\n\n## 主要レースの賞金比較\n\n- サウジカップ: 2000万ドル（約30億円）\n- ドバイワールドカップ: 1200万ドル\n- 凱旋門賞: 500万ユーロ\n- ジャパンカップ: 約5億円\n\n## 日本馬の適性\n\n香港とドバイは日本馬の好走率が高い。特にシャティンの芝は日本の馬場に近く、スピードタイプの日本馬に向いている。一方、欧州の深い芝と北米のダートは依然として壁が高い。\n\n## 今後の展望\n\n賞金の高額化により、海外遠征のリターンが大きくなっている。今後は凱旋門賞一辺倒ではなく、各馬の適性に合ったレース選択が重要になる。",
    tags: ["ドバイ", "サウジカップ", "香港", "海外競馬", "賞金", "メイダン", "世界の競馬"],
  },
}

for (const ep of episodesData) {
  const videoId = `EP_${ep.id}`
  const thumbPath = `/images/static/converted/chapter/${ep.id}/ogp/${ep.id}.webp`
  const desc = `${ep.programName}の人気エピソード`

  insertVideo.run(videoId, ep.title, desc, "", thumbPath, ep.duration, ep.categoryCode, ep.programId, now, now, now)
  insertMetric.run(videoId, ep.viewCount, ep.rating, Math.floor(ep.viewCount / 5000), Math.floor(ep.viewCount / 10000))
  insertThumb.run(ulid(), videoId, thumbPath, now)

  // Transcription + AI Content
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

  console.log(`  + ${ep.title.slice(0, 30)}...`)
}

// === サムネイルスタイルプリセット投入 ===
console.log("\nSeeding thumbnail style presets...")
const thumbnailPresets = [
  {
    id: ulid(),
    name: "レース分析",
    promptTemplate: "A dynamic horse racing thumbnail with a green turf background and dramatic finish line imagery. Bold typography, speed lines, professional racing atmosphere. Dark green and gold color scheme.",
    styleParams: JSON.stringify({ colorScheme: "green-gold", layout: "racing", fontStyle: "bold-sans", mood: "exciting" }),
    isDefault: 1,
  },
  {
    id: ulid(),
    name: "データ・AI予想",
    promptTemplate: "A data-driven horse racing analysis thumbnail with charts, graphs, and horse silhouettes. Tech-inspired design with neon accents on dark background. Electric blue and green palette.",
    styleParams: JSON.stringify({ colorScheme: "neon-dark", layout: "data", fontStyle: "monospace", mood: "analytical" }),
    isDefault: 0,
  },
  {
    id: ulid(),
    name: "血統・生産",
    promptTemplate: "An elegant horse breeding themed thumbnail with horse family tree imagery. Warm, prestigious atmosphere with leather and wood textures. Deep brown and cream tones.",
    styleParams: JSON.stringify({ colorScheme: "brown-cream", layout: "elegant", fontStyle: "serif", mood: "prestigious" }),
    isDefault: 0,
  },
  {
    id: ulid(),
    name: "海外競馬",
    promptTemplate: "A global horse racing thumbnail featuring world-famous racecourses. International flags, dramatic sky, and majestic horses. Royal blue and gold palette with cosmopolitan feel.",
    styleParams: JSON.stringify({ colorScheme: "blue-gold", layout: "global", fontStyle: "bold-serif", mood: "majestic" }),
    isDefault: 0,
  },
]

const insertPreset = sqlite.prepare("INSERT OR IGNORE INTO thumbnail_style_presets (id, name, prompt_template, style_params, is_default, created_at) VALUES (?, ?, ?, ?, ?, ?)")
for (const preset of thumbnailPresets) {
  insertPreset.run(preset.id, preset.name, preset.promptTemplate, preset.styleParams, preset.isDefault, now)
  console.log(`  + ${preset.name}`)
}

console.log("\nSeed complete.")
console.log(`  Programs: ${programsData.length}`)
console.log(`  Videos: ${episodesData.length}`)
console.log(`  Thumbnail presets: ${thumbnailPresets.length}`)

sqlite.close()
