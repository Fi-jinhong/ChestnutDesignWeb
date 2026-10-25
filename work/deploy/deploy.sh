#!/bin/bash
# 一键部署栗子作品集网站到阿里云服务器
# 用法：bash work/deploy/deploy.sh
#
# 流程：备份现有站点(WordPress) → 检查 Nginx → rsync 增量同步 → 写入配置 → 重载
set -euo pipefail

DEPLOY_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$DEPLOY_DIR/../.." && pwd)"
SITE_DIR="$PROJECT_ROOT/outputs/chestnut-local/public"
CONF="$DEPLOY_DIR/deploy.conf"

if [ ! -f "$CONF" ]; then
  echo "未找到配置文件：$CONF"
  exit 1
fi
# shellcheck disable=SC1090
source "$CONF"

for var in SERVER_IP DOMAIN; do
  if [ -z "${!var}" ]; then
    echo "请先在 work/deploy/deploy.conf 中填写 $var"
    exit 1
  fi
done

SSH_OPTS="-o StrictHostKeyChecking=no"
if [ -n "$SSH_KEY" ]; then
  SSH_OPTS="$SSH_OPTS -i $SSH_KEY"
fi

echo "==> 目标服务器：$SERVER_USER@$SERVER_IP"
echo "==> 域名：$DOMAIN"
echo "==> 本地站点：$SITE_DIR ($(du -sh "$SITE_DIR" | cut -f1))"
echo ""

# ---------- 1. 备份现有站点 + 检查环境 ----------
echo "==> [1/4] 备份现有站点..."
ssh $SSH_OPTS "$SERVER_USER@$SERVER_IP" bash -s <<'EOF'
set -e
BACKUP_DIR=/root/site-backup
mkdir -p "$BACKUP_DIR"
STAMP=$(date +%Y%m%d-%H%M%S)

WEBROOT=$(grep -rh "root " /etc/nginx/sites-enabled/ 2>/dev/null | head -1 | sed 's/.*root //; s/;//')
if [ -z "$WEBROOT" ] || [ ! -d "$WEBROOT" ]; then
  WEBROOT=$(grep -rh "root " /etc/nginx/conf.d/ 2>/dev/null | head -1 | sed 's/.*root //; s/;//')
fi
if [ -z "$WEBROOT" ] || [ ! -d "$WEBROOT" ]; then WEBROOT=/var/www/html; fi
echo "站点根目录：$WEBROOT"

tar czf "$BACKUP_DIR/webroot-$STAMP.tar.gz" -C "$WEBROOT" . 2>/dev/null || echo "(站点文件为空，跳过打包)"
echo "文件已备份：$BACKUP_DIR/webroot-$STAMP.tar.gz"

if command -v mysqldump >/dev/null 2>&1; then
  mysqldump --all-databases --single-transaction > "$BACKUP_DIR/db-$STAMP.sql" 2>/dev/null \
    && echo "数据库已备份：$BACKUP_DIR/db-$STAMP.sql" \
    || echo "(数据库备份失败，可手动执行 mysqldump)"
fi

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

# ---------- 2. 同步站点文件 ----------
echo ""
echo "==> [2/4] 同步站点文件（增量传输，首次约 185M）..."
rsync -avz --delete --info=progress2 -e "ssh $SSH_OPTS" \
  "$SITE_DIR/" \
  "$SERVER_USER@$SERVER_IP:$REMOTE_DIR/"

# ---------- 3. 写入 Nginx 配置 ----------
echo ""
echo "==> [3/4] 更新 Nginx 配置..."
NGINX_CONF=$(sed "s/__DOMAIN__/$DOMAIN/g" "$DEPLOY_DIR/nginx.conf")
ssh $SSH_OPTS "$SERVER_USER@$SERVER_IP" bash -s <<EOF
set -e
mkdir -p /root/site-backup
[ -f /etc/nginx/sites-available/chestnut ] && cp /etc/nginx/sites-available/chestnut /root/site-backup/chestnut.nginx.\$(date +%Y%m%d-%H%M%S) || true
cat > /etc/nginx/sites-available/chestnut <<'NGINX'
$NGINX_CONF
NGINX
ln -sf /etc/nginx/sites-available/chestnut /etc/nginx/sites-enabled/chestnut
if [ -d /etc/nginx/sites-enabled ]; then
  for f in /etc/nginx/sites-enabled/*; do
    [ "\$(basename "\$f")" = "chestnut" ] && continue
    if grep -q "server_name.*$DOMAIN" "\$f" 2>/dev/null; then
      mv "\$f" "\$f.disabled"
      echo "已禁用旧站点配置：\$f.disabled"
    fi
  done
fi
nginx -t
systemctl reload nginx
EOF

echo ""
echo "==> [4/4] 完成"
echo ""
echo "网站已上线：http://$DOMAIN"
echo ""
echo "后续建议："
echo "  1. 控制台安全组放行 443 端口（当前未开放）"
echo "  2. 申请 HTTPS 证书："
echo "     apt install -y certbot python3-certbot-nginx"
echo "     certbot --nginx -d $DOMAIN -d www.$DOMAIN"
