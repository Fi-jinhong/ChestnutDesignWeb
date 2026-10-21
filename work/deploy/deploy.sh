#!/bin/bash
# 一键部署栗子作品集网站到阿里云服务器
# 用法：bash work/deploy/deploy.sh
set -euo pipefail

DEPLOY_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$DEPLOY_DIR/../.." && pwd)"
SITE_DIR="$PROJECT_ROOT/outputs/chestnut-local/public"
CONF="$DEPLOY_DIR/deploy.conf"

# 读取配置
if [ ! -f "$CONF" ]; then
  echo "未找到配置文件：$CONF"
  exit 1
fi
# shellcheck disable=SC1090
source "$CONF"

# 校验必填项
for var in SERVER_IP DOMAIN; do
  if [ -z "${!var}" ]; then
    echo "请先在 work/deploy/deploy.conf 中填写 $var"
    exit 1
  fi
done

SSH_OPTS=""
if [ -n "$SSH_KEY" ]; then
  SSH_OPTS="-i $SSH_KEY"
fi

echo "==> 目标服务器：$SERVER_USER@$SERVER_IP"
echo "==> 域名：$DOMAIN"
echo "==> 本地站点目录：$SITE_DIR"

# 1. 首次部署：安装 Nginx 并创建目录
echo "==> [1/3] 检查服务器 Nginx 环境..."
ssh $SSH_OPTS "$SERVER_USER@$SERVER_IP" bash -s <<'EOF'
set -e
if ! command -v nginx >/dev/null 2>&1; then
  echo "安装 Nginx..."
  if command -v apt >/dev/null 2>&1; then
    apt update -y && apt install -y nginx
  elif command -v yum >/dev/null 2>&1; then
    yum install -y nginx
  fi
  systemctl enable nginx
fi
mkdir -p /var/www/chestnut
EOF

# 2. 同步网站文件（rsync 增量传输，只传变化的文件）
echo "==> [2/3] 同步站点文件（增量，首次约 185M 需要几分钟）..."
rsync -avz --delete -e "ssh $SSH_OPTS" \
  "$SITE_DIR/" \
  "$SERVER_USER@$SERVER_IP:$REMOTE_DIR/"

# 3. 写入 Nginx 配置并重载
echo "==> [3/3] 更新 Nginx 配置..."
NGINX_CONF=$(sed "s/__DOMAIN__/$DOMAIN/g" "$DEPLOY_DIR/nginx.conf")
ssh $SSH_OPTS "$SERVER_USER@$SERVER_IP" bash -s <<EOF
set -e
cat > /etc/nginx/sites-available/chestnut <<'NGINX'
$NGINX_CONF
NGINX
ln -sf /etc/nginx/sites-available/chestnut /etc/nginx/sites-enabled/chestnut
nginx -t
systemctl reload nginx
EOF

echo ""
echo "部署完成！访问：http://$DOMAIN"
echo ""
echo "如尚未配置 HTTPS，登录服务器执行："
echo "  apt install -y certbot python3-certbot-nginx"
echo "  certbot --nginx -d $DOMAIN -d www.$DOMAIN"
