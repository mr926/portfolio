# CHAOS LAB — Portfolio

An architecture & interior design portfolio built with Next.js, Prisma (SQLite), and a fully self-hosted admin panel.

## Docker 部署

镜像托管于 Docker Hub，由 GitHub Actions 在每次推送到 `main` 分支时自动构建，同时支持 `linux/amd64` 和 `linux/arm64`。

```
mr926/portfolio:latest
```

### docker-compose.yml

```yaml
services:
  portfolio:
    image: mr926/portfolio:latest
    ports:
      - "3000:3000"
    user: "1000:1000"        # 与宿主机文件夹所有者的 uid:gid 保持一致
                             # 宝塔默认为 www 用户：可用 `id www` 确认
    volumes:
      - ./data:/app/data                  # SQLite 数据库（必须挂载）
      - ./uploads:/app/public/uploads     # 本地上传图片
    environment:
      DATABASE_URL: "file:/app/data/portfolio.db"
      JWT_SECRET: "替换为随机长字符串"       # openssl rand -hex 32
    restart: unless-stopped
```

### 启动

```bash
# 拉取最新镜像并启动
docker compose pull
docker compose up -d

# 查看启动日志（应看到 "Migrations complete." 和 "Ready"）
docker compose logs -f
```

> 容器启动时会**自动创建数据库并执行迁移**，无需手动初始化。

### 默认账号

首次启动后访问 `http://your-server:3000/admin`：

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
| `DATABASE_URL` | `file:/app/data/portfolio.db` | SQLite 数据库路径，路径需与 volume 挂载一致 |
| `JWT_SECRET` | `a8f3...`（随机长字符串） | 登录 token 签名密钥，可用 `openssl rand -hex 32` 生成 |

### 可选

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `PORT` | `3000` | 监听端口 |
| `NODE_ENV` | `production` | 运行模式 |

---

## Volume 说明

| 容器路径 | 建议挂载 | 说明 |
|----------|---------|------|
| `/app/data` | `./data` | SQLite 数据库，**必须挂载**，否则容器重建后数据丢失 |
| `/app/public/uploads` | `./uploads` | 本地上传的图片，使用阿里云 OSS 时可省略 |

挂载目录需与容器运行用户（`user` 字段）的 uid:gid 匹配，否则会出现写入权限错误。

---

## 阿里云 OSS（可选）

图片默认存储在容器本地（`/app/public/uploads`）。如需使用阿里云 OSS，在管理后台 **Settings → Storage** 页面填写，无需修改环境变量、无需重启容器即时生效：

| 后台字段 | 说明 |
|----------|------|
| OSS Region | Bucket 所在地域，如 `oss-cn-hangzhou` |
| OSS Bucket | Bucket 名称 |
| Access Key ID | 阿里云 RAM 子账号 AccessKey ID |
| Access Key Secret | 对应 AccessKey Secret |
| 路径前缀 | Bucket 内目录前缀，默认 `portfolio/` |
| 自定义域名 | CDN 域名，如 `https://cdn.example.com`（可留空） |

---

## 本地开发

```bash
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)。
