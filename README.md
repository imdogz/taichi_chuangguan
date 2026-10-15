# 🥋 太极智能学习与互动评测平台 (Taichi Smart Platform)

基于 **AI 计算机视觉** 与 **大语言模型** 构建的智能化太极拳学习、姿态评测、关卡跟练与拳友社区平台。平台采用前后端分离架构，通过摄像头实时捕捉人体骨骼关键点，结合太极标准动作模板进行多维度实时姿态相似度比对、节奏判定与动作打分，同时内置大模型太极拳理 AI 问答助手和互动社区。

---

## 📌 目录
- [项目特性](#-项目特性)
- [技术栈](#-技术栈)
- [系统环境与依赖需求](#-系统环境与依赖需求)
- [项目安装指导](#-项目安装指导)
  - [1. 克隆/打开项目](#1-克隆打开项目)
  - [2. 后端环境配置与依赖安装](#2-后端环境配置与依赖安装)
  - [3. 前端环境配置与依赖安装](#3-前端环境配置与依赖安装)
- [如何启动运行](#-如何启动运行)
  - [第一步：启动后端服务](#第一步启动后端服务-fastapi)
  - [第二步：启动前端服务](#第二步启动前端服务-vite--react)
  - [第三步：访问系统](#第三步访问系统)
- [核心目录结构](#-核心目录结构)
- [常见问题与注意事项](#-常见问题与注意事项)

---

## ✨ 项目特性

1. **AI 动作捕捉与实时姿态评分**：
   - 基于 **MediaPipe Pose** 实时识别人体 33 个骨骼关键点与关节三维坐标。
   - 自研角度几何解算器（`AngleCalculator`）与关键帧检测算法（`KeyframeDetector`），精确解算肢体角度变化与运动节奏。
   - 通过 **WebSocket 全双工通信** 将摄像头视频帧实时流式传输至后端，秒级反馈 "Perfect / Great / Good / Miss" 判定与 Combo 连击加成。
2. **太极招式闯关跟练系统**：
   - 关卡制学习路线：起势、野马分鬃、白鹤亮翅、搂膝拗步、手挥琵琶等经典式子。
   - 支持跟练对比、动作模板对齐、实时动作骨骼高亮与指导反馈。
3. **AI 太极知识问答助手**：
   - 集成 **讯飞星火大模型 (Spark AI)**，内置太极拳理、拳法要诀与练功答疑 Prompt，提供一对一专业智能拳师指导。
4. **拳友交流社区**：
   - 支持动态发布、心得分享、互动点赞与评论交流，形成太极学习者社区生态。
5. **用户体系与学习档案**：
   - 采用 JWT 鉴权与 Bcrypt 安全加密。
   - 记录用户日常练习历史、闯关得分、动作评分趋势与统计分析。

---

## 🛠️ 技术栈

### 前端 (Frontend)
- **核心框架**：React 19 + JavaScript (ES Modules)
- **构建工具**：Vite 7
- **UI & 样式**：TailwindCSS 3, Lucide React (图标库)
- **网络通信**：Axios (REST API), 原生 WebSocket Client (实时评测通信)
- **硬件调用**：WebRTC / MediaDevices (摄像头视频捕获)

### 后端 (Backend)
- **Web 框架**：FastAPI (异步高性能 API 框架) + Uvicorn ASGI 服务器
- **计算机视觉与算法**：MediaPipe, OpenCV (`cv2`), NumPy, SciPy
- **大语言模型**：SparkAI SDK (讯飞星火大模型)
- **数据持久化**：SQLAlchemy ORM + SQLite (内置零配置，同时支持扩展 SQL Server)
- **用户安全**：Python-Jose (JWT 鉴权), 原生 Bcrypt (密码哈希加盐)

---

## 📋 系统环境与依赖需求

### 1. 基础运行环境
- **操作系统**：Windows 10/11、macOS 或 Linux
- **Python**：`Python 3.10` 或 `3.11`（**强烈推荐 3.11**，兼顾 MediaPipe 与 PyTorch/FastAPI 兼容性）
- **Node.js**：`Node.js >= 18.0.0`（推荐 `LTS 20.x`），并配备 `npm`（>= 9.0）
- **硬件外设**：电脑配备正常工作的**摄像头**（用于实时动作识别）

### 2. 所需 Python 依赖包清单
| 依赖包名称 | 推荐版本 / 说明 | 核心作用 |
| :--- | :--- | :--- |
| `fastapi` | `>=0.100.0` | 异步 Web API 框架 |
| `uvicorn[standard]` | `>=0.22.0` | ASGI 高性能 Web 服务器 |
| `sqlalchemy` | `>=2.0.0` | ORM 数据库管理与建模 |
| `pydantic` | `>=2.0.0` | 数据验证与序列化 |
| `pydantic-settings` | `>=2.0.0` | 配置项与环境变量管理 |
| `python-jose[cryptography]` | `>=3.3.0` | JWT Token 签名与解密 |
| `bcrypt` | `>=4.0.0` | 密码哈希加密 |
| `python-multipart` | `>=0.0.6` | 表单及文件数据解析 |
| `opencv-python` | `>=4.8.0` | 图像编解码、处理与绘制 |
| `mediapipe` | `>=0.10.0` | Google 人体姿态关键点检测 |
| `numpy` | `>=1.24.0, <2.0.0` | 科学计算与骨骼坐标矩阵运算 |
| `scipy` | `>=1.10.0` | 信号处理与节奏匹配计算 |
| `websockets` | `>=11.0` | WebSocket 双向实时连接 |
| `sparkai-python` | 最新版本 | 讯飞星火大模型 API 交互 |

### 3. 所需 Node.js 依赖包清单
- `react`, `react-dom` (^19.2.0)
- `axios` (^1.13.2)
- `lucide-react` (^0.560.0)
- `vite` (^7.2.4)
- `tailwindcss` (^3.4.17), `postcss`, `autoprefixer`

---

## 🚀 项目安装指导

### 1. 克隆/打开项目
确保在项目根目录（`taichi_project`）：
```bash
cd taichi_project
```

---

### 2. 后端环境配置与依赖安装

进入后端目录 `taiji_backend`：
```bash
cd taiji_backend
```

#### (1) 创建并激活 Python 虚拟环境（推荐）
- **Windows (PowerShell)**:
  ```powershell
  python -m venv .venv
  .\.venv\Scripts\Activate.ps1
  ```
- **Linux / macOS**:
  ```bash
  python3 -m venv .venv
  source .venv/bin/activate
  ```

#### (2) 安装 Python 所需包
在虚拟环境中执行以下安装命令：
```bash
pip install --upgrade pip
pip install fastapi "uvicorn[standard]" sqlalchemy pydantic pydantic-settings "python-jose[cryptography]" bcrypt python-multipart opencv-python mediapipe "numpy<2.0.0" scipy websockets sparkai-python
```

> **可选：大模型问答配置 (讯飞星火)**
> 若需要使用 AI 拳理智能问答助手，请在 `taiji_backend/services/ai_service.py` 或环境变量中填入您的讯飞星火应用凭证：
> - `spark_url`: 服务接口地址
> - `spark_app_id`: 应用 APPID
> - `spark_api_secret`: API Secret
> - `spark_api_key`: API Key
> - `spark_llm_domain`: 模型版本标识（如 `generalv3.5`）

---

### 3. 前端环境配置与依赖安装

打开新的终端窗口，进入前端目录 `taichi-app`：
```bash
cd taichi-app
```

安装 npm 依赖包：
```bash
npm install
```

---

## 💻 如何启动运行

本系统需要**同时启动后端 API 服务和前端开发服务器**。

### 第一步：启动后端服务 (FastAPI)

在后端目录 `taiji_backend` 下，确保已激活虚拟环境：
```bash
# 方式一：直接运行 main.py
python main.py

# 方式二：使用 uvicorn 命令行（支持热重载）
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
看到类似如下日志即代表后端启动成功：
```text
>>> 正在检查并创建数据库表结构...
>>> 数据库表结构检查/创建完成。
🥋 游戏模块已加载
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
```
- **后端交互文档 (Swagger UI)**：浏览器打开 [http://localhost:8000/docs](http://localhost:8000/docs)
- **备用文档 (ReDoc)**：[http://localhost:8000/redoc](http://localhost:8000/redoc)

---

### 第二步：启动前端服务 (Vite + React)

在前端目录 `taichi-app` 下执行：
```bash
npm run dev
```
终端将输出开发服务地址：
```text
  VITE v7.2.4  ready in 320 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

---

### 第三步：访问系统

1. 打开现代浏览器（**推荐使用 Chrome 或 Edge**）。
2. 访问前端地址：[http://localhost:5173](http://localhost:5173)。
3. **允许浏览器使用摄像头权限**：进入“动作闯关/实时跟练”模块时，浏览器会弹出摄像头授权提示，请点击“允许”，以便系统进行骨骼姿态识别与实时评分。

---

## 📂 核心目录结构

```text
taichi_project/
├── README.md                      # 项目说明文档
├── taichi-app/                    # 前端项目 (React + Vite)
│   ├── index.html                 # 页面 HTML 模板
│   ├── package.json               # 前端项目依赖与脚本
│   ├── vite.config.js             # Vite 代理与构建配置（反向代理后端 8000 端口）
│   ├── tailwind.config.js         # TailwindCSS 样式配置
│   └── src/
│       ├── main.jsx               # 前端 React 入口
│       ├── App.jsx                # 页面路由与主框架
│       ├── hooks/
│       │   └── useCamera.js       # 摄像头调用与视频帧捕获 Hook
│       ├── pages/
│       │   ├── Homepage.jsx       # 平台首页
│       │   ├── GameLevelPage.jsx  # 太极动作闯关与实时 AI 跟练评分
│       │   ├── AIChat.jsx         # 太极拳理 AI 问答助手
│       │   ├── CommunityPage.jsx  # 拳友交流社区
│       │   ├── LibraryPage.jsx    # 太极动作库
│       │   └── ProfilePage.jsx    # 个人中心与打卡记录
│       └── services/
│           ├── api.js             # REST API 请求统一封装
│           └── gameSocket.js      # WebSocket 实时姿态评测通信
└── taiji_backend/                 # 后端项目 (FastAPI + AI 评测算法)
    ├── main.py                    # FastAPI 启动主入口与路由注册
    ├── database.py                # 数据库配置与 SQLAlchemy 初始化
    ├── config.py                  # JWT、游戏判定阈值与评分权重配置
    ├── dependencies.py            # OAuth2/JWT 认证中间件
    ├── pose_extractor.py          # MediaPipe 姿态关键点提取器
    ├── angle_calculator.py        # 人体各关节夹角几何计算
    ├── keyframe_detector.py       # 关键动作帧自动检测
    ├── rhythm_scorer.py           # 动作节奏与相似度评分引擎
    ├── template_manager.py        # 标准动作模板数据管理器
    ├── models/                    # ORM 数据库实体模型 (User, Record, Community等)
    ├── routers/                   # 业务路由 (User, Game, Community, AI等)
    ├── schemas/                   # Pydantic 数据出入参校验模型
    ├── services/                  # 业务逻辑服务 (AI 问答服务等)
    ├── templates/                 # 预录制的标准太极动作骨骼模板 (.pkl / .json)
    └── videos/                    # 太极教学与动作示范音视频资源
```

---

## ❓ 常见问题与注意事项

1. **摄像头无法开启或黑屏**：
   - 检查浏览器是否已授予页面摄像头访问权限；
   - 检查是否有其他应用（如微信、其他视频播放器、调试软件）独占占用了摄像头；
   - 生产部署建议使用 `HTTPS` 协议，现代浏览器限制 `HTTP` 下非 `localhost` 的摄像头调用。
2. **MediaPipe 与 NumPy 版本兼容**：
   - 如果运行报错 `numpy.core.multiarray failed to import`，是因为 NumPy 2.x 与当前 MediaPipe 版本存在兼容冲突，请确保安装 NumPy 1.x：
     ```bash
     pip install "numpy<2.0.0"
     ```
3. **跨域 (CORS) 与 WebSocket 代理**：
   - 前端已在 `vite.config.js` 中配置了对 `http://localhost:8000`（API）与 `ws://localhost:8000`（WebSocket）的透明代理；
   - 后端已在 `main.py` 中配置允许所有跨域请求，默认开箱即用。

