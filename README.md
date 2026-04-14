# CHAOS LAB — Portfolio

An architecture & interior design portfolio built with Next.js, Prisma (SQLite), and a fully self-hosted admin panel.

## Docker 部署

镜像由 GitHub Actions 自动构建并推送至 GHCR，每次推送到 `main` 分支时触发。

```
ghcr.io/mr926/portfolio:latest
```

### 快速启动

```yaml
# docker-compose.yml
services:
  portfolio:
    image: ghcr.io/mr926/portfolio:latest
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data                   # SQLite 数据库持久化
      - ./uploads:/app/public/uploads      # 本地上传图片持久化
    environment:
      DATABASE_URL: "file:/app/data/portfolio.db"
      JWT_SECRET: "替换为随机长字符串"
    restart: unless-stopped
```

```bash
docker compose up -d
```

首次启动后访问 `http://your-server:3000/admin`，默认账号：

| 字段 | 默认值 |
|------|--------|
| 用户名 | `admin` |
| 密码 | `admin123` |

> **首次登录后请立即在 Admin → Account 页面修改密码。**

---

## 环境变量

### 必填

| 变量 | 示例值 | 说明 |
|------|--------|------|
| `DATABASE_URL` | `file:/app/data/portfolio.db` | SQLite 数据库文件路径。`/app/data/` 目录应挂载为 volume，否则容器重启后数据丢失。 |
| `JWT_SECRET` | `a8f3k2...`（随机长字符串） | 管理后台登录 token 的签名密钥。**生产环境必须修改**，可用 `openssl rand -hex 32` 生成。 |

### 可选

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `PORT` | `3000` | HTTP 监听端口（已内置于镜像）。 |
| `NODE_ENV` | `production` | 运行模式，保持 `production` 即可。 |

---

## 阿里云 OSS（可选）

图片默认上传到容器本地目录（`/app/public/uploads`），如需使用阿里云 OSS 存储，在管理后台 **Settings → Storage** 页面填写以下信息，无需修改环境变量、无需重启容器：

| 后台字段 | 说明 |
|----------|------|
| OSS Region | Bucket 所在地域，如 `oss-cn-hangzhou` |
| OSS Bucket | Bucket 名称 |
| Access Key ID | 阿里云 RAM 子账号的 AccessKey ID |
| Access Key Secret | 对应的 AccessKey Secret |
| 路径前缀 | 文件在 Bucket 内的目录前缀，默认 `portfolio/` |
| 自定义域名 | 绑定了 CDN 的自定义域名，如 `https://cdn.example.com`（可留空） |

---

## Volume 说明

| 容器路径 | 建议挂载到宿主机 | 说明 |
|----------|-----------------|------|
| `/app/data` | `./data` | SQLite 数据库，**必须挂载**，否则数据在容器重建后丢失 |
| `/app/public/uploads` | `./uploads` | 本地上传的图片，使用 OSS 时可省略 |

---

## 本地开发

```bash
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)。
